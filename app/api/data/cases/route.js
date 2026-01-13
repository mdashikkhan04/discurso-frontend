import "server-only";

import { getAllCases } from "@/lib/server/data/cases";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";
// import { use } from "react";

export async function GET(req) {
  try {
    let ai = req?.nextUrl?.searchParams.get("ai");
    if (ai) ai = ai === "true";

    // console.log("GET cases ai", ai);

    const { userRole, isAllowed } = await isAccessAllowed(req, ["admin"]);
    if (userRole === "negotiator" && !ai) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let data = await getAllCases(ai);
    if (ai) {
      data = data.map((item) => {
        const aiSide = item.ai;
        return {
          id: item.id,
          title: item.title,
          summary: item.summary,
          partyName: aiSide === "a" ? item.bName : item.aName,
          params: item.params,
          context: item.generalInstruct,
          status: item.status,
          instructions: aiSide === "a" ? item.bInstruct : item.aInstruct,
          formula: aiSide === "a" ? item.scoreFormulaB : item.scoreFormulaA,
          side: aiSide === "a" ? "b" : "a",
          scorable: item.scorable,
          opponent: aiSide === "a" ? item.aName : item.bName,
          aiParams: item.aiParams,
          gender: item.gender || "female",
        };
      });
      // data = data.filter((item) => item.ai === ai);
      // console.log("ai cases data", data);
    } else {
      data = data.map((item) => ({
        ...item,
        gender: item.gender || "female",
      }));
    }
    // console.log("cases data", data.length);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
