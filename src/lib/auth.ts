import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";
import type { User } from "@prisma/client";

/** Loads the full DB user for the current session, or null. SERVER-ONLY. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user;
}

/** Requires an APPROVED user; redirects otherwise. Returns the full user (server-only). */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.status === "PENDING") redirect("/pending");
  if (user.status !== "APPROVED") redirect("/signin");
  return user;
}

/** Requires the single admin (role ADMIN and email === ADMIN_EMAIL). */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const isAdmin = user.role === "ADMIN" && user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) redirect("/dashboard");
  return user;
}

/** API-route variant: returns user or null without redirecting. */
export async function getApiUser(): Promise<User | null> {
  return getCurrentUser();
}

export function isAdminUser(user: User | null): boolean {
  return !!user && user.role === "ADMIN" && user.email === process.env.ADMIN_EMAIL;
}
