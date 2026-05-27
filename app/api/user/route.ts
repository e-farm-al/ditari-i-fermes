/**
 * GET  /api/user  — get own profile
 * PUT  /api/user  — update own profile (name, phone, language)
 */

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { withAuth, ok, err } from "@/lib/api/middleware";
import { API_ERRORS } from "@/lib/api/types";

export async function GET(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    return ok(user);
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(req, async ({ user }) => {
    const body = await req.json();
    const { name, phone, language } = body;

    const [updated] = await db
      .update(users)
      .set({
        ...(name && { name }),
        ...(phone && { phone }),
        ...(language && { language }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return ok(updated);
  });
}
