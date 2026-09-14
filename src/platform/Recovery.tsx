import { useEffect, useState } from "react";
import { Copy, KeyRound } from "lucide-react";
import { api } from "./client";
export function PasswordRecovery() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setToken(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  return (
    <section className="page-wrap">
      <div className="form-card narrow">
        <div className="icon-square">
          <KeyRound aria-hidden="true" />
        </div>
        <h1>{done ? "Your password is updated." : "A fresh start for your account."}</h1>
        {done ? (
          <>
            <p>Your previous sessions have been signed out. Use your new password to sign in.</p>
            <a className="button" href="/member">
              Sign in
            </a>
          </>
        ) : (
          <>
            <p>
              Use the one-time recovery link supplied by the SLKD team. It expires after 15 minutes.
            </p>
            <form
              className="form-grid"
              onSubmit={async (event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                if (data.get("password") !== data.get("confirm")) {
                  setMessage("Your passwords do not match.");
                  return;
                }
                setBusy(true);
                setMessage("");
                try {
                  await api("/auth/reset", { token, password: data.get("password") });
                  setDone(true);
                  setToken("");
                } catch (e: any) {
                  setMessage(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                New password
                <input
                  className="recovery-input"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={256}
                  required
                />
              </label>
              <label>
                Confirm new password
                <input
                  className="recovery-input"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={256}
                  required
                />
              </label>
              {message && <p role="alert">{message}</p>}
              <button className="button" type="submit" disabled={busy || !token}>
                {busy ? "Updating…" : "Set new password"}
              </button>
            </form>
            {!token && (
              <p>
                Open your recovery link or <a href="/contact">contact the team for account help</a>.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
export function AdminRecovery({ userId }: { userId: string }) {
  const [verified, setVerified] = useState(false);
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="notice recovery-panel">
      <h3>Account recovery</h3>
      <p>
        Verify the member's identity using contact details already on record. Share the recovery
        link privately with that member.
      </p>
      <label className="check-label">
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
        I have verified this member's identity.
      </label>
      <button
        className="button outline"
        type="button"
        disabled={!verified || busy}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            const r = await api("/admin/password-reset", { id: userId, identityVerified: true });
            setLink(window.location.origin + "/reset-password#" + r.token);
          } catch (e: any) {
            setMessage(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <KeyRound size={16} />
        {busy ? "Creating…" : "Create recovery link"}
      </button>
      {link && (
        <>
          <p>One use only · expires in 15 minutes. A new link replaces the previous one.</p>
          <input
            className="recovery-input"
            aria-label="Private recovery link"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            className="button outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setMessage("Recovery link copied.");
              } catch {
                setMessage("Select the link above and copy it.");
              }
            }}
          >
            <Copy size={16} />
            Copy private link
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
