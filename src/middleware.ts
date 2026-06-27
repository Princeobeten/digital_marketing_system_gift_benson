import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Send the bare root to the right place.
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = session ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  // Already authenticated users shouldn't see login/register.
  if (isPublic && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protected pages require a session.
  if (!isPublic && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals, static assets, and API routes
  // (API routes guard themselves via requireAuth()).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
