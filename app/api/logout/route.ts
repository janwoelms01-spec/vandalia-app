import { NextResponse } from "next/server";
import { getSessionCookieName } from "../../../src/lib/auth";
import { publicUrl } from "@/lib/publicUrl";

export async function POST(req: Request) {


    const res = NextResponse.redirect(publicUrl("/login"))
    res.cookies.set(getSessionCookieName(), "", {
        httpOnly: true,
        path:"/",
        maxAge: 0,
    });
    return res;
}