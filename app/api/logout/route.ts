import { NextResponse } from "next/server";
import { getSessionCookieName } from "../../../src/lib/auth";

export async function POST(req: Request) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set(getSessionCookieName(), "", {
        httpOnly: true,
        path:"/",
        maxAge: 0,
    });
    return res;
}