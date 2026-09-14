import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { build } from "esbuild";
import assert from "node:assert/strict";
await build({
  entryPoints: ["src/platform/api.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: ".sites-runtime/api-test.mjs",
});
const { handleAPI } = await import("../.sites-runtime/api-test.mjs");
const sqlite = new DatabaseSync(":memory:");
for (const file of readdirSync("drizzle")
  .filter((f) => f.endsWith(".sql"))
  .sort())
  sqlite.exec(readFileSync("drizzle/" + file, "utf8"));
class Statement {
  constructor(sql, values = []) {
    this.sql = sql;
    this.values = values;
  }
  bind(...v) {
    return new Statement(this.sql, v);
  }
  async first() {
    return sqlite.prepare(this.sql).get(...this.values) || null;
  }
  async all() {
    return { results: sqlite.prepare(this.sql).all(...this.values) };
  }
  async run() {
    const r = sqlite.prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(r.changes) } };
  }
}
const env = {
  DB: {
    prepare: (sql) => new Statement(sql),
    batch: async (statements) => {
      sqlite.exec("BEGIN");
      try {
        const r = await Promise.all(statements.map((s) => s.run()));
        sqlite.exec("COMMIT");
        return r;
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  },
  TRUST_SITES_IDENTITY: "true",
  ADMIN_BOOTSTRAP_KEY: "test-only-bootstrap-secret",
};
async function call(path, body, user, expected = 200, origin = "https://slk.test") {
  const headers = { origin };
  if (user) {
    headers["oai-authenticated-user-id"] = user;
    headers["oai-authenticated-user-email"] = user + "@example.test";
    headers["oai-authenticated-user-full-name"] = user;
  }
  if (body !== undefined) headers["content-type"] = "application/json";
  const req = new Request("https://slk.test/api" + path, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await handleAPI(req, env);
  const data = await response.json();
  assert.equal(response.status, expected, path + ": " + JSON.stringify(data));
  return data;
}
assert.equal((await call("/public")).entities.length, 2);
sqlite.exec(
  "UPDATE entities SET data=json_set(data,'$.status','published','$.demo',json('false'));",
);
assert.equal(sqlite.prepare("SELECT count(*) n FROM entities").get().n, 6);
await call("/claim", { id: "voucher-example" }, null, 401);
await call("/admin", undefined, null, 401);
for (const u of ["owner", "member", "outsider"]) await call("/signin", {}, u);
await call("/admin", undefined, "member", 403);
await call("/bootstrap", { key: "wrong" }, "owner", 403);
await call("/bootstrap", { key: env.ADMIN_BOOTSTRAP_KEY }, "owner");
await call("/bootstrap", { key: env.ADMIN_BOOTSTRAP_KEY }, "outsider", 409);
await call("/profile", { name: "Hacker" }, "member", 403, "https://other.test");
await call("/claim", { id: "voucher-example" }, "member", 403);
const submission = await call(
  "/submissions",
  { kind: "membership", name: "Member", email: "member@example.test", consent: true, amount: 1 },
  "member",
);
assert.equal(
  JSON.parse(sqlite.prepare("SELECT data FROM submissions WHERE id=?").get(submission.id).data)
    .amount,
  240,
);
await call("/admin/submission", { id: submission.id, status: "verified" }, "owner", 400);
await call(
  "/admin/submission",
  { id: submission.id, status: "verified", paymentConfirmed: true },
  "owner",
);
assert.equal((await call("/member", undefined, "member")).user.active, true);
const claimed = await call("/claim", { id: "voucher-example" }, "member");
await call("/claim", { id: "voucher-example" }, "member", 409);
assert.equal((await call("/member", undefined, "outsider")).claims.length, 0);
await call("/admin/redeem", { code: claimed.code }, "member", 403);
await call("/admin/redeem", { code: claimed.code }, "owner");
await call("/admin/redeem", { code: claimed.code }, "owner", 409);
assert.equal((await call("/member", undefined, "member")).claims[0].status, "redeemed");

// Member-controlled, single-use redemption with a durable staff receipt.
await call("/wallet", undefined, null, 401);
const originalOffer = JSON.parse(
  sqlite.prepare("SELECT data FROM entities WHERE id='voucher-example'").get().data,
);
const addOffer = async (id) =>
  call(
    "/admin/entity",
    { ...originalOffer, id, title: "Staff redemption test", expires: "2099-12-31" },
    "owner",
  );
await addOffer("self-use");
const ownClaim = await call("/claim", { id: "self-use" }, "member");
assert.equal(
  (await call("/wallet", undefined, "member")).claims.find((c) => c.id === ownClaim.id).redeemable,
  true,
);
await call("/redeem", { id: ownClaim.id, confirm: true }, null, 401);
await call("/redeem", { id: ownClaim.id, confirm: true }, "outsider", 404);
await call("/redeem", { id: ownClaim.id, confirm: false }, "member", 400);
await call("/redeem", { id: ownClaim.id, confirm: true }, "member", 403, "https://evil.test");
const used = await call("/redeem", { id: ownClaim.id, confirm: true }, "member");
assert.equal(used.claim.status, "redeemed");
assert.equal(used.claim.receipt.code, ownClaim.code);
assert.equal(used.claim.receipt.title, "Staff redemption test");
assert.ok(used.claim.receipt.memberName);
assert.ok(used.serverTime);
assert.equal(used.claim.redeemable, false);
await call("/redeem", { id: ownClaim.id, confirm: true }, "member", 409);
await call("/admin/redeem", { code: ownClaim.code }, "owner", 409);
await call(
  "/admin/entity",
  { ...originalOffer, id: "self-use", title: "Changed after redemption" },
  "owner",
);
await call("/admin/delete", { id: "self-use" }, "owner");
assert.deepEqual(
  (await call("/wallet", undefined, "member")).claims.find((c) => c.id === ownClaim.id).receipt,
  used.claim.receipt,
);
await addOffer("race-use");
const raceClaim = await call("/claim", { id: "race-use" }, "member");
const raceRequest = () =>
  new Request("https://slk.test/api/redeem", {
    method: "POST",
    headers: {
      origin: "https://slk.test",
      "content-type": "application/json",
      "oai-authenticated-user-id": "member",
    },
    body: JSON.stringify({ id: raceClaim.id, confirm: true }),
  });
const raced = await Promise.all([handleAPI(raceRequest(), env), handleAPI(raceRequest(), env)]);
assert.deepEqual(raced.map((r) => r.status).sort(), [200, 409]);
assert.equal(
  sqlite
    .prepare("SELECT count(*) n FROM audit WHERE action='voucher.redeemed' AND target=?")
    .get(raceClaim.id).n,
  1,
);
for (const reason of ["expired", "archived", "inactive"]) {
  await addOffer(reason);
  const claim = await call("/claim", { id: reason }, "member");
  if (reason === "expired")
    await call("/admin/entity", { ...originalOffer, id: reason, expires: "2000-01-01" }, "owner");
  if (reason === "archived") await call("/admin/delete", { id: reason }, "owner");
  if (reason === "inactive")
    sqlite.prepare("UPDATE users SET membership='inactive' WHERE id='member'").run();
  const checked = (await call("/wallet", undefined, "member")).claims.find(
    (c) => c.id === claim.id,
  );
  assert.equal(checked.redeemable, false);
  assert.ok(checked.invalidReason);
  await call("/redeem", { id: claim.id, confirm: true }, "member", 409);
  assert.equal(
    sqlite.prepare("SELECT status FROM claims WHERE id=?").get(claim.id).status,
    "available",
  );
  if (reason === "inactive")
    sqlite.prepare("UPDATE users SET membership='active' WHERE id='member'").run();
}
console.log(
  "PASS: claim → wallet → staff-confirmed redemption, private ownership, immutable receipts, duplicate/concurrent redemption protection and expired/archived/inactive restrictions.",
);
await call(
  "/business",
  {
    title: "Private Business",
    email: "private@example.test",
    phone: "0123456789",
    publicContact: false,
    website: "javascript:alert(1)",
    ownerId: "owner",
    status: "published",
  },
  "member",
);
const business = JSON.parse(
  sqlite
    .prepare("SELECT data FROM entities WHERE kind='businesses' AND data LIKE '%Private Business%'")
    .get().data,
);
assert.equal(business.status, "pending");
assert.equal(business.ownerId, "member");
assert.equal(business.website, "");
assert.equal(
  (await call("/public")).entities.some((e) => e.id === business.id),
  false,
);
await call("/admin/entity", { ...business, status: "published" }, "owner");
assert.equal((await call("/public")).entities.find((e) => e.id === business.id).email, undefined);
assert.equal(
  (await call("/public", undefined, "member")).entities.find((e) => e.id === business.id).email,
  "private@example.test",
);
// Contact details, durable payment references, private review and admin confirmation.
const attendee = {
  id: "event-network",
  name: "Member Example",
  email: "attendee@example.test",
  phone: "0821234567",
  business: "Local business",
  consent: true,
};
await call("/register", { id: "event-network" }, "member", 400);
await call("/register", { ...attendee, consent: false }, "member", 400);
await call("/register", attendee, null, 401);
const interest = (await call("/register", attendee, "member")).registration;
assert.equal(interest.status, "pending_confirmation");
assert.equal(interest.details.phone, "0821234567");
assert.equal(interest.details.banking.account, "63135151221");
assert.equal(
  (await call("/registration?event=event-network", undefined, "outsider")).registration,
  null,
);
await call("/register", attendee, "member", 409);
await call("/admin/registration", { id: interest.id, confirm: true }, "member", 403);
await call("/admin/registration", { id: interest.id, confirm: true }, "owner");
assert.equal(
  (await call("/registration?event=event-network", undefined, "member")).registration.status,
  "confirmed",
);
const eventData = JSON.parse(
  sqlite.prepare("SELECT data FROM entities WHERE id='event-network'").get().data,
);
await call("/admin/entity", { ...eventData, id: "paid-event", price: 175 }, "owner");
const paid = (
  await call(
    "/register",
    { ...attendee, id: "paid-event", amount: 1, status: "confirmed" },
    "member",
  )
).registration;
assert.equal(paid.details.amount, 175);
assert.equal(paid.status, "pending_payment");
await call("/registration-payment", { id: paid.id, paymentSent: true }, "outsider", 404);
await call("/registration-payment", { id: paid.id, paymentSent: false }, "member", 400);
await call("/registration-payment", { id: paid.id, paymentSent: true }, "member");
assert.equal(
  (await call("/registration?event=paid-event", undefined, "member")).registration.status,
  "payment_review",
);
await call("/admin/registration", { id: paid.id, confirm: true }, "owner", 400);
await call("/admin/registration", { id: paid.id, confirm: true, paymentVerified: true }, "owner");
await call("/registration-payment", { id: paid.id, paymentSent: true }, "member", 409);
assert.equal(
  (await call("/registration?event=paid-event", undefined, "member")).registration.status,
  "confirmed",
);
// The server snapshots the redemption window and enforces it for members and staff.
await call(
  "/admin/entity",
  { ...originalOffer, id: "window-default", expires: "2099-12-31" },
  "owner",
);
const defaultWindow = await call("/claim", { id: "window-default" }, "member");
const savedDefault = sqlite.prepare("SELECT * FROM claims WHERE id=?").get(defaultWindow.id);
assert.equal(
  Date.parse(savedDefault.redeem_by) - Date.parse(savedDefault.created_at),
  48 * 3600000,
);
await call(
  "/admin/entity",
  { ...originalOffer, id: "window-custom", expires: "2099-12-31", redeemHours: 6 },
  "owner",
);
const customWindow = await call("/claim", { id: "window-custom" }, "member");
const savedCustom = sqlite.prepare("SELECT * FROM claims WHERE id=?").get(customWindow.id);
assert.equal(Date.parse(savedCustom.redeem_by) - Date.parse(savedCustom.created_at), 6 * 3600000);
await call(
  "/admin/entity",
  { ...originalOffer, id: "window-custom", expires: "2099-12-31", redeemHours: 72 },
  "owner",
);
assert.equal(
  sqlite.prepare("SELECT redeem_by FROM claims WHERE id=?").get(customWindow.id).redeem_by,
  savedCustom.redeem_by,
);
for (const redeemHours of [0, -1, 1.5, "oops", 9000])
  await call(
    "/admin/entity",
    { ...originalOffer, id: "window-invalid", redeemHours },
    "owner",
    400,
  );
sqlite
  .prepare("UPDATE claims SET redeem_by=? WHERE id=?")
  .run(new Date(Date.now() - 1000).toISOString(), customWindow.id);
assert.equal(
  (await call("/wallet", undefined, "member")).claims.find((c) => c.id === customWindow.id)
    .redeemable,
  false,
);
await call("/redeem", { id: customWindow.id, confirm: true }, "member", 409);
await call("/admin/redeem", { code: customWindow.code }, "owner", 409);
await call("/redeem", { id: defaultWindow.id, confirm: true }, "member");
assert.equal(
  (await call("/wallet", undefined, "member")).claims.find((c) => c.id === defaultWindow.id).status,
  "redeemed",
);
await call(
  "/admin/entity",
  { ...originalOffer, id: "legacy-window", expires: "2099-12-31" },
  "owner",
);
const legacyWindow = await call("/claim", { id: "legacy-window" }, "member");
sqlite
  .prepare("UPDATE claims SET redeem_by=NULL,created_at=? WHERE id=?")
  .run(new Date(Date.now() - 49 * 3600000).toISOString(), legacyWindow.id);
const legacyView = (await call("/wallet", undefined, "member")).claims.find(
  (c) => c.id === legacyWindow.id,
);
assert.ok(legacyView.redeem_by);
assert.equal(legacyView.redeemable, false);
await call("/redeem", { id: legacyWindow.id, confirm: true }, "member", 409);
await call("/admin/redeem", { code: legacyWindow.code }, "owner", 409);
console.log(
  "PASS: event contact/payment workflow and configurable voucher deadlines, ownership, immutable claim deadlines and staff/member expiry enforcement.",
);

await call("/admin/member", { id: "member", membership: "inactive", disabled: true }, "owner");
await call("/claim", { id: "voucher-example" }, "member", 403);
await call("/member", undefined, "member", 403);
await call("/admin/delete", { id: "voucher-example" }, "owner");
assert.equal(
  (await call("/public")).entities.some((e) => e.id === "voucher-example"),
  false,
);
assert.ok(sqlite.prepare("SELECT count(*) n FROM claims").get().n >= 1);
await call("/submissions", {
  kind: "contact",
  name: "Visitor",
  email: "visitor@example.test",
  message: "Hello",
  consent: true,
});
await call("/submissions", {
  kind: "donation",
  name: "Donor",
  email: "donor@example.test",
  amount: 500,
  consent: true,
});
assert.ok(sqlite.prepare("SELECT count(*) n FROM audit").get().n >= 8);
console.log(
  "PASS: 35 workflow and access checks — membership, claims, redemption, ownership, publication, enquiries, history and CSRF.",
);

// Exercise public account access without any platform identity headers.
async function account(path, body, jar = "", expected = 200, extraHeaders = {}) {
  const response = await handleAPI(
    new Request("https://slk.test/api" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        origin: "https://slk.test",
        cookie: jar,
        "content-type": "application/json",
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
  );
  const data = await response.json();
  assert.equal(response.status, expected, path + ": " + JSON.stringify(data));
  const sessionCookie = response.headers
    .getSetCookie()
    .find((c) => c.startsWith("__Host-slk_session="));
  return { data, cookie: sessionCookie?.split(";")[0], response };
}
const signup = {
  name: "Public Member",
  email: "public@example.test",
  password: "Secure membership passphrase!",
  consent: true,
};
await account("/auth/signup", { ...signup, password: "short" }, "", 400);
await account("/auth/signup", signup, "", 403, { origin: "https://evil.test" });
const joined = await account("/auth/signup", signup);
assert.ok(
  joined.response.headers
    .getSetCookie()
    .every((c) => c.includes("HttpOnly") && c.includes("Secure") && c.includes("SameSite=Lax")),
);
assert.ok(joined.cookie);
const publicSession = (await account("/session", undefined, joined.cookie)).data;
assert.equal(publicSession.user.email, signup.email);
assert.equal(publicSession.user.active, false);
assert.equal(publicSession.user.role, "member");
assert.equal(
  (await account("/member", undefined, joined.cookie)).data.user.id,
  publicSession.user.id,
);
await account("/admin", undefined, joined.cookie, 403);
await account("/claim", { id: "voucher-example" }, joined.cookie, 403);
await account("/auth/signup", { ...signup, email: "PUBLIC@example.test" }, "", 409);
await account("/auth/signup", { ...signup, email: "owner@example.test" }, "", 409);
await account("/auth/login", { email: signup.email, password: "wrong" }, "", 401);
const signedIn = await account("/auth/login", signup);
assert.equal(
  (await account("/session", undefined, signedIn.cookie)).data.user.id,
  publicSession.user.id,
);
const stored = sqlite
  .prepare("SELECT * FROM credentials WHERE user_id=?")
  .get(publicSession.user.id);
assert.notEqual(stored.password_hash, signup.password);
assert.equal(
  sqlite
    .prepare("SELECT count(*) n FROM sessions WHERE token_hash=?")
    .get(joined.cookie.split("=")[1]).n,
  0,
);
const changed = await account(
  "/auth/password",
  { password: "A new secure passphrase!", currentPassword: signup.password },
  signedIn.cookie,
);
await account("/member", undefined, joined.cookie, 401);
await account("/member", undefined, signedIn.cookie, 401);
await account("/auth/login", signup, "", 401);
const logout = await account("/auth/logout", {}, changed.cookie);
await account("/member", undefined, changed.cookie, 401);
assert.equal(
  (
    await account("/session", undefined, "__Host-slk_signed_out=1", 200, {
      "oai-authenticated-user-id": "owner",
    })
  ).data.signedIn,
  false,
);
assert.ok(
  logout.response.headers.getSetCookie().some((c) => c.startsWith("__Host-slk_signed_out=1")),
);
const legacy = await account("/auth/password", { password: "Owner account passphrase!" }, "", 200, {
  "oai-authenticated-user-id": "owner",
});
assert.equal((await account("/session", undefined, legacy.cookie)).data.user.role, "admin");
await account("/admin", undefined, legacy.cookie);
const expired = await account("/auth/signup", { ...signup, email: "expired@example.test" });
const expiredId = (await account("/session", undefined, expired.cookie)).data.user.id;
sqlite.prepare("UPDATE sessions SET expires_at=0 WHERE user_id=?").run(expiredId);
await account("/member", undefined, expired.cookie, 401);
for (let i = 0; i < 10; i++)
  await account("/auth/login", { email: "rate@example.test", password: "wrong" }, "", 401);
await account("/auth/login", { email: "rate@example.test", password: "wrong" }, "", 429);
sqlite.prepare("UPDATE auth_attempts SET expires_at=0").run();
await account("/auth/login", { email: "rate@example.test", password: "wrong" }, "", 401);
console.log(
  "PASS: public signup/login, private cookies, inactive membership, admin isolation, duplicate/legacy email protection, password rotation, revocation, expiry, sign-out and rate limits.",
);
// Production hardening regressions run against an isolated database only.
const forged = await handleAPI(
  new Request("https://slk.test/api/admin", { headers: { "oai-authenticated-user-id": "owner" } }),
  { ...env, TRUST_SITES_IDENTITY: undefined },
);
assert.equal(forged.status, 401, "standalone deployment must not trust supplied identity headers");
await account(
  "/admin/password-reset",
  { id: publicSession.user.id, identityVerified: true },
  joined.cookie,
  401,
);
await call(
  "/admin/password-reset",
  { id: publicSession.user.id, identityVerified: false },
  "owner",
  400,
);
const recovery = await call(
  "/admin/password-reset",
  { id: publicSession.user.id, identityVerified: true },
  "owner",
);
const dbReset = sqlite
  .prepare("SELECT * FROM password_resets WHERE user_id=?")
  .get(publicSession.user.id);
assert.notEqual(dbReset.token_hash, recovery.token);
assert.ok(recovery.expiresAt > Date.now());
const recoveredPassword = "Recovered secure member passphrase!";
await account("/auth/reset", { token: recovery.token, password: recoveredPassword });
await account("/auth/reset", { token: recovery.token, password: recoveredPassword }, "", 400);
assert.equal(
  (await account("/auth/login", { email: signup.email, password: recoveredPassword })).data.ok,
  true,
);
const expiredRecovery = await call(
  "/admin/password-reset",
  { id: publicSession.user.id, identityVerified: true },
  "owner",
);
sqlite
  .prepare("UPDATE password_resets SET expires_at=0 WHERE user_id=?")
  .run(publicSession.user.id);
await account(
  "/auth/reset",
  { token: expiredRecovery.token, password: recoveredPassword },
  "",
  400,
);
await call(
  "/admin/entity",
  { ...originalOffer, id: "demo-blocked", demo: true, status: "published" },
  "owner",
  400,
);
for (const changes of [
  { date: "2026-02-30" },
  { expires: "not-a-date" },
  { price: "Infinity" },
  { capacity: -1 },
  { time: "25:99" },
])
  await call("/admin/entity", { ...originalOffer, id: "bad-content", ...changes }, "owner", 400);
await call(
  "/admin/submission",
  { id: submission.id, status: "verified", paymentConfirmed: true },
  "owner",
  409,
);
for (const [body, status] of [
  ["{", 400],
  ["null", 400],
  ["[]", 400],
  ["x".repeat(33000), 413],
]) {
  const r = await handleAPI(
    new Request("https://slk.test/api/auth/signup", {
      method: "POST",
      headers: { origin: "https://slk.test", "content-type": "application/json" },
      body,
    }),
    env,
  );
  assert.equal(r.status, status, "bounded JSON body validation");
}
const wrongMethod = await handleAPI(
  new Request("https://slk.test/api/admin/member", {
    method: "GET",
    headers: { "oai-authenticated-user-id": "owner" },
  }),
  env,
);
assert.equal(wrongMethod.status, 405);
sqlite.prepare("DELETE FROM auth_attempts").run();
await call(
  "/submissions",
  { kind: "contact", name: "Another visitor", email: "visitor@example.test", consent: true },
  null,
  429,
);
await call("/submissions", {
  kind: "contact",
  name: "Different visitor",
  email: "distinct@example.test",
  consent: true,
});
console.log(
  "PASS: identity spoofing blocked by default, one-use/expiring password recovery, malformed/oversized requests, method checks, anonymous spam limits, demo exclusions, date validation and repeated payment protection.",
);
sqlite.close();
