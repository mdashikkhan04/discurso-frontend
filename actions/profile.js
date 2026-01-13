"use server";

import { verifyAccess } from "@/lib/server/auth";
import { getUserProfile, getGlobalCompetencyAverages } from "@/lib/server/data/profiles";
import { getNiceNum, getMinName } from "@/lib/util";
import { getProfilePictureDownloadURL } from "@/lib/server/storage";
import { getDocs } from "@/lib/server/data/data";
import { getActiveJourneyName, listStages as listStagesDb } from "@/lib/server/data/journeys";

export async function getProfileData() {
  const access = await verifyAccess();
  if (!access?.uid) throw new Error("Unauthorized");
  const profile = await getUserProfile(access.uid);

  const dateOfJoining = new Date(profile.dateOfJoining).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  let avatarUrl = profile.avatarUrl || "/profilepicture.jpg";
  if (profile.avatarUrl && profile.avatarUrl !== "/profilepicture.jpg") {
    try {
      const freshUrl = await getProfilePictureDownloadURL(access.uid);
      if (freshUrl) {
        avatarUrl = freshUrl;
      }
    } catch (error) {
      console.error("Error getting fresh avatar URL:", error);
    }
  }

  return {
    nickname: profile.nickname || "User",
    profile_id: `@${getMinName(access.uid)}`,
    email: access.email,
    level: profile.level,
    avatarUrl,
    points: profile.points,
    streak: profile.streak,
    date_of_joining: dateOfJoining,
    friends_count: profile.friends_count,
    proficiency: profile.proficiencyScores?.overallProficiency || 0,
    percentile_substantive: profile.percentiles?.substantive || 0,
    percentile_relational: profile.percentiles?.relational || 0,
    competency: profile.currentCompetency || "Getting Started",
    worstCompetencies: profile.worstCompetencies || []
  };
}

export async function getSpiderWebStats() {
  const access = await verifyAccess();
  if (!access?.uid) throw new Error("Unauthorized");
  const profile = await getUserProfile(access.uid);
  return Object.entries(profile.competencyAverages).map(([key, value]) => ({
    subject: formatLabel(key),
    value: getNiceNum(Math.min(100, Math.max(0, (value / 5) * 100)), 1)
  }));
}

export async function getProfileStats() {
  const access = await verifyAccess();
  if (!access?.uid) throw new Error("Unauthorized");
  const profile = await getUserProfile(access.uid);

  return {
    negotiationsDone: profile.negotiationsDone,
    topScore: `${profile.topScore}`,
    competency: profile.currentCompetency || "Getting Started",
    modulesDone: profile.modulesDone || 0,
    worstCompetencies: profile.worstCompetencies || []
  };
}

export async function getAverageSpiderWebStats() {
  const averageStats = await getGlobalCompetencyAverages();
  return Object.entries(averageStats).map(([key, value]) => ({
    subject: formatLabel(key),
    value: getNiceNum(Math.min(100, Math.max(0, (value / 5) * 100)), 1)
  }));
}

export async function getUserAchievements() {
  await verifyAccess();

  return [
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "First Login",
      description: "Logged",
      points: 300,
      locked: false,
      progress: 0,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "Marathon Negotiator",
      description: "Complete 50 negotiations in a row without failing",
      points: 300,
      locked: true,
      progress: 65,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "First Login",
      description: "Logged into the platform for the very first time",
      points: 50,
      locked: false,
      progress: 0,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "Marathon Negotiator",
      description: "Complete 50 negotiations in a row without failing",
      points: 300,
      locked: true,
      progress: 65,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "First Login",
      description: "Logged into the platform for the very first time",
      points: 300,
      locked: false,
      progress: 0,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "Marathon Negotiator",
      description: "Complete 50 negotiations in a row without failing",
      points: 300,
      locked: true,
      progress: 65,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "First Login",
      description: "Logged into the platform for the very first time",
      points: 50,
      locked: false,
      progress: 0,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "Marathon Negotiator",
      description: "Complete 50 negotiations in a row without failing",
      points: 300,
      locked: true,
      progress: 65,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "First Login",
      description: "Logged into the platform for the very first time",
      points: 300,
      locked: false,
      progress: 0,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "Marathon Negotiator",
      description: "Complete 50 negotiations in a row without failing",
      points: 300,
      locked: true,
      progress: 65,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "First Login",
      description: "Logged",
      points: 50,
      locked: false,
      progress: 0,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "Marathon Negotiator",
      description: "Complete 50 negotiations in a row without failing",
      points: 300,
      locked: true,
      progress: 65,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "First Login",
      description: "Logged",
      points: 300,
      locked: false,
      progress: 0,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "Marathon Negotiator",
      description: "Complete 50 negotiations in a row without failing",
      points: 300,
      locked: true,
      progress: 65,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "First Login",
      description: "Logged into the platform for the very first time",
      points: 50,
      locked: false,
      progress: 0,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "Marathon Negotiator",
      description: "Complete 50 negotiations in a row without failing",
      points: 300,
      locked: true,
      progress: 65,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "First Login",
      description: "Logged into the platform for the very first time",
      points: 50,
      locked: true,
      progress: 23,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "Marathon Negotiator",
      description: "Complete 50 negotiations in a row without failing",
      points: 300,
      locked: false,
      progress: 0,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "First Login",
      description: "Logged",
      points: 50,
      locked: true,
      progress: 45,
    },
    {
      icon: "/profile/ach.svg",
      lockedIcon: "/profile/ach_locked.png",
      title: "Marathon Negotiator",
      description: "Complete",
      points: 300,
      locked: false,
      progress: 0,
    },
  ];
}

export async function uploadProfilePictureAction(formData) {
  const access = await verifyAccess();
  if (!access?.uid) throw new Error("Unauthorized");

  const { uploadProfilePicture } = await import("@/lib/server/storage");
  const { updateProfileAvatar } = await import("@/lib/server/data/profiles");

  const imageFile = formData.get('image');
  if (!imageFile || imageFile.size === 0) {
    throw new Error("No image file provided");
  }

  const result = await uploadProfilePicture(access.uid, imageFile);

  await updateProfileAvatar(access.uid, result.downloadUrl);

  return { success: true, imageUrl: result.downloadUrl };
}

export async function getProfileAvatarUrl() {
  const access = await verifyAccess();
  if (!access?.uid) throw new Error("Unauthorized");
  let avatarUrl;
  try {
    avatarUrl = await getProfilePictureDownloadURL(access.uid);
  } catch (error) {
    console.error("Error getting fresh avatar URL:", error);
  }
  return avatarUrl;
}


export async function getJourneyProgress() {
  const access = await verifyAccess();
  if (!access?.uid) throw new Error("Unauthorized");
  const profile = await getUserProfile(access.uid);
  const activeName = await getActiveJourneyName();
  if (!activeName) return { userId: access.uid, profile_id: `@${getMinName(access.uid)}`, nickname: profile.nickname || "User", modulesDone: profile.modulesDone || 0, completedStages: [], completedJourney: {}, details: [], completedCount: 0, lastCompletedAt: 0, journey: null };
  const stages = await listStagesDb(activeName);
  const stageIds = new Set((stages || []).map(s => s.id));
  const titleById = new Map((stages || []).map(s => [s.id, s.title || "Stage"]));
  const map = profile.completedJourney || {};
  const arr = (profile.completedStages || []).filter(id => stageIds.has(id));
  const entries = Object.entries(map).filter(([sid]) => stageIds.has(sid));
  const details = entries.map(([sid, ts]) => ({ stageId: sid, title: titleById.get(sid) || sid, completedAt: Number(ts) || 0 }))
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  const lastCompletedAt = details.length ? details[0].completedAt : 0;
  const completedCount = details.length || arr.length;
  return {
    userId: access.uid,
    profile_id: `@${getMinName(access.uid)}`,
    nickname: profile.nickname || "User",
    modulesDone: profile.modulesDone || completedCount,
    completedStages: arr,
    completedJourney: Object.fromEntries(entries),
    details,
    completedCount,
    lastCompletedAt,
    journey: activeName,
  };
}

export async function listJourneyUsersProgress() {
  const { role } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Forbidden");
  const activeName = await getActiveJourneyName();
  if (!activeName) return [];
  const stages = await listStagesDb(activeName);
  const stageIds = new Set((stages || []).map(s => s.id));
  const titleById = new Map((stages || []).map(s => [s.id, s.title || "Stage"]));
  const profiles = await getDocs("profiles", []);
  const rows = (profiles || []).map((p) => {
    const fullMap = p.completedJourney || {};
    const entries = Object.entries(fullMap).filter(([sid]) => stageIds.has(sid));
    const map = Object.fromEntries(entries);
    const arr = (p.completedStages || []).filter((id) => stageIds.has(id));
    const count = Object.keys(map).length || arr.length || 0;
    if (!count) return null;
    const last = Object.values(map).length ? Math.max(...Object.values(map)) : 0;
    const details = entries.map(([sid, ts]) => ({ stageId: sid, title: titleById.get(sid) || sid, completedAt: Number(ts) || 0 }))
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    return {
      userId: p.userId,
      profile_id: `@${getMinName(p.userId || "")}`,
      nickname: p.nickname || "User",
      modulesDone: p.modulesDone || count,
      completedCount: count,
      lastCompletedAt: last,
      completedJourney: map,
      completedStages: arr,
      details,
      journey: activeName,
    };
  }).filter(Boolean).sort((a, b) => (b.lastCompletedAt || 0) - (a.lastCompletedAt || 0));
  return rows;
}

function formatLabel(key) {
  return key
    .replaceAll(/([A-Z])/g, ' $1')
    .replace(/^./, string_ => string_.toUpperCase())
    .trim();
}
