# Missing icons (for the `msr-icons` package author)

The app is set up to use **`msr-icons`** for all icons, via the wrapper at
`src/components/Icon.tsx`. However, **`msr-icons@1.0.6` as published on npm contains no
build output** — the package only ships `README.md`, `LICENSE`, and `package.json` (no
`dist/` directory), so `import { ... } from "msr-icons"` resolves to nothing and exports
zero icons.

**Action needed:** publish a version of `msr-icons` that actually includes the built
`dist/index.js`, `dist/index.cjs`, and `dist/index.d.ts` referenced by its `package.json`
`exports`. Once that's available, the `Icon` wrapper can be switched from its temporary
fallback glyphs to real `msr-icons` components in one place.

## Icons the app needs (semantic name → suggested PascalCase export)

| App usage | Suggested `msr-icons` name |
|---|---|
| Cart | `Cart` / `ShoppingCart` |
| Wishlist / favourite | `Heart` |
| Settings / account | `Settings` |
| Search | `Search` |
| Home / dashboard | `House` |
| Affiliate link | `Link` |
| Language | `Globe` / `Language` |
| Theme | `Palette` |
| Eligible / success | `Check` / `CircleCheck` |
| Not eligible / error | `Close` / `CircleX` |
| Info / notice | `Info` |
| Ban user | `Ban` / `UserBlock` |
| Delete | `Trash` |
| Edit | `Pencil` / `Edit` |
| User | `User` |
| Price / tag | `Tag` |
| Seed / demo data | `Database` |
| Guided tour | `Compass` / `MapPin` |
| Locked feature | `Lock` |
| QR code | `QrCode` |

If any of the above names don't exist in the package, please add them (or tell me the
correct names) and I'll map them in `src/components/Icon.tsx`.
