import "server-only";
import { saveDoc, getDoc } from "@/lib/server/data/data";

export async function hasUserConsent(userId) {
    const consentDoc = await getDoc(userId, "consent");
    // console.log("hasUserConsent() consentDoc", consentDoc);
    if (consentDoc) return true;
    return false;
}

export async function saveUserConsent(userId, unix, ip) {
    // console.log("saveUserConsent()", userId, unix, ip);
    const consentId = await saveDoc({ userId, unix, ip }, "consent");
    return consentId;
}
