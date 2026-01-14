// === DEPRECATED : use actions/auth.js ===

import "server-only";

import { serialize } from "cookie";

export async function POST(req) {
  try {
    const tokenCookie = serialize("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      // sameSite: "strict",
      sameSite: "lax",
      path: "/",
      maxAge: -1,
    });

    const accessCookie = serialize("access", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      // sameSite: "strict",
      sameSite: "lax",
      path: "/",
      maxAge: -1,
    });

    return new Response(JSON.stringify({ message: "Logged out" }), {
      status: 200,
      headers: {
        "Set-Cookie": `${tokenCookie}, ${accessCookie}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return new Response(JSON.stringify({ error: "Logout failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
