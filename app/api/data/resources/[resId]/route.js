import "server-only";

import {
  saveResource,
  deleteResource,
  getResource,
} from "@/lib/server/data/resources";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";

export async function GET(req, { params }) {
  try {
    const { isAllowed } = await isAccessAllowed(req, ["negotiator"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resId } = await params;
    const data = await getResource(resId);
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
    if (isAllowed === null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let { data } = await req.json();
    if (data.files) {
      let image;
    }
    if (!data.id) data = { ...data, image: "", approved: false };
    const newResId = await saveResource(data);

    return NextResponse.json({ data: newResId }, { status: 200 });
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
    const { isAllowed } = await isAccessAllowed(req, ["admin"]);
    if (isAllowed === null) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { resId } = params;
    const deleted = await deleteResource(resId);
    return NextResponse.json({ data: deleted }, { status: 200 });
  } catch (er) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
