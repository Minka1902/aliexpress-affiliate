import type { User } from "@prisma/client";

// The ONLY shape of user data allowed to reach the client. Strips passwordHash, trackingId,
// AI keys, and DS OAuth tokens. Every API/RSC returning user data must route through this.
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
  theme: string | null;
  locale: string | null;
  shipToCountry: string | null;
  aiProvider: string | null;
  hasAiKey: boolean; // whether a key is set — never the key itself
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    theme: user.theme,
    locale: user.locale,
    shipToCountry: user.shipToCountry,
    aiProvider: user.aiProvider,
    hasAiKey: !!user.aiKeyEncrypted,
  };
}

// Admin view of a user — still never exposes passwordHash or raw secrets, but DOES include
// the trackingId (the admin sets it) so it can be displayed/edited in /admin.
export interface AdminUserView extends PublicUser {
  trackingId: string | null;
  createdAt: string;
}

export function toAdminUser(user: User): AdminUserView {
  return {
    ...toPublicUser(user),
    trackingId: user.trackingId,
    createdAt: user.createdAt.toISOString(),
  };
}
