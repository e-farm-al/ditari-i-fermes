import { NextRequest, NextResponse } from "next/server";
import { or, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, users } from "@/db";
import { createSession } from "@/lib/auth/session";

function isPhone(value: string) {
  return /^(\+|00)?\d[\d\s\-]{6,14}$/.test(value.trim());
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("355")) return "+" + digits;
  if (digits.startsWith("0")) return "+355" + digits.slice(1);
  return "+" + digits;
}

export async function POST(req: NextRequest) {
  const { identifier, password } = await req.json();

  if (!identifier?.trim() || !password) {
    return NextResponse.json(
      { error: "Ju lutem plotësoni të gjitha fushat" },
      { status: 400 }
    );
  }

  const raw = identifier.trim();
  let user;

  if (isPhone(raw)) {
    const normalized = normalizePhone(raw);
    [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.phone, normalized), eq(users.phone, raw)))
      .limit(1);
  } else {
    // username lookup (case-insensitive)
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, raw.toLowerCase()))
      .limit(1);
  }

  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Emri i përdoruesit ose fjalëkalimi është i gabuar" },
      { status: 401 }
    );
  }

  await createSession({ userId: user.id, name: user.name, email: user.email });

  return NextResponse.json({ ok: true });
}
