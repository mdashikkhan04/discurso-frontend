import "server-only";
import { getDocs, saveDoc, deleteDoc, getDoc } from "@/lib/server/data/data";
import { deleteResourceMedia } from "@/lib/server/storage";

const COLLECTION = "resources";

export async function getResource(id) {
  if (!id) throw new Error("Resource ID required");
  const {timestamp, ...rest} = await getDoc(id, COLLECTION);
  return rest;
}

export async function listResources() {
  let items = await getDocs(COLLECTION);
  items = items.map(item => {
    const { timestamp, ...rest } = item;
    return rest;
  });
  return (items || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getAllResources(hidePrivate = false) {
  const list = await listResources();
  if (!hidePrivate) return list;
  return (list || []).filter(r => r.free !== false);
}

export async function saveResource(resource) {
  if (!resource?.type) throw new Error("Resource type required");
  const now = Date.now();
  const doc = {
    ...resource,
    createdAt: resource.createdAt || now,
    updatedAt: now,
  };
  const id = await saveDoc(doc, COLLECTION);
  return id;
}

export async function deleteResource(id) {
  if (!id) return false;
  try {
    const res = await getDoc(id, COLLECTION);
    if ((res.type === 'audio' || res.type === 'video') && res.storageRef) {
      await deleteResourceMedia(res.storageRef);
    }
  } catch (_) {}
  return await deleteDoc(id, COLLECTION);
}
