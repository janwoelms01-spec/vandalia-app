import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifySession, getSessionCookieName, Role } from "@/lib/auth";
import { can } from "@/lib/rbac/permissions";

const STAFF: Role[] = ["ADMIN", "SCRIPTOR", "ARCHIVAR"];

export async function proxy(req: NextRequest){
    const {pathname}=req.nextUrl;

    // Public
    if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/login") ||
        pathname.startsWith("/_next")||
        pathname === "favicon.ico"
    ) {
        return NextResponse.next();
    }
    const cookieName = getSessionCookieName();
    const token = req.cookies.get(getSessionCookieName())?.value;

     if (!process.env.JWT_SECRET) {
    return new NextResponse(
      `JWT_SECRET MISSING in proxy. cookieName=${cookieName} tokenPresent=${!!token}`,
      { status: 500 }
    );
  }
    
    if(!token) return NextResponse.redirect(new URL("/login", req.url));

    const session = await verifySession(token);
  if (!session) {
    return new NextResponse(
      `JWT_VERIFY_FAILED. cookieName=${cookieName} tokenLen=${token.length}`,
      { status: 401 }
    );
}
    if (!session) {
  return new NextResponse("Session invalid - check JWT_SECRET/cookie name", { status: 401 });
}
    if(!session) return NextResponse.redirect(new URL("/login", req.url));

    if (
        session.mustChangePassword &&
        !pathname.startsWith("/passwort-aendern") &&
        !pathname.startsWith("/api/change-passwort") &&
        !pathname.startsWith("/api/logout")
    ){
        return NextResponse.redirect(new URL("/passwort-aendern", req.url));
    }

    // RBAC: MEMBER eingeschränkt
    if (session.role === "MEMBER") {
        const allowed =
        pathname === "/" ||
        pathname.startsWith("/meldungen") ||
        pathname.startsWith("/mitnahme") ||
        pathname.startsWith("api/issues") ||
        pathname.startsWith("api/room.loans") ||
        pathname.startsWith("api/logout") ||
        pathname.startsWith("/inventur") ||
        pathname.startsWith("/buecher");

        if (!allowed) return NextResponse.redirect(new URL("/", req.url));
    }
    if(pathname.startsWith("/admin")){
        if (!can(session.role, "ADMIN_PANEL")) return NextResponse.redirect(new URL("/", req.url));
    }
    if (
        pathname.startsWith("/inventur")||
        pathname.startsWith("/buecher") ||
        pathname.startsWith("/export") ||
        pathname.startsWith("api/admin") ||
        pathname.startsWith("api/inventory")
    ){
        if (!STAFF.includes(session.role)) return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/buecher/:path*",
    "/inventur/:path*",
    "/meldungen/:path*",
    "/mitnahme/:path*",
    "/export/:path*",
    "/api/:path*"
  ],
};