import { NextResponse } from "next/server";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { verifySession, getSessionCookieName, signSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const {currentPassword, newPassword} = await req.json();

    if(!currentPassword || !newPassword || newPassword.lengthj < 8) {
        return NextResponse.json({error: "Ungültige Eingabe (mind. 8 Zeichen)."}, {status: 400});
    }

    const cookieName = getSessionCookieName();
    const token = (req.headers.get("cookie")||"")
        .split(";")
        .map((s) => s.trim())
        .find((c) => c.startsWith(cookieName + "="))
        ?.split("=")[1];

    if (!token) return NextResponse.json({ error: "Nicht eingeloggt."}, { status: 401});

    const session = await verifySession(token);
    if(!session) return NextResponse.json({ error: "Session ungültig."}, { status: 401});

    const user = await prisma.users.findUnique({ where: {id: session.sub}});
    if(!user || !user.is_active) return NextResponse.json({ error: "User nicht gefunden."}, {status: 404});

    const ok = await argon2.verify(user.password_hash, currentPassword);
    if(!ok) return NextResponse.json({error: "Aktuelles Passwort ist falsch."},{status:401});

    const hash = await argon2.hash(newPassword);

    await prisma.users.update({
        where: { id: user.id},
        data: {
            password_hash: hash,
            must_change_password: false,
            password_changed_at: new Date(),
        },
    });

    const newToken = await signSession({
        sub: user.id,
        username: user.username,
        role: user.role,
        mustChangePassword: false,
    });

    const res = NextResponse.json({ok:true});
    res.cookies.set(cookieName, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path:"/",
        maxAge: 60*60*24*3,
    });

    return res;
}