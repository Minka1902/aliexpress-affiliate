import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { entitlements, isAdminRole, type Feature } from "./roles";
import type { User } from "@prisma/client";

/** Loads the full DB user for the current session, or null. SERVER-ONLY. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user;
}

/** Requires an active (non-banned) user; redirects otherwise. Returns the full user. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.status === "BANNED") redirect("/banned");
  return user;
}

/** Requires the single admin (role ADMIN and email === ADMIN_EMAIL). */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!isAdminRole(user)) redirect("/dashboard");
  return user;
}

/** API-route variant: returns user or null without redirecting. */
export async function getApiUser(): Promise<User | null> {
  return getCurrentUser();
}

export function isAdminUser(user: User | null): boolean {
  return !!user && isAdminRole(user);
}

/** True if the user is active and entitled to a given paid feature. */
export function hasFeature(user: User | null, feature: Feature): boolean {
  if (!user || user.status === "BANNED") return false;
  return entitlements(user)[feature];
}
