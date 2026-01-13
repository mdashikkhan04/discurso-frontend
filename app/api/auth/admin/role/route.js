import "server-only";

import { setUserRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { key, uid, role } = await req.json();

    const roleKey = process.env.ROLE_ADMIN_KEY;

    if (!key === roleKey) throw new Error("Bad key");

    if (!uid || !role) {
      return NextResponse.json(
        { error: "UID and role are required." },
        { status: 400 }
      );
    }

    await setUserRole(uid, role);

    return NextResponse.json(
      { message: "Role assigned" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
