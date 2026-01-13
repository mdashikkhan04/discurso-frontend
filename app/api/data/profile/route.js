import "server-only";

import { getUser, updateUser, getUserIdByToken, getUserRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const userId = await getUserIdByToken(req.cookies.get("session")?.value);
        // console.log("GET profile userId", userId);
        const userRecord = await getUser(userId);
        const data = getUserData(userRecord);
        // console.log("GET profile data", userId, data);
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
        const userId = await getUserIdByToken(req.cookies.get("session")?.value);
        // console.log("POST profile userId", userId);
        const { data } = await req.json();
        delete data.role;
        data.uid = userId;
        data.disabled = false;
        data.role = await getUserRole(req.cookies.get("session")?.value, userId);
        // console.log("POST profile data", data);
        const updatedUserRecord = await updateUser(data, true);
        let updatedData = { ...data };
        return NextResponse.json({ data: updatedData }, { status: 200 });
    } catch (error) {
        console.error("Error saveing new case data:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

function getUserData(userRecord) {
    const userCustClaims = userRecord.customClaims;
    const userData = {
        email: userRecord.email,
        displayName: userRecord.displayName || "",
        role: userCustClaims?.role || null,
        studentId: userCustClaims?.studentId || "",
        organisation: userCustClaims?.organisation || "",
        password: "",
    };
    return userData;
}
