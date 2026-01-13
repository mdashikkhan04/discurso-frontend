"use client";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithCustomToken,
  updatePassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const dbName = process.env.NEXT_PUBLIC_FIRESTORE_DB_NAME || undefined;
const db = getFirestore(app, dbName);
const auth = getAuth(app);
const storage = getStorage(app);

const firestore_util = {
  db,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  doc,
  getDoc,
};

const auth_util = {
  auth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithCustomToken,
  updatePassword
};

const storage_util = {
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};

export { auth_util, storage_util, firestore_util };
