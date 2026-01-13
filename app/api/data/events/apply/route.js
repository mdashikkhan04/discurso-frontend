import "server-only";

// import { saveEvent, deleteEvent, getEvent } from "@/lib/server/data/events";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";

export async function POST(req) {
  try {
    const { isAllowed } = await  isAccessAllowed(req, ["negotiator"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { data } = await req.json();
    // console.log("/api/data/events/apply data:", data);

    //TODO send email to event instructor

    // const newResId = await saveEvent(data);

    return NextResponse.json({ data: true }, { status: 200 });
  } catch (error) {
    console.error("Error saveing new case data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
