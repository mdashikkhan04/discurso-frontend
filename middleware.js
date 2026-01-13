import { NextResponse } from "next/server";
import { getAccessRole } from "./lib/client/access";

const INNER_PATHS = ["/admin", "/instructor", "/negotiator"];
const isInner = (path) => {
  return INNER_PATHS.some(innerPath => path.startsWith(innerPath));
}

export async function middleware(req) {
  const { pathname, search } = req.nextUrl;

  if (process.env.NEXT_PUBLIC_PSEVASD) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/data-copy") ||
    pathname.startsWith("/api/data/summary")) {
    return NextResponse.next();
  }

  const session = req.cookies.get("session")?.value;
  const accessCookie = req.cookies.get("access")?.value;
  const cookieConsent = req.cookies.get("cookies")?.value;

  if (cookieConsent === "reject" && isInner(pathname)) {
    return NextResponse.redirect(new URL(`/`, req.url));
  }

  const isServerAction = req.method === "POST" && (req.headers.get("next-action") || req.headers.get("Next-Action"));
  if (isServerAction) return NextResponse.next();

  if (!session || !accessCookie) {
    if (!isInner(pathname) || isServerAction) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(`/signin?redirect=${pathname}`, req.url));
  }

  try {
    const userRole = await getAccessRole(accessCookie);

    if (!userRole) {
      return NextResponse.redirect(new URL("/error", req.url));
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/signin")) {
      if (search.includes("auth")) {
        return NextResponse.next();
      } else {
        return NextResponse.redirect(new URL(`/${userRole}`, req.url));
      }
    }

    if (userRole === "admin") {
      return NextResponse.next();
    } else if (
      userRole === "negotiator" &&
      pathname.startsWith("/negotiator")
    ) {
      return NextResponse.next();
    } else if (
      userRole === "instructor" &&
      pathname.startsWith("/instructor")
    ) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(`/${userRole}`, req.url));
  } catch (error) {
    console.error("Failed to decrypt access cookie:", error);
    return NextResponse.redirect(new URL(`/signin`, req.url));
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/instructor/:path*",
    "/negotiator/:path*",
    "/signin/:path*",
    "/api/:path*",
  ],
};
