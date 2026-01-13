// app/api/auth/admin/users/[uid]/route.js
import "server-only";

import { NextResponse } from "next/server";
import { updateUser, deleteUser } from "@/lib/server/auth";
import { isAccessAllowed } from "@/lib/server/api-utils";

/**
 * Handler for POST and DELETE requests to /api/auth/admin/users/[uid]
 */
export async function POST(req, { params }) {
  const { uid } = params;
  //console.log("param uid", uid);

  try {
    const { isAllowed } = await  isAccessAllowed(req, ["admin"]);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Unauthorized: Admins only" },
        { status: 401 }
      );
    }

    // Parse request body
    const userData = await req.json();

    const updateResult = await updateUser(userData);
    //console.log("updateResult", updateResult);

    return NextResponse.json(
      { message: updateResult.message },
      { status: 200 }
    );
  } catch (error) {
    console.error(`POST /api/auth/admin/users/${uid} error:`, error);
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  //console.log("delete", params);
  //console.log("delete", params.userId);
  const { userId } = await params;

  try {
    const { isAllowed } = await  isAccessAllowed(req, ["admin"]);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Unauthorized: Admins only" },
        { status: 401 }
      );
    }

    // Delete user
    await deleteUser(userId);

    return NextResponse.json(
      { message: `User ${userId} deleted` },
      { status: 200 }
    );
  } catch (error) {
    console.error(`DELETE /api/auth/admin/users/${userId} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 }
    );
  }
}
