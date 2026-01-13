import "server-only";

import { getEvents } from "@/lib/server/data/events";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";

export async function GET(req) {
  try {
    let participant = req?.nextUrl?.searchParams.get("participant");
    let instructor = req?.nextUrl?.searchParams.get("instructor");
    let available = req?.nextUrl?.searchParams.get("available");
    let data;

    if (!participant && !instructor) {
      const { isAllowed } = await isAccessAllowed(req, ["admin"]);
      // console.log("isAllowed", isAllowed);
      if (!isAllowed) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      data = await getEvents();
      // console.debug("resFiles", resFiles);
    } else if (available && participant) {
      const { isAllowed } = await isAccessAllowed(req, ["negotiator"]);
      if (!isAllowed) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      let avEvents = await getEvents({ participant, available });
      // console.log("avEvents", avEvents);
      data = avEvents.filter((event) => !event.started);
      // console.log("data", data);
    } else if (participant) {
      const { isAllowed } = await isAccessAllowed(req, ["negotiator"]);
      if (!isAllowed) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      data = await getEvents({ participant });
    } else if (instructor) {
      const { isAllowed } = await isAccessAllowed(req, ["instructor"]);
      if (!isAllowed) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      data = await getEvents({ instructor });
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
