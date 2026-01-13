'use server';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateAccessToken } from "@/lib/server/access";
import {
    verifyAccess,
    getTermsAccepted as getTerms,
    setTermsAccepted as setTerms,
    getSigninToken as getToken,
    setEmailVerified as setVerified,
    getWelcomeLoginLink as getWelcomeLink,
    createUser,
    getUserIdByEmail,
    getUserEmailById,
} from "@/lib/server/auth";
import { saveNewEmail } from "@/lib/server/data/signup";
import { createInvite, listInvites, removeInvite, verifyInviteToken, getInviteCreator } from "@/lib/server/invites";
import { getUser } from "@/lib/server/auth";
import { makeTempPassword } from "@/lib/util";
import { incrementStreak } from "@/lib/server/data/profiles";
import { getAllUsers } from "@/lib/server/auth";

export async function validateSession() {
    try {
        const access = await verifyAccess(null, null, true);
        return Boolean(access);
    } catch (error) {
        return false;
    }
}

export async function setSession(token, email) { //TODO replace in set-password page
    if (!token) throw new Error("Token is required to set session");
    if (!email) throw new Error("Email is required to set session");
    const cookieStore = await cookies();
    const cookiesConsent = cookieStore.get("cookies")?.value;
    if (!cookiesConsent || cookiesConsent === "reject") {
        // await deleteCookieConsent(cookieStore);
        throw new Error("Cookie consent required");
    }
    const { role, uid } = await verifyAccess(null, token);
    if (!role) redirect("/signin");
    const bTermsAccepted = await getTerms(email);
    // if (!bTermsAccepted) throw new Error("Terms not accepted");
    if (!bTermsAccepted) return false;
    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        path: "/",
        maxAge: 86400, // 24 hours
    });
    const accessToken = await generateAccessToken(role);
    cookieStore.set("access", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        path: "/",
        maxAge: 86400, // 24 hours
    });
    await incrementStreak(uid);
    return role;
}

export async function updateSession(token) {
    if (!token) throw new Error("Token is required to set session");
    const access = (await verifyAccess(null, token));
    if (!access?.uid) throw new Error("Unauthorized");
    const cookieStore = await cookies();
    if (!cookieStore.get("access")?.value) {
        const email = await getUserEmailById(access.uid);
        if (!email) throw new Error("Unauthorized");
        const bSessionSet = await setSession(token, email);
        return bSessionSet;
    }
    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        path: "/",
        maxAge: 86400, // 24 hours
    });
    await incrementStreak(access.uid);
    return true;
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete("session", { path: "/" });
    cookieStore.delete("access", { path: "/" });
    return true;
}

export async function deleteCookieConsent(cookieStore) {
    if (!cookieStore) cookieStore = await cookies();
    cookieStore.delete("cookies", { path: "/" });
    return true;
}

export async function getSigninToken(token) {
    if (!token) throw new Error("Token is required");
    const customToken = await getToken(token);
    return customToken;
}

export async function setEmailVerified(verified, token) {
    if (verified === undefined || verified === null) throw new Error("Verified status is required");
    const { uid } = await verifyAccess(null, token);
    await setVerified(uid, verified);
    return true;
}

export async function joinList(email) {
    if (!email) throw new Error("Email is required to join mailing list");
    await saveNewEmail({ email });
    return true;
}

export async function checkCaptcha(token) {
    if (!token) return false;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    const response = await fetch(verifyUrl, { method: "POST" });
    const data = await response.json();
    return data.success;
}

export async function setCookiesConsent(consentType) {
    if (consentType === undefined || consentType === null) throw new Error("Consent is required");
    const cookieStore = await cookies();
    cookieStore.set("cookies", consentType, {
        // httpOnly: false,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        path: "/",
        maxAge: 315360000
    });
    return consentType;
}

export async function getCookiesConsent() {
    const cookieStore = await cookies();
    const cookiesConsent = cookieStore.get("cookies")?.value;
    return cookiesConsent;
}

export async function getTermsAccepted(email) {
    return await getTerms(email);
}

export async function setTermsAccepted(email, acceptedTermsTimestamp) {
    return await setTerms(email, acceptedTermsTimestamp);
}

export async function getSignInPreflight(email) {
    const cookieStore = await cookies();
    const cookiesConsent = cookieStore.get("cookies")?.value;
    const cookiesAccepted = Boolean(cookiesConsent && cookiesConsent !== "reject");
    const termsAccepted = email ? await getTerms(email) : false;
    return { cookiesAccepted, termsAccepted };
}


export async function getWelcomeLoginLink(uid, email) {
    return (await getWelcomeLink(uid, email));
}

export async function listInvitesAction() {
    const { role } = await verifyAccess(["admin"], null, true);
    if (role !== "admin") throw new Error("Unauthorized");
    const items = await listInvites();
    const domain = process.env.APP_DOMAIN;
    const enriched = await Promise.all((items || []).map(async (it) => {
        let createdByName = "";
        try {
            const user = await getUser(it.createdBy);
            createdByName = user?.displayName || user?.email || it.createdBy;
        } catch (_) {
            createdByName = it.createdBy;
        }
        const link = it.link;
        return { ...it, createdByName, link };
    }));
    return enriched;
}

export async function createInviteAction(comment, daysValid) {
    const { role, uid } = await verifyAccess(["admin"], undefined, true);
    if (role !== "admin") throw new Error("Unauthorized");
    const days = Math.min(Math.max(parseInt(daysValid || 7, 10) || 7, 1), 31);
    const invite = await createInvite(comment, uid, days);
    return invite;
}

export async function deleteInviteAction(inviteId) {
    const { role } = await verifyAccess(["admin"], undefined, true);
    if (role !== "admin") throw new Error("Unauthorized");
    await removeInvite(inviteId);
    return true;
}

export async function verifyJoinInvite(token) {
    if (!token) throw new Error("Token required");
    const inviteId = await verifyInviteToken(token);
    return inviteId;
}

export async function submitJoinEmail({ token, email, displayName = "" }) {
    if (!token) throw new Error("Token required");
    if (!email) throw new Error("Email required");
    const inviteId = await verifyInviteToken(token);
    if (!inviteId) throw new Error("Invalid or expired token");
    const existingUid = await getUserIdByEmail(email);
    if (existingUid) throw new Error("Email already in use");
    const tempPassword = makeTempPassword();
    const createdBy = await getInviteCreator(inviteId);
    await createUser({ email, password: tempPassword, displayName, role: "negotiator" }, true, createdBy);
    return true;
}

export async function getUsers(page = 1, search = "") {
    const { role } = await verifyAccess(["admin"]);
    if (role !== "admin") throw new Error("Unauthorized");

    const allUsers = await getAllUsers();

    const pageSize = 50;
    let filteredUsers = allUsers;

    if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = allUsers.filter(user =>
            Object.values(user).some(value =>
                typeof value === "string" && value.toLowerCase().includes(searchLower)
            )
        );
    }

    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = filteredUsers.slice(start, end);

    return {
        users: paginatedUsers,
        total,
        totalPages,
        currentPage: page,
        pageSize
    };
}
