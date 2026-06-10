import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

// The session cookie payload is intentionally minimal — it NEVER contains the
// trackingId, AI keys, or any commission data.
export interface SessionData {
  userId?: string;
  role?: "USER" | "ADMIN";
  status?: "PENDING" | "APPROVED" | "REJECTED";
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "aff_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
