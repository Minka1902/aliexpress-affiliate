import type { Role, Status, User } from "@prisma/client";
import { entitlements, type Entitlements } from "@/lib/roles";

// The ONLY shape of user data allowed to reach a normal client. Strips passwordHash,
// trackingId, AI keys, and DS OAuth tokens. Includes computed feature entitlements.
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: Status;
  theme: string | null;
  locale: string | null;
  shipToCountry: string | null;
  aiProvider: string | null;
  hasAiKey: boolean;
  onboarded: boolean;
  features: Entitlements;
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
    onboarded: !!user.onboardedAt,
    features: entitlements(user),
  };
}

// Admin view — includes trackingId + raw unlock flags + created date. Never passwordHash/keys.
export interface AdminUserView extends PublicUser {
  trackingId: string | null;
  unlockedAi: boolean;
  unlockedCart: boolean;
  unlockedWishlist: boolean;
  createdAt: string;
}

export function toAdminUser(user: User): AdminUserView {
  return {
    ...toPublicUser(user),
    trackingId: user.trackingId,
    unlockedAi: user.unlockedAi,
    unlockedCart: user.unlockedCart,
    unlockedWishlist: user.unlockedWishlist,
    createdAt: user.createdAt.toISOString(),
  };
}
