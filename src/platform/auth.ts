// Application accounts use the same server-side membership and admin checks as legacy accounts.
export const SESSION_COOKIE = "__Host-slk_session";
export const SIGNED_OUT_COOKIE = "__Host-slk_signed_out";
export const SESSION_SECONDS = 60 * 60 * 24 * 30;
export const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
export const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
export async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  // 100,000 is the Workers WebCrypto per-operation PBKDF2 iteration limit.
  const bits = await crypto.subtle.deriveBits({name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 100000, hash: "SHA-256"}, key, 256);
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, "0")).join("");
}
export function equalHash(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
export const cookie = (name: string, value: string, maxAge = SESSION_SECONDS) => `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
export function readCookie(request: Request, name: string) {
  return (request.headers.get("cookie") || "").split(";").map(s => s.trim()).find(s => s.startsWith(name + "="))?.slice(name.length + 1) || "";
}
