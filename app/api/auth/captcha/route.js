// === DEPRECATED : use actions/auth.js ===

export async function POST(req) {
    const { token } = await req.json();
    // console.log("api/auth/captcha token", token)

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const response = await fetch(verifyUrl, { method: "POST" });
    const data = await response.json();
    // console.log("api/auth/captcha data", data)

    if (data.success) {
        return Response.json({ verified: true });
    } else {
        return Response.json({ verified: false, error: data["error-codes"] });
    }
}
