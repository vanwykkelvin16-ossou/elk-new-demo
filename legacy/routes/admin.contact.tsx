import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/image-uploader";
import { Loader2, Plus, Trash2, Save, Mail, Users, CheckCircle2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeInvalidate } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";
import {
  type ContactInfoRow,
  type ContactPerson,
  emptyContact,
  isMeaningfulContact,
  parseContacts,
} from "@/lib/contact";

export const Route = createFileRoute("/admin/contact")({
  component: AdminContactPage,
});

function AdminContactPage() {
  const qc = useQueryClient();
  useRealtimeInvalidate("contact_info", [["admin-contact-info"]]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-contact-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_info")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as unknown as ContactInfoRow & { contacts: unknown };
      return { ...row, contacts: parseContacts(row.contacts) } as ContactInfoRow;
    },
  });

  const [email, setEmail] = useState("");
  const [contacts, setContacts] = useState<ContactPerson[]>([]);

  useEffect(() => {
    if (data) {
      setEmail(data.general_email ?? "");
      setContacts(data.contacts ?? []);
    }
  }, [data]);

  const patch = (i: number, changes: Partial<ContactPerson>) =>
    setContacts((prev) => prev.map((c, j) => (j === i ? { ...c, ...changes } : c)));

  const save = useMutation({
    mutationFn: async () => {
      // Drop blank rows so members never see an empty card.
      const payloadContacts = contacts.filter(isMeaningfulContact);
      const body = {
        general_email: email.trim() || null,
        contacts: payloadContacts as unknown as Json,
        updated_at: new Date().toISOString(),
      };
      const { error } = data
        ? await supabase.from("contact_info").update(body).eq("id", data.id)
        : await supabase.from("contact_info").insert(body);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact info updated — live for all members");
      qc.invalidateQueries({ queryKey: ["admin-contact-info"] });
      qc.invalidateQueries({ queryKey: ["contact-info"] });
    },
    onError: (e) => toast.error(e.message || "Failed to save"),
  });

  const validContacts = contacts.filter(isMeaningfulContact);

  const isDirty = useMemo(() => {
    const origEmail = data?.general_email ?? "";
    const origContacts = JSON.stringify(data?.contacts ?? []);
    return email !== origEmail || JSON.stringify(contacts) !== origContacts;
  }, [email, contacts, data]);

  const lastUpdated = data?.updated_at
    ? new Date(data.updated_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Never";

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="pb-6 border-b border-border">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
          Settings
        </p>
        <h1
          className="text-3xl font-bold mt-2 tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Contact info
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Who members reach out to — shown in their Profile under “Get in touch”. Changes sync
          instantly.
        </p>
      </header>

      {isLoading ? (
        <div className="py-20 grid place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* General email */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                <Mail className="size-4" />
              </span>
              <h2 className="text-sm font-semibold">General email</h2>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <Label htmlFor="general-email" className="text-xs text-muted-foreground">
                Email address
              </Label>
              <Input
                id="general-email"
                type="email"
                placeholder="info@slkd.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
          </section>

          {/* People */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Users className="size-4" />
                </span>
                <h2 className="text-sm font-semibold truncate">
                  People to contact
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {validContacts.length}
                  </span>
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full shrink-0"
                onClick={() => setContacts([...contacts, emptyContact()])}
              >
                <Plus className="size-4 mr-1.5" /> Add person
              </Button>
            </div>

            {contacts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                <UserCircle2 className="size-10 mx-auto text-muted-foreground/50" />
                <p className="text-sm font-medium mt-3">No contacts yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-5">
                  Add the people members should reach out to.
                </p>
                <Button size="sm" onClick={() => setContacts([emptyContact()])}>
                  <Plus className="size-4 mr-1.5" /> Add first contact
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {contacts.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-2xl border border-border bg-card p-4 flex gap-4 items-start"
                  >
                    {/* Profile photo — members see this next to the name */}
                    <ImageUploader
                      value={c.image_url}
                      onChange={(url) => patch(i, { image_url: url })}
                      folder="contacts"
                      shape="circle"
                      compact
                    />

                    <div className="flex-1 min-w-0 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Name</Label>
                        <Input
                          value={c.name}
                          placeholder="Debbie Yeates"
                          onChange={(e) => patch(i, { name: e.target.value })}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Phone</Label>
                        <Input
                          value={c.phone}
                          placeholder="072 323 4300"
                          onChange={(e) => patch(i, { phone: e.target.value })}
                          className="h-10 tabular-nums"
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full size-9 shrink-0"
                      onClick={() => setContacts(contacts.filter((_, j) => j !== i))}
                      aria-label={`Remove ${c.name || "contact"}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Sticky save bar */}
      {!isLoading && (
        <div className={cn("sticky bottom-4 z-10 transition-all", !isDirty && "opacity-80")}>
          <div className="rounded-2xl border border-border bg-background/90 backdrop-blur-md shadow-lg px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {isDirty ? (
                <>
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <p className="text-sm font-medium leading-tight">Unsaved changes</p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                  <p className="text-sm font-medium leading-tight truncate">
                    Saved
                    <span className="text-muted-foreground font-normal hidden sm:inline">
                      {" "}
                      · {lastUpdated}
                    </span>
                  </p>
                </>
              )}
            </div>
            <Button
              size="lg"
              className="px-6 font-semibold shrink-0"
              onClick={() => save.mutate()}
              disabled={save.isPending || !isDirty}
            >
              {save.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Save &amp; publish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
