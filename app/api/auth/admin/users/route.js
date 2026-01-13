import "server-only";

import { getAllUsers } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";

export async function GET(req) {
  try {
    const { isAllowed } = await  isAccessAllowed(req, ["admin"]);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await getAllUsers();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
