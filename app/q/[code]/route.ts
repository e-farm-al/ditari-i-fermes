import { NextRequest, NextResponse } from "next/server";
import { db, qrCodes } from "@/db";
import { eq } from "drizzle-orm";

// Entity type → app route mapping
// Extend here as new modules are added (animals, flocks, plots)
const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  hive:   (id) => `/hives/${id}`,
  animal: (id) => `/animals/${id}`,
  flock:  (id) => `/poultry/${id}`,
  plot:   (id) => `/crops/${id}`,
};

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const [qr] = await db
    .select()
    .from(qrCodes)
    .where(eq(qrCodes.code, code))
    .limit(1);

  if (!qr) {
    // Unknown code — send to dashboard (user will see a 404-like state)
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const buildPath = ENTITY_ROUTES[qr.entityType];
  if (!buildPath) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect to the entity page — middleware will handle auth if needed
  return NextResponse.redirect(new URL(buildPath(qr.entityId), req.url));
}
