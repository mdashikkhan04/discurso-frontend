import "server-only";

import { getUserRole, getUserIdByToken } from "@/lib/server/auth";

export async function isAccessAllowed(req, roles) {
  const token = req.cookies.get("session")?.value;

  const userRole = await getUserRole(token);

  if (!userRole) {
    return { userRole: "", isAllowed: false, uid: null };
  }

  if (!roles.includes("admin")) {
    roles.push("admin");
  }

  const uid = await getUserIdByToken(token);

  // console.log("isAccessAllowed()", userRole, roles, roles.includes(userRole));
  return { userRole, isAllowed: roles.includes(userRole), uid };
}
