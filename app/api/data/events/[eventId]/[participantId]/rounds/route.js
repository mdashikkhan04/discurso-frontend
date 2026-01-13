import "server-only";
import { getEvent } from "@/lib/server/data/events";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";
import { getResult } from "@/lib/server/data/results";

export async function GET(req, { params }) {
  try {
    const { isAllowed } = await isAccessAllowed(req, ["negotiator"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, participantId } = await params;
    const event = await getEvent(eventId);

    const rounds = await Promise.all(
      (event.rounds || []).map(async (round, index) => {
        const result = await getResult(eventId, participantId, index + 1);
        const finished = !!result.final || !!result.madeDeal || (result.survey && Object.keys(result.survey).length > 0);
        return {
          title: round.case?.title || "Untitled",
          startTime: round.startTime,
          endTime: round.endTime,
          viewTime: round.viewTime,
          aiRound: round.aiRound || (round.aiSide && round.aiSide !== "n") || false,
          finished: finished || false,
          hasMadeDeal: result.madeDeal || false,
        };
      })
    );

    return NextResponse.json(
      { eventTitle: event.title, rounds },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching event rounds:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
