import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "fd_session";
const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);

export type SessionPayload = {
  userId: string;
  name: string;
  email: string | null;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookie = cookies().get(COOKIE);
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie.value, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  cookies().delete(COOKIE);
}
