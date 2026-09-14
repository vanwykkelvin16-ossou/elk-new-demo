import { env as cloudflareEnv } from "cloudflare:workers";
import { handleAPI } from "./platform/api";
import { siteOrigin, publicPages } from "./platform/seo";
import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} - try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

function secure(response: Response, path: string) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Strict-Transport-Security", "max-age=31536000");
  if (!publicPages[path] && path !== "/sitemap.xml" && path !== "/robots.txt")
    headers.set("X-Robots-Tag", "noindex, nofollow");
  if ((headers.get("Content-Type") || "").includes("text/html")) {
    headers.set("Cache-Control", "no-store");
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data: blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com; upgrade-insecure-requests",
    );
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const path = new URL(request.url).pathname;
    try {
      if (path === "/robots.txt")
        return new Response(
          "User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /member\nDisallow: /app\nDisallow: /reset-password\nSitemap: " +
            siteOrigin +
            "/sitemap.xml\n",
          { headers: { "Content-Type": "text/plain; charset=utf-8" } },
        );
      if (path === "/sitemap.xml")
        return new Response(
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
            Object.keys(publicPages)
              .map((p) => "<url><loc>" + siteOrigin + p + "</loc></url>")
              .join("") +
            "</urlset>",
          { headers: { "Content-Type": "application/xml; charset=utf-8" } },
        );
      if (path.startsWith("/api/"))
        return secure(await handleAPI(request, cloudflareEnv as any), path);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return secure(await normalizeCatastrophicSsrResponse(response), path);
    } catch (error) {
      console.error(error);
      return secure(brandedErrorResponse(), path);
    }
  },
};
