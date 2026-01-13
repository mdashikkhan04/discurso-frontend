import "server-only";

import { saveCase, deleteCase, getCase } from "@/lib/server/data/cases";
import { getUserRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";
import { getAndSaveCaseInterest } from "@/lib/server/ai";

export async function GET(req, { params }) {
  try {
    const { isAllowed } = await isAccessAllowed(req, ["instructor"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = await params;
    const data = await getCase(caseId);
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

    const { data, updateInterest } = await req.json();
    const newCaseId = await saveCase(data);
    if (updateInterest) {
      getAndSaveCaseInterest(newCaseId, `${data.generalInstruct}\n${data.aInstruct}`, "a")
      getAndSaveCaseInterest(newCaseId, `${data.generalInstruct}\n${data.bInstruct}`, "b")
    }

    return NextResponse.json({ data: newCaseId }, { status: 200 });
  } catch (error) {
    console.error("Error saveing new case data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    let userRole = await getUserRole(req.cookies.get("session")?.value);
    if (!userRole || userRole != "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { caseId } = params;
    const deleted = await deleteCase(caseId);
    return NextResponse.json({ data: deleted }, { status: 200 });
  } catch (er) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
