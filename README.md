# SO LOVE KRUGERSDORP — New Demo

Independent redesign based on `vanwykkelvin16-ossou/so-love-vouchers` and SLKD's public website. The original GitHub repository and its live services were not modified.

## Included

- Responsive public website: home, story, events, business directory, vouchers, membership, sponsorship, donations, contact and privacy.
- Member accounts, payment-verification status, annual membership expiry, voucher wallet/history, event registrations and business-profile submissions.
- Server-side membership gating, atomic single-claim limits and one-time redemption.
- Admin management of events, vouchers, businesses, sponsors, members, enquiries, donation pledges, membership payments, website settings and activity history. Published content updates the public site. Deletion archives records to preserve history.
- Cloudflare D1 persistence and R2 image uploads. Original Supabase credentials are disconnected.
- PWA manifest, installable app icon and offline fallback. Protected pages and APIs are never cached by the service worker.

## Demo access and activation

The Sites deployment is owner-private. Sign-in currently uses the Sites platform's ChatGPT identity, not a separate email/password account. A signed-in visitor is registered as an inactive member. The first administrator enters the private setup code configured as `ADMIN_BOOTSTRAP_KEY`; never commit that code.

The admin can independently verify a membership payment to activate one year of access. No card processor is connected. Donation forms record pledges, sponsorship forms record enquiries, and the contact form saves requests in the admin inbox; these forms do not send email or charge cards.

Before public/customer launch, connect the chosen customer identity provider and payment processor, verify current membership pricing and banking details, replace the example voucher, confirm event dates, and review the privacy notice. The configured R240 annual demo price came from the linked SLKD membership form and is editable. Upcoming event cards accept expressions of interest until dates are set.

## Source preservation

The initial local commit preserves the available original source. Original route implementations are also retained under `legacy/routes`. The original Bun lockfile is retained under `original-lockfiles`; npm is the active package manager. `source-copy-manifest.json` records all original file paths and Git blob hashes.

Original `.env` and `.mcp.json` runtime/connection configuration are deliberately excluded from the new repository. The original 2.36 MB `public/events/slk-breakfast.png` could not be retrieved through the connected GitHub interface; it remains available in the original repository. This image is not used by the new design. All other source assets were copied and three authentic SLKD community photographs were added.

## Development and verification

- `npm ci`
- `npm run build`
- `npx tsc --noEmit`
- `node scripts/verify-platform.mjs` — isolated SQLite workflow and access-control checks.
- `node scripts/verify-worker.mjs` — local Worker rendering and D1 checks.

D1 schema is in `db/schema.ts`; generated schema-only migrations are in `drizzle/`. Sites provisions and binds `DB` and `BUCKET`. Production secrets belong in Sites runtime settings, never source files. The Worker trusts identity headers only behind the Sites dispatcher; standalone hosting requires equivalent header sanitisation/authentication.

## Content and photography

Organisation reference: https://slkd.co.za
Membership reference: https://form.jotform.com/242462640866057
Community photos: SLKD's website (`Angus crowd Krugersdorp.jpg`, gallery images dated 19 May 2026). Local filenames: `public/community/gathering.jpg`, `outreach.jpg`, `team.jpg`.

## GitHub destination

The completed independent source is stored in `vanwykkelvin16-ossou/elk-new-demo`. The original `so-love-vouchers` repository remains unchanged.
