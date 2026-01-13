import { storage_util as store } from "@/lib/client/firebase/firebase";

function getProfilePictureRef(userId) {
  const profilesRef = store.ref(store.storage, "profiles");
  const userRef = store.ref(profilesRef, userId);
  return store.ref(userRef, "avatar.jpg");
}

function getResourceRef(filename) {
  const resourcesRef = store.ref(store.storage, "resources");
  return store.ref(resourcesRef, filename);
}

function getTranscriptsRawRef(filename) {
  const transcriptsRef = store.ref(store.storage, "transcripts");
  const rawRef = store.ref(transcriptsRef, "raw");
  return store.ref(rawRef, filename);
}

function adaptFileName(filename) {
  const date = new Date()
    .toISOString()
    .replace(/[-:.T]/g, "")
    .slice(0, 14);
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
  const dotIndex = sanitizedFilename.lastIndexOf(".");
  if (dotIndex === -1) {
    return `${sanitizedFilename}_${date}`;
  }
  const name = sanitizedFilename.substring(0, dotIndex);
  const extension = sanitizedFilename.substring(dotIndex);
  return `${name}_${date}${extension}`;
}

export async function uploadProfilePicture(file, userId) {
  const orgName = file.name;
  const type = file.type;
  const fileRef = getProfilePictureRef(userId);
  const metadata = { customMetadata: { userId, orgName, uploadedAt: Date.now().toString() } };
  await store.uploadBytes(fileRef, file, metadata);
  const downloadUrl = await store.getDownloadURL(fileRef);
  return { orgName, filename: "avatar.jpg", type, downloadUrl };
}

export async function deleteProfilePicture(userId) {
  const fileRef = getProfilePictureRef(userId);
  await store.deleteObject(fileRef);
}

export async function uploadResourceFile(file, userId, resourceId) {
  const orgName = file.name;
  const type = file.type;
  const filename = adaptFileName(file.name);
  const fileRef = getResourceRef(filename);
  const metadata = { customMetadata: { userId, orgName, resourceId } };
  await store.uploadBytes(fileRef, file, metadata);
  return { orgName, filename, type };
}

export async function getResourceFileDownloadURL(filename) {
  if (!filename) return "";
  const fileRef = getResourceRef(filename);
  const url = await store.getDownloadURL(fileRef);
  return url;
}

export async function deleteResourceFile(filename) {
  const fileRef = getResourceRef(filename);
  await store.deleteObject(fileRef);
}

export async function uploadTranscriptSource(file, userId, uploadTime, extra = {}) {
  const timestamp = Number(uploadTime);
  const unixTimestamp = Math.floor(timestamp / 1000);
  const extensionMatch = file.name?.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : "";
  const orgBase = (file.name || "transcript").replace(/\.[^.]+$/, "");
  const normalizedBase = orgBase
    .replace(/\s+/g, "_")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 80) || "transcript";
  const filename = `${normalizedBase}-${unixTimestamp}${extension}`;
  const fileRef = getTranscriptsRawRef(filename);
  const { eventId = "", round = "", negId = "" } = extra || {};
  const normalizedEventId =
    typeof eventId === "string" ? eventId.trim() : eventId || "";
  const roundValue =
    typeof round === "number"
      ? Number.isFinite(round)
        ? String(round)
        : ""
      : typeof round === "string"
        ? round.trim()
        : "";
  const negIdValue = typeof negId === "string" ? negId.trim() : "";
  const metadata = {
    contentType: file.type || "application/octet-stream",
    customMetadata: {
      uploadedBy: userId,
      originalFileName: file.name,
      uploadedAt: String(timestamp),
      eventId: normalizedEventId || "",
      round: roundValue || "",
      negId: negIdValue || "",
    },
  };

  await store.uploadBytes(fileRef, file, metadata);
  return {
    orgName: file.name,
    filename,
    type: metadata.contentType,
    storagePath: `transcripts/raw/${filename}`,
  };
}

export async function getTranscriptDownloadURL(filename) {
  if (!filename) return "";
  const fileRef = getTranscriptsRawRef(filename);
  const url = await store.getDownloadURL(fileRef);
  return url;
}
