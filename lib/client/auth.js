"use client";

import { auth_util as auth } from "@/lib/client/firebase/firebase";

export function getAuth() {
  return auth.auth;
}

export function onAuthStateChanged(listener) {
  return auth.onAuthStateChanged(auth.auth, listener);
}

export function onIdTokenChanged(listener) {
  return auth.onIdTokenChanged(auth.auth, listener);
}


export async function sendEmailVerificationEmail(email) {
  await auth.sendEmailVerification(email);
}

export async function sendPasswordReset(email) {
  await auth.sendPasswordResetEmail(auth.auth, email);
}

export async function loginWithCustomToken(token) {
  const userCredential = await auth.signInWithCustomToken(auth.auth, token);
  return userCredential.user;
}

export async function resetPassword(user, newPassword) {
  await auth.updatePassword(user, newPassword);
}

export async function refreshToken(force = false) {
  const user = auth.auth.currentUser;
  if (user) {
    return await user.getIdToken(force);
  }
  return false;
}

export function getUserRole(user) {
  user = user ?? auth.auth.currentUser;
  if (user?.reloadUserInfo?.customAttributes) {
    let claims = JSON.parse(user.reloadUserInfo.customAttributes);
    if (claims.role) return claims.role;
  }
  return null;
}

export async function loginUser(email, password) {
  const userCredential = await auth.signInWithEmailAndPassword(
    auth.auth,
    email,
    password
  );
  return userCredential.user;
}

export async function logoutUser() {
  await auth.signOut(auth.auth);
}
