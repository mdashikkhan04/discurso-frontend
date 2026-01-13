import "server-only";

import { saveEvent, deleteEvent, getEvent } from "@/lib/server/data/events";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";

export async function GET(req, { params }) {
  try {
    const { isAllowed } = await isAccessAllowed(req, ["instructor"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const data = await getEvent(eventId);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { isAllowed } = await isAccessAllowed(req, ["instructor"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { data } = await req.json();
    try {
      const newEventId = await saveEvent(data);
      return NextResponse.json({ data: newEventId }, { status: 200 });
    } catch (er) {
      console.error("Error saving event:", er);
      return NextResponse.json({ error: er.message || "Failed to save event" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error saving new event data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { isAllowed } = await isAccessAllowed(req, ["instructor"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const deleted = await deleteEvent(eventId);
    return NextResponse.json({ data: deleted }, { status: 200 });
  } catch (er) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
