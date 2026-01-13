import "server-only";
import { getDocs, saveDoc, deleteDoc, getDoc } from "@/lib/server/data/data";
import {
  getUserIdByEmail,
  getUserEmailById,
  createUser,
} from "@/lib/server/auth";
import { getTimeLeft } from "@/lib/util";
import { getCasesForEventEditor } from "@/lib/server/data/cases";
import { getEventCoverDownloadURL } from "@/lib/server/storage";
import { deleteResultsByEventId } from "@/lib/server/data/results";

async function enrichParticipantEmails(participants) {
  return await Promise.all(
    participants.map(async (participant) => {
      if (participant.id) {
        const currentEmail = await getUserEmailById(participant.id);
        return {
          ...participant,
          email: currentEmail || participant.email,
        };
      }
      return participant;
    })
  );
}

export async function markRoundNotified(eventId, round) {
  const event = await getDoc(eventId, "events");
  let roundIndex = parseInt(round) - 1;
  event.rounds[roundIndex].notified = true;
  await saveDoc(event, "events");
}

export async function getEvent(eventId) {
  const eventDoc = await getDoc(eventId, "events");
  eventDoc.instructorEmail = await getUserEmailById(eventDoc.instructor);
  const coverLink = await resolveEventCoverLink(eventDoc.coverImage);

  if (eventDoc.participants?.length) {
    eventDoc.participants = await enrichParticipantEmails(eventDoc.participants);
  }

  const richEvent = enrichEvent({ ...eventDoc, coverLink });

  if (richEvent?.rounds?.length) {
    const caseIds = richEvent.rounds.map((round) => round.case?.id || round.caseId).filter((id) => id);
    if (caseIds.length) {
      const cases = await getCasesForEventEditor(caseIds);
      richEvent.rounds = richEvent.rounds.map((round) => {
        const caseId = round.caseId || round.case?.id;
        return {
          ...round,
          case: cases[caseId] ? {
            id: caseId,
            title: cases[caseId].title,
            aName: cases[caseId].aName,
            bName: cases[caseId].bName
          } : null,
          aiRound: round.aiSide !== "n"
        };
      });
    }
    if (richEvent?.matches?.length) {
      richEvent.matches.forEach((match, index) => {
        if (richEvent.rounds[index]) {
          richEvent.rounds[index].matches = match.matches;
        }
      });
    }
  }
  richEvent.instructorId = richEvent.instructor;

  return richEvent;
}

export async function getEvents(options) {
  let events;
  if (!options) {
    events = await getDocs("events", null, null, null, "timestamp", "desc");
  } else if (options.participant) {
    if (options.available) {
      const allEvents = await getDocs("events", null, null, null, "timestamp", "desc");
      const availableEvents = allEvents.filter((event) => {
        return !event.participants.includes(options.participant);
      });
      events = availableEvents;
    } else {
      events = await getDocs("events", [
        {
          field: "participantIds",
          contains: true,
          value: options.participant,
        },
      ], null, null, "timestamp", "desc");
    }
  } else if (options.instructor) {
    events = await getDocs("events", [
      {
        field: "instructor",
        value: options.instructor,
      },
    ], null, null, "timestamp", "desc");
  }
  events = await Promise.all(
    events.map(async (event) => {
      const instructorEmail = await getUserEmailById(event.instructor);
      const coverLink = await resolveEventCoverLink(event.coverImage);

      let enrichedParticipants = event.participants;
      if (event.participants?.length) {
        enrichedParticipants = await enrichParticipantEmails(event.participants);
      }

      return {
        ...event,
        instructorEmail,
        coverLink,
        participants: enrichedParticipants,
      };
    })
  );
  return enrichEvents(events).sort((a, b) => {
    return b.startTime - a.startTime;
  });
}

export async function getAllEvents() {
  const events = await getDocs("events");
  return events;
}

export async function saveEvent(newEvent) {
  if (!newEvent.draft) {
    let instructorId = newEvent.instructor;
    if (instructorId && instructorId.includes("@")) {
      instructorId = await getUserIdByEmail(instructorId);
    }

    newEvent.participants = await Promise.all(
      newEvent.participants.map(async (participant) => {
        let userId = await getUserIdByEmail(participant.email);
        if (!userId) {
          let newUser = await createUser({
            email: participant.email,
            role: "negotiator",
            displayName: participant.name,
            organisation: participant.org,
            studentId: participant.studentId,
          }, newEvent.welcomeEmail, instructorId);
          userId = newUser.uid;
        }
        participant.id = userId;
        return participant;
      })
    );
  }

  if (newEvent.instructor.includes("@")) {
    newEvent.instructor = await getUserIdByEmail(newEvent.instructor);
  }

  if (!newEvent.draft) {
    let aParticipantIds = [];
    let aTeamsNames = Object.keys(newEvent.teams);
    for (let sTeamName of aTeamsNames) {
      let oTeam = newEvent.teams[sTeamName];
      oTeam.participants = oTeam.participants.map((participant) => {
        let userId = newEvent.participants.find((user) => user.email === participant.email)?.id;
        aParticipantIds.push(userId);
        return userId;
      });
    }
    newEvent.participantIds = aParticipantIds;
  }

  const eventId = await saveDoc(newEvent, "events");
  return eventId;
}

export async function deleteEvent(eventId) {
  const deleted = await deleteDoc(eventId, "events");
  if (deleted) {
    await deleteResultsByEventId(eventId);
  }
  return deleted;
}

function enrichEvents(rawEvents) {
  const currentTime = Date.now();
  const events = rawEvents.map((event) => {
    return enrichEvent(event, currentTime);
  });
  return events;
}

function enrichEvent(rawEvent, currentTime) {
  currentTime = currentTime ?? Date.now();
  let finished, endTime, lastRound;
  if (rawEvent.rounds && rawEvent.rounds.length && rawEvent.rounds[rawEvent.rounds.length - 1].endTime) {
    lastRound = rawEvent.rounds[rawEvent.rounds.length - 1];
    endTime = lastRound.endTime;
    finished = endTime < currentTime;
  }
  let viewTime;
  let currentRound = 0;
  let roundsStarted = false;
  if (currentTime >= rawEvent.startTime && !finished) {
    for (let i = 0; i < rawEvent.rounds.length; i++) {
      let oRound = rawEvent.rounds[i];

      if (!viewTime && oRound.startTime > currentTime) {
        viewTime = oRound.viewTime || oRound.startTime;
      }
      if (currentTime >= oRound.startTime) roundsStarted = true;
      if (currentTime < oRound.endTime) {
        currentRound = i + 1;
        break;
      }
    }
  }
  let currentRoundIndex = currentRound - 1;
  if (currentRoundIndex < 0) currentRoundIndex = 0;
  const oCurrentRound = rawEvent?.rounds?.length ? rawEvent.rounds[currentRoundIndex] : null;
  const roundEndTime = oCurrentRound ? oCurrentRound.endTime : Infinity;
  const { value, unit } = getTimeLeft(roundEndTime);
  if (!viewTime) viewTime = oCurrentRound ? oCurrentRound.startTime : Infinity;
  return {
    ...rawEvent,
    roundsCount: rawEvent.rounds.length,
    currentRound: currentRound,
    timeLeft: value,
    timeLeftUnits: unit,
    finished,
    started: currentTime >= rawEvent.startTime,
    endTime,
    viewTime,
    roundsStarted,
    roundEndTime
  };
}

async function resolveEventCoverLink(coverValue) {
  if (!coverValue || typeof coverValue !== "string") return null;
  if (coverValue.startsWith("http") || coverValue.startsWith("/")) {
    return coverValue;
  }
  try {
    return await getEventCoverDownloadURL(coverValue);
  } catch (error) {
    console.error("Error resolving event cover link:", error);
    return null;
  }
}