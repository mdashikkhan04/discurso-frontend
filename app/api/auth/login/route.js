// === DEPRECATED : use actions/auth.js ===

import "server-only";

import { getUserRole } from "@/lib/server/auth";
import { serialize } from "cookie";
import { generateAccessToken } from "@/lib/server/access";
import { cookies } from "next/headers";

export async function POST(req) {
  const { token, email } = await req.json();

  const cookieStore = await cookies();
  const cookiesAccepted = cookieStore.get("cookies")?.value === "agreed";

  if (cookiesAccepted) {

    try {
      if (!token) {
        return new Response(JSON.stringify({ error: "Token is missing." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userRole = await getUserRole(token);
      if (!userRole) {
        return new Response(JSON.stringify({ error: "No user role." }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Set token in HTTP-only cookie
      const tokenCookie = serialize("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        // sameSite: "strict",
        sameSite: "lax",
        path: "/",
        maxAge: 86400, // 24 hour
      });

      const accessToken = await generateAccessToken(userRole);

      // Set access cookie
      const accessCookie = serialize("access", accessToken, {
        httpOnly: true, // Ensure it's not accessible via JavaScript
        secure: process.env.NODE_ENV !== "development",
        // sameSite: "strict",
        sameSite: "lax",
        path: "/",
        maxAge: 86400, // 24 hour
      });

      return new Response(JSON.stringify({ role: userRole }), {
        status: 200,
        headers: {
          "Set-Cookie": `${tokenCookie}, ${accessCookie}`, // Set both cookies
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error in login route:", error);
      return new Response(
        JSON.stringify({ error: "Invalid token.", gotToken: token }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
  console.warn("Attempted login without cookies consent by", email);
  return new Response(
    JSON.stringify({ error: "Missing cookies consent" }),
    {
      status: 406,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": serialize("cookies", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
          // sameSite: "strict",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        })
      },
    }
  );
}
