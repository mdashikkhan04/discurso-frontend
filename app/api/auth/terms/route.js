// === DEPRECATED : use actions/auth.js ===

import "server-only";

import { getTermsAccepted, setTermsAccepted } from "@/lib/server/auth";

export async function GET(req) {
    const email = req.nextUrl.searchParams.get("email") || "";
    const acceptedTermsTime = await getTermsAccepted(email);
    if (isNaN(acceptedTermsTime)) {
        return new Response(JSON.stringify({ error: "User not found" }), {
            status: 412,
            headers: { "Content-Type": "application/json" },
        });
    }
    return new Response(JSON.stringify({ acceptedTerms: Boolean(acceptedTermsTime) }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST(req) {
    const { email, acceptedTerms } = await req.json();

    if (!email) {
        return new Response(JSON.stringify({ error: "Email is required." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        await setTermsAccepted(email, acceptedTerms);
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error setting terms accepted:", error);
        return new Response(JSON.stringify({ error: "Failed to set terms accepted." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
