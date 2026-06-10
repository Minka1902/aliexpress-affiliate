# What I need from you to enable real Stripe payments

Right now payments use a **simulated instant-unlock** (`src/lib/payments.ts`). To switch to
real Stripe Checkout, provide the following and I'll wire it in behind the same
`unlock()`/checkout interface.

## 1. Stripe account & keys
- A Stripe account (test mode is fine to start).
- **Secret key** (`sk_test_...` / `sk_live_...`) → env `STRIPE_SECRET_KEY`.
- **Publishable key** (`pk_test_...`) → env `STRIPE_PUBLISHABLE_KEY` (only if we use Stripe.js on the client; Checkout redirect doesn't strictly need it).
- **Webhook signing secret** (`whsec_...`) → env `STRIPE_WEBHOOK_SECRET` (created when you add the webhook endpoint below).

## 2. Products / prices
Either:
- Create **Products + Prices** in the Stripe dashboard for: AI, Cart, Wishlist, Bundle, and give me the **price IDs** (`price_...`); or
- Let the app create **ad-hoc prices** at checkout from the amounts in the admin pricing page (no dashboard setup needed). Tell me which you prefer.

## 3. URLs
- The app's public base URL (e.g. `https://yourapp.com`) for Checkout **success/cancel** redirects → env `APP_BASE_URL`.
- I'll register a webhook endpoint at `POST /api/stripe/webhook` in your Stripe dashboard; you paste back the signing secret (step 1).

## 4. Currency & business details
- Confirm the **currency** (matches the admin pricing page; default USD).
- Any business info Stripe requires to activate live payments (handled in your Stripe dashboard, not in code).

## What I'll build once provided
- `POST /api/pay` → creates a Stripe **Checkout Session** and returns its URL (client redirects).
- `POST /api/stripe/webhook` → verifies the signature and, on `checkout.session.completed`,
  unlocks the purchased feature(s) via the existing `unlock()` function.
- Env-gated: if Stripe env vars are absent, the app keeps using the simulated unlock, so
  nothing breaks before keys are added.
