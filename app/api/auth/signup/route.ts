import { NextRequest, NextResponse } from "next/server";
import { or, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, users, farms, farmMembers } from "@/db";
import { createSession } from "@/lib/auth/session";

const VALID_FARM_TYPES = ["livestock", "bees", "poultry", "crops", "mixed"] as const;
type FarmType = typeof VALID_FARM_TYPES[number];

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("355")) return "+" + digits;
  if (digits.startsWith("0")) return "+355" + digits.slice(1);
  return "+" + digits;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 30);
}

async function uniqueUsername(base: string): Promise<string> {
  let candidate = base;
  let suffix = 1;
  while (true) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1);
    if (!existing) return candidate;
    candidate = `${base}${suffix++}`;
  }
}

export async function POST(req: NextRequest) {
  const { name, username: rawUsername, phone, email, password, farmName, farmType, region } =
    await req.json();

  if (!name?.trim())
    return NextResponse.json({ error: "Emri është i detyrueshëm" }, { status: 400 });
  if (!phone?.trim())
    return NextResponse.json({ error: "Numri i telefonit është i detyrueshëm" }, { status: 400 });
  if (!password || password.length < 6)
    return NextResponse.json({ error: "Fjalëkalimi duhet të ketë të paktën 6 karaktere" }, { status: 400 });
  if (!farmName?.trim())
    return NextResponse.json({ error: "Emri i fermës është i detyrueshëm" }, { status: 400 });
  if (!VALID_FARM_TYPES.includes(farmType))
    return NextResponse.json({ error: "Lloji i fermës është i pavlefshëm" }, { status: 400 });

  const normalizedPhone = normalizePhone(phone.trim());
  const normalizedEmail = email?.trim().toLowerCase() || null;

  // Resolve username: use provided or auto-generate from name
  const usernameBase = rawUsername?.trim()
    ? rawUsername.trim().toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30)
    : slugify(name.trim());
  const username = await uniqueUsername(usernameBase || "farmer");

  // Duplicate check — phone, username, and email must all be unique
  const conditions = [eq(users.phone, normalizedPhone), eq(users.username, username)];
  if (normalizedEmail) conditions.push(eq(users.email, normalizedEmail));

  const [existing] = await db
    .select({ id: users.id, phone: users.phone, username: users.username, email: users.email })
    .from(users)
    .where(or(...conditions))
    .limit(1);

  if (existing) {
    if (existing.phone === normalizedPhone)
      return NextResponse.json({ error: "Ky numër telefoni është regjistruar tashmë" }, { status: 409 });
    if (normalizedEmail && existing.email === normalizedEmail)
      return NextResponse.json({ error: "Ky email është regjistruar tashmë" }, { status: 409 });
    return NextResponse.json({ error: "Ky emër përdoruesi është i zënë" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({ name: name.trim(), username, phone: normalizedPhone, email: normalizedEmail, passwordHash, language: "sq" })
    .returning();

  const [farm] = await db
    .insert(farms)
    .values({ ownerId: user.id, name: farmName.trim(), farmType: farmType as FarmType, region: region?.trim() || null })
    .returning();

  await db.insert(farmMembers).values({ farmId: farm.id, userId: user.id, role: "owner" });

  await createSession({ userId: user.id, name: user.name, email: user.email });

  return NextResponse.json({ ok: true, username });
}
