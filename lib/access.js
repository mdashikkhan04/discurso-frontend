// import crypto from "crypto";

const EXPIRATION_TIME = 60 * 60 * 24; // 24 hours

export async function getAccessRole(accessToken) {
  let role;

  try {
    const [ivHex, encryptedData] = accessToken.split(":");
    const iv = Uint8Array.from(Buffer.from(ivHex, "hex"));
    const encryptedToken = Uint8Array.from(Buffer.from(encryptedData, "hex"));

    const secretKey = process.env.ACCESS_CRYPTO_KEY;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretKey),
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    const decryptedToken = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      key,
      encryptedToken
    );
    const decodedToken = new TextDecoder().decode(decryptedToken);
    const accessTokenParts = decodedToken.split("-");
    const timestamp = accessTokenParts[1];
    const tokenTimestamp = parseInt(timestamp);
    const currentTime = Date.now();
    const timeDifference = currentTime - tokenTimestamp;
    if (timeDifference > EXPIRATION_TIME) {
      throw new Error("Token expired");
    }

    return accessTokenParts[0];
  } catch (error) {}

  return role;
}

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
