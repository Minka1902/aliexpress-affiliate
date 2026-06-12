# msr-icons status

**Resolved:** `msr-icons@1.1.0` ships a real `dist/` with 2122 icons. All icons the app uses
are present and mapped in `src/components/IconImpl.tsx`:

| App usage | msr-icons export |
|---|---|
| Cart | `ShoppingCart` |
| Wishlist (nav) / favourite | `Wishlist` / `Heart` / `HeartFilled` |
| Settings / account | `Settings` |
| Search | `Search` |
| Home / dashboard | `Home2` |
| Affiliate link | `Link` |
| Language | `Language` |
| Theme | `Palette` |
| Eligible / success | `Check` |
| Close / not eligible | `Close` |
| Info | `Info` |
| Ban user / suspended | `Ban` |
| Delete | `Trash` |
| Edit | `Edit` |
| User | `User` |
| Price / tag | `PriceTag` |
| Seed / demo data | `Seedling` |
| Guided tour | `Compass` |
| Locked feature | `Lock` |
| QR code | `QrCode` |
| Empty / box | `Box` |

## Remaining request for the package author (performance, not correctness)
The published package bundles **all 2122 icons into a single module** (`dist/index.js`), which
is **not tree-shakeable** — importing even one named icon pulls the whole ~1.6MB library into
the bundle. As a workaround the app loads the icon module **lazily** (`src/components/Icon.tsx`
via `next/dynamic`) so it stays out of the critical first-load bundle.

To make named imports tree-shakeable (so apps only pay for the icons they use), please publish
each icon (or category) as its **own module** with a matching `exports` subpath, e.g.
`msr-icons/icons/ShoppingCart`, and keep `"sideEffects": false`. Then the lazy-loading
workaround can be removed.
