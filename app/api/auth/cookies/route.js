// === DEPRECATED : use actions/auth.js ===

import "server-only";

import { serialize } from "cookie";

export async function POST(req) {
    const { agreed } = await req.json();

    try {
        if (!agreed && agreed !== false) {
            return new Response(JSON.stringify({ error: "Consent is missing." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }


        if (agreed) {

            const cookiesCookie = serialize("cookies", agreed ? "agreed" : "rejected", {
                // httpOnly: false,
                secure: process.env.NODE_ENV !== "development",
                // sameSite: "strict",
                sameSite: "lax",
                path: "/",
                maxAge: 315360000,
            });


            return new Response(JSON.stringify({ agreed }), {
                status: 200,
                headers: {
                    "Set-Cookie": `${cookiesCookie}`,
                    "Content-Type": "application/json",
                },
            });
        }

        return new Response(JSON.stringify({ message: "Cookies rejected" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in cookies route:", error);
        return new Response(
            JSON.stringify({ error: "Invalid consent.", gotConsent: agreed }),
            {
                status: 401,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}