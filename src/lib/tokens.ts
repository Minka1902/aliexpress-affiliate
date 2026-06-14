import crypto from "crypto";
import { prisma } from "./prisma";

export type TokenType = "RESET" | "VERIFY";

function hash(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Creates a single-use token of the given type and returns the RAW token (to email). */
export async function createToken(userId: string, type: TokenType, ttlMs = 60 * 60_000): Promise<string> {
  const raw = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: { userId, type, tokenHash: hash(raw), expiresAt: new Date(Date.now() + ttlMs) },
  });
  return raw;
}

/** Consumes a token: returns the userId if valid+unexpired, else null. Deletes it (single-use). */
export async function consumeToken(raw: string, type: TokenType): Promise<string | null> {
  if (!raw) return null;
  const row = await prisma.verificationToken.findUnique({ where: { tokenHash: hash(raw) } });
  if (!row || row.type !== type) return null;
  await prisma.verificationToken.delete({ where: { id: row.id } }).catch(() => {});
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row.userId;
}
