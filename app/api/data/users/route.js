import "server-only";

import { getAllNegotiators } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";

export async function GET(req) {
  try {
    const { userRole, isAllowed } = await isAccessAllowed(req, ["instructor"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getAllNegotiators();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
