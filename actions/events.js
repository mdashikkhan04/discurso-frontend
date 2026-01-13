"use server";

import { getDoc, saveDoc, deleteDoc } from "@/lib/server/data/data";
import { getUsersByRoles, getUserIdByEmail, createUser, getAdminEmails, verifyAccess, checkUserQuota, checkParticipantQuota } from "@/lib/server/auth";
import { sendAdminWelcomeEmail } from "@/lib/server/mail";
import { getEvents as fetchEvents, getEvent as fetchEvent } from "@/lib/server/data/events";

export async function getEvents(participatingOnly, page = 1, search = "") {
    const access = await verifyAccess();
    if (!access?.role || !access?.uid) throw new Error("Unauthorized");

    const { role, uid } = access;
    const pageSize = 50;

    let rawEvents;

    if (role === "negotiator" || participatingOnly) {
        rawEvents = await fetchEvents({ participant: uid });
    } else if (role === "instructor" || role === "admin") {
        rawEvents = await fetchEvents(role === "admin" ? undefined : { instructor: uid });
    }

    if (rawEvents) {
        let events = rawEvents.map(event => {
            const { timestamp, ...rest } = event;
            return rest;
        });

        if (search) {
            const searchLower = search.toLowerCase();
            events = events.filter(event =>
                Object.values(event).some(value =>
                    typeof value === "string" && value.toLowerCase().includes(searchLower)
                )
            );
        }

        const draftEvents = events.filter(e => e.draft);
        const nonDraftEvents = events.filter(e => !e.draft);

        const nonDraftTotal = nonDraftEvents.length;
        const nonDraftTotalPages = Math.ceil(nonDraftTotal / pageSize);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedNonDraftEvents = nonDraftEvents.slice(start, end);

        const combinedEvents = [...draftEvents, ...paginatedNonDraftEvents];

        return {
            events: combinedEvents,
            total: events.length,
            totalPages: nonDraftTotalPages, 
            currentPage: page,
            pageSize,
            draftCount: draftEvents.length,
            nonDraftCount: nonDraftTotal
        };
    }

    throw new Error("Unauthorized");
}

export async function getEvent(eventId) {
    return await fetchEvent(eventId);
}

export async function saveEvent(eventData, skipParticipants) {
    try {
        if (!eventData.draft && !skipParticipants) {
            const welcomeLinks = [];
            let usersCreated = 0;

            let instructorId = eventData.instructorId || eventData.instructor;
            if (instructorId && instructorId.includes("@")) {
                instructorId = await getUserIdByEmail(instructorId);
            }

            if (instructorId) {
                const participantQuota = await checkParticipantQuota(instructorId, eventData.participants.length);
                if (!participantQuota.allowed) {
                    return {
                        success: false,
                        quotaExceeded: true,
                        error: `Participant quota exceeded. Maximum ${participantQuota.maxParticipants} participants allowed per event. You can save as draft to preserve your work.`
                    };
                }
            }

            const newParticipants = [];
            for (const participant of eventData.participants) {
                const userId = await getUserIdByEmail(participant.email);
                if (!userId) {
                    newParticipants.push(participant);
                }
            }

            if (newParticipants.length > 0 && instructorId) {
                const quota = await checkUserQuota(instructorId, newParticipants.length);
                if (!quota.allowed) {
                    return {
                        success: false,
                        quotaExceeded: true,
                        error: `User creation quota exceeded. You can create ${quota.remaining} more users, but ${newParticipants.length} new participants would be needed. You can save as draft to preserve your work.`
                    };
                }
            }

            eventData.participants = await Promise.all(
                eventData.participants.map(async (participant) => {
                    let userId = await getUserIdByEmail(participant.email);
                    if (!userId) {
                        try {
                            let newUser = await createUser({
                                email: participant.email,
                                role: "negotiator",
                                displayName: participant.name,
                                organisation: participant.org,
                                studentId: participant.studentId,
                            }, false, instructorId);
                            userId = newUser.uid;
                            usersCreated++;
                            if (newUser.welcomeLink) welcomeLinks.push(newUser.welcomeLink);
                        } catch (e) {
                            console.error("Failed to create user:", e);
                            throw new Error(`Failed to create user for ${participant.email}: ${e.message}`);
                        }
                    }
                    participant.id = userId;
                    return participant;
                })
            );

            if (welcomeLinks.length) {
                const adminEmails = await getAdminEmails();
                sendAdminWelcomeEmail(adminEmails, usersCreated, welcomeLinks.length, eventData.title);
            }

            eventData.participantIds = eventData.participants.map(p => p.id);

            const teams = {};
            eventData.participants.forEach(participant => {
                if (participant.team) {
                    if (!teams[participant.team]) {
                        teams[participant.team] = {
                            name: participant.team,
                            org: participant.org,
                            participants: []
                        };
                    }
                    teams[participant.team].participants.push(participant.id);
                }
            });
            eventData.teams = teams;
        }
        if (eventData.instructorId && eventData.instructorId.includes("@")) {
            eventData.instructorId = await getUserIdByEmail(eventData.instructorId);
            if (!eventData.instructorId) {
                return {
                    success: false,
                    error: "Instructor email not found in system"
                };
            }
        }
        if (eventData.instructorId) {
            eventData.instructor = eventData.instructorId;
            delete eventData.instructorId;
        }
        const eventId = await saveDoc(eventData, "events");

        return {
            success: true,
            eventId: eventId,
            message: eventData.draft ? "Event saved as draft" : "Event saved"
        };
    } catch (error) {
        console.error("Error in saveEvent action:", error);
        return {
            success: false,
            error: error.message || "Failed to save event"
        };
    }
}

export async function deleteEvent(eventId) {
    try {
        await deleteDoc(eventId, "events");
        return {
            success: true,
            message: "Event deleted successfully"
        };
    } catch (error) {
        console.error("Error in deleteEvent action:", error);
        return {
            success: false,
            error: error.message || "Failed to delete event"
        };
    }
}

export async function getPossibleInstructors() {
    const aIntructors = await getUsersByRoles(["instructor", "admin"]);
    return aIntructors;
}

export async function getPossibleParticipants() {
    const aParticipants = await getUsersByRoles(["negotiator", "instructor", "admin"]);
    return aParticipants;
}

export async function getSviFormData() {
    const survey = [
        {
            label: "How satisfied are you with your own outcome—i.e., the extent to which the terms of your agreement (or lack of agreement) benefit you?",
            fieldName: "satisfaction",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
            minDesc: "Not at all",
            maxDesc: "Perfectly",
        },
        {
            label: "How satisfied are you with the balance between your own outcome and your counterpart’s outcome?",
            fieldName: "balance",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
            minDesc: "Not at all",
            maxDesc: "Perfectly",
        },
        {
            label: "Did you feel like you forfeited or “lost” in this negotiation?",
            fieldName: "forfeited",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Totally'",
            minDesc: "Not at all",
            maxDesc: "Totally",
        },
        {
            label: "Do you think the terms of your agreement are consistent with principles of legitimacy or objective criteria (e.g., common standards of fairness, precedent, industry practice, legality, etc.)?",
            fieldName: "legitimacy",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
            minDesc: "Not at all",
            maxDesc: "Perfectly",
        },
        {
            label: "Did you “lose face” (i.e., damage your sense of pride) in the negotiation?",
            fieldName: "loseFace",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Totally'",
            minDesc: "Not at all",
            maxDesc: "Totally",
        },
        {
            label: "Did this negotiation make you feel more or less competent as a negotiator?",
            fieldName: "competence",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'It made me feel less competent' and 7 means 'It made me feel more competent'",
            minDesc: "It made me feel less competent",
            maxDesc: "It made me feel more competent",
        },
        {
            label: "Did you behave according to your own principles and values?",
            fieldName: "principles",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
            minDesc: "Not at all",
            maxDesc: "Perfectly",
        },
        {
            label: "Did this negotiation positively or negatively impact your self-image or your impression of yourself?",
            fieldName: "selfImage",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'It negatively impacted my self-image' and 7 means 'It positively impacted my self-image'",
            minDesc: "It negatively impacted my self-image",
            maxDesc: "It positively impacted my self-image",
        },
        {
            label: "Do you feel your counterpart listened to your concerns?",
            fieldName: "listened",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
            minDesc: "Not at all",
            maxDesc: "Perfectly",
        },
        {
            label: "Would you characterize the negotiation process as fair?",
            fieldName: "fairness",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
            minDesc: "Not at all",
            maxDesc: "Perfectly",
        },
        {
            label: "How satisfied are you with the ease (or difficulty) of reaching an agreement?",
            fieldName: "ease",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not satisfied at all' and 7 means 'Perfectly satisfied'",
            minDesc: "Not satisfied at all",
            maxDesc: "Perfectly satisfied",
        },
        {
            label: "Did your counterpart consider your wishes, opinions, or needs?",
            fieldName: "considered",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
            minDesc: "Not at all",
            maxDesc: "Perfectly",
        },
        {
            label: "What kind of “overall” impression did your counterpart make on you?",
            fieldName: "impression",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Extremely negative' and 7 means 'Extremely positive'",
            minDesc: "Extremely negative",
            maxDesc: "Extremely positive",
        },
        {
            label: "How satisfied are you with your relationship with your counterpart as a result of this negotiation?",
            fieldName: "relationshipSatisfaction",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
            minDesc: "Not at all",
            maxDesc: "Perfectly",
        },
        {
            label: "Did the negotiation make you trust your counterpart?",
            fieldName: "trust",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
            minDesc: "Not at all",
            maxDesc: "Perfectly",
        },
        {
            label: "Did the negotiation build a good foundation for a future relationship with your counterpart?",
            fieldName: "futureRelationship",
            tip: "The answer is on a scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
            minDesc: "Not at all",
            maxDesc: "Perfectly",
        },
    ];
    return survey.reduce((acc, item) => {
        acc[item.fieldName] = {
            label: item.label,
            tip: item.tip,
            // minDesc: item.minDesc,
            // maxDesc: item.maxDesc
        };
        return acc;
    }, {});
}

export async function listEventCoverUploads() {
    const access = await verifyAccess(["instructor"]);
    if (!access?.uid) throw new Error("Unauthorized");

    const { listEventCoverImages } = await import("@/lib/server/storage");
    const uploads = await listEventCoverImages(access.uid);

    return { success: true, uploads };
}

export async function uploadEventCover(formData) {
    const access = await verifyAccess(["instructor"]);
    if (!access?.uid) throw new Error("Unauthorized");

    const imageFile = formData.get("image");
    if (!(imageFile instanceof File) || imageFile.size === 0) {
        throw new Error("No image file provided");
    }

    const { uploadEventCoverImage } = await import("@/lib/server/storage");
    const result = await uploadEventCoverImage(access.uid, imageFile);

    return { success: true, ...result };
}

export async function deleteEventCover(storagePath) {
    const access = await verifyAccess(["instructor"]);
    if (!access?.uid) throw new Error("Unauthorized");
    if (!storagePath) throw new Error("No storage path provided");

    const { deleteEventCoverImage } = await import("@/lib/server/storage");
    await deleteEventCoverImage(access.uid, storagePath);

    return { success: true };
}
