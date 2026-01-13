import "server-only";

import { getJoinToken, getUser, verifyJoinToken } from "@/lib/server/auth";
import { saveDoc, getDocs, deleteDoc } from "@/lib/server/data/data";
import { makeHash } from "@/lib/util"

const COLLECTION = "invites" as const;

interface InviteRecord {
  id?: string;
  token?: string;
  comment?: string;
  createdBy: string;
  createdAt?: number;
  expiresAt?: number;
  link?: string;
}

// disgusting duplication, temporary hotfix
interface InviteItem { id: string; token: string; comment?: string; link: string; createdByName?: string; expiresAt?: number }


export async function createInvite(comment: "", createdBy: string, daysValid = 7): Promise<InviteItem> {
  if (!createdBy) throw new Error("createdBy (UID) is required");
  const validDays = Math.min(Math.max(Math.floor(daysValid || 1), 1), 31);
  const timeNow = Date.now();
  const expiresAt = timeNow + validDays * 24 * 3600 * 1000;
  const inviteId = makeHash(createdBy + timeNow.toString() + Math.random().toString()).slice(0, 20); // not ideal but risk of collision is low enough
  const token = await getJoinToken(inviteId, Math.floor(expiresAt / 1000));
  const link = `https://${process.env.APP_DOMAIN}/signin/join?invite=${token}`;
  const inviteItem = {
    inviteId,
    comment: comment.trim() || "",
    createdBy,
    createdAt: timeNow,
    expiresAt,
    link,
    token
  };
  const inviteRecordId = await saveDoc(inviteItem, COLLECTION);
  const oUser = await getUser(createdBy);
  const createdByName = oUser.displayName || oUser.email || createdBy;
  return { id: inviteRecordId, ...inviteItem, createdByName };
}

export async function listInvites(): Promise<Array<{ id: string; token: string; comment?: string; createdAt?: number; createdBy: string; expiresAt?: number; link?: string }>> {
  const items = (await getDocs(COLLECTION)) as InviteRecord[];
  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return items
    .filter((it) => Boolean(it.id) && Boolean(it.token))
    .map(({ id, token, comment, createdAt, createdBy, expiresAt, link }) => ({ id: id!, token: token!, comment, createdAt, createdBy, expiresAt, link }));
}

export async function removeInvite(inviteId: string): Promise<boolean> {
  await deleteDoc(inviteId, COLLECTION);
  return true;
}

export async function verifyInviteToken(token: string): Promise<string> {
  if (!token) throw new Error("Token required");
  const payload = (await verifyJoinToken(token)) as any as { inv: string };
  const inviteDoc = (await getDocs(COLLECTION, [{ field: "inviteId", value: payload.inv }]))?.[0] as InviteRecord & { id: string };
  if (!inviteDoc) throw new Error("Invite not found");
  const timeNow = Date.now();
  if (inviteDoc.expiresAt < timeNow) throw new Error("Invite expired");
  return payload.inv;
}

export async function getInviteCreator(inviteId: string): Promise<string | null> {
  const inviteDocs = await getDocs(COLLECTION, [{ field: "inviteId", value: inviteId }]);
  if (!inviteDocs || inviteDocs.length === 0) return null;
  const inviteDoc = inviteDocs[0] as InviteRecord;
  return inviteDoc.createdBy || null;
}
