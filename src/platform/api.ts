import { defaultSettings, initialEntities } from "./seed";
import {
  SESSION_COOKIE,
  SIGNED_OUT_COOKIE,
  SESSION_SECONDS,
  randomToken,
  digest,
  passwordHash,
  equalHash,
  cookie,
  readCookie,
} from "./auth";
type Env = { DB: any; BUCKET: any; ADMIN_BOOTSTRAP_KEY?: string };
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const active = (u: any) =>
  u && !u.disabled && u.membership === "active" && (!u.expires || u.expires >= now().slice(0, 10));
const fail = (message: string, status = 400): never => {
  throw Object.assign(new Error(message), { status });
};
const clean = (v: any, max = 5000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const kinds = ["events", "vouchers", "businesses", "sponsors"];
export async function handleAPI(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname.replace("/api", "");
  try {
    if (!env.DB)
      return json({ error: "The database is not available yet. Please try again shortly." }, 503);
    const db = env.DB;
    const all = async (sql: string, ...v: any[]) =>
      (
        await db
          .prepare(sql)
          .bind(...v)
          .all()
      ).results;
    const one = async (sql: string, ...v: any[]) =>
      db
        .prepare(sql)
        .bind(...v)
        .first();
    const run = async (sql: string, ...v: any[]) =>
      db
        .prepare(sql)
        .bind(...v)
        .run();
    const log = async (userId: string, action: string, target: string) =>
      run(
        "INSERT INTO audit(id,user_id,action,target,created_at) VALUES(?,?,?,?,?)",
        uid(),
        userId,
        action,
        target,
        now(),
      );
    const initialized = await one("SELECT id FROM settings WHERE id='main'");
    if (!initialized) {
      await db.batch([
        ...initialEntities.map((e) =>
          db
            .prepare("INSERT OR IGNORE INTO entities(id,kind,data,updated_at) VALUES(?,?,?,?)")
            .bind(e.id, e.kind, JSON.stringify(e), now()),
        ),
        db
          .prepare("INSERT OR IGNORE INTO settings(id,data) VALUES('main',?)")
          .bind(JSON.stringify(defaultSettings)),
      ]);
    }
    const srow = await one("SELECT data FROM settings WHERE id='main'");
    const settings = srow ? { ...defaultSettings, ...JSON.parse(srow.data) } : defaultSettings;
    const rows = await all("SELECT id,kind,data FROM entities");
    const entities = rows.map((r: any) => ({ ...JSON.parse(r.data), id: r.id, kind: r.kind }));
    // Seed examples are read-only until an admin explicitly imports them.
    const catalog = entities;
    const sessionToken = readCookie(request, SESSION_COOKIE);
    const savedSession = sessionToken
      ? await one(
          "SELECT user_id FROM sessions WHERE token_hash=? AND expires_at>?",
          await digest(sessionToken),
          Date.now(),
        )
      : null;
    // An explicit app session/sign-out overrides any legacy platform identity.
    const identity =
      savedSession?.user_id ||
      (!sessionToken && !readCookie(request, SIGNED_OUT_COOKIE)
        ? request.headers.get("oai-authenticated-user-id")
        : null);
    let user = identity ? await one("SELECT * FROM users WHERE id=?", identity) : null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const origin = request.headers.get("origin");
      if (!origin || origin !== new URL(request.url).origin)
        fail("This request could not be verified.", 403);
      if (Number(request.headers.get("content-length") || 0) > 6000000)
        fail("The file is too large.", 413);
    }
    const mustUser = () => {
      if (!identity || !user) fail("Please sign in to continue.", 401);
      if (user.disabled) fail("Your account is paused. Please contact the team.", 403);
      return user;
    };
    const mustAdmin = () => {
      mustUser();
      if (user.role !== "admin") fail("Administrator access is required.", 403);
    };
    const claimView = (c: any, owner: any) => {
      const voucher = catalog.find((e: any) => e.id === c.voucher_id && e.kind === "vouchers");
      const reason =
        c.status !== "available"
          ? "This voucher has already been redeemed."
          : !active(owner)
            ? "An active membership is required to redeem."
            : !voucher || voucher.status !== "published"
              ? "This offer is no longer available."
              : voucher.expires && voucher.expires < now().slice(0, 10)
                ? "This voucher has expired."
                : "";
      return {
        ...c,
        receipt: c.receipt ? JSON.parse(c.receipt) : null,
        voucher: voucher || null,
        redeemable: !reason,
        invalidReason: reason,
      };
    };
    const redeemClaim = async (c: any, owner: any) => {
      const view = claimView(c, owner);
      if (!view.redeemable) fail(view.invalidReason, 409);
      const timestamp = now();
      const receipt = {
        title: view.voucher.title,
        business: view.voucher.business,
        benefit: view.voucher.benefit,
        memberName: owner.name,
        code: c.code,
        redeemedAt: timestamp,
        demo: !!view.voucher.demo,
      };
      const result = await run(
        "UPDATE claims SET status='redeemed',redeemed_at=?,receipt=? WHERE id=? AND user_id=? AND status='available' AND EXISTS(SELECT 1 FROM users WHERE id=? AND disabled=0 AND membership='active' AND (expires IS NULL OR expires>=?)) AND EXISTS(SELECT 1 FROM entities WHERE id=? AND json_extract(data,'$.status')='published' AND (coalesce(json_extract(data,'$.expires'),'')='' OR json_extract(data,'$.expires')>=?))",
        timestamp,
        JSON.stringify(receipt),
        c.id,
        owner.id,
        owner.id,
        timestamp.slice(0, 10),
        c.voucher_id,
        timestamp.slice(0, 10),
      );
      if (!result.meta.changes)
        fail("This voucher has already been redeemed or is no longer valid.", 409);
      await log(user.id, "voucher.redeemed", c.id);
      return {
        ok: true,
        claim: claimView(
          { ...c, status: "redeemed", redeemed_at: timestamp, receipt: JSON.stringify(receipt) },
          owner,
        ),
        serverTime: now(),
      };
    };
    if (path === "/wallet" && request.method === "GET") {
      mustUser();
      return json({
        claims: (
          await all("SELECT * FROM claims WHERE user_id=? ORDER BY created_at DESC", user.id)
        ).map((c: any) => claimView(c, user)),
        serverTime: now(),
      });
    }
    if (path === "/redeem" && request.method === "POST") {
      mustUser();
      const b = (await request.json()) as any;
      if (b.confirm !== true)
        fail("Confirm that you are with staff before redeeming this voucher.");
      const c = await one(
        "SELECT * FROM claims WHERE id=? AND user_id=?",
        clean(b.id, 100),
        user.id,
      );
      if (!c) fail("Voucher not found in your wallet.", 404);
      return json(await redeemClaim(c, user));
    }
    if (path === "/session")
      return json({
        user: user
          ? {
              ...user,
              active: active(user),
              hasPassword: !!(await one(
                "SELECT user_id FROM credentials WHERE user_id=?",
                user.id,
              )),
            }
          : null,
        signedIn: !!identity,
        adminConfigured: !!(await one("SELECT id FROM users WHERE role='admin' LIMIT 1")),
      });
    const issueSession = async (userId: string) => {
      const token = randomToken();
      await run(
        "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
        await digest(token),
        userId,
        Date.now() + SESSION_SECONDS * 1000,
      );
      const response = json({ ok: true });
      response.headers.append("Set-Cookie", cookie(SESSION_COOKIE, token));
      response.headers.append("Set-Cookie", cookie(SIGNED_OUT_COOKIE, "", 0));
      return response;
    };
    if (path === "/auth/legacy" && request.method === "POST") {
      const form = await request.formData();
      const returnTo = form.get("returnTo") === "/admin" ? "/admin" : "/member?tab=profile";
      if (sessionToken)
        await run("DELETE FROM sessions WHERE token_hash=?", await digest(sessionToken));
      const response = new Response(null, {
        status: 303,
        headers: {
          Location: "/signin-with-chatgpt?return_to=" + encodeURIComponent(returnTo),
          "Cache-Control": "no-store",
        },
      });
      response.headers.append("Set-Cookie", cookie(SESSION_COOKIE, "", 0));
      response.headers.append("Set-Cookie", cookie(SIGNED_OUT_COOKIE, "", 0));
      return response;
    }
    if (path === "/auth/logout" && request.method === "POST") {
      if (sessionToken)
        await run("DELETE FROM sessions WHERE token_hash=?", await digest(sessionToken));
      const response = json({ ok: true });
      response.headers.append("Set-Cookie", cookie(SESSION_COOKIE, "", 0));
      response.headers.append("Set-Cookie", cookie(SIGNED_OUT_COOKIE, "1"));
      return response;
    }
    if (
      ["/auth/signup", "/auth/login", "/auth/password"].includes(path) &&
      request.method === "POST"
    ) {
      if (path === "/auth/password") mustUser();
      const b = (await request.json()) as any;
      const email = clean(path === "/auth/password" ? user.email : b.email, 254).toLowerCase();
      const password = typeof b.password === "string" ? b.password : "";
      if (
        b.currentPassword &&
        (typeof b.currentPassword !== "string" || b.currentPassword.length > 256)
      )
        fail("Your current password is incorrect.", 401);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Enter a valid email address.");
      if (password.length > 256 || !password.length)
        fail("Enter a password of up to 256 characters.");
      const timestamp = Date.now();
      // Atomic fixed-window limits: email and, when provided by the edge, client IP.
      const subjects = ["email:" + email];
      const ip = request.headers.get("cf-connecting-ip");
      if (ip) subjects.push("ip:" + ip);
      for (const subject of subjects) {
        const key = await digest(subject);
        const attempt = await one(
          "INSERT INTO auth_attempts(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END RETURNING count",
          key,
          timestamp + 900000,
          timestamp,
          timestamp,
          timestamp + 900000,
        );
        if (attempt.count > (subject.startsWith("ip:") ? 60 : 10))
          fail("Too many attempts. Please try again in 15 minutes.", 429);
      }
      const existing = await one("SELECT * FROM credentials WHERE email=?", email);
      if (path === "/auth/login") {
        const hash = await passwordHash(
          password,
          existing?.salt || "slkd-unknown-account-timing-salt",
        );
        if (!existing || !equalHash(hash, existing.password_hash))
          fail("The email or password is incorrect.", 401);
        const account = await one("SELECT * FROM users WHERE id=?", existing.user_id);
        if (!account || account.disabled)
          fail("Your account is paused. Please contact the team.", 403);
        return issueSession(account.id);
      }
      if (password.length < 12) fail("Use a password with at least 12 characters.");
      const salt = randomToken();
      const hash = await passwordHash(password, salt);
      if (path === "/auth/signup") {
        const name = clean(b.name, 120);
        if (name.length < 2 || b.consent !== true)
          fail("Enter your full name and accept the privacy notice.");
        // Never attach an unverified signup to an existing member or administrator by email.
        if (existing || (await one("SELECT id FROM users WHERE lower(email)=? LIMIT 1", email)))
          fail("An account already uses this email. Sign in, or contact the team for help.", 409);
        const userId = uid();
        try {
          await db.batch([
            db
              .prepare("INSERT INTO users(id,email,name,created_at) VALUES(?,?,?,?)")
              .bind(userId, email, name, now()),
            db
              .prepare("INSERT INTO credentials(user_id,email,salt,password_hash) VALUES(?,?,?,?)")
              .bind(userId, email, salt, hash),
          ]);
        } catch (e: any) {
          if (/UNIQUE/.test(e.message))
            fail("An account already uses this email. Please sign in.", 409);
          throw e;
        }
        return issueSession(userId);
      }
      const own = await one("SELECT * FROM credentials WHERE user_id=?", user.id);
      if (
        own &&
        (!b.currentPassword ||
          !equalHash(await passwordHash(String(b.currentPassword), own.salt), own.password_hash))
      )
        fail("Your current password is incorrect.", 401);
      if (existing && existing.user_id !== user.id)
        fail("This email is already in use. Please contact the team.", 409);
      await db.batch([
        db
          .prepare(
            "INSERT INTO credentials(user_id,email,salt,password_hash) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET salt=excluded.salt,password_hash=excluded.password_hash",
          )
          .bind(user.id, email, salt, hash),
        db.prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id),
      ]);
      await log(user.id, "account.password", user.id);
      return issueSession(user.id);
    }
    if (path === "/public")
      return json({
        settings: {
          headline: settings.headline,
          intro: settings.intro,
          phone: settings.phone,
          email: settings.email,
          membershipPrice: settings.membershipPrice,
          donationIntro: settings.donationIntro,
        },
        entities: catalog
          .filter((e: any) => e.status === "published")
          .map((e: any) => {
            if (e.kind === "businesses" && !e.publicContact && !active(user)) {
              const { email, phone, ...rest } = e;
              return rest;
            }
            return e;
          }),
      });
    if (path === "/signin" && request.method === "POST") {
      if (!identity) fail("Please sign in with ChatGPT first.", 401);
      const raw = request.headers.get("oai-authenticated-user-full-name") || "";
      let name = "";
      try {
        name = decodeURIComponent(raw);
      } catch {}
      await run(
        "INSERT OR IGNORE INTO users(id,email,name,created_at) VALUES(?,?,?,?)",
        identity,
        request.headers.get("oai-authenticated-user-email") || "",
        name || "Community member",
        now(),
      );
      return json({ ok: true });
    }
    if (path === "/bootstrap" && request.method === "POST") {
      mustUser();
      const b = (await request.json()) as any;
      if (!env.ADMIN_BOOTSTRAP_KEY || b.key !== env.ADMIN_BOOTSTRAP_KEY)
        fail("The setup code is incorrect.", 403);
      const exists = await one("SELECT id FROM users WHERE role='admin' LIMIT 1");
      if (exists && exists.id !== user.id)
        fail("An administrator has already been appointed.", 409);
      await run(
        "UPDATE users SET role='admin' WHERE id=? AND NOT EXISTS(SELECT 1 FROM users WHERE role='admin')",
        user.id,
      );
      await log(user.id, "admin.setup", user.id);
      return json({ ok: true });
    }
    if (path === "/member" && request.method === "GET") {
      mustUser();
      return json({
        user: { ...user, active: active(user) },
        claims: (
          await all("SELECT * FROM claims WHERE user_id=? ORDER BY created_at DESC", user.id)
        ).map((c: any) => claimView(c, user)),
        registrations: await all("SELECT * FROM registrations WHERE user_id=?", user.id),
        businesses: catalog.filter((e: any) => e.kind === "businesses" && e.ownerId === user.id),
        submissions: await all(
          "SELECT * FROM submissions WHERE user_id=? ORDER BY created_at DESC",
          user.id,
        ),
        paymentInstructions: {
          bankName: settings.bankName,
          bankAccount: settings.bankAccount,
          bankReference: settings.bankReference,
        },
      });
    }
    if (path === "/profile" && request.method === "POST") {
      mustUser();
      const b = (await request.json()) as any;
      if (!clean(b.name, 120)) fail("Please enter your name.");
      await run(
        "UPDATE users SET name=?,phone=? WHERE id=?",
        clean(b.name, 120),
        clean(b.phone, 40),
        user.id,
      );
      return json({ ok: true });
    }
    if (path === "/business" && request.method === "POST") {
      mustUser();
      if (!active(user)) fail("An active paid membership is required to list your business.", 403);
      const b = (await request.json()) as any;
      const own = catalog.find((e: any) => e.kind === "businesses" && e.ownerId === user.id);
      if (!clean(b.title, 150)) fail("Please enter your business name.");
      const data = {
        id: own?.id || uid(),
        kind: "businesses",
        title: clean(b.title, 150),
        description: clean(b.description, 3000),
        category: clean(b.category, 100),
        phone: clean(b.phone, 50),
        email: clean(b.email, 200),
        website: safeURL(b.website),
        image: safeImage(b.image),
        location: clean(b.location, 150),
        publicContact: b.publicContact === true,
        ownerId: user.id,
        status: "pending",
      };
      await run(
        "INSERT INTO entities(id,kind,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at",
        data.id,
        data.kind,
        JSON.stringify(data),
        now(),
      );
      await log(user.id, "business.submitted", data.id);
      return json({ ok: true, message: "Your business profile has been sent for review." });
    }
    if (path === "/claim" && request.method === "POST") {
      mustUser();
      if (!active(user)) fail("Activate your paid membership before claiming vouchers.", 403);
      const b = (await request.json()) as any;
      const v = catalog.find(
        (e: any) => e.id === b.id && e.kind === "vouchers" && e.status === "published",
      );
      if (!v) fail("This voucher is no longer available.", 404);
      if (v.expires && v.expires < now().slice(0, 10)) fail("This voucher has expired.");
      const id = uid(),
        code = "SLK-" + uid().replace(/-/g, "").slice(0, 12).toUpperCase();
      const result = await run(
        "INSERT OR IGNORE INTO claims(id,user_id,voucher_id,code,created_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM claims WHERE voucher_id=?) < ?",
        id,
        user.id,
        v.id,
        code,
        now(),
        v.id,
        Number(v.limit) || 999999,
      );
      if (!result.meta.changes)
        fail("You have already claimed this voucher, or all vouchers have been claimed.", 409);
      await log(user.id, "voucher.claimed", v.id);
      return json({ ok: true, id, code });
    }
    if (path === "/register" && request.method === "POST") {
      mustUser();
      const b = (await request.json()) as any;
      const e = catalog.find(
        (e: any) => e.id === b.id && e.kind === "events" && e.status === "published",
      );
      if (!e) fail("This event is unavailable.", 404);
      if (e.date && e.date < now().slice(0, 10)) fail("Registration has closed.");
      const r = await run(
        "INSERT OR IGNORE INTO registrations(id,user_id,event_id,created_at) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM registrations WHERE event_id=?) < ?",
        uid(),
        user.id,
        e.id,
        now(),
        e.id,
        Number(e.capacity) || 999999,
      );
      if (!r.meta.changes) fail("You are already registered, or this event is full.", 409);
      return json({ ok: true });
    }
    if (path === "/submissions" && request.method === "POST") {
      const b = (await request.json()) as any;
      if (!["membership", "donation", "sponsor", "contact"].includes(b.kind))
        fail("Choose a valid enquiry type.");
      if (b.kind === "membership") mustUser();
      if (!clean(b.name, 120) || !/^\S+@\S+\.\S+$/.test(clean(b.email, 200)))
        fail("Please enter your name and a valid email address.");
      if (b.consent !== true) fail("Please agree to the use of your details for this request.");
      if (b.kind === "membership" && active(user)) fail("Your membership is already active.");
      const existing = await one(
        "SELECT id FROM submissions WHERE kind=? AND user_id=? AND status='new' AND created_at > ?",
        b.kind,
        user?.id || "",
        new Date(Date.now() - 60000).toISOString(),
      );
      if (existing)
        fail("Your request has already been received. Please wait before submitting again.", 429);
      const id = uid();
      const data = {
        name: clean(b.name, 120),
        email: clean(b.email, 200),
        phone: clean(b.phone, 40),
        message: clean(b.message),
        company: clean(b.company, 150),
        reference: clean(b.reference, 120),
        proof: safeImage(b.proof),
        amount:
          b.kind === "membership"
            ? Number(settings.membershipPrice)
            : Math.max(0, Math.min(10000000, Number(b.amount) || 0)),
        consent: true,
      };
      if (b.kind === "donation" && data.amount < 1) fail("Please enter a donation amount.");
      await run(
        "INSERT INTO submissions(id,kind,user_id,data,created_at) VALUES(?,?,?,?,?)",
        id,
        b.kind,
        user?.id || null,
        JSON.stringify(data),
        now(),
      );
      if (b.kind === "membership")
        await run(
          "UPDATE users SET membership='pending' WHERE id=? AND membership!='active'",
          user.id,
        );
      return json({
        ok: true,
        id,
        message:
          b.kind === "membership"
            ? "Your membership request is pending payment verification."
            : b.kind === "donation"
              ? "Your donation pledge is saved. The team will arrange payment with you."
              : "Your request has been sent to the team.",
      });
    }
    if (path === "/upload" && request.method === "POST") {
      mustUser();
      if (!env.BUCKET) fail("Image uploads are temporarily unavailable.", 503);
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return json({ error: "Please choose an image." }, 400);
      if (file.size > 5000000) fail("Please choose an image smaller than 5 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let type = "";
      if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) type = "image/jpeg";
      if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71)
        type = "image/png";
      if (
        String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
      )
        type = "image/webp";
      if (!type) fail("Please upload a JPEG, PNG or WebP image.");
      const key = "uploads/" + uid();
      await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: type } });
      return json({ url: "/api/media/" + key });
    }
    if (path.startsWith("/media/uploads/") && request.method === "GET") {
      const key = path.slice("/media/".length);
      const obj = await env.BUCKET?.get(key);
      if (!obj) fail("Image not found.", 404);
      return new Response(obj.body, {
        headers: {
          "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
          "Cache-Control": "public,max-age=86400",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (path.startsWith("/admin")) {
      mustAdmin();
      if (path === "/admin" && request.method === "GET")
        return json({
          entities: catalog,
          users: await all("SELECT * FROM users ORDER BY created_at DESC"),
          submissions: await all("SELECT * FROM submissions ORDER BY created_at DESC"),
          claims: await all("SELECT * FROM claims ORDER BY created_at DESC"),
          registrations: await all("SELECT * FROM registrations ORDER BY created_at DESC"),
          audit: await all("SELECT * FROM audit ORDER BY created_at DESC LIMIT 100"),
          settings,
        });
      const b = (await request.json()) as any;
      if (path === "/admin/seed") {
        await db.batch(
          initialEntities.map((e) =>
            db
              .prepare("INSERT OR IGNORE INTO entities(id,kind,data,updated_at) VALUES(?,?,?,?)")
              .bind(e.id, e.kind, JSON.stringify(e), now()),
          ),
        );
        await log(user.id, "examples.imported", "catalog");
        return json({ ok: true });
      }
      if (path === "/admin/entity") {
        if (!kinds.includes(b.kind) || !clean(b.title, 150))
          fail("A title and valid content type are required.");
        if (!["published", "draft", "pending", "archived"].includes(b.status))
          fail("Choose a valid publishing status.");
        const id = b.id || uid();
        const data = {
          id,
          kind: b.kind,
          title: clean(b.title, 150),
          description: clean(b.description),
          category: clean(b.category, 100),
          image: safeImage(b.image),
          location: clean(b.location, 200),
          date: clean(b.date, 10),
          time: clean(b.time, 10),
          capacity: Math.max(1, Number(b.capacity) || 100),
          price: Math.max(0, Number(b.price) || 0),
          benefit: clean(b.benefit, 100),
          business: clean(b.business, 150),
          terms: clean(b.terms, 3000),
          expires: clean(b.expires, 10),
          limit: Math.max(1, Number(b.limit) || 100),
          demo: b.demo === true,
          status: b.status,
          phone: clean(b.phone, 50),
          email: clean(b.email, 200),
          website: safeURL(b.website),
          publicContact: b.publicContact === true,
          ownerId: clean(b.ownerId, 200),
        };
        await run(
          "INSERT INTO entities(id,kind,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at",
          id,
          b.kind,
          JSON.stringify(data),
          now(),
        );
        await log(user.id, "content.saved", id);
        return json({ ok: true });
      }
      if (path === "/admin/delete") {
        const e = catalog.find((e: any) => e.id === b.id);
        if (!e) fail("Content not found.", 404);
        // Archive content with a history so existing claims and registrations remain traceable.
        e.status = "archived";
        await run(
          "UPDATE entities SET data=?,updated_at=? WHERE id=?",
          JSON.stringify(e),
          now(),
          e.id,
        );
        await log(user.id, "content.archived", e.id);
        return json({ ok: true });
      }
      if (path === "/admin/member") {
        if (b.id === user.id && b.disabled) fail("You cannot pause your own admin account.");
        if (!["inactive", "pending", "active"].includes(b.membership))
          fail("Choose a valid membership status.");
        const target = await one("SELECT id FROM users WHERE id=?", b.id);
        if (!target) fail("Member not found.", 404);
        await run(
          "UPDATE users SET membership=?,expires=?,disabled=? WHERE id=?",
          b.membership,
          clean(b.expires, 10) || null,
          b.disabled ? 1 : 0,
          b.id,
        );
        await log(user.id, "membership.updated", b.id);
        return json({ ok: true });
      }
      if (path === "/admin/submission") {
        if (!["new", "contacted", "verified", "closed"].includes(b.status))
          fail("Choose a valid request status.");
        const sub = await one("SELECT * FROM submissions WHERE id=?", b.id);
        if (!sub) fail("Request not found.", 404);
        if (b.status === "verified" && sub.kind === "membership" && sub.user_id) {
          if (!b.paymentConfirmed)
            fail("Confirm that the payment has been independently verified.");
          const expiry = new Date();
          expiry.setFullYear(expiry.getFullYear() + 1);
          await db.batch([
            db.prepare("UPDATE submissions SET status=? WHERE id=?").bind(b.status, b.id),
            db
              .prepare("UPDATE users SET membership='active',expires=? WHERE id=?")
              .bind(expiry.toISOString().slice(0, 10), sub.user_id),
          ]);
        } else await run("UPDATE submissions SET status=? WHERE id=?", b.status, b.id);
        await log(user.id, "request." + b.status, b.id);
        return json({ ok: true });
      }
      if (path === "/admin/redeem") {
        const c = await one("SELECT * FROM claims WHERE code=?", clean(b.code, 30).toUpperCase());
        if (!c) fail("Voucher code not found.", 404);
        const member = await one("SELECT * FROM users WHERE id=?", c.user_id);
        return json(await redeemClaim(c, member));
      }
      if (path === "/admin/settings") {
        const next = {
          headline: clean(b.headline, 150),
          intro: clean(b.intro, 1000),
          phone: clean(b.phone, 50),
          email: clean(b.email, 200),
          membershipPrice: Math.max(1, Number(b.membershipPrice) || 240),
          bankName: clean(b.bankName, 100),
          bankAccount: clean(b.bankAccount, 100),
          bankReference: clean(b.bankReference, 100),
          donationIntro: clean(b.donationIntro, 1000),
        };
        await run(
          "INSERT INTO settings(id,data) VALUES('main',?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
          JSON.stringify(next),
        );
        await log(user.id, "settings.saved", "main");
        return json({ ok: true });
      }
    }
    return json({ error: "Page not found." }, 404);
  } catch (e: any) {
    if (!e.status) console.error("SLK request failed", e);
    return json(
      { error: e.status ? e.message : "We could not complete this request. Please try again." },
      e.status || 500,
    );
  }
}
function safeURL(v: any) {
  const s = clean(v, 1000);
  if (!s) return "";
  try {
    const u = new URL(s);
    return ["https:", "http:"].includes(u.protocol) ? s : "";
  } catch {
    return "";
  }
}
function safeImage(v: any) {
  const s = clean(v, 1000);
  return /^\/(?!\/)[A-Za-z0-9_./-]+$/.test(s) ? s : safeURL(s);
}
