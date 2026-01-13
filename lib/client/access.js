export async function getAccessRole(accessCookie) {
  let role;

  const EXPIRATION_TIME = 60 * 60 * 24 * 1000; // 1 day in milliseconds

  try {
    const [ivHex, encryptedRole] = accessCookie.split(":");
    const iv = Uint8Array.from(Buffer.from(ivHex, "hex"));
    const encryptedData = Uint8Array.from(Buffer.from(encryptedRole, "hex"));

    const secretKey = process.env.ACCESS_CRYPTO_KEY;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretKey),
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      key,
      encryptedData
    );
    const decoded = new TextDecoder().decode(decrypted);
    const accessTokenParts = decoded.split("-");

    const timestamp = accessTokenParts[1];
    const tokenTimestamp = parseInt(timestamp);
    const currentTime = Date.now();
    const timeDifference = currentTime - tokenTimestamp;
    if (timeDifference > EXPIRATION_TIME) {
      throw new Error("Token expired");
    }

    role = accessTokenParts[0];
  } catch (error) {
    console.error(error);
  }
  return role;
}
