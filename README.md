# AffiLink — AliExpress Affiliate App

A small AliExpress-style web app for friends & family to turn AliExpress product links into
their own affiliate (tracked) links — with a personal dashboard, local cart & wishlist, and
an AI assistant that hunts coupons and screens products for rip-offs before checkout.

## Stack
- **Next.js 15** (App Router, TypeScript) — frontend + API route handlers
- **Prisma + SQLite** — users, approvals, assigned tracking IDs, generated-link library
- **iron-session** — auth; **bcryptjs** — password hashing; **AES-256-GCM** — secrets at rest
- **next-intl** — Hebrew / English / Russian (Hebrew RTL); 3 themes via CSS variables
- **recharts** — dashboard analytics; **driver.js** — in-app tour; **qrcode** — link QR codes
- AI providers: Claude / OpenAI / Gemini (bring-your-own key) with a free Claude fallback

## Privacy invariants
- The **tracking ID** (each user's AliExpress affiliate ID) is server-only. Shared links use
  a `/go/<id>` redirect so the tracking ID never appears in any URL the user sees.
- **Commissions/earnings** are admin-only; user order views strip all commission fields.
- App Secret, AI keys, and OAuth tokens live only in `.env` / encrypted DB columns.

## Setup
1. `npm install`
2. Copy `.env.example` → `.env` and fill in values:
   - `ALIEXPRESS_APP_KEY` / `ALIEXPRESS_APP_SECRET` (keep secret; rotate if ever exposed)
   - `SESSION_SECRET` and `ENCRYPTION_KEY` — `openssl rand -base64 32`
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the single admin account
3. `npx prisma db push` then `npx tsx prisma/seed.ts` (creates the admin)
4. `npm run dev` → http://localhost:3000

## Flow
1. A friend signs up → status **PENDING**; the admin is notified.
2. Admin opens `/admin`, assigns a **tracking ID**, and approves → the user is emailed.
3. The user pastes AliExpress links → gets a tracked link (with QR). Ineligible products can
   be added to the **wishlist**, which is re-checked on every login; eligible ones go to the
   **cart**, where an AI safety + deals check runs before checkout.

## Deployment
Use a host with a **persistent disk** (Render/Railway) and set
`DATABASE_URL="file:/data/app.db"`. Vercel's filesystem is ephemeral — use Turso (libSQL)
there instead.

## Phase 2 (not enabled by default)
In-app ordering via `aliexpress.ds.order.create` requires OAuth + a saved address and is
gated behind `ENABLE_DS_PAYMENTS`. Build and test against the sandbox first.
