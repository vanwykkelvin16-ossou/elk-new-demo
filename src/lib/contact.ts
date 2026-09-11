/**
 * Shared shape for the SLK contact people.
 *
 * `contact_info.contacts` is a JSONB array, so `image_url` needed no schema
 * change — but older rows were saved before it existed. Always read them
 * through `parseContacts` so a missing/!malformed entry can never crash the
 * admin editor or the member-facing list.
 */
export type ContactPerson = {
  name: string;
  phone: string;
  image_url: string | null;
};

export type ContactInfoRow = {
  id: string;
  general_email: string | null;
  contacts: ContactPerson[];
  updated_at?: string | null;
};

export function emptyContact(): ContactPerson {
  return { name: "", phone: "", image_url: null };
}

/** Normalise the JSONB payload into a predictable ContactPerson[]. */
export function parseContacts(raw: unknown): ContactPerson[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const c = entry as Record<string, unknown>;
    return [
      {
        name: typeof c.name === "string" ? c.name : "",
        phone: typeof c.phone === "string" ? c.phone : "",
        image_url: typeof c.image_url === "string" && c.image_url ? c.image_url : null,
      },
    ];
  });
}

/** A contact is worth showing/saving once it has a name or a number. */
export function isMeaningfulContact(c: ContactPerson) {
  return !!(c.name.trim() || c.phone.trim());
}

/** Digits-only tel: href target. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

/** First letter for the avatar fallback. */
export function contactInitial(c: ContactPerson, index: number) {
  const n = c.name.trim();
  return n ? n.charAt(0).toUpperCase() : String(index + 1);
}
