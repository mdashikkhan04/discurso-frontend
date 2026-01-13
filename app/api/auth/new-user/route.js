import "server-only";

import { createUser, verifyAccess } from "@/lib/server/auth";
import { saveUserConsent } from "@/lib/server/data/consent";
import { NextResponse } from "next/server";

export async function POST(req) {
  const reqTime = Date.now();
  try {
    // Parse request body
    const { sendWelcomeEmail, ...newUser } = await req.json();
    const reqIp = getReqIp(req);

    if (!newUser.email || !newUser.password) {
      return NextResponse.json(
        { error: "Email and password is required to create a user." },
        { status: 400 }
      );
    }

    // Get the creator's UID
    let createdBy;
    try {
      const access = await verifyAccess([], undefined, true);
      createdBy = access.uid;
    } catch (e) {
      console.warn(e);
    }

    const userRecord = await createUser(newUser, sendWelcomeEmail, createdBy);
    const consentId = await saveUserConsent(userRecord.uid, reqTime, reqIp)
    return NextResponse.json(
      {
        message: "User created. Verification email sent.",
        user: userRecord.uid,
        consent: consentId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/auth/new-user error:", error);
    return NextResponse.json(
      { error: "Failed to create user." },
      { status: 500 }
    );
  }
}

function getReqIp(req) {
  let ip;
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    ip = forwarded ? forwarded.split(",")[0] : req.ip;
  } catch (er) {
    console.warn(er);
  }
  return ip;
}
