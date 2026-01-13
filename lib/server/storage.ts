import "server-only";
import { bucket } from "@/lib/server/firebase/firebase-admin";

function getProfilePictureRef(userId: string) {
  return bucket.file(`profiles/${userId}/avatar.jpg`);
}

function getResourceRef(filePath: string) {
  return bucket.file(filePath);
}

function getEventCoverFile(filePath: string) {
  return bucket.file(filePath);
}

function buildEventCoverPath(userId: string, extension: string) {
  const timestamp = Date.now();
  return `event-covers/${userId}/${timestamp}${extension}`;
}

function getImageExtension(file: File) {
  const nameMatch = file.name?.match(/\.([a-zA-Z0-9]+)$/);
  if (nameMatch?.[1]) {
    return `.${nameMatch[1].toLowerCase()}`;
  }
  switch (file.type) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
}

function adaptFileName(filename: string, userId?: string) {
  const date = new Date()
    .toISOString()
    .replace(/[-:.T]/g, "")
    .slice(0, 14);
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
  const dotIndex = sanitizedFilename.lastIndexOf(".");

  let name: string;
  let extension: string;

  if (dotIndex === -1) {
    name = sanitizedFilename;
    extension = "";
  } else {
    name = sanitizedFilename.substring(0, dotIndex);
    extension = sanitizedFilename.substring(dotIndex);
  }

  if (userId) {
    return `avatar_${userId}_${date}${extension}`;
  }

  return `${name}_${date}${extension}`;
}

export async function uploadProfilePicture(userId: string, file: File): Promise<{ downloadUrl: string; type: string }> {
  if (!file || !userId) {
    throw new Error("File and user ID are required");
  }
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed");
  }
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File size must be less than 5MB");
  }
  try {
    const fileRef = getProfilePictureRef(userId);

    const buffer = Buffer.from(await file.arrayBuffer());

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          userId,
          orgName: file.name,
          uploadedAt: Date.now().toString()
        }
      },
    });

    const downloadUrl = await getProfilePictureDownloadURL(userId);

    return {
      downloadUrl,
      type: file.type
    };
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw new Error("Failed to upload profile picture");
  }
}

export async function getProfilePictureDownloadURL(userId: string): Promise<string> {
  if (!userId) return "";

  try {
    const fileRef = getProfilePictureRef(userId);
    const [fileExists] = await fileRef.exists();
    if (!fileExists) return null;
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour expiry
    });
    return url;
  } catch (error) {
    console.error("Error getting profile picture URL:", error);
    return "";
  }
}

export async function deleteProfilePicture(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const fileRef = getProfilePictureRef(userId);
    await fileRef.delete();
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    throw new Error("Failed to delete profile picture");
  }
}

export async function uploadResourceFile(file: File, userId: string, resourceId: string) {
  const orgName = file.name;
  const type = file.type;
  const filename = adaptFileName(file.name);
  const fileRef = getResourceRef(filename);

  const buffer = Buffer.from(await file.arrayBuffer());

  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
      metadata: { userId, orgName, resourceId }
    }
  });
  return { orgName, filename, type };
}

export async function getResourceFileDownloadURL(filename: string) {
  if (!filename) return "";
  const fileRef = getResourceRef(filename);
  const [url] = await fileRef.getSignedUrl({
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  return url;
}

export async function deleteResourceFile(filename: string) {
  const fileRef = getResourceRef(filename);
  await fileRef.delete();
}

export async function uploadEventCoverImage(userId: string, file: File) {
  if (!file || !userId) {
    throw new Error("File and user ID are required");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only image files are allowed");
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File size must be less than 5MB");
  }

  const extension = getImageExtension(file);
  const storagePath = buildEventCoverPath(userId, extension || "");

  const fileRef = getEventCoverFile(storagePath);
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadedAt = Date.now();

  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
      metadata: {
        userId,
        uploadedAt: uploadedAt.toString(),
      },
    },
  });

  const downloadUrl = await getEventCoverDownloadURL(storagePath);

  return {
    storagePath,
    downloadUrl,
    uploadedAt,
  };
}

export async function getEventCoverDownloadURL(storagePath: string) {
  if (!storagePath) return null;

  try {
    const fileRef = getEventCoverFile(storagePath);
    const [exists] = await fileRef.exists();
    if (!exists) return null;
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });
    return url;
  } catch (error) {
    console.error("Error getting event cover URL:", error);
    return null;
  }
}

export async function listEventCoverImages(userId: string) {
  if (!userId) return [];

  try {
    const prefix = `event-covers/${userId}/`;
    const [files] = await bucket.getFiles({ prefix });

    const uploads = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        const meta = metadata?.metadata || {};
        const uploadedAtValue = Number(meta.uploadedAt) || Date.parse(metadata?.timeCreated ?? "");
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 60 * 60 * 1000,
        });
        return {
          storagePath: file.name,
          downloadUrl: url,
          uploadedAt: Number.isFinite(uploadedAtValue) ? uploadedAtValue : Date.now(),
        };
      })
    );

    return uploads.sort((a, b) => b.uploadedAt - a.uploadedAt);
  } catch (error) {
    console.error("Error listing event cover images:", error);
    return [];
  }
}

export async function deleteEventCoverImage(userId: string, storagePath: string) {
  if (!userId || !storagePath) {
    throw new Error("User ID and storage path are required");
  }
  if (!storagePath.startsWith(`event-covers/${userId}/`)) {
    throw new Error("Unauthorized");
  }
  try {
    const fileRef = getEventCoverFile(storagePath);
    await fileRef.delete();
  } catch (error) {
    console.error("Error deleting event cover:", error);
    throw new Error("Failed to delete event cover image");
  }
}

function normalizeResourceBase(name: string) {
  const base = name.replace(/\.[a-zA-Z0-9]+$/,'');
  return base.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9._-]/g, '_');
}

function getOriginalExtension(file: File) {
  const m = file.name?.match(/\.([a-zA-Z0-9]+)$/);
  return m?.[1] ? m[1].toLowerCase() : '';
}

function buildResourceMediaPath(kind: 'video' | 'audio', file: File) {
  const ext = getOriginalExtension(file);
  const norm = normalizeResourceBase(file.name);
  const unixTime = Date.now();
  const path = `resources/${kind}/${norm}-${unixTime}${ext ? '.' + ext : ''}`;
  return path;
}

function getResourceMediaFile(storagePath: string) {
  return bucket.file(storagePath);
}

export async function uploadResourceMedia(kind: 'video' | 'audio', file: File, uploadedBy: string) {
  if (!file) throw new Error('File required');
  if (kind !== 'video' && kind !== 'audio') throw new Error('Invalid kind');
  const storagePath = buildResourceMediaPath(kind, file);
  const ref = getResourceMediaFile(storagePath);
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadedAt = Date.now();
  await ref.save(buffer, {
    metadata: {
      contentType: file.type,
      metadata: {
        uploadedBy,
        uploadedAt: uploadedAt.toString(),
        orgName: file.name,
      }
    }
  });
  const downloadUrl = await getResourceMediaDownloadURL(storagePath);
  return { storagePath, downloadUrl, contentType: file.type, originalName: file.name, uploadedAt };
}

export async function getResourceMediaDownloadURL(storagePath: string) {
  if (!storagePath) return '';
  const ref = getResourceMediaFile(storagePath);
  const [exists] = await ref.exists();
  if (!exists) return '';
  const [url] = await ref.getSignedUrl({ action: 'read', expires: Date.now() + 24 * 60 * 60 * 1000 });
  return url;
}

export async function deleteResourceMedia(storagePath: string) {
  if (!storagePath) return;
  const ref = getResourceMediaFile(storagePath);
  await ref.delete({ ignoreNotFound: true } as any);
}
