# Launch review — 14 September 2026

## Release decision

The update is prepared for the existing Sites deployment. It improves production security and the administrator workflow. It is **not an unconditional launch certification**: real-device acceptance, organisation approvals and remaining static-analysis findings below are outstanding. Automated checks do not establish zero defects or complete security.

Only `vanwykkelvin16-ossou/elk-new-demo` and its linked Sites application are changed. The original `so-love-vouchers` repository is preserved.

## What changed

- Grouped admin navigation and a separate Registrations page. Status destinations show counts for Interest registered, Awaiting payment, Payment being verified and Spot confirmed. Search, event filtering and export of the selected view are included. Mobile navigation is vertical; registration rows become labelled cards.
- Content filters include draft, published, pending and archived records. Requests have separate type and status filters.
- Same-origin writes, method checks, bounded JSON/multipart bodies, additional rate limits, safe image restrictions and stricter administrator input validation.
- Legacy Sites identity is accepted only with explicit trusted-dispatcher configuration. Standalone installations default to rejecting identity headers.
- One-use, short-lived administrator-assisted password recovery with identity confirmation, hashed tokens and session revocation.
- Demonstration vouchers are hidden/drafted and cannot be claimed or redeemed. Existing real records and member receipts are retained.
- South African expiry dates, retained event details in member history, and the owner-supplied EFT account as the default payment instruction.
- Public-page SEO metadata, canonical URLs, sitemap and robots; private routes excluded from indexing; security response headers and real 404 responses.
- Correctly sized PWA icons, offline fallback assets and dependency security patches.

## Verification evidence

| Check | Result and scope |
| --- | --- |
| TypeScript | `npx tsc --noEmit` passes. |
| Production build | Cloudflare Worker, static assets and migrations build successfully. Non-fatal large-bundle/toolchain warnings remain. |
| Platform regression suite | Passes isolated database tests for authentication, permissions, membership verification, voucher ownership/inventory/expiry/concurrent redemption, event registration, recovery and malformed/rate-limited requests. |
| Built Worker integration suite | Passes actual Worker route rendering, D1, R2 image storage, WebCrypto/session cookies, voucher flow, SEO, security headers, sitemap, 404 and health checks in Miniflare. |
| Dependency audit | `npm audit` reports zero known vulnerabilities at review time. This is time-sensitive and not proof that dependencies have no undiscovered issues. |
| Images | 33 image files decode successfully; largest checked file is 450,613 bytes. Android/iPhone icons have their required dimensions. |
| Secret scan | Pattern scan found no matching private keys or common provider tokens in reviewed source. Runtime bootstrap credentials remain server secrets. Public account/payment identifiers are not API secrets. Pattern scans are not comprehensive secret detection. |
| Lint | **Not passing:** 105 explicit-any typing findings and 11 React development/hook warnings remain. Formatter and basic error findings were repaired; generated runtime output is excluded. Rules were not disabled to hide typing debt. |
| Interactive browser/mobile QA | **Blocked:** managed preview browser returned ERR_BLOCKED_BY_CLIENT. No claim of completed visual, accessibility-interaction, iOS installation or Android installation acceptance. |

Tests use isolated fixtures, not fabricated production signups or payments. Passing backend integration tests does not prove every interactive browser flow.

## Organisation-owned launch requirements

1. Independently confirm FNB Business account **63135151221**, account ownership, membership price **R240 per year**, payment references, refund terms and who may approve payments. No automatic bank reconciliation exists.
2. Publish genuine approved offers and event details, including dates, venues, prices and terms. Demonstration vouchers must stay unpublished. Existing undated events remain expressions of interest rather than promises of dated events.
3. Complete real iPhone/Android/desktop acceptance: sign up/sign in, membership EFT review, admin navigation/status filters, event registration and confirmation, claim into wallet, show staff a live redemption receipt, then verify the same voucher cannot be redeemed again. Check keyboard navigation, zoom and small-screen spacing.
4. Confirm privacy text, image permissions, data retention and support/account-recovery ownership. Verify the initial administrator is the intended operator and securely retain the bootstrap secret.
5. Confirm the intended production domain. This release retains the existing Sites URL and canonical origin; it does not change slkd.co.za DNS.
6. Plan backup/restore ownership and incident support with the hosting provider. A full backup restoration drill was not performed in this session.
7. Resolve the remaining lint/type-model debt and re-run lint before declaring all engineering quality gates green.

## Operational limits

Payments are manual EFT; giving forms record pledges/enquiries, not card charges. Email delivery, automatic email verification and push notifications are not configured. Password recovery is a verified administrator-assisted process; it does not automatically send email. Voucher redemption requires an online server check. Uploaded business/event images are public and must not contain private payment documents.

The Content Security Policy retains inline scripts required by the existing TanStack bootstrap; nonce-based strict script enforcement is not implemented. Security headers reduce specific risks but do not replace authorisation or input validation.

Sites supplies D1 and R2 through the hosting manifest and applies the new password-reset migration. A standalone Cloudflare deployment needs explicit equivalent bindings and migrations; this is not a static or Vercel-ready backend. Keep `TRUST_SITES_IDENTITY` unset outside the trusted Sites dispatcher. Never run the standalone deploy command without configuring persistence.

## Reproducible checks

```sh
npm ci
npx tsc --noEmit
npm run build
node scripts/verify-platform.mjs
node scripts/verify-worker.mjs
npm audit
npm run lint
```

The lint command currently fails for the findings disclosed above. Do not describe this release as having every check green.
