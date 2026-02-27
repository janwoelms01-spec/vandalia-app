import { NextResponse } from "next/server";
import argon2 from "argon2";
import { signSession, getSessionCookieName } from "../../../src/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient;

export async function POST(req: Request){
    const{ username, password } = await req.json();

    if(!username || !password){
        return NextResponse.json({error: "Missing credentials"}, {status: 400});
    }

    const user = await prisma.users.findUnique({
        where: {username},
    });
    if (!user || !user.is_active){
        return NextResponse.json({error: "Invalid Credentials"}, {status: 401});
    }
    const ok = await argon2.verify(user.password_hash, password);
    if (!ok){
        return NextResponse.json({error: "Invalid Credentials"}, {status: 401});
    }

console.log("PROXY JWT_SECRET len", (process.env.JWT_SECRET || "").length);
console.log("PROXY cookie name", getSessionCookieName());

    const token = await signSession({
        sub:user.id,
        username: user.username,
        role: user.role,
        mustChangePassword: !!user.must_change_password,
    });
    const res = NextResponse.json({ok : true});

    res.cookies.set(getSessionCookieName(), token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path:"/",
        maxAge: 60*60*24*3,
    });
    return res;
}

