"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "@/components/ui/select";
import { Trash2, Plus, Play, Pause, Save, Lock, Unlock, Search, Trash, Settings, ChevronDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import InfoTooltip from "@/components/InfoTooltip";
import CaseSearch from "@/components/CaseSearch";
import ParamsAI from "@/components/ParamsAI";
import { useLoading } from "@/contexts/LoadingContext";
import { Download, Upload, FileText } from "lucide-react";
import { showSuccessToast, showErrorToast, showWarnToast } from "@/components/toast";
import { getPossibleInstructors, getPossibleParticipants, saveEvent as saveEventAction, deleteEvent as deleteEventAction } from "@/actions/events";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { Slider } from "@/components/ui/slider";
import EventCoverPicker from "@/components/EventCoverPicker";

export default function EventEditor({ event, initInstructorId }) {
  const DEFAULT_ROUND_DURATION = 4 * 60 * 60 * 1000;
  const DEFAULT_ROUND_START_INTERVAL = 24 * 60 * 60 * 1000;
  const { user } = useUser();
  const getAdaptedUnix = () => { return (Math.floor(Date.now() / 60000) * 60000) };
  const adaptedUnix = getAdaptedUnix();
  const bIsNewEvent = !event?.id;
  const [lastEndTime, setLastEndTime] = useState(null);
  const getNewStartTime = () => (lastEndTime ? (lastEndTime < adaptedUnix ? adaptedUnix : lastEndTime + DEFAULT_ROUND_START_INTERVAL) : adaptedUnix);
  const getEmptyParticipant = () => ({ email: "", name: "", studentId: "", org: "", team: "", rounds: null, afterLaunch: (event?.startTime || 0) <= adaptedUnix });
  const getEmptyRound = () => {
    const newRoundStartTime = getNewStartTime();
    return { case: null, endTime: (newRoundStartTime + DEFAULT_ROUND_DURATION), startTime: newRoundStartTime, viewTime: newRoundStartTime, aiRound: false, aiSide: "n", aiParams: {}, inAppChat: true, language: "en", isNewRound: !bIsNewEvent && !isDraft }
  };

  const getParticipantRounds = (participant) => {
    return participant.rounds || null;
  };

  const isParticipantInRound = (participant, roundIndex) => {
    const rounds = getParticipantRounds(participant);
    if (rounds === null) return true; // null means all rounds
    return rounds.includes(roundIndex);
  };

  const getParticipantsForRound = (particips, roundIndex) => {
    return particips.filter(p => isParticipantInRound(p, roundIndex));
  };

  const checkRoundMatches = (matches, participants, roundNo, isOngoing) => {
    const roundText = roundNo ? `in round ${roundNo}` : "";
    if (!matches?.length) return `Missing matches ${roundText}.`;

    const roundIndex = roundNo ? roundNo - 1 : 0;
    const roundParticipants = getParticipantsForRound(participants, roundIndex);
    const validTeams = new Set(roundParticipants.map(p => p.team).filter(t => t));

    const usedTeams = new Set();
    for (const match of matches) {
      const { a, b } = match;
      if (!a || !b) {
        return `Both teams must be assigned ${roundText}.`;
      }
      if (a === b) {
        return `Team "${a}" ${roundText} cannot play against itself .`;
      }
      if (!isOngoing) {
        if (!validTeams.has(a) && !a.startsWith("AI-")) {
          return `Team "${a}" ${roundText} is NOT in participant list for this round.`;
        }
        if (!validTeams.has(b) && !b.startsWith("AI-")) {
          return `Team "${b}" ${roundText} is NOT in participant list for this round.`;
        }
      }
      if (usedTeams.has(a)) {
        return `Team "${a}" ${roundText} appears in more than one match.`;
      }
      if (usedTeams.has(b)) {
        return `Team "${b}" ${roundText} appears in more than one match.`;
      }
      usedTeams.add(a);
      usedTeams.add(b);
    }
    const bAllTeamsMatched = [...validTeams].every(team => usedTeams.has(team));
    if (!bAllTeamsMatched) showWarnToast(`Some teams not in any match ${roundText}`);
    return null;
  }

  const checkTeamsInParticipants = (round, participants, roundIndex) => {
    if (!round.matches || !round.matches.length) return false;

    const roundParticipants = roundIndex !== undefined
      ? getParticipantsForRound(participants, roundIndex)
      : participants;
    const validTeams = new Set(roundParticipants.map(p => p.team).filter(t => t));
    const usedTeams = new Set();

    round.matches.forEach(match => {
      if (match.a && !match.a.startsWith("AI-")) usedTeams.add(match.a);
      if (match.b && !match.b.startsWith("AI-")) usedTeams.add(match.b);
    });

    const hasExtraTeams = [...usedTeams].some(team => !validTeams.has(team));

    return hasExtraTeams;
  }

  if (!event) event = {
    title: "",
    instructorId: initInstructorId,
    participants: [getEmptyParticipant()],
    rounds: [getEmptyRound()],
    startTime: adaptedUnix,
    draft: true,
    empty: true,
    coverImage: null
  };

  const getCoverPreview = (value, fallback) => {
    if (fallback) return fallback;
    if (typeof value === "string" && (value.startsWith("/") || value.startsWith("http"))) {
      return value;
    }
    return null;
  };

  const initialCoverImage = event.coverImage || null;
  const initialCoverPreview = getCoverPreview(initialCoverImage, event.coverLink);

  const [id, setId] = useState(event.id);
  const [title, setTitle] = useState(event.title);
  const [instructorId, setInstructorId] = useState(event.instructorId);
  const [startTime, setStartTime] = useState(event.startTime);
  const [participants, setParticipants] = useState(event.participants);
  const [rounds, setRounds] = useState(event.rounds.map((round, index) => ({ ...round, isNewRound: false, obsoleteMatches: checkTeamsInParticipants(round, event.participants, index) })));
  const [users, setUsers] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [isDraft, setIsDraft] = useState(event.draft);
  const [savingDraft, setSavingDraft] = useState(event.draft);
  const [searchingCase, setSearchingCase] = useState("");
  const [pendingSave, setPendingSave] = useState(false);
  const [roundsChanged, setRoundsChanged] = useState(false);
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();
  const [maxTeamSize, setMaxTeamSize] = useState(3);
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [coverPreview, setCoverPreview] = useState(initialCoverPreview);
  const [isCoverPickerOpen, setCoverPickerOpen] = useState(false);

  const isEventStarted = () => id && event.startTime <= Date.now();
  const canEditEvent = () => !id || isDraft || !isEventStarted();
  const isRoundStarted = (round) => id && round.startTime <= Date.now();
  const isRoundFinished = (round) => id && round.endTime <= Date.now();
  const canEditRound = (round) => !id || isDraft || round?.isNewRound || !isRoundStarted(round);
  const canEditEndTime = (round) => round ? (!id || isDraft || round?.isNewRound || !isRoundFinished(round)) : false;
  const canManageCover = () => !id || isDraft || !hasEventEnded();

  const getEventLastEndTime = () => {
    const endTimes = rounds?.map((round) => round?.endTime).filter((value) => Number.isFinite(value));
    if (endTimes?.length) return Math.max(...endTimes);
    if (event?.endTime) return event.endTime;
    return null;
  };

  const hasEventEnded = () => {
    if (!id) return false;
    if (event?.finished) return true;
    const lastEnd = getEventLastEndTime();
    return lastEnd ? lastEnd <= Date.now() : false;
  };

  const updateLastEndTime = (newEndTime) => {
    const adaptedNow = getAdaptedUnix();
    if (newEndTime <= adaptedNow) newEndTime = adaptedNow;
    setLastEndTime(newEndTime);
  };

  useEffect(() => {
    if (!lastEndTime) {
      const lastRoundEndTime = event?.rounds?.[event.rounds.length - 1]?.endTime;
      updateLastEndTime(lastRoundEndTime || getNewStartTime());
    }
  }, [event]);

  const getActiveRoundIndex = () => {
    return rounds.findIndex(round => isRoundStarted(round) && !isRoundFinished(round));
  };

  const getRoundStatus = (roundIndex) => {
    const round = rounds[roundIndex];
    if (isRoundStarted(round) && !isRoundFinished(round)) return "active";
    if (isRoundFinished(round)) return "finished";
    if (isRoundStarted(round) && isRoundFinished(round)) return "stopped";
    return "pending";
  };

  const canStartRound = (roundIndex) => {
    if (isDraft) return false;
    if (roundIndex < 0 || roundIndex >= rounds.length) return false;
    const round = rounds[roundIndex];
    if (round?.isNewRound) return false;
    if (round?.obsoleteMatches) return false;
    const isActive = isRoundStarted(round) && !isRoundFinished(round);
    return !isActive;
  };

  const canStopRound = (roundIndex) => {
    if (isDraft) return false;
    if (roundIndex < 0 || roundIndex >= rounds.length) return false;
    const round = rounds[roundIndex];
    if (round?.isNewRound) return false;
    const isActive = isRoundStarted(round) && !isRoundFinished(round);
    return isActive;
  };

  useEffect(() => {
    const setAllUsers = async () => {
      if (!users?.length) setUsers(await getPossibleParticipants());
      if (!instructors?.length) setInstructors(await getPossibleInstructors());
    }
    setAllUsers();
  }, []);

  useEffect(() => {
    const setAllLastSeenTime = async () => {
      if (users?.length) {
        const updatedParticipants = participants.map(participant => {
          const user = users.find(user => user.email.toLowerCase() === participant.email.toLowerCase());
          return {
            ...participant,
            lastSeenTime: user ? user.lastSignInTime : null
          };
        });
        setParticipants(updatedParticipants);
      }
    }
    setAllLastSeenTime();
  }, [users]);

  useEffect(() => {
    setRoundsChanged(true);
  }, [rounds]);

  useEffect(() => {
    if (pendingSave && roundsChanged) {
      saveEvent(true, null, true);
      setPendingSave(false);
      setRoundsChanged(false);
    }
  }, [pendingSave, roundsChanged]);

  useEffect(() => {
    const updatedRounds = rounds.map((round, index) => ({
      ...round,
      obsoleteMatches: checkTeamsInParticipants(round, participants, index)
    }));

    const hasChanges = updatedRounds.some((round, index) =>
      round.obsoleteMatches !== rounds[index].obsoleteMatches
    );

    if (hasChanges) {
      setRounds(updatedRounds);
    }
  }, [participants]);

  const saveEvent = async (skipAsk, skipChecks, skipRedirect) => {
    const failEarly = (message) => {
      showErrorToast(message);
      throw new Error();
    };
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return failEarly("Event name is required.");
    if (!instructorId) return failEarly("Event instructor is required.");
    if (!savingDraft && !skipChecks) {
      if (isDraft && confirm("Save as LIVE event?") === false) {
        return;
      }
      if (!startTime) return failEarly("Event start time is required.");
      if (!participants.length) return failEarly("At least one participant is required for live events.");
      const emailRegex = /^[a-zA-Z0-9._%+-]+(?<!\.)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      let tempParticipants = [...participants];
      for (const participant of tempParticipants) {
        participant.error = false;
        if (!participant.email?.trim()) {
          participant.error = true;
          setParticipants(tempParticipants);
          return failEarly("All participants must have an email address.");
        }
        if (!emailRegex.test(participant.email.trim())) {
          participant.error = true;
          setParticipants(tempParticipants);
          return failEarly(`Invalid email format: ${participant.email}`);
        }
        // if (!participant.name?.trim()) {
        //   participant.error = true;
        //   setParticipants(tempParticipants);
        //   return failEarly("All participants must have a name.");
        // }
        // if (!participant.org?.trim()) {
        //   participant.error = true;
        //   setParticipants(tempParticipants);
        //   return failEarly("All participants must have an organization.");
        // }
        if (!participant.team?.trim()) {
          participant.error = true;
          setParticipants(tempParticipants);
          return failEarly("All participants must be assigned to a team.");
        }
      }
      if (!rounds?.length) return failEarly("At least one round is required.");
      let lastEndTime = startTime;
      let roundNo = 0;
      for (const round of rounds) {
        roundNo++;
        if (!round.case?.id) return failEarly("All rounds must have a case selected for live events.");
        if (round.aiRound && (!round.aiSide || round.aiSide === "n")) return failEarly("AI side must be set for AI rounds.");
        if (!round.viewTime || !round.startTime || !round.endTime) return failEarly("All rounds must have view time, start time, and end time set for live events.");
        if (round.startTime < startTime) return failEarly("Round start times must be at or after the event start time.");
        if (round.viewTime < lastEndTime) return failEarly("Round view times must be after previous round end times.");
        if (round.startTime < round.viewTime) return failEarly("Round start times must be after their view times.");
        if (round.endTime <= round.startTime) return failEarly("Round end times must be after their start times.");
        lastEndTime = round.endTime;
        const timeNow = getAdaptedUnix();
        const bRoundEnded = round.endTime <= timeNow;
        if (bRoundEnded) continue;
        const bRoundStarted = round.startTime <= timeNow;
        const bRoundOngoing = bRoundStarted && !bRoundEnded;
        const roundMatchesError = checkRoundMatches(round.matches, participants, roundNo, bRoundOngoing);
        if (roundMatchesError) return failEarly(roundMatchesError);
      }
      const hasNonAIRounds = rounds.some(round => !round.aiRound || round.aiSide === "n");
      if (hasNonAIRounds) {
        const hasMatches = rounds.some(round => round.matches && round.matches.length > 0);
        if (!hasMatches) return failEarly("Live events require matches to be generated for team-based rounds.");
      }
    }
    if (!isDraft && event.draft && !skipAsk) {
      if (!confirm("Save LIVE event?")) {
        return;
      }
    }
    showLoading();
    try {
      const cleanedRounds = rounds.map(({ isNewRound, ...round }) => round);
      const cleanedParticipants = participants.map(p => {
        const { lastSeenTime, afterLaunch, ...rest } = p;
        return rest;
      });
      const eventData = {
        title: trimmedTitle,
        startTime: startTime,
        instructorId: instructorId,
        rounds: cleanedRounds,
        participants: cleanedParticipants,
        draft: savingDraft,
        coverImage: coverImage || null
      };
      if (event.id || id) {
        eventData.id = event.id || id;
      }
      const result = await saveEventAction(eventData);
      if (result.success) {
        showSuccessToast(result.message || "Event saved successfully!");
        if (!savingDraft && !skipRedirect) {
          router.back();
        }
        if (result.eventId && !event.id) {
          setId(result.eventId);
        }
        setIsDraft(savingDraft);
        setRounds(cleanedRounds);
      } else {
        if (result.quotaExceeded) {
          showErrorToast(result.error || "User quota exceeded");
        } else {
          showErrorToast(result.error || "Failed to save event");
        }
      }
    } catch (error) {
      console.error("Error during save:", error);
      showErrorToast(`Error during save: ${error.message || "Unknown error"}`);
    }
    hideLoading();
  };

  const deleteEvent = async () => {
    const eventName = title;
    if (!confirm(`Delete event "${eventName}"?`)) {
      return;
    }
    showLoading();
    try {
      const result = await deleteEventAction(id);
      if (result.success) {
        showSuccessToast("Event deleted");
        router.back();
      } else {
        showErrorToast(result.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("Error during delete:", error);
      showErrorToast(`Error during delete: ${error.message || "Unknown error"}`);
    }
    hideLoading();
  };

  const updateParticipants = (newParticipants, noMatches) => {
    setParticipants(newParticipants);
    if (!noMatches) generateAllMatches(newParticipants, true);
  }

  const updateParticipant = (index, field, value, noMatches) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      [field]: value,
      lastSeenTime: field === "email" ? getLastSeenTimeByEmail(value) : updatedParticipants[index].lastSeenTime,
      error: false
    };
    updateParticipants(updatedParticipants, noMatches);
  }

  const getLastSeenTimeByEmail = (email) => {
    const user = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    return user ? user.lastSignInTime : null;
  }

  const autofillParticipant = async (index, email) => {
    if (email) {
      const updatedParticipants = [...participants];
      const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        updatedParticipants[index] = {
          ...updatedParticipants[index],
          name: existingUser.displayName || "",
          org: existingUser.organisation || "",
          studentId: existingUser.studentId || "",
          lastSeenTime: existingUser.lastSignInTime || null,
        }
        setParticipants(updatedParticipants);
      }
    }
  }

  const deleteParticipant = (index) => {
    const user = participants[index];
    const userName = user.name || user.email;
    if (userName) {
      if (!confirm(`Delete ${userName}?`)) return;
    }
    const updatedParticipants = [...participants];
    updatedParticipants.splice(index, 1);
    updateParticipants(updatedParticipants);
  }

  const addParticipant = () => {
    updateParticipants([...participants, getEmptyParticipant()]);
  }

  const addRound = () => {
    const newRound = getEmptyRound();
    updateLastEndTime(newRound.endTime);
    setRounds([...rounds, newRound]);
  }

  const deleteRound = (index) => {
    const round = rounds[index];
    const roundName = round.case?.title || (index + 1);
    if (roundName) {
      if (!confirm(`Are you sure you want to delete round ${roundName}?`)) return;
    }
    const updatedRounds = [...rounds];
    updatedRounds.splice(index, 1);
    updateLastEndTime(updatedRounds[updatedRounds.length - 1].endTime);
    setRounds(updatedRounds);
  }


  const updateRound = (index, field, value) => { // TODO reconsider this, seems wasteful
    const updatedRounds = [...rounds];
    const sLowerField = field.toLowerCase();
    let bShouldUpdateMatches = true;
    if (sLowerField.includes("time")) {
      if (value !== null && Number.isFinite(value)) {
        updatedRounds[index][field] = value;
        if (sLowerField === "endtime" && index === updatedRounds.length - 1) updateLastEndTime(value);
      }
      bShouldUpdateMatches = false;
      if (value === null || !Number.isFinite(value)) {
        return;
      }
    } else if (sLowerField.includes("matches")) {
      updatedRounds[index][field] = value;
      bShouldUpdateMatches = false;
    } else if (sLowerField.includes("case")) {
      updatedRounds[index].case = value;
    } else if (sLowerField.includes("lang")) {
      updatedRounds[index].language = value;
    } else if (sLowerField.includes("ai")) {
      if (field === "aiSide") {
        updatedRounds[index].aiSide = value;
      } else if (field === "aiRound") {
        updatedRounds[index].aiRound = value;
      } else if (field === "aiParams") {
        updatedRounds[index].aiParams = value;
      }
    } else if (sLowerField.includes("inappchat")) {
      updatedRounds[index].inAppChat = value;
    }
    if (bShouldUpdateMatches) {
      updatedRounds[index].matches = generateMatches(index, participants);
    }

    setRounds(updatedRounds);
  }

  const startRound = (index) => {
    const roundStatus = getRoundStatus(index);
    const actionText = roundStatus === 'stopped' ? 'Restart' : 'Start';
    if (!confirm(`${actionText} round ${index + 1}?`)) return;
    const timeNow = Date.now();
    const oneHour = 60 * 60 * 1000;
    const updatedRounds = [...rounds];
    const activeRoundIndex = getActiveRoundIndex();
    if (activeRoundIndex !== -1 && activeRoundIndex !== index) {
      updatedRounds[activeRoundIndex].endTime = timeNow;
    }
    for (let i = 0; i < index; i++) {
      const round = updatedRounds[i];
      if (isRoundStarted(round) && !isRoundFinished(round)) {
        updatedRounds[i].endTime = timeNow;
      } else if (!isRoundStarted(round)) {
        const pastTime = timeNow - (24 * oneHour * (index - i));
        updatedRounds[i].viewTime = pastTime;
        updatedRounds[i].startTime = pastTime + 50;
        updatedRounds[i].endTime = pastTime + (12 * oneHour);
      }
    }
    updatedRounds[index].viewTime = timeNow;
    updatedRounds[index].startTime = timeNow;
    updatedRounds[index].endTime = timeNow + (24 * oneHour);
    for (let i = index + 1; i < updatedRounds.length; i++) {
      const roundDistance = i - index;
      const baseTime = timeNow + (24 * oneHour * roundDistance);
      updatedRounds[i].viewTime = baseTime;
      updatedRounds[i].startTime = baseTime + 50;
      updatedRounds[i].endTime = baseTime + (24 * oneHour);
    }

    setRounds(updatedRounds);
    setPendingSave(true);
  };

  const stopRound = (index) => {
    if (!confirm(`Stop round ${index + 1}?`)) return;

    const updatedRounds = [...rounds];
    updatedRounds[index].endTime = Date.now();

    setRounds(updatedRounds);
    setPendingSave(true);
  };

  const setSortTeams = () => {
    const teamSize = Math.min(Math.max(maxTeamSize || 1, 1), 10);
    const sortedParticipants = [...participants].sort((a, b) => {
      const orgA = a.org || "";
      const orgB = b.org || "";

      if (orgA === orgB) {
        return (a.email || "").localeCompare(b.email || "");
      }
      return orgA.localeCompare(orgB);
    });

    const groupedByOrg = sortedParticipants.reduce((groups, participant) => {
      const org = participant.org || "No Organization";
      if (!groups[org]) {
        groups[org] = [];
      }
      groups[org].push(participant);
      return groups;
    }, {});

    const participantsWithTeams = [];
    let globalTeamNumber = 1;

    const bAllRoundsAI = rounds?.length && rounds.every(round => round.aiRound);

    Object.entries(groupedByOrg).forEach(([org, orgParticipants]) => {
      let currentTeam = [];

      orgParticipants.forEach((participant) => {
        currentTeam.push({
          ...participant,
          team: String(globalTeamNumber)
        });

        if (bAllRoundsAI) {
          participantsWithTeams.push(...currentTeam);
          currentTeam = [];
          globalTeamNumber++;
        } else if (currentTeam.length === teamSize) {
          participantsWithTeams.push(...currentTeam);
          currentTeam = [];
          globalTeamNumber++;
        }
      });

      if (currentTeam.length > 0) {
        participantsWithTeams.push(...currentTeam);
        globalTeamNumber++;
      }
    });

    const totalTeams = globalTeamNumber - 1;
    if (!bAllRoundsAI && totalTeams % 2 !== 0 && teamSize > 1) {
      const lastIndex = participantsWithTeams.length - 1;
      if (lastIndex >= 0) {
        const lastParticipant = participantsWithTeams[lastIndex];
        const lastTeamId = lastParticipant.team;

        const teamCounts = participantsWithTeams.reduce((m, p) => {
          m[p.team] = (m[p.team] || 0) + 1;
          return m;
        }, {});

        const membersInLastTeam = teamCounts[lastTeamId] || 0;

        if (membersInLastTeam > 1) {
          const newTeamId = String(totalTeams + 1);
          participantsWithTeams[lastIndex] = { ...lastParticipant, team: newTeamId };
        } else {
          const prevTeamId = String(totalTeams - 1);
          const prevTeamCount = teamCounts[prevTeamId] || 0;

          if (prevTeamCount < teamSize) {
            let sourceTeamId = null;
            let maxSize = 0;
            for (const [teamId, cnt] of Object.entries(teamCounts)) {
              if (teamId === lastTeamId) continue;
              if (cnt > maxSize) { maxSize = cnt; sourceTeamId = teamId; }
            }

            if (sourceTeamId && maxSize > 1) {
              const srcIndex = participantsWithTeams.map(p => p.team).lastIndexOf(sourceTeamId);
              if (srcIndex >= 0) {
                participantsWithTeams[srcIndex] = { ...participantsWithTeams[srcIndex], team: prevTeamId };
              } else {
                participantsWithTeams[lastIndex] = { ...lastParticipant, team: prevTeamId };
              }
            } else {
              participantsWithTeams[lastIndex] = { ...lastParticipant, team: prevTeamId };
            }
          }
        }
      }
    }

    if (!bAllRoundsAI) {
      const currentTeamIds = Array.from(new Set(participantsWithTeams.map(p => p.team).filter(Boolean)));
      if (currentTeamIds.length % 2 !== 0 && teamSize === 1 && currentTeamIds.length >= 3) {
        const sortedTeamIds = [...currentTeamIds].sort((a, b) => {
          const na = parseInt(a, 10);
          const nb = parseInt(b, 10);
          if (!isNaN(na) && !isNaN(nb)) return nb - na;
          return String(b).localeCompare(String(a));
        });
        const lastId = sortedTeamIds[0];
        const prevId = sortedTeamIds[1];
        for (let i = 0; i < participantsWithTeams.length; i++) {
          if (participantsWithTeams[i].team === lastId) {
            participantsWithTeams[i] = { ...participantsWithTeams[i], team: prevId };
          }
        }
        showWarnToast(`Merged 2 teams (${prevId}) to make an even number of teams!`);
      }
    }

    updateParticipants(participantsWithTeams);

    const currentTeamsCount = new Set(participantsWithTeams.map(p => p.team).filter(Boolean)).size;
    const bOddlyOddTeamsCount = !bAllRoundsAI && (currentTeamsCount % 2 !== 0);
    if (bOddlyOddTeamsCount) {
      showWarnToast("Odd number of teams created. Add more participants or adjust the team size.");
    }
  }

  const formatRoundsDisplay = (participant) => {
    const rounds = getParticipantRounds(participant);
    if (rounds === null) return "All rounds";
    if (rounds.length === 0) return "No rounds";
    return `Rounds: ${rounds.map(r => r + 1).join(", ")}`;
  };

  const updateParticipantRounds = (index, selectedRounds) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      rounds: selectedRounds
    };
    updateParticipants(updatedParticipants);
  };

  const generateAllMatches = (particips, silent) => {
    if (!particips) particips = participants;
    if (!particips.length) {
      if (!silent) showErrorToast("No participants to generate matches");
      return;
    }
    if (particips.some(p => !p.team?.trim())) {
      if (!silent) showErrorToast("All participants must be assigned to a team");
      return;
    }
    const updatedRounds = [...rounds];
    updatedRounds.forEach((round, index) => {
      if (round.matchesLocked) return;
      if (round.startTime <= Date.now() && !round.isNewRound && id) return;
      round.matches = generateMatches(index, particips);
    });
    setRounds(updatedRounds);
  }

  const generateMatches = (roundIndex, particips) => {
    const round = rounds[roundIndex];
    const roundParticipants = getParticipantsForRound(particips, roundIndex);
    const teams = [...new Set(roundParticipants.map(p => p.team).filter(team => team))];
    if (round.aiRound) {
      return generateAIMatches(teams, round);
    } else {
      return generateTeamMatches(teams, roundParticipants, roundIndex);
    }
  }

  const generateAIMatches = (teams, round) => {
    if (!round.aiSide || round.aiSide === "n") return null;
    return teams.map(teamId => {
      const aiTeamId = `AI-${teamId}`;
      return {
        a: round.aiSide === "a" ? aiTeamId : teamId,
        b: round.aiSide === "b" ? aiTeamId : teamId
      };
    });
  }

  const generateTeamMatches = (teams, particips, roundIndex) => {
    const orgOf = (() => {
      const cache = {};
      particips.forEach(p => {
        if (p.team && !cache[p.team]) cache[p.team] = p.org || "Unknown";
      });
      return teamId => cache[teamId] || "Unknown";
    })();

    const allTeams = [...teams].sort((a, b) => {
      const numA = typeof a === 'number' ? a : parseInt(a, 10);
      const numB = typeof b === 'number' ? b : parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return String(a).localeCompare(String(b));
    });

    const half = Math.floor(allTeams.length / 2);
    const firstHalf = allTeams.slice(0, half);
    const secondHalfBase = allTeams.slice(half);
    const lenSecond = secondHalfBase.length;

    if (!lenSecond) return [];

    const prevPairs = new Set();
    for (let ri = 0; ri < roundIndex; ri++) {
      const r = rounds[ri];
      if (!r || r.aiRound) continue;
      const ms = r.matches || [];
      for (const m of ms) {
        if (!m?.a || !m?.b) continue;
        const k = m.a < m.b ? `${m.a}|${m.b}` : `${m.b}|${m.a}`;
        prevPairs.add(k);
      }
    }

    let bestShift = 0;
    let bestRepeats = Infinity;
    let bestClashes = Infinity;

    for (let shift = 0; shift < lenSecond; shift++) {
      let repeats = 0;
      let clashes = 0;
      for (let i = 0; i < firstHalf.length; i++) {
        const a = firstHalf[i];
        const b = secondHalfBase[(i + roundIndex + shift) % lenSecond];
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (prevPairs.has(key)) repeats++;
        if (orgOf(a) === orgOf(b)) clashes++;
      }
      if (repeats < bestRepeats || (repeats === bestRepeats && clashes < bestClashes)) {
        bestRepeats = repeats;
        bestClashes = clashes;
        bestShift = shift;
        if (bestRepeats === 0 && bestClashes === 0) break;
      }
    }

    const rotatedSecondHalf = secondHalfBase.map(
      (_, i) => secondHalfBase[(i + roundIndex + bestShift) % lenSecond]
    );

    const matches = [];
    for (let i = 0; i < firstHalf.length; i++) {
      matches.push({ a: firstHalf[i], b: rotatedSecondHalf[i] });
    }

    if (allTeams.length % 2 !== 0) {
      const byeTeam = rotatedSecondHalf[firstHalf.length];
      showWarnToast(
        `Team ${byeTeam} not included in matches in round ${roundIndex + 1}.`
      );
    }

    return matches;
  };


  const formatDateTimeLocal = (unixTimestamp) => {
    if (!unixTimestamp || !Number.isFinite(unixTimestamp)) {
      return "";
    }
    const date = new Date(unixTimestamp);
    if (isNaN(date.getTime())) {
      return "";
    }
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  }

  const parseDateTimeLocal = (dateTimeLocalString) => {
    if (!dateTimeLocalString || typeof dateTimeLocalString !== 'string') {
      return null;
    }
    const date = new Date(dateTimeLocalString);
    const timestamp = date.getTime();
    if (isNaN(timestamp)) {
      return null;
    }
    return timestamp;
  }

  const fakeParticipants = () => {
    const fakeNames = [
      "John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis",
      "David Wilson", "Jessica Miller", "Christopher Taylor", "Amanda Anderson",
      "Matthew Thomas", "Jennifer Martinez"
    ];

    const fakeOrgs = [
      "University A", "University B", "University C", "University D",
      "College Alpha", "College Beta", "Institute Gamma", "Academy Delta"
    ];

    const fakeDomains = ["example.com", "mail.org", "demo.net", "company.co"];

    const fakeParticipants = [];

    for (let i = 0; i < 10; i++) {
      const name = fakeNames[i];
      const firstName = name.split(' ')[0].toLowerCase();
      const lastName = name.split(' ')[1].toLowerCase();
      const randomOrg = fakeOrgs[Math.floor(Math.random() * fakeOrgs.length)];
      const randomDomain = fakeDomains[Math.floor(Math.random() * fakeDomains.length)];

      fakeParticipants.push({
        email: `${firstName}.${lastName}@${randomDomain}`,
        name: name,
        studentId: `ST${(Math.floor(Math.random() * 90000) + 10000)}`,
        org: randomOrg,
        team: ""
      });
    }

    updateParticipants(fakeParticipants);
  }

  const CSV_HEADERS = ["email", "name", "studentId", "org", "team"];

  const getCsvDownload = (content, filename) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename || "participants.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const downloadParticipantsCSV = () => {
    const csvContent = `${CSV_HEADERS.join(",")}\n` +
      participants.map((p) => `${CSV_HEADERS.map(key => (p[key])).join(",")}`).join("\n");
    getCsvDownload(csvContent, `${title?.replace(" ", "_") || "event"}-participants.csv`);
  }

  const downloadCSVTemplate = () => {
    const csvContent = `${CSV_HEADERS.join(",")}\nexample@email.com,John Doe,ST001,University A,Team1\nexample2@email.com,Jane Smith,ST002,University B,Team2`;
    getCsvDownload(csvContent, "participants_template.csv");
  }

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = text.split("\n").slice(1);

        const newParticipants = rows
          .map((row) => {
            const [email, name, studentId, org, team] = row
              .split(",")
              .map((item) => item.trim());
            if (!email) return null;
            return { email, name, studentId, org, team };
          })
          .filter((participant) => participant !== null);

        if (newParticipants.length === 0) {
          showWarnToast("No valid participants found in CSV file");
          return;
        }

        const updatedParticipants = [...participants];
        let addedCount = 0;
        let updatedCount = 0;

        newParticipants.forEach((newParticipant) => {
          if (newParticipant.team?.toLowerCase().trim() === "ai") return;
          const existingIndex = updatedParticipants.findIndex(
            (p) => p.email === newParticipant.email
          );

          if (existingIndex > -1) {
            if (JSON.stringify(updatedParticipants[existingIndex]) !== JSON.stringify(newParticipant)) {
              updatedParticipants[existingIndex] = {
                ...updatedParticipants[existingIndex],
                ...newParticipant,
              };
              updatedCount++;
            }
          } else {
            updatedParticipants.push(newParticipant);
            addedCount++;
          }
        });

        updateParticipants(updatedParticipants.filter((p) => p.email !== ""));
        showSuccessToast(`CSV imported: ${addedCount} added, ${updatedCount} updated`);
        event.target.value = "";
      } catch (error) {
        showErrorToast("Error reading CSV file. Please check the format.");
      }
    };

    reader.readAsText(file);
  }

  const handleWipeParticipants = () => {
    if (!confirm("Remove ALL participants? This CANNOT be undone.")) return;
    updateParticipants([]);
  }

  const handleCoverSelect = ({ value, previewUrl }) => {
    setCoverImage(value);
    setCoverPreview(previewUrl);
    setCoverPickerOpen(false);
  };

  const clearCoverSelection = () => {
    setCoverImage(null);
    setCoverPreview(null);
  };

  const getParticipantsCount = () => {
    if (!participants?.length) return 0;
    return participants.filter(p => p.email?.includes("@")).length;
  }

  const LastSeenStatus = ({ lastSeenTime }) => {
    let statusText = "Never seen";
    let isActive = false;

    if (lastSeenTime) {
      statusText = new Date(lastSeenTime).toLocaleDateString();
      isActive = true;
    }

    return (
      <div className="flex items-center gap-1 w-23">
        <div className={`w-5 h-5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <span className={`${isActive ? 'text-sm text-gray-700' : 'text-md text-gray-500'} whitespace-pre-line`}>
          {statusText}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen p-2 md:p-4">
        {bIsNewEvent && (
          <h1 className="text-3xl font-bold text-blue-700 mb-2">New Event</h1>
        )}
        <Accordion className="" type="multiple" defaultValue={["basic", "participants", "rounds"]}>
          <AccordionItem value="basic">
            <div className="flex items-center justify-start space-x-2">
              <AccordionTrigger>
                <div className="text-md inline-flex items-center justify-center">
                  <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-700 rounded-full mr-2">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <span className="font-semibold text-blue-700">Basic info</span>
                </div>
              </AccordionTrigger>
              {/* <InfoTooltip iconOnly={false} info="" /> */}
            </div>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                <div className="space-y-1">
                  <Label className="text-blue-700 font-semibold text-md" htmlFor="title">Event Name</Label>
                  <Input className="rounded-2xl"
                    id="title"
                    type="text"
                    placeholder="Name of the Event"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!canEditEvent()}
                  />
                  <InfoTooltip info="The name of the event, e.g. 'Negotiation Competition 2025'" />
                </div>
                <div className="space-y-1">
                  <Label className="text-blue-700 font-semibold text-md" htmlFor="event-time">Time & Date</Label>
                  <Input
                    className="rounded-2xl"
                    type="datetime-local"
                    value={formatDateTimeLocal(startTime)}
                    onChange={(e) => {
                      const parsed = parseDateTimeLocal(e.target.value);
                      if (parsed !== null && Number.isFinite(parsed)) {
                        setStartTime(parsed);
                      }
                    }}
                    disabled={!canEditEvent()}
                  />
                  <InfoTooltip info="The start time of the event. Determines when events are active and when rounds can be started." />
                </div>
                <div className="space-y-1">
                  <Label className="text-blue-700 font-semibold text-md">Cover Image</Label>
                  <div className="flex flex-wrap items-center justify-start gap-3">
                    <div className="relative w-40 h-24 rounded-2xl border border-blue-100 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {coverPreview ? (
                        <Image
                          src={coverPreview}
                          alt="Event cover preview"
                          fill
                          className="object-cover"
                          sizes="160px"
                          unoptimized
                        />
                      ) : (
                        <span className="text-sm text-gray-500">No cover selected</span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => setCoverPickerOpen(true)}
                        disabled={!canManageCover()}
                      >
                        {coverPreview ? "Change image" : "Choose image"}
                      </Button>
                      {coverPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={clearCoverSelection}
                          disabled={!canManageCover()}
                        >
                          Remove cover
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end md:justify-start">
                    <InfoTooltip info="Select a cover image for this event. You can choose from preset covers or upload your own." />
                  </div>
                </div>
                {!initInstructorId && (
                  <div className="space-y-1">
                    <Label className="text-blue-700 font-semibold text-md" htmlFor="instructor">Event Instructor</Label>
                    <Select
                      className=""
                      id="instructor"
                      onValueChange={(value) => setInstructorId(value)}
                      defaultValue={instructorId}
                      disabled={!canEditEvent()}
                    >
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Event instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((user) => (
                          <SelectItem key={user.uid} value={user.uid}>
                            {user.displayName || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InfoTooltip info="The instructor of the event. Determines who is responsible for the event and who can manage it." />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="participants">
            <div className="flex items-center justify-start space-x-2">
              <AccordionTrigger>
                <div className="text-md inline-flex items-center justify-center">
                  <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-700 rounded-full mr-2">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <span className="font-semibold text-blue-700">Participants</span>
                </div>
              </AccordionTrigger>
              <InfoTooltip iconOnly={false} info="Add participants to the event. They will receive emails with their assigned rounds and cases." />
            </div>
            <AccordionContent>
              <div className="py-1">
                {participants.map((user, index) => (
                  // <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto_auto] gap-2 px-2 py-1">
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[4fr_4fr_2fr_3fr_2fr_2fr_1fr_2fr] gap-2 px-2 py-1">
                    <Input
                      className="rounded-2xl"
                      placeholder="Email"
                      type="email"
                      value={user.email}
                      onChange={(e) => updateParticipant(index, "email", e.target.value?.trim())}
                      onBlur={(e) => autofillParticipant(index, e.target.value?.trim())}
                      disabled={(!canEditEvent() && !user.afterLaunch)}
                    />
                    <Input
                      className="rounded-2xl"
                      placeholder="Name"
                      type="text"
                      value={user.name}
                      onChange={(e) => updateParticipant(index, "name", e.target.value)}
                    // disabled={!canEditEvent()}
                    />
                    <Input
                      className="rounded-2xl"
                      placeholder="Student ID"
                      type="text"
                      value={user.studentId}
                      onChange={(e) => updateParticipant(index, "studentId", e.target.value)}
                    // disabled={!canEditEvent()}
                    />
                    <Input
                      className="rounded-2xl"
                      placeholder="Organization"
                      type="text"
                      value={user.org}
                      onChange={(e) => updateParticipant(index, "org", e.target.value)}
                    // disabled={!canEditEvent()}
                    />
                    <Input
                      className="rounded-2xl"
                      placeholder="Team"
                      type="text"
                      value={user.team}
                      onChange={(e) => updateParticipant(index, "team", e.target.value, true)}
                      onBlur={() => updateParticipants(participants)}
                    // disabled={!canEditEvent()}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="rounded-full px-3 text-sm whitespace-nowrap justify-between"
                          title="Select rounds for this participant"
                        >
                          {formatRoundsDisplay(user)}
                          <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Select Rounds</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            // Select all rounds
                            updateParticipantRounds(index, null);
                          }}
                          className="cursor-pointer font-semibold"
                        >
                          <span className="mr-2 w-4 text-blue-800 font-bold">
                            {getParticipantRounds(user) === null ? "✓" : ""}
                          </span>
                          All rounds
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 h-px bg-gray-100" />
                        {rounds.map((round, roundIndex) => {
                          const currentRounds = getParticipantRounds(user);
                          const isCurrentlySelected = isParticipantInRound(user, roundIndex);

                          return (
                            <DropdownMenuItem
                              key={roundIndex}
                              onClick={() => {
                                let newRounds;
                                if (currentRounds === null) {
                                  newRounds = rounds
                                    .map((_, idx) => idx)
                                    .filter(idx => idx !== roundIndex);
                                } else {
                                  if (isCurrentlySelected) {
                                    newRounds = currentRounds.filter(r => r !== roundIndex);
                                  } else {
                                    newRounds = [...currentRounds, roundIndex].sort((a, b) => a - b);
                                  }
                                  if (newRounds.length === rounds.length) {
                                    newRounds = null;
                                  }
                                }
                                updateParticipantRounds(index, newRounds);
                              }}
                              className="cursor-pointer"
                            >
                              <span className="mr-2 w-4 text-blue-600 font-semibold">
                                {isCurrentlySelected ? "✓" : ""}
                              </span>
                              Round {roundIndex + 1} {round.case?.title ? `- ${round.case.title}` : ""}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {/* {canEditEvent() && ( */}
                    <div className="flex items-center justify-center">
                      <Button
                        title="Delete participant"
                        variant="destructive"
                        className="rounded-full w-fit px-3 "
                        onClick={() => deleteParticipant(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* )} */}
                    <div className="flex items-center justify-start">
                      <LastSeenStatus lastSeenTime={user.lastSeenTime} />
                    </div>
                  </div>
                ))}
                {/* {canEditEvent() && (
                <> */}
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Button
                    variant="default"
                    className="rounded-full font-semibold text-white"
                    onClick={() => addParticipant()}
                  // disabled={!canEditEvent()}
                  >
                    <Plus className="h-4 w-4" strokeWidth={4} />
                    Add participant
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-full font-semibold"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={downloadCSVTemplate}>
                        <FileText className="h-4 w-4 mr-2" />
                        Get template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadParticipantsCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Download list
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!canEditEvent()} onClick={() => document.getElementById('csv-upload').click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload list
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    style={{ display: 'none' }}
                    disabled={!canEditEvent()}
                  />
                  <Button
                    variant="destructive"
                    className="rounded-full font-semibold text-white"
                    onClick={() => handleWipeParticipants()}
                    disabled={!canEditEvent()}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={3} />
                    Wipe participants
                  </Button>
                  <div className="relative inline-flex">
                    <Button
                      title="Sort participants by organization and auto-assign teams"
                      variant="outline"
                      className="rounded-full font-semibold pr-10"
                      onClick={() => setSortTeams()}
                      disabled={!canEditEvent()}
                    >
                      Set & sort Teams
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted"
                          disabled={!canEditEvent()}
                          title="Adjust maximum team size"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 space-y-3 p-4">
                        <div className="flex items-center justify-start text-sm font-semibold gap-2">
                          <span>Maximum team size:</span>
                          <span className="font-bold">{maxTeamSize}</span>
                        </div>
                        <Slider
                          value={[maxTeamSize]}
                          min={1}
                          max={10}
                          step={1}
                          onValueChange={(value) => setMaxTeamSize(Math.min(Math.max(value[0] || 1, 1), 10))}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {process.env.NEXT_PUBLIC_ENVIRON !== "prod" && canEditEvent() && (
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="ghost"
                      className="rounded-full text-center mx-auto mt-2 text-orange-600 hover:text-orange-500"
                      onClick={() => fakeParticipants()}
                    >
                      Fake people
                    </Button>
                  </div>
                  //   )}
                  // </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="rounds">
            <div className="flex items-center justify-start space-x-2">
              <AccordionTrigger>
                <div className="text-md inline-flex items-center justify-center">
                  <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-700 rounded-full mr-2">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <span className="font-semibold text-blue-700">Manage Rounds</span>
                </div>
              </AccordionTrigger>
              <InfoTooltip iconOnly={false} info="Rounds are the individual parts of the event. Each round can have its own case, start and end time, and AI settings. Participants will be assigned to rounds based on their teams." />
            </div>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-2 py-1">
                {rounds.map((round, index) => (
                  <div key={index} className="space-y-2">
                    <Card className="bg-white border shadow-lg rounded-lg p-2">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h1 className="text-xl font-semibold text-blue-700 text-center">Round {index + 1}</h1>
                        {!isDraft && !round?.isNewRound && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoundStatus(index) === 'active' ? 'bg-green-100 text-green-800' :
                            getRoundStatus(index) === 'finished' ? 'bg-gray-100 text-gray-800' :
                              getRoundStatus(index) === 'stopped' ? 'bg-orange-100 text-orange-800' :
                                ''
                            }`}>
                            {getRoundStatus(index) === 'active' ? 'Active' :
                              getRoundStatus(index) === 'finished' ? 'Finished' :
                                getRoundStatus(index) === 'stopped' ? 'Stopped' :
                                  ''}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-2 py-1">
                        <div className="flex items-center justify-start gap-2">
                          {canStartRound(index) && (
                            <Button
                              variant="outline"
                              className="rounded-full w-fit px-3 bg-green-600 hover:bg-green-500"
                              onClick={() => startRound(index)}
                              title={`${getRoundStatus(index) === 'stopped' ? 'Restart' : 'Start'} round ${index + 1}`}
                            >
                              <Play className="h-10 w-10 text-white" strokeWidth={2} />
                            </Button>
                          )}
                          {canStopRound(index) && (
                            <Button
                              variant="destructive"
                              className="rounded-full w-fit px-3"
                              onClick={() => stopRound(index)}
                              title={`Stop round ${index + 1}`}
                            >
                              <Pause className="h-10 w-10" strokeWidth={2} />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-end">
                          {canEditRound(round) && (
                            <Button
                              variant="destructive"
                              className="rounded-full w-fit px-3"
                              onClick={() => deleteRound(index)}
                              title={`Delete round ${index + 1}`}
                            >
                              <Trash2 className="h-10 w-10" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                      </div>
                      <div className="flex items-center justify-start my-2">
                        <h2 className="text-blue-700 font-semibold">Case: <span className="text-black">{round.case?.id ? round.case.title : "Select Case"}</span></h2>
                        {canEditRound(round) && (
                          <Button
                            title="Select negotiation case for this round"
                            variant="ghost"
                            className="rounded-full w-fit mx-2 p-1"
                            onClick={() => { setSearchingCase(index) }}
                            disabled={!canEditRound(round)}
                          >
                            <Search strokeWidth={2} className={`p-0 ${round.case?.id ? "text-black" : "text-blue-700"}`} />
                          </Button>
                        )}
                        {Boolean(searchingCase.toString()) && (
                          <CaseSearch onClose={() => { setSearchingCase("") }} onCaseSelected={(acase) => {
                            updateRound(searchingCase, "case", acase);
                          }} userId={user.uid} />
                        )}
                      </div>
                      {round.case?.languages?.length > 1 && (
                        <div className="flex items-center justify-start">
                          <Label htmlFor="language" className="min-w-20 text-blue-700 font-semibold">Language:</Label>
                          <Select
                            className="ml-2 rounded-2xl"
                            id="language"
                            onValueChange={(value) => updateRound(index, "language", value)}
                            defaultValue={"EN"}
                            disabled={!canEditRound(round)}
                          >
                            <SelectTrigger className="rounded-2xl">
                              <SelectValue placeholder="Instructions language" />
                            </SelectTrigger>
                            <SelectContent>
                              {round.case?.languages?.map((lang) => (
                                <SelectItem key={`round-${index}-lang-${lang}`} value={lang}>
                                  {lang}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="my-4 mt-2">
                        <div className="flex items-center justify-start mb-2">
                          <Switch className="mr-2" id={`round-${index + 1}-ai`} checked={round.aiRound} onCheckedChange={(value) => updateRound(index, "aiRound", value)} disabled={!canEditRound(round)} />
                          <Label htmlFor={`round-${index + 1}-ai`} className="text-blue-700 font-semibold">Round with AI</Label>
                        </div>
                        {!round.aiRound && (
                          <div className="flex items-center justify-start mb-2">
                            <Switch className="mr-2" id={`round-${index + 1}-chat`} checked={round.inAppChat} onCheckedChange={(value) => updateRound(index, "inAppChat", value)} disabled={!canEditRound(round)} />
                            <Label htmlFor={`round-${index + 1}-chat`} className="text-blue-700 font-semibold">Negotiation in Discurso Chat</Label>
                          </div>
                        )}
                        {round.aiRound && (
                          <>
                            <div className="flex items-center justify-start mb-2">
                              <Label htmlFor="aiSide" className="min-w-14 text-blue-700 font-semibold">AI Side:</Label>
                              <Select
                                className="ml-2 rounded-2xl"
                                id="aiSide"
                                onValueChange={(value) => updateRound(index, "aiSide", value)}
                                defaultValue={round.aiSide || "a"}
                                disabled={!canEditRound(round)}
                              >
                                <SelectTrigger className="rounded-2xl">
                                  <SelectValue placeholder="AI Party" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem key={`round-${index}-aiside-a`} value="a">
                                    {round.case?.aName || "Party A"}
                                  </SelectItem>
                                  <SelectItem key={`round-${index}-aiside-b`} value="b">
                                    {round.case?.bName || "Party B"}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {round.aiParams && (
                              <>
                                <Label htmlFor="aiParams" className="min-w-14 text-blue-700 font-semibold">AI Settings:</Label>
                                <div className="px-2">
                                  <ParamsAI initParams={round.aiParams} onChange={(params) => updateRound(index, "aiParams", params)}
                                    disabled={isRoundFinished(round)}
                                  />
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                      <div className="my-4">
                        <div className="flex sm:flex-row md:flex-col lg:flex-row items-center justify-start mb-2">
                          <Label className="min-w-20 text-blue-700 font-semibold text-md justify-start md:w-full lg:w-fit" htmlFor={`round-${index}-viewTime`}>View Time:</Label>
                          <Input
                            className="rounded-2xl sm:w-fit md:w-full lg:w-fit"
                            id={`round-${index}-viewTime`}
                            type="datetime-local"
                            value={formatDateTimeLocal(round.viewTime)}
                            onChange={(e) => updateRound(index, "viewTime", parseDateTimeLocal(e.target.value))}
                            disabled={isRoundFinished(round) && round.obsoleteMatches}
                          />
                        </div>
                        <div className="flex sm:flex-row md:flex-col lg:flex-row items-center justify-start mb-2">
                          <Label className="min-w-20 text-blue-700 font-semibold text-md justify-start md:w-full lg:w-fit" htmlFor={`round-${index}-startTime`}>Start Time:</Label>
                          <Input
                            className="rounded-2xl sm:w-fit md:w-full lg:w-fit"
                            id={`round-${index}-startTime`}
                            type="datetime-local"
                            value={formatDateTimeLocal(round.startTime)}
                            onChange={(e) => updateRound(index, "startTime", parseDateTimeLocal(e.target.value))}
                            disabled={isRoundFinished(round) && round.obsoleteMatches}
                          />
                        </div>
                        <div className="flex sm:flex-row md:flex-col lg:flex-row items-center justify-start mb-2">
                          <Label className="min-w-20 text-blue-700 font-semibold text-md justify-start md:w-full lg:w-fit" htmlFor={`round-${index}-endTime`}>End Time:</Label>
                          <Input
                            className="rounded-2xl sm:w-fit md:w-full lg:w-fit"
                            id={`round-${index}-endTime`}
                            type="datetime-local"
                            value={formatDateTimeLocal(round.endTime)}
                            onChange={(e) => updateRound(index, "endTime", parseDateTimeLocal(e.target.value))}
                            disabled={isRoundFinished(round) && round.obsoleteMatches}
                          />
                        </div>
                      </div>
                      <div>
                        {round.matches?.length ? (
                          <Accordion className="w-full" type="single" collapsible>
                            <AccordionItem value={`round-${index}-matches`}>
                              <div className="flex items-center justify-start">
                                <Button
                                  title="Lock/Unlock matches to prevent auto-generation"
                                  variant="ghost"
                                  size="icon"
                                  className="m-0 p-0 rounded-full"
                                  onClick={() =>
                                    updateRound(index, "matchesLocked", !round.matchesLocked)
                                  }
                                  disabled={!canEditRound(round)}
                                >
                                  {round.matchesLocked ? (
                                    <Lock className="h-4 w-4 text-black" />
                                  ) : (
                                    <Unlock className="h-4 w-4 text-blue-700" />
                                  )}
                                </Button>
                                <AccordionTrigger className="flex-1 text-left text-blue-700 font-semibold">
                                  Matches
                                </AccordionTrigger>
                                {process.env.ENVIRON !== "prod" && (
                                  <p className="ml-2 text-orange-600">{round.obsoleteMatches ? "Matches mismatch participants" : ""}</p>
                                )}
                              </div>
                              <AccordionContent className="p-0">
                                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-2 py-1 items-center">
                                  <Label className="text-blue-700 text-md block" >{round.case?.id ? round.case.aName : "Party A"}</Label>
                                  <Label className="text-blue-700 text-md block" >{round.case?.id ? round.case.bName : "Party B"}</Label>
                                  {canEditRound(round) && !round.aiRound && (
                                    <Button
                                      variant="default"
                                      className="rounded-full w-fit px-3"
                                      onClick={() => {
                                        const updatedMatches = [...round.matches];
                                        updatedMatches.push({ a: "", b: "" });
                                        updateRound(index, "matches", updatedMatches);
                                      }}
                                      disabled={!canEditRound(round)}
                                    >
                                      <Plus className="h-4 w-4" strokeWidth={4} />
                                    </Button>
                                  )}
                                </div>
                                {round.matches.map((match, matchIndex) => (
                                  <div key={`match-${index}-${matchIndex}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 px-2 py-1">
                                    <Input
                                      className="rounded-2xl"
                                      placeholder="Team A"
                                      type="text"
                                      value={match.a.includes("AI") ? "AI" : match.a}
                                      onChange={(e) => {
                                        const updatedMatches = [...round.matches];
                                        updatedMatches[matchIndex].a = e.target.value;
                                        updateRound(index, "matches", updatedMatches);
                                      }}
                                      disabled={round.aiRound || !canEditRound(round) || (isRoundFinished(round) && round.obsoleteMatches)}
                                    />
                                    <Input
                                      key={`match-${index}-${matchIndex}-b`}
                                      className="rounded-2xl"
                                      placeholder="Team B"
                                      type="text"
                                      value={match.b.includes("AI") ? "AI" : match.b}
                                      onChange={(e) => {
                                        const updatedMatches = [...round.matches];
                                        updatedMatches[matchIndex].b = e.target.value;
                                        updateRound(index, "matches", updatedMatches);
                                      }}
                                      disabled={round.aiRound || !canEditRound(round) || (isRoundFinished(round) && round.obsoleteMatches)}
                                    />
                                    {canEditRound(round) && !(isRoundFinished(round) && round.obsoleteMatches) && !round.aiRound && (
                                      <Button
                                        variant="destructive"
                                        className="rounded-full w-fit px-3"
                                        onClick={() => {
                                          if (!confirm(`Delete the match in round ${index + 1}${match.a && match.b ? ` between ${match.a} and ${match.b}` : ''}?`)) return;
                                          const updatedMatches = [...round.matches];
                                          updatedMatches.splice(matchIndex, 1);
                                          updateRound(index, "matches", updatedMatches);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ) : (
                          <>
                            <h2 className="text-blue-700 font-semibold">Matches:</h2>
                            <p className="text-gray-500 text-sm">No matches yet. Complete participants and round setup.</p>
                          </>
                        )}
                      </div>
                    </Card>
                  </div>
                ))}
                {/* {(canEditEvent() || canEditEndTime(rounds.length ? rounds[rounds.length - 1] : null)) && ( */}
                <div className="flex justify-center items-center">
                  <Button variant="default" className="rounded-full font-semibold" onClick={() => addRound()}>
                    <Plus className="h-4 w-4" strokeWidth={4} />
                    Add Round
                  </Button>
                </div>
                {/* )} */}
              </div>
              {/* <InfoTooltip fromTop={true} info="Rounds are the individual parts of the event. Each round can have its own case, start and end time, and AI settings. Participants will be assigned to rounds based on their teams." /> */}
            </AccordionContent >
          </AccordionItem >
        </Accordion >
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center justify-start">
            {(canEditEvent() || canEditEndTime(rounds.length ? rounds[rounds.length - 1] : null)) && (
              <>
                <Button
                  variant="default"
                  className="rounded-full font-semibold text-white ml-2 mr-4"
                  onClick={() => saveEvent()}
                  disabled={pendingSave}
                >
                  <Save className="h-4 w-4" strokeWidth={2} />
                  {pendingSave ? "Saving..." : "Save Event"}
                </Button>
                {isDraft && (
                  <>
                    <Switch
                      className="mr-2"
                      id="draft-mode"
                      checked={savingDraft}
                      onCheckedChange={(value) => setSavingDraft(value)}
                      disabled={!canEditEvent()}
                    />
                    <Label htmlFor="draft-mode" className="text-blue-700 font-semibold mr-2">
                      Draft Mode
                    </Label>
                    <InfoTooltip fromTop={true} iconOnly={true} info="Draft mode allows you to create an event without making it live and visible to others.
          Once you are ready, you can save it the as a live event." />
                  </>
                )}
                {pendingSave && (
                  <span className="text-blue-700 font-semibold">Processing...</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center justify-end">
            {id && (
              <Button
                variant="destructive"
                className="rounded-full font-semibold mx-2"
                onClick={() => deleteEvent()}
                disabled={pendingSave}
              >
                <Trash2 className="h-4 w-4" />
                Delete Event
              </Button>
            )}
          </div>
        </div>
      </div>
      {isCoverPickerOpen && (
        <EventCoverPicker
          isOpen={isCoverPickerOpen}
          onClose={() => setCoverPickerOpen(false)}
          onSelect={handleCoverSelect}
          selectedValue={coverImage}
          currentPreview={coverPreview}
          canUpload={user?.role === "instructor"}
        />
      )}
    </>
  );
}