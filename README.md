# SO LOVE KRUGERSDORP

Community website and installable PWA for events, membership, business listings and single-use vouchers.

All new work belongs to `vanwykkelvin16-ossou/elk-new-demo`. The original `so-love-vouchers` repository and its services have not been changed. Original source is retained under `legacy/`; original credentials are disconnected.

## Running the application

- `npm ci`
- `npm run build`
- `npx tsc --noEmit`
- `node scripts/verify-platform.mjs`
- `node scripts/verify-worker.mjs`

This is a **Cloudflare Worker application** using D1 (`DB`) and R2 (`BUCKET`). Sites provisions these bindings using `.openai/hosting.json` and applies generated migrations from `drizzle/`. It is not a static export or a Vercel-ready backend. For another provider, provision equivalent persistence and migrate the server before changing hosting.

Standalone Cloudflare deployment requires D1/R2 bindings and migration application in addition to the generated `dist/server/wrangler.json`. Do not run the standalone deploy command against an unconfigured account. Keep `TRUST_SITES_IDENTITY` unset outside the trusted Sites dispatcher. Never expose a standalone Worker that trusts user-supplied identity headers.

## Accounts and access

Public visitors browse without ChatGPT. SLKD accounts use email/password, salted PBKDF2 hashes, hashed opaque sessions and Secure/HttpOnly/SameSite cookies. Membership starts inactive. Only administrators can verify payment and activate membership. Password changes revoke existing app sessions. Protected responses are not cached by the service worker.

Existing Sites-linked accounts are retained when `TRUST_SITES_IDENTITY=true` is explicitly configured behind the Sites dispatcher. These members can set an app password under My details. The first administrator uses the private `ADMIN_BOOTSTRAP_KEY` runtime secret. Never commit the secret or expose it in browser code.

Account recovery: an administrator independently verifies the member's identity using existing contact information, opens **Members → Manage membership → Account recovery**, creates a one-use recovery link, and shares it privately. It expires after 15 minutes and is stored only as a hash. Creating another link invalidates the old link. Using the link revokes existing sessions. The URL token is held in its fragment and removed from the address bar when opened. No email delivery service or automated email verification is configured.

## Payments and vouchers

Payments use the organisation's manual EFT workflow. No card processor is connected and no card details are collected. FNB Business account `63135151221` is the account supplied by the owner; the organisation must verify its ownership and the R240 annual membership price before taking real payments.

Donation forms record pledges and sponsorship/contact forms save enquiries to the admin inbox. These actions do not charge money or send emails. Membership access and paid event places are activated only after the administrator checks the payment in the bank account.

A paid active member claims an offer into their wallet, then redeems it in front of staff. The server enforces ownership, publication, membership, inventory, one claim per member and single redemption. The default redemption window is 48 hours; admins can change it per voucher. A claim's saved deadline does not change later. The earlier offer expiry applies in South African time. Redemption produces an immutable receipt with the code and server timestamp.

The release moves demonstration offers into drafts, hides them publicly and prevents claiming/redemption. Existing real records, event expressions of interest, member history and receipts are retained. An administrator must enter and approve genuine offers before publishing. Seed event templates on a new installation are drafts until configured.

## Administration

The grouped menu separates events/attendance, people/support and offers/activity. **Registrations** is its own workspace with Interest registered, Awaiting payment, Payment review and Spot confirmed destinations, counts, attendee/reference search, an event filter and export of the current view. Phone layouts use a vertical menu and stacked attendee cards.

Content has published/draft/pending/archived filters. Requests have type and status filters. Archived content can be reopened and restored through the editor. The removed Website settings menu remains removed. Payment verification, event confirmation and voucher redemption remain server-authorised actions.

Image uploads are limited to administrators and active members, with size/type checks and rate limits. Uploads are public business/event images, not private payment documents. Member account and payment data are not included in public APIs.

## SEO and PWA

Public routes have page-specific titles, descriptions, canonical links and sharing metadata. Account/admin routes are noindex. The server supplies robots.txt, sitemap.xml, real 404s and security headers. The canonical origin is in `src/platform/seo.ts`; change it only when the final domain is configured. No domain migration to slkd.co.za has been performed.

The app includes correctly sized Android/iPhone icons and an offline fallback. Voucher redemption requires a live connection and server validation. Push notifications are not implemented. Real-device installation and interactive browser acceptance still require verification; the managed audit browser could not open its preview.

## Photography and release record

SLKD community photographs were sourced from the organisation's website or supplied by the owner. Stock sources and reuse details are recorded in `public/stock/credits.json`; community asset provenance is in `public/community/credits.json`. No extra stock assets were invented for this release.

See `docs/LAUNCH-REVIEW.md` for verification evidence, limits and the remaining organisation-owned launch decisions. Dependency overrides patch esbuild, undici and sharp advisories while keeping the tested Miniflare 4 interface. Recheck these overrides when upgrading the toolchain.
