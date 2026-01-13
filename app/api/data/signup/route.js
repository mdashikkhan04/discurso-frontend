// === DEPRECATED : use actions/auth.js ===

import "server-only";

import { saveNewEmail } from "@/lib/server/data/signup";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {

    const emailData = await req.json();
    // console.log("POST /api/data/signup data", emailData);
    const newEmailId = await saveNewEmail(emailData);

    return NextResponse.json({ data: newEmailId }, { status: 200 });
  } catch (error) {
    console.error("Error saveing event round results:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}