import "server-only";

import crypto from "crypto";

export async function generateAccessToken(role) {
  const secretKey = process.env.ACCESS_CRYPTO_KEY;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey),
    iv
  );
  let encryptedToken = cipher.update(`${role}-${Date.now()}`, "utf8", "hex");
  encryptedToken += cipher.final("hex");

  const encryptedAccess = `${iv.toString("hex")}:${encryptedToken}`;
  return encryptedAccess;
}
