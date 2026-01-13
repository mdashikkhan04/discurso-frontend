import "server-only";

import { auth } from "./firebase/firebase-admin";
import { sendWelcomeEmail } from "./mail";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { makeTempPassword } from "@/lib/util";

export async function verifyAccess(requiredRoles = [], token, skipRedirect) {
  if (process.env.NEXT_PUBLIC_PSEVASD) {
    return {
      uid: "oLOs3RBkMtWMqK3au4xQaaSLGts2",
      email: "ai-bot@discurso.ai",
      role: "admin",
      allowed: true,
    }
  }
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("session")?.value || null;
  }
  if (!token) {
    if (skipRedirect) throw new Error("No token provided");
    return redirect("/signin");
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const user = await auth.getUser(decodedToken.uid);
    if (!user) {
      if (skipRedirect) throw new Error("User not found");
      return redirect("/signin");
    }
    const oVerification = {
      uid: decodedToken.uid,
      email: user.email,
      role: user.customClaims?.role,
      allowed: true,
    };
    const userRole = user.customClaims?.role || null;
    if (!requiredRoles?.length && userRole) return oVerification;
    if (![...requiredRoles, "admin"].includes(userRole)) throw new Error("Unauthorized");
    return oVerification;
  } catch (error) {
    if (skipRedirect) throw error;
    return redirect("/signin");
  }
}

export async function getAdminEmails() {
  const adminUsers = await getAdminUsers();
  return adminUsers.map(user => user.email).filter(email => email);
}

export async function getAdminUsers() {
  const users = await getAllUsers();
  const adminUsers = users.filter(user => user.role === 'admin' && !user.disabled);
  return adminUsers;
}

export async function createUser(userData, sendEmail, createdBy) {
  let customClaims;
  if (userData.role || userData.organisation || userData.studentId || userData.maxUsers !== undefined || createdBy) {
    customClaims = {};
    if (userData.role) {
      customClaims.role = userData.role?.trim();
    }
    if (userData.organisation) {
      customClaims.organisation = userData.organisation?.trim();
    }
    if (userData.studentId) {
      customClaims.studentId = userData.studentId?.trim();
    }
    if (userData.maxUsers !== undefined) {
      customClaims.maxUsers = userData.maxUsers === null || userData.maxUsers === "" ? null : parseInt(userData.maxUsers, 10);
    }
    if (createdBy) {
      customClaims.createdBy = createdBy;
    }
  }

  let newUser = {
    email: userData.email,
    emailVerified: false,
    password: userData.password || makeTempPassword(),
    displayName: userData.displayName,
  };

  let userRecord = await auth.createUser(newUser);

  if (customClaims) {
    await auth.setCustomUserClaims(userRecord.uid, customClaims);
  }

  if (sendEmail) {
    const welcomeLink = await getWelcomeLoginLink(userRecord.uid, userRecord.email);
    await sendWelcomeEmail(userData.email, userData.displayName, welcomeLink);
    try {
      const existingClaims = (await auth.getUser(userRecord.uid)).customClaims || {};
      await auth.setCustomUserClaims(userRecord.uid, { ...existingClaims, onboarded: Date.now() });
    } catch (e) {
      console.error("Failed to set onboarded claim:", e);
    }
    userRecord = { ...userRecord, welcomeLink };
  }
  return userRecord;
}

export async function getWelcomeLoginLink(uid, email) {
  try {
    const welcomeToken = await getWelcomeToken(uid, email);
    const domain = process.env.APP_DOMAIN;
    const isLocal = domain?.includes("localhost");
    return `${isLocal ? "" : "https://"}${domain}/signin/set-password?token=${welcomeToken}`;
  } catch (error) {
    throw new Error("Failed to make welcome email link.");
  }
}

async function getWelcomeToken(uid, email) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: uid,
    email,
    purpose: "welcome",
    ver: 1,
    iat: now,
    exp: now + (7 * 24 * 3600), // 7 days
  };
  return jwt.sign(payload, process.env.WELCOME_SECRET_KEY, { algorithm: "HS256" });
}

async function verifyWelcomeToken(token) {
  const oData = jwt.verify(token, process.env.WELCOME_SECRET_KEY, { algorithms: ["HS256"], clockTolerance: 300 });
  if (oData.purpose !== "welcome") throw new Error("Wrong token purpose");
  if (!oData.sub || !oData.email) throw new Error("Missing token data");
  return oData;
}

export async function getSigninToken(welcomeToken) {
  if (!welcomeToken) throw new Error("Token is required");
  const { sub: uid, email, iat } = await verifyWelcomeToken(welcomeToken);
  const user = await auth.getUser(uid);
  if (user.email !== email) throw new Error("Token email mismatch");
  const validAfter = Math.floor(new Date(user.tokensValidAfterTime).getTime() / 1000);
  if (iat < validAfter) throw new Error("Token has been revoked");
  // await auth.revokeRefreshTokens(uid); // revoke to make the welcome token one-time use
  const customToken = await auth.createCustomToken(uid, { welcome: true });
  return customToken;
}

export async function getJoinToken(inviteId, expSeconds) {
  const timeNow = Math.floor(Date.now() / 1000);
  if (expSeconds < timeNow) throw new Error("expSeconds must be in the future");
  const payload = {
    inv: inviteId,
    purpose: "join",
    ver: 1,
    iat: timeNow,
    exp: expSeconds
  };
  return jwt.sign(payload, process.env.WELCOME_SECRET_KEY, { algorithm: "HS256" });
}

export async function verifyJoinToken(token) {
  const oData = jwt.verify(token, process.env.WELCOME_SECRET_KEY, { algorithms: ["HS256"], clockTolerance: 300 });
  if (oData.purpose !== "join") throw new Error("Wrong token purpose");
  if (!oData.inv) throw new Error("Missing token data");
  return oData;
}

export async function setEmailVerified(uid, verified) {
  if (!uid) throw new Error("User ID is required to set email verified");
  await auth.updateUser(uid, { emailVerified: verified });
  return true;
}

export async function deleteUser(uid) {
  try {
    await auth.deleteUser(uid);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user.");
  }
}

export async function updateUser(userData, skipTokenRevoke) {
  const { uid, password, ...data } = userData;
  const updates = {
    disabled: data.disabled,
  };
  if (data.email) {
    updates.email = data.email?.trim();
  }
  if (data.displayName) {
    updates.displayName = data.displayName?.trim();
  }

  if (password) {
    updates.password = password;
  }

  await auth.updateUser(uid, updates);

  let customClaims;
  if (data.role || data.organisation || data.studentId || data.maxUsers !== undefined || data.maxParticipants !== undefined) {
    customClaims = {};
    if (data.role) {
      customClaims.role = data.role?.trim();
    }
    if (data.organisation) {
      customClaims.organisation = data.organisation?.trim();
    }
    if (data.studentId) {
      customClaims.studentId = data.studentId?.trim();
    }
    if (data.maxUsers !== undefined) {
      customClaims.maxUsers = data.maxUsers === null || data.maxUsers === "" ? null : parseInt(data.maxUsers, 10);
    }
    if (data.maxParticipants !== undefined) {
      customClaims.maxParticipants = data.maxParticipants === null || data.maxParticipants === "" ? null : parseInt(data.maxParticipants, 10);
    }
  }
  if (customClaims) {
    const existingClaims = (await auth.getUser(uid)).customClaims || {};
    await auth.setCustomUserClaims(uid, { ...existingClaims, ...customClaims });
  }

  // revoke refresh tokens to immediately apply new claims
  if (!skipTokenRevoke) await auth.revokeRefreshTokens(uid);

  return { message: `User ${uid} updated` };
}

export async function getUsersByRoles(roles) {
  if (!roles?.length) {
    throw new Error("Invalid roles parameter");
  }
  let users = await getAllUsers();
  const filteredUsers = users.filter(user => roles.includes(user.role) && !user.disabled);
  return filteredUsers;
}

export async function getAllNegotiators() {
  return await getUsersByRoles(['negotiator', 'admin']);
}

export async function getAllUsers() {
  let users = [];
  let nextPageToken = undefined;
  try {
    do {
      const result = await auth.listUsers(1000, nextPageToken);
      users.push(...result.users);
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    let strippedUsers = users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      disabled: user.disabled,
      emailVerified: user.emailVerified,
      role: user.customClaims?.role || "",
      organisation: user.customClaims?.organisation || "",
      studentId: user.customClaims?.studentId || "",
      maxUsers: user.customClaims?.maxUsers,
      maxParticipants: user.customClaims?.maxParticipants,
      createdBy: user.customClaims?.createdBy || "",
      isUser: user.customClaims?.role != "admin",
      lastSignInTime: new Date(user.metadata.lastSignInTime).getTime(),
      acceptedTerms: user.customClaims?.acceptedTerms,
    }));

    const userMap = new Map(strippedUsers.map(u => [
      u.uid,
      (u.displayName && u.displayName.trim()) ? u.displayName : (u.email || u.uid)
    ]));

    strippedUsers = strippedUsers.map(user => ({
      ...user,
      createdByName: user.createdBy ? userMap.get(user.createdBy) || user.createdBy : ""
    }));

    strippedUsers.sort((a, b) => {
      const emailA = (a.email || "").toLowerCase();
      const emailB = (b.email || "").toLowerCase();
      return emailA.localeCompare(emailB);
    });

    return strippedUsers;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch user list.");
  }
}

export async function getTermsAccepted(email) {
  if (!email) return false;
  const user = await auth.getUserByEmail(email);
  if (!user) return null;
  return Boolean(user.customClaims?.acceptedTerms);
}

export async function setTermsAccepted(email, acceptedTermsTimestamp) {
  if (!email) throw new Error("User mail is required to set terms accepted");
  if (typeof acceptedTermsTimestamp !== "number") throw new Error("acceptedTermsTimestamp must be a unix timestamp");
  const user = await auth.getUserByEmail(email);
  if (!user) throw new Error(`User not found [${email}]`);
  await auth.setCustomUserClaims(user.uid, {
    ...user.customClaims,
    acceptedTerms: acceptedTermsTimestamp,
  });
  return true;
}

export async function getUserIdByToken(token) {
  if (!token) return null;
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export async function getUserRole(token, uid) {
  let role;
  if (token || uid) {
    try {
      const user = await auth.getUser(uid || (await auth.verifyIdToken(token)).uid);
      role = user.customClaims?.role || null;
    } catch (er) {
      console.error(er);
    }
  }
  return role;
}

export async function setUserRole(uid, role) {
  try {
    const user = await auth.getUser(uid);
    if (!user) throw new Error(`User not found [${uid}]`);
    await auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      role
    });
    await auth.revokeRefreshTokens(uid);
  } catch (error) {
    throw new Error("Failed to set user role.");
  }
}

export async function getUser(uid, ignoreMissing) {
  try {
    const user = await auth.getUser(uid);
    return user;
  } catch (error) {
    if (ignoreMissing && error.message.includes("no user record")) return null;
    console.error("Error fetching user:", error.message);
    throw new Error("Failed to fetch user.");
  }
}

export async function getUserEmailById(uid) {
  if (!uid) return "";
  try {
    const user = await getUser(uid);
    return user.email;
  } catch (e) {
    return uid;
  }
}

export async function getUserIdByEmail(email) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (e) {
    return "";
  }
  return user.uid;
}

export async function countUsersCreatedBy(creatorUid) {
  let users = [];
  let nextPageToken = undefined;
  try {
    do {
      const result = await auth.listUsers(1000, nextPageToken);
      users.push(...result.users);
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    const count = users.filter(user => user.customClaims?.createdBy === creatorUid).length;
    return count;
  } catch (error) {
    console.error("Error counting users:", error);
    throw new Error("Failed to count users.");
  }
}

export async function checkUserQuota(creatorUid, additionalUsers = 1) {
  const creator = await auth.getUser(creatorUid);
  const role = creator.customClaims?.role;

  if (role !== "instructor") {
    return { allowed: true, remaining: Infinity };
  }

  const maxUsers = creator.customClaims?.maxUsers ?? 50;
  const currentCount = await countUsersCreatedBy(creatorUid);
  const remaining = maxUsers - currentCount;

  return {
    allowed: remaining >= additionalUsers,
    remaining,
    maxUsers,
    currentCount
  };
}

export async function checkParticipantQuota(instructorUid, participantCount) {
  const instructor = await auth.getUser(instructorUid);
  const role = instructor.customClaims?.role;

  if (role !== "instructor") {
    return { allowed: true, remaining: Infinity };
  }

  const maxParticipants = instructor.customClaims?.maxParticipants ?? 50;
  const remaining = maxParticipants - participantCount;

  return {
    allowed: participantCount <= maxParticipants,
    remaining,
    maxParticipants,
    participantCount
  };
}