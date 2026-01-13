import "server-only";

import { getAllResources } from "@/lib/server/data/resources";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";

export async function GET(req) {
  try {
    const { userRole, isAllowed } = await isAccessAllowed(req, [
      "instructor",
      "negotiator",
    ]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getAllResources(userRole !== "admin");
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
