# SO LOVE KRUGERSDORP — New Demo

Independent redesign based on `vanwykkelvin16-ossou/so-love-vouchers` and SLKD's public website. The original GitHub repository and its live services were not modified.

## Included

- Responsive public website: home, story, events, business directory, vouchers, membership, sponsorship, donations, contact and privacy.
- Member accounts, payment-verification status, annual membership expiry, voucher wallet/history, event registrations and business-profile submissions.
- Server-side membership gating, atomic single-claim limits and one-time redemption. Members claim vouchers into their wallet, open a voucher in front of staff and explicitly confirm redemption. The server checks ownership, active membership, publication and expiry before recording the use. A receipt keeps the offer details, member name, code and timestamp; past receipts cannot be used again. Live status refreshes while the voucher is open, and the “just redeemed” treatment ends after two minutes.
- Admin management of events, vouchers, businesses, sponsors, members, enquiries, donation pledges, membership payments, website settings and activity history. Published content updates the public site. Deletion archives records to preserve history.
- Cloudflare D1 persistence and R2 image uploads. Original Supabase credentials are disconnected.
- PWA manifest, installable app icon and offline fallback. Protected pages and APIs are never cached by the service worker.

## Demo access and activation

Visitors can create an SLKD account with an email and password; ChatGPT is not required. Accounts start with inactive membership. Existing platform accounts keep their memberships and history: sign in using the earlier demo option once, then set a password under My details. Password setup never links an anonymous signup to an existing account by email. Passwords are salted with PBKDF2; opaque sessions are stored hashed in D1 and sent only in Secure, HttpOnly, SameSite cookies. Authentication has server-side rate limits and same-origin checks. Changing a password revokes existing app sessions. Password reset/email verification delivery is not configured; the login screen directs account-help requests to the team. The first administrator enters the private setup code configured as `ADMIN_BOOTSTRAP_KEY`; never commit that code.

The admin can independently verify a membership payment to activate one year of access. No card processor is connected. Donation forms record pledges, sponsorship forms record enquiries, and the contact form saves requests in the admin inbox; these forms do not send email or charge cards.

Before public/customer launch, connect the chosen payment processor and account-recovery email service, verify current membership pricing and banking details, replace the example voucher, confirm event dates, and review the privacy notice. The configured R240 annual demo price came from the linked SLKD membership form and is editable. Upcoming event cards accept expressions of interest until dates are set.

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

All new work is stored in `vanwykkelvin16-ossou/elk-new-demo`. No source remote points to the original repository.

## Navigation

The shared app shell stays mounted across routes. Internal links use TanStack navigation, including event details and member/admin tabs. Initial account checks show a neutral loading state rather than briefly displaying a sign-in form.

## Mobile and involvement pages

The navigation includes a Get involved dropdown for Membership, Sponsorship and Donations. Membership uses a welcoming photo-led introduction, benefit cards, annual plan and clear joining steps. Sponsorship and Donations have distinct introductions and focused enquiry/pledge forms. Mobile layouts use fluid grids, readable spacing, touch-friendly controls and dialogs that fit the available screen height. Donation choices remain pledges; no card payment is processed.
