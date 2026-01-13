import "server-only";
import { saveDoc } from "@/lib/server/data/data";

export async function saveNewEmail(emailData) {
  // console.log("saveNewEmail()", emailData);
  const emailId = await saveDoc(emailData, "signups");
  return emailId;
}
