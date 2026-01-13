import "server-only";

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync } from "fs";
import path from "path";

if (!admin.apps.length) {
  console.log("NODE_ENV", process.env.NODE_ENV);
  if (process.env.NEXT_PUBLIC_ENVIRON === "local") {
    const serviceAccount = JSON.parse(process.env.FIREABSE_ADMIN_CONF ?
      process.env.FIREABSE_ADMIN_CONF
      : readFileSync(path.resolve("./firebase-admin-config.json"), "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
}

const dbName = process.env.NEXT_PUBLIC_FIRESTORE_DB_NAME || undefined;
let db;

if (dbName) {
  db = getFirestore(admin.app(), dbName);
} else {
  db = admin.firestore();
}

const auth = admin.auth();
const bucket = getStorage().bucket();

export { admin, db, auth, bucket };
