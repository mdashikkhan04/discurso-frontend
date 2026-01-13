"use client";
import { firestore_util } from "./firebase/firebase";

const { db, collection, query, where, onSnapshot, addDoc, doc, getDoc } = firestore_util;

const messagesRef = collection(db, "p2pMessages");

export const getMessagesSnapshot = (callback, negId) => {
  if (!negId) {
    callback([]);
    return () => {};
  }

  const q = query(messagesRef, where("negId", "==", negId));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    messages.sort((a, b) => {
      const aTime = a.time?.toDate?.() || a.time || 0;
      const bTime = b.time?.toDate?.() || b.time || 0;
      return aTime - bTime;
    });
    
    callback(messages);
  });
};

export const getAgreementsSnapshot = (
  callback,
  eventId = "",
  roundId = 0,
  participantId = "",
  enemyIds = []
) => {
  const numericRoundId = typeof roundId === 'string' ? parseInt(roundId, 10) : roundId;
  
  const allParticipantIds = [participantId, ...enemyIds].filter(Boolean);
  const resultsRef = collection(db, "results");
  
  let q;
  if (allParticipantIds.length > 0 && allParticipantIds.length <= 10) {
    q = query(
      resultsRef,
      where("eventId", "==", eventId.trim()),
      where("round", "==", numericRoundId),
      where("participants", "array-contains-any", allParticipantIds)
    );
  } else {
    q = query(
      resultsRef,
      where("eventId", "==", eventId.trim()),
      where("round", "==", numericRoundId)
    );
  }

  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    let filteredResults = results;

    if (allParticipantIds.length > 10) {
      filteredResults = results.filter(result => 
        result.participants && result.participants.some(pid => allParticipantIds.includes(pid))
      );
    }

    const agreements = filteredResults.map(result => ({
      id: result.id,
      eventId: result.eventId,
      round: result.round,
      team: result.team,
      participants: result.participants,
      agreement: result.agreement || {},
      madeDeal: result.madeDeal,
      final: result.final,
      lastModified: result.lastModified || result.updatedAt || Date.now()
    }));

    callback(agreements);
  });
};

export const getAgreementConflictsSnapshot = (
  callback,
  eventId = "",
  roundId = 0,
  participantId = "",
  enemyIds = []
) => {
  const eventRef = doc(db, "events", eventId);
  const resultsRef = collection(db, "results");
  
  const numericRoundId = typeof roundId === 'string' ? parseInt(roundId, 10) : roundId;
  
  const allParticipantIds = [participantId, ...enemyIds].filter(Boolean);
  
  let latestEvent = null;
  let latestCase = null;
  let latestResults = [];
  
  const eventUnsubscribe = onSnapshot(eventRef, async (eventSnapshot) => {
    if (eventSnapshot.exists()) {
      latestEvent = { id: eventSnapshot.id, ...eventSnapshot.data() };
      
      if (latestEvent.rounds && latestEvent.rounds[numericRoundId - 1]) {
        const caseId = latestEvent.rounds[numericRoundId - 1].case?.id || latestEvent.rounds[numericRoundId - 1].caseId;
        if (caseId) {
          try {
            const caseRef = doc(db, "cases", caseId);
            const caseSnapshot = await getDoc(caseRef);
            if (caseSnapshot.exists()) {
              latestCase = { id: caseSnapshot.id, ...caseSnapshot.data() };
            }
          } catch (error) {
            console.error("Error fetching case:", error);
          }
        }
      }
    }
    processConflicts();
  });
  
  let resultsQuery;
  if (allParticipantIds.length > 0 && allParticipantIds.length <= 10) {
    resultsQuery = query(
      resultsRef,
      where("eventId", "==", eventId.trim()),
      where("round", "==", numericRoundId),
      where("participants", "array-contains-any", allParticipantIds)
    );
  } else {
    resultsQuery = query(
      resultsRef,
      where("eventId", "==", eventId.trim()),
      where("round", "==", numericRoundId)
    );
  }

  const resultsUnsubscribe = onSnapshot(resultsQuery, (snapshot) => {
    latestResults = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    if (allParticipantIds.length > 10) {
      latestResults = latestResults.filter(result => 
        result.participants && result.participants.some(pid => allParticipantIds.includes(pid))
      );
    }
    
    processConflicts();
  });

  const processConflicts = () => {
    if (!latestEvent || !latestCase || !latestResults.length) return;

    const conflicts = [];
    const ownResult = latestResults.find(r => r.participants?.includes(participantId));
    
    if (ownResult && Object.keys(ownResult.agreement || {}).length > 0) {
      for (const enemyId of enemyIds) {
        const enemyResult = latestResults.find(r => r.participants?.includes(enemyId));
        
        if (enemyResult && Object.keys(enemyResult.agreement || {}).length > 0) {
          const hasConflict = latestCase.agreeMatch ? !hasSameAgreedVals(ownResult, enemyResult) : false;
          
          if (hasConflict) {
            conflicts.push({
              id: `${ownResult.id}-${enemyResult.id}`,
              eventId,
              round: roundId,
              ownResult: {
                id: ownResult.id,
                team: ownResult.team,
                agreement: ownResult.agreement,
                madeDeal: ownResult.madeDeal
              },
              enemyResult: {
                id: enemyResult.id,
                team: enemyResult.team,
                agreement: enemyResult.agreement,
                madeDeal: enemyResult.madeDeal
              },
              conflictType: 'agreement_mismatch',
              lastModified: Math.max(
                ownResult.lastModified || ownResult.updatedAt || 0,
                enemyResult.lastModified || enemyResult.updatedAt || 0
              )
            });
          }
        }
      }
    }
    
    callback(conflicts);
  };

  return () => {
    eventUnsubscribe();
    resultsUnsubscribe();
  };
};

export const getCombinedSnapshot = (
  callbacks,
  eventId = "",
  roundId = 0,
  participantId = "",
  enemyIds = [],
  ownTeamIds = [],
  negId = null
) => {
  const numericRoundId = typeof roundId === 'string' ? parseInt(roundId, 10) : roundId;
  
  const allParticipantIds = [participantId, ...enemyIds, ...ownTeamIds].filter(Boolean);
  const allUserIds = [participantId, ...enemyIds, ...ownTeamIds].filter(Boolean);
  
  const eventRef = doc(db, "events", eventId);
  const messagesRef = collection(db, "p2pMessages");
  const resultsRef = collection(db, "results");
  
  let latestEvent = null;
  let latestCase = null;
  
  let messagesQuery;
  if (negId) {
    messagesQuery = query(messagesRef, where("negId", "==", negId));
  } else if (eventId?.trim()) {
    messagesQuery = query(
      messagesRef,
      where("eventId", "==", eventId.trim())
    );
  } else {
    messagesQuery = query(messagesRef);
  }
  
  let resultsQuery;
  if (allParticipantIds.length > 0 && allParticipantIds.length <= 10) {
    resultsQuery = query(
      resultsRef,
      where("eventId", "==", eventId.trim()),
      where("round", "==", numericRoundId),
      where("participants", "array-contains-any", allParticipantIds)
    );
  } else {
    resultsQuery = query(
      resultsRef,
      where("eventId", "==", eventId.trim()),
      where("round", "==", numericRoundId)
    );
  }
  
  const eventUnsubscribe = onSnapshot(eventRef, async (eventSnapshot) => {
    if (eventSnapshot.exists()) {
      latestEvent = { id: eventSnapshot.id, ...eventSnapshot.data() };
      
      if (latestEvent.rounds && latestEvent.rounds[numericRoundId - 1]) {
        const caseId = latestEvent.rounds[numericRoundId - 1].case?.id || latestEvent.rounds[numericRoundId - 1].caseId;
        if (caseId) {
          try {
            const caseRef = doc(db, "cases", caseId);
            const caseSnapshot = await getDoc(caseRef);
            if (caseSnapshot.exists()) {
              latestCase = { id: caseSnapshot.id, ...caseSnapshot.data() };
            }
          } catch (error) {
            console.error("Error fetching case:", error);
          }
        }
      }
    }
  });
  
  const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    let filteredMessages = messages;
    
    if (!negId) {
      filteredMessages = messages.filter(msg => {
        const msgRoundId = typeof msg.roundId === 'string' ? parseInt(msg.roundId, 10) : msg.roundId;
        const roundMatch = msgRoundId === numericRoundId;
        
        const userMatch = allUserIds.length === 0 || allUserIds.includes(msg.userId);
        
        return roundMatch && userMatch;
      });
    }
    
    if (eventId.trim()) {
      filteredMessages.sort((a, b) => {
        const aTime = a.time?.toDate?.() || a.time || 0;
        const bTime = b.time?.toDate?.() || b.time || 0;
        return aTime - bTime;
      });
    }
    
    if (callbacks.onMessages) {
      callbacks.onMessages(filteredMessages);
    }
  });
  
  const resultsUnsubscribe = onSnapshot(resultsQuery, (snapshot) => {
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    let filteredResults = results;
    if (allParticipantIds.length > 10) {
      filteredResults = results.filter(result => 
        result.participants && result.participants.some(pid => allParticipantIds.includes(pid))
      );
    }

    const agreements = filteredResults.map(result => ({
      id: result.id,
      eventId: result.eventId,
      round: result.round,
      team: result.team,
      participants: result.participants,
      agreement: result.agreement || {},
      madeDeal: result.madeDeal,
      final: result.final,
      lastModified: result.lastModified || result.updatedAt || Date.now()
    }));

    if (callbacks.onAgreements) {
      callbacks.onAgreements(agreements);
    }
    
    if (latestEvent && latestCase && filteredResults.length > 0) {
      const conflicts = [];
      const ownResult = filteredResults.find(r => r.participants?.includes(participantId));
      
      if (ownResult && Object.keys(ownResult.agreement || {}).length > 0) {
        for (const enemyId of enemyIds) {
          const enemyResult = filteredResults.find(r => r.participants?.includes(enemyId));
          
          if (enemyResult && Object.keys(enemyResult.agreement || {}).length > 0) {
            const hasConflict = latestCase.agreeMatch ? !hasSameAgreedVals(ownResult, enemyResult) : false;
            
            if (hasConflict) {
              conflicts.push({
                id: `${ownResult.id}-${enemyResult.id}`,
                eventId,
                round: roundId,
                ownResult: {
                  id: ownResult.id,
                  team: ownResult.team,
                  agreement: ownResult.agreement,
                  madeDeal: ownResult.madeDeal
                },
                enemyResult: {
                  id: enemyResult.id,
                  team: enemyResult.team,
                  agreement: enemyResult.agreement,
                  madeDeal: enemyResult.madeDeal
                },
                conflictType: 'agreement_mismatch',
                lastModified: Math.max(
                  ownResult.lastModified || ownResult.updatedAt || 0,
                  enemyResult.lastModified || enemyResult.updatedAt || 0
                )
              });
            }
          }
        }
      }
      
      if (callbacks.onConflicts) {
        callbacks.onConflicts(conflicts);
      }
    }
  });
    
  return () => {
    eventUnsubscribe();
    messagesUnsubscribe();
    resultsUnsubscribe();
  };
};

export const sendP2PMessage = async (
  negId,
  message,
  user,
  caseId,
  eventId,
  roundId
) => {
  const newMessage = {
    negId: negId || "",
    content: message.trim(),
    time: new Date(),
    userId: user.uid,
    eventId: eventId || "",
    roundId: roundId || 0,
  };

  try {
    const messagesRef = collection(db, "p2pMessages");
    const docRef = await addDoc(messagesRef, newMessage);
    return docRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
};

function hasSameAgreedVals(results, enemyResults) {
  if (results.agreement) {
    const keys = Object.keys(results.agreement);
    for (const key of keys) {
      if (results.agreement[key] !== enemyResults.agreement[key]) return false;
    }
  }
  return true;
}
