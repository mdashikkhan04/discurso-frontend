'use server';

import { verifyAccess } from "@/lib/server/auth";

import { listResources as listRes, saveResource as saveRes, getResource as getRes, deleteResource as delRes } from "@/lib/server/data/resources";
import { uploadResourceMedia, getResourceMediaDownloadURL } from "@/lib/server/storage";

export async function listResources() {
  const { role } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Unauthorized");
  return await listRes();
}

export async function getResource(resourceId) {
  const access = await verifyAccess();
  if (!access?.uid) throw new Error("Unauthorized");
  return await getRes(resourceId);
}

export async function createResource(resource) {
  const { role, uid } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Unauthorized");
  if (resource?.type === 'video' || resource?.type === 'audio') throw new Error('Use uploadResourceFileAction for media');
  return await saveRes({ ...resource, createdBy: uid });
}

export async function updateResource(resourceId, updates) {
  const { role } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Unauthorized");
  const existing = await getRes(resourceId);
  if (!existing) throw new Error("Resource not found");
  return await saveRes({ ...existing, ...updates, id: resourceId });
}

export async function uploadResourceFileAction(formData) {
  const { role, uid } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Unauthorized");
  const file = formData.get('file');
  const kind = formData.get('kind'); // 'video' | 'audio'
  const tagsJson = formData.get('tags');
  const title = formData.get('title') || '';
  const existingId = formData.get('id');
  if (!file || !kind) throw new Error('File and kind required');
  const up = await uploadResourceMedia(kind, file, uid);
  let tags = undefined;
  try { if (tagsJson) tags = JSON.parse(tagsJson); } catch (_) {}
  const payload = {
    type: kind,
    storageRef: up.storagePath,
    originalName: up.originalName,
    contentType: up.contentType,
    uploadedBy: uid,
    uploadedAt: up.uploadedAt,
    ...(title ? { title } : {}),
    ...(Array.isArray(tags) ? { tags } : {}),
  };
  if (existingId) {
    const existing = await getRes(existingId);
    const resId = await saveRes({ ...existing, ...payload, id: existingId });
    return await getRes(resId);
  } else {
    const resId = await saveRes(payload);
    return await getRes(resId);
  }
}

export async function getResourceMediaUrl(storagePath) {
  const access = await verifyAccess();
  if (!access?.uid) throw new Error("Unauthorized");
  return await getResourceMediaDownloadURL(storagePath);
}

export async function deleteResource(resourceId) {
  const { role } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Unauthorized");
  return await delRes(resourceId);
}
