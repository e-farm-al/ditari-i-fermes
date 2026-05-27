/**
 * Farm Diary — API Middleware
 *
 * Two guards used by every route:
 *   1. withAuth      — verifies JWT session, resolves our internal user
 *   2. withFarmAccess — verifies the user is a member of the requested farm
 *                       and optionally enforces a minimum role
 *
 * Usage in a route:
 *
 *   export async function GET(req: NextRequest, { params }) {
 *     return withFarmAccess(req, params.farmId, "viewer", async (ctx) => {
 *       // ctx.user    — full User row from our DB
 *       // ctx.member  — FarmMember row (role, joinedAt…)
 *       // ctx.farm    — Farm row
 *     });
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { db, users, farms, farmMembers } from "@/db";
import type { User, Farm, FarmMember } from "@/db";
import { API_ERRORS, type FarmRole, type ApiError } from "./types";

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function err(
  code: string,
  message: string,
  status: number
): NextResponse {
  const body: ApiError = { ok: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

// ---------------------------------------------------------------------------
// AUTH CONTEXT
// ---------------------------------------------------------------------------

export type AuthContext = {
  user: User;
};

export type FarmContext = AuthContext & {
  farm: Farm;
  member: FarmMember;
};

// ---------------------------------------------------------------------------
// withAuth
// Resolves the Clerk session → internal user row.
// Creates the user row on first login (Clerk webhook alternative).
// ---------------------------------------------------------------------------

export async function withAuth(
  req: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return err(API_ERRORS.UNAUTHENTICATED, "Not authenticated", 401);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return err(API_ERRORS.UNAUTHENTICATED, "User not found", 401);
    }

    return handler({ user });
  } catch (e) {
    console.error("[withAuth]", e);
    return err(API_ERRORS.INTERNAL_ERROR, "Internal server error", 500);
  }
}

// ---------------------------------------------------------------------------
// withFarmAccess
// Extends withAuth: verifies farm membership + optional minimum role.
//
// Role hierarchy (lowest → highest):
//   viewer < worker < manager < owner
// ---------------------------------------------------------------------------

const ROLE_RANK: Record<FarmRole, number> = {
  viewer: 0,
  worker: 1,
  manager: 2,
  owner: 3,
};

export async function withFarmAccess(
  req: NextRequest,
  farmId: string,
  minimumRole: FarmRole,
  handler: (ctx: FarmContext) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async ({ user }) => {
    // Load the farm
    const [farm] = await db
      .select()
      .from(farms)
      .where(eq(farms.id, farmId))
      .limit(1);

    if (!farm) {
      return err(API_ERRORS.FARM_NOT_FOUND, "Farm not found", 404);
    }

    // Load membership
    const [member] = await db
      .select()
      .from(farmMembers)
      .where(
        and(
          eq(farmMembers.farmId, farmId),
          eq(farmMembers.userId, user.id)
        )
      )
      .limit(1);

    if (!member) {
      return err(API_ERRORS.FORBIDDEN, "You are not a member of this farm", 403);
    }

    // Role check
    if (ROLE_RANK[member.role] < ROLE_RANK[minimumRole]) {
      return err(
        API_ERRORS.INSUFFICIENT_ROLE,
        `This action requires the '${minimumRole}' role or higher`,
        403
      );
    }

    return handler({ user, farm, member });
  });
}

// ---------------------------------------------------------------------------
// parsePagination — extracts ?page & ?pageSize from URL search params
// ---------------------------------------------------------------------------

export function parsePagination(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20"))
  );
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}
