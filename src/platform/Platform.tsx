import { useEffect, useState, useRef, createContext, useContext, type ReactNode } from "react";
import { useLocation, useRouter } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowRight,
  Heart,
  Menu,
  X,
  MapPin,
  CalendarDays,
  Ticket,
  Users,
  Building2,
  HandHeart,
  ShieldCheck,
  Search,
  LockKeyhole,
  Check,
  Plus,
  LayoutDashboard,
  LogOut,
  Settings,
  Mail,
  Phone,
  Download,
  ImagePlus,
  Trash2,
  Pencil,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Clock,
  Activity,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Toaster, toast } from "sonner";
import { api, money, dateLabel } from "./client";
import { defaultSettings, initialEntities, eventBanking } from "./seed";
import "./platform.css";
import "./editorial.css";
type Item = Record<string, any>;
const Context = createContext<any>(null);
const useSite = () => useContext(Context);
const publicNav = [
  ["/about", "Our story"],
  ["/events", "Events"],
  ["/businesses", "Our community"],
  ["/vouchers", "Vouchers"],
];
const adminNav = [
  ["overview", "Overview", LayoutDashboard],
  ["events", "Events", CalendarDays],
  ["vouchers", "Vouchers", Ticket],
  ["businesses", "Businesses", Building2],
  ["members", "Members", Users],
  ["requests", "Requests & giving", HandHeart],
  ["redemptions", "Redemptions", ShieldCheck],
  ["sponsors", "Sponsors", Heart],
  ["settings", "Website settings", Settings],
  ["activity", "Activity log", Activity],
] as const;
// Keep document state while navigating; modified clicks and external links stay native.
function AppLink({ href, onClick, children, ...props }: any) {
  const router = useRouter();
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target ||
          props.download !== undefined ||
          !href?.startsWith("/") ||
          href.startsWith("//") ||
          /^\/(sign(in|out)-with-chatgpt|api)\b/.test(href)
        )
          return;
        event.preventDefault();
        void router.navigate({
          href,
          resetScroll: href.split("?")[0] !== router.state.location.pathname,
        });
      }}
    >
      {children}
    </a>
  );
}
function SessionLoading() {
  return (
    <div className="page-wrap" aria-busy="true" role="status">
      <div className="account-loading">
        <Heart size={28} />
        <span>Opening your account…</span>
      </div>
    </div>
  );
}
function Logo() {
  return (
    <AppLink href="/" className="logo" aria-label="So Love Krugersdorp home">
      <img src="/brand-heart.png" alt="" />
      <span>
        so love<span>KRUGERSDORP</span>
      </span>
    </AppLink>
  );
}
function Button({ children, href, className = "", ...props }: any) {
  return href ? (
    <AppLink className={"button " + className} href={href} {...props}>
      {children}
    </AppLink>
  ) : (
    <button className={"button " + className} {...props}>
      {children}
    </button>
  );
}
function Eyebrow({ children }: any) {
  return (
    <div className="eyebrow">
      <span />
      {children}
    </div>
  );
}
const heroPhotos: Record<string, string> = {
  "/about": "about-hero",
  "/events": "events-hero",
  "/businesses": "businesses-hero",
  "/vouchers": "vouchers-hero",
  "/contact": "contact-hero",
};
function EditorialHero({
  eyebrow,
  title,
  description,
  photo,
  children,
  label = "SO LOVE KRUGERSDORP",
  compact = false,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  photo: string;
  children?: ReactNode;
  label?: string;
  compact?: boolean;
}) {
  return (
    <section className={"editorial-hero " + (compact ? "compact" : "")}>
      <img
        className="editorial-hero-image"
        src={"/stock/" + photo + ".webp"}
        srcSet={`/stock/${photo}-mobile.webp 900w, /stock/${photo}.webp 2000w`}
        sizes="(max-width: 700px) 100vw, 94vw"
        alt=""
        fetchPriority="high"
        decoding="async"
      />
      <div className="editorial-hero-shade" />
      <div className="editorial-hero-content">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {children && <div className="editorial-hero-actions">{children}</div>}
      </div>
      <div className="editorial-hero-foot">
        <span>
          <MapPin size={15} />
          {label}
        </span>
        <span>People. Purpose. Possibility.</span>
      </div>
    </section>
  );
}
function PageTitle({ eyebrow, title, description, children }: any) {
  const { path } = useSite();
  const photo = heroPhotos[path];
  if (photo)
    return (
      <EditorialHero
        compact
        eyebrow={eyebrow}
        title={title}
        description={description}
        photo={photo}
      >
        {children}
      </EditorialHero>
    );
  return (
    <div className="page-title">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
function Field({ label, children, ...props }: any) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}
function Empty({
  title = "Nothing here just yet",
  description = "Check back soon for updates.",
  children,
}: any) {
  return (
    <div className="empty">
      <Heart size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
function Badge({ children, tone = "" }: any) {
  return <span className={"badge " + tone}>{children}</span>;
}
function Header() {
  const { session, path, search } = useSite();
  const [open, setOpen] = useState(false);
  const [involvedOpen, setInvolvedOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const involvedRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const involvedButtonRef = useRef<HTMLButtonElement>(null);
  const closeNavigation = () => {
    setOpen(false);
    setInvolvedOpen(false);
  };
  useEffect(() => {
    if (!open && !involvedOpen) return;
    const pointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!headerRef.current?.contains(event.target)) closeNavigation();
      else if (!involvedRef.current?.contains(event.target)) setInvolvedOpen(false);
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (involvedOpen) {
        setInvolvedOpen(false);
        involvedButtonRef.current?.focus();
      } else {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", pointerDown);
    document.addEventListener("keydown", keyDown);
    return () => {
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("keydown", keyDown);
    };
  }, [open, involvedOpen]);
  useEffect(() => {
    setOpen(false);
    setInvolvedOpen(false);
  }, [path, search.toString()]);
  return (
    <>
      <div className="topbar">
        <span>Rooted in faith. Connected by community.</span>
        <AppLink href="/sponsor">
          Make a difference <ArrowUpRight size={13} />
        </AppLink>
      </div>
      <header className="header" ref={headerRef}>
        <Logo />
        <nav
          id="main-navigation"
          className={open ? "nav open" : "nav"}
          aria-label="Main navigation"
        >
          <AppLink href="/" className="mobile-only" onClick={closeNavigation}>
            Home
          </AppLink>
          {publicNav.map(([href, label]) => (
            <AppLink
              key={href}
              href={href}
              className={path === href ? "active" : ""}
              onClick={closeNavigation}
              aria-current={path === href ? "page" : undefined}
            >
              {label}
            </AppLink>
          ))}
          <div
            className="involved-menu"
            ref={involvedRef}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setInvolvedOpen(false);
            }}
          >
            <button
              type="button"
              ref={involvedButtonRef}
              aria-expanded={involvedOpen}
              aria-controls="involved-navigation"
              onClick={() => setInvolvedOpen((value) => !value)}
              className={
                "involved-trigger " +
                (["/membership", "/sponsor", "/donate"].includes(path) ? "active" : "")
              }
            >
              Get involved <ChevronDown size={15} />
            </button>
            <div id="involved-navigation" className="involved-dropdown" hidden={!involvedOpen}>
              {[
                [
                  "/membership",
                  "Become a member",
                  "Belong, connect and enjoy local benefits",
                  Users,
                ],
                ["/sponsor", "Become a sponsor", "Put your business behind local good", Building2],
                ["/donate", "Give a donation", "Support the community you care about", HandHeart],
              ].map(([href, title, description, Icon]: any) => (
                <AppLink
                  key={href}
                  href={href}
                  onClick={closeNavigation}
                  aria-current={path === href ? "page" : undefined}
                >
                  <span className="involved-icon">
                    <Icon size={20} />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </AppLink>
              ))}
            </div>
          </div>
          <AppLink className="mobile-only" href="/contact" onClick={closeNavigation}>
            Contact us
          </AppLink>
          <AppLink className="mobile-only" href="/member" onClick={closeNavigation}>
            {session.user ? "My account" : "Member login"}
          </AppLink>
          {session.user?.role === "admin" && (
            <AppLink className="mobile-only" href="/admin" onClick={closeNavigation}>
              Admin portal
            </AppLink>
          )}
          <AppLink className="mobile-only nav-privacy" href="/privacy" onClick={closeNavigation}>
            Privacy
          </AppLink>
        </nav>
        <div className="header-actions">
          <AppLink href="/member" className="login-link">
            {session.user ? "My account" : "Member login"}
          </AppLink>
          <Button href="/membership">
            Become a member <ArrowUpRight size={16} />
          </Button>
          <button
            className="menu-toggle"
            ref={menuButtonRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => {
              setOpen(!open);
              setInvolvedOpen(false);
            }}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
function Footer() {
  const { data } = useSite();
  return (
    <footer>
      <div className="footer-top">
        <div>
          <Logo />
          <p>
            More connected. More compassionate.
            <br />
            More possibility for Krugersdorp.
          </p>
        </div>
        <div>
          <h4>Find your place</h4>
          <AppLink href="/about">Our story</AppLink>
          <AppLink href="/events">Community events</AppLink>
          <AppLink href="/businesses">Business directory</AppLink>
          <AppLink href="/vouchers">Member vouchers</AppLink>
        </div>
        <div>
          <h4>Make a difference</h4>
          <AppLink href="/membership">Become a member</AppLink>
          <AppLink href="/sponsor">Become a sponsor</AppLink>
          <AppLink href="/donate">Give a donation</AppLink>
          <AppLink href="/contact">Contact us</AppLink>
        </div>
        <div>
          <h4>Let's connect</h4>
          <AppLink href={"tel:" + data.settings.phone.replace(/\s/g, "")}>
            {data.settings.phone}
          </AppLink>
          <span>Krugersdorp, Gauteng</span>
          <AppLink href="/member">
            Member portal <ArrowUpRight size={14} />
          </AppLink>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} So Love Krugersdorp</span>
        <div>
          <AppLink href="/privacy">Privacy</AppLink>
          <AppLink href="/admin">
            Admin portal <LockKeyhole size={12} />
          </AppLink>
          <span>Made with love, for our town.</span>
        </div>
      </div>
    </footer>
  );
}
function Home() {
  const { data } = useSite();
  const events = data.entities.filter((i: Item) => i.kind === "events").slice(0, 3);
  return (
    <>
      <div className="home-hero-wrap">
        <EditorialHero
          eyebrow="A COMMUNITY WITH HEART"
          title={
            data.settings.headline === defaultSettings.headline ? (
              <>
                <span className="home-title-accent">A little love.</span>
                <br />A stronger Krugersdorp.
              </>
            ) : (
              data.settings.headline
            )
          }
          description={data.settings.intro}
          photo="home-hero"
          label="KRUGERSDORP, SOUTH AFRICA"
        >
          <Button href="/membership">
            Find your place <ArrowUpRight size={18} />
          </Button>
          <AppLink className="hero-secondary" href="/about">
            Meet our community <ArrowRight size={17} />
          </AppLink>
        </EditorialHero>
      </div>
      <div className="values-strip">
        <span>GOOD THINGS START WITH US</span>
        <span>
          <Heart /> Rooted in faith
        </span>
        <span>
          <Users /> Stronger together
        </span>
        <span>
          <Building2 /> Proudly local
        </span>
        <span>
          <HandHeart /> Love in action
        </span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <Eyebrow>THERE'S A PLACE FOR YOU HERE</Eyebrow>
            <h2>
              Small actions.
              <br />A meaningful difference.
            </h2>
          </div>
          <p>
            Show up. Share what you have. Support someone nearby. There are so many ways to be part
            of the story.
          </p>
        </div>
        <div className="action-grid">
          {[
            [
              "01",
              Users,
              "Become a member",
              "Build connections, discover local businesses and unlock member vouchers.",
              "/membership",
            ],
            [
              "02",
              CalendarDays,
              "Come together",
              "Make new connections at a gathering, networking event or community initiative.",
              "/events",
            ],
            [
              "03",
              HandHeart,
              "Give a little love",
              "Support a cause close to home through a donation or sponsorship.",
              "/donate",
            ],
          ].map(([n, Icon, title, desc, href]: any) => (
            <AppLink className="action-card" href={href} key={n}>
              <div className="action-top">
                <Icon />
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <ArrowUpRight className="card-arrow" />
            </AppLink>
          ))}
        </div>
      </section>
      <section className="story-band local-roots" aria-labelledby="local-roots-title">
        <div className="roots-visual">
          <div className="story-image">
            <img
              src="/stock/home-story.webp"
              alt="Volunteers chatting beside a van"
              loading="lazy"
              width={1000}
              height={667}
            />
          </div>
          <div className="roots-photo-note">
            <Heart size={25} aria-hidden="true" />
            <span>
              Small acts.<strong>Lasting connection.</strong>
            </span>
          </div>
        </div>
        <div className="roots-copy">
          <Eyebrow>LOCAL ROOTS. SHARED HOPE.</Eyebrow>
          <h2 id="local-roots-title">
            We believe in
            <br />
            <em>the good in our town.</em>
          </h2>
          <p>
            Born from the vision of Speak Jesus, So Love Krugersdorp brings faith and practical care
            into community life.
          </p>
          <p>
            We connect residents, businesses and ministries around a shared purpose: helping
            Krugersdorp flourish.
          </p>
          <div className="roots-values">
            <span>
              <Users size={17} aria-hidden="true" /> People first
            </span>
            <span>
              <HandHeart size={17} aria-hidden="true" /> Love in action
            </span>
          </div>
          <div className="roots-actions">
            <Button href="/about">
              This is our story <ArrowUpRight size={18} />
            </Button>
            <AppLink href="/membership" className="text-link">
              Be part of it <ArrowRight size={17} />
            </AppLink>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <Eyebrow>MAKE TIME FOR COMMUNITY</Eyebrow>
            <h2>Better when we're together.</h2>
          </div>
          <AppLink className="text-link" href="/events">
            Explore events <ArrowRight size={18} />
          </AppLink>
        </div>
        <div className="cards-grid">
          {events.length ? (
            events.map((e: Item) => <EventCard key={e.id} item={e} />)
          ) : (
            <Empty
              title="The next gathering starts here"
              description="Our team is preparing the community calendar."
            />
          )}
        </div>
      </section>
      <section className="membership-banner">
        <div>
          <Eyebrow>A MEMBERSHIP THAT MEANS MORE</Eyebrow>
          <h2>
            Be part of something
            <br />
            close to home.
          </h2>
          <p>Connections. Local benefits. A shared purpose.</p>
        </div>
        <div>
          <div className="banner-price">
            {money(data.settings.membershipPrice)}
            <span>/ year</span>
          </div>
          <Button href="/membership" className="white">
            Join the community <ArrowUpRight size={18} />
          </Button>
        </div>
      </section>
    </>
  );
}
function EventCard({ item }: any) {
  return (
    <AppLink href={"/events?event=" + item.id} className="event-card">
      <div className="card-photo">
        <img src={item.image || "/community/gathering.jpg"} alt={item.title} loading="lazy" />
        <Badge>{item.category || "Community"}</Badge>
      </div>
      <div className="card-body">
        <div className="date-meta">
          <CalendarDays size={15} />
          {dateLabel(item.date)}
        </div>
        <h3>{item.title}</h3>
        <p>
          <MapPin size={14} />
          {item.location || "Krugersdorp"}
        </p>
        <div className="card-foot">
          <span>{item.date ? "View event" : "Register your interest"}</span>
          <ArrowUpRight size={20} />
        </div>
      </div>
    </AppLink>
  );
}
function Events() {
  const { data, session, search } = useSite();
  const router = useRouter();
  const [filter, setFilter] = useState("All events");
  const items = data.entities.filter((i: Item) => i.kind === "events");
  const selected = items.find((i: Item) => i.id === search.get("event"));
  return (
    <div className="page-wrap">
      <PageTitle
        eyebrow="MEET. CONNECT. MAKE A DIFFERENCE."
        title="Good company. Great purpose."
        description="Find your next opportunity to connect with our community."
      />
      <div className="filters">
        {["All events", "Business & networking", "Community & outreach", "Faith & fellowship"].map(
          (f) => (
            <button key={f} onClick={() => setFilter(f)} className={filter === f ? "selected" : ""}>
              {f}
            </button>
          ),
        )}
      </div>
      <div className="cards-grid">
        {items
          .filter((i: Item) => filter === "All events" || i.category === filter)
          .map((i: Item) => (
            <EventCard key={i.id} item={i} />
          ))}
        {!items.length && <Empty title="More moments together, coming soon" />}
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) void router.navigate({ href: "/events", resetScroll: false });
        }}
      >
        <DialogContent className="slk-dialog">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>{selected?.category}</DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <img
                className="dialog-image"
                src={selected.image || "/community/gathering.jpg"}
                alt={selected.title}
              />
              <div className="detail-meta">
                <span>
                  <CalendarDays />
                  {dateLabel(selected.date)} {selected.time}
                </span>
                <span>
                  <MapPin />
                  {selected.location}
                </span>
              </div>
              <p>{selected.description}</p>
              {session.user ? (
                <EventRegistration
                  key={selected.id + session.user.id}
                  event={selected}
                  user={session.user}
                />
              ) : (
                <div className="event-registration">
                  <h3>Register your interest</h3>
                  <p>
                    Sign in to fill in your contact details, receive your payment reference and
                    track confirmation of your spot.
                  </p>
                  <EventBankDetails amount={Number(selected.price) || 0} />
                  <Button href="/member">
                    Sign in to register <ArrowUpRight size={16} />
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
const registrationLabels: Record<string, string> = {
  pending_payment: "Awaiting payment",
  payment_review: "Payment being verified",
  pending_confirmation: "Interest registered",
  confirmed: "Spot confirmed",
};
function EventBankDetails({ amount, reference }: { amount: number; reference?: string }) {
  return (
    <section className="event-bank" aria-label="Event payment details">
      <div className="event-bank-heading">
        <Building2 size={21} />
        <h3>Pay by EFT</h3>
      </div>
      <dl>
        <div>
          <dt>Bank</dt>
          <dd>{eventBanking.bank}</dd>
        </div>
        <div>
          <dt>Account type</dt>
          <dd>{eventBanking.accountType}</dd>
        </div>
        <div>
          <dt>Account number</dt>
          <dd className="bank-number">{eventBanking.account}</dd>
        </div>
        {amount > 0 && (
          <div>
            <dt>Amount per person</dt>
            <dd>{money(amount)}</dd>
          </div>
        )}
        {reference && (
          <div>
            <dt>Payment reference</dt>
            <dd>{reference}</dd>
          </div>
        )}
      </dl>
      <p>
        {amount > 0
          ? reference
            ? "Use this exact reference for your EFT. Your spot is confirmed after the team verifies payment."
            : "Submit your details below to receive your unique EFT reference. Payment will be verified before your spot is confirmed."
          : "No payment is requested yet. The team will confirm the event arrangements and any contribution before you pay."}
      </p>
    </section>
  );
}
function EventRegistration({ event, user }: { event: Item; user: Item }) {
  const [registration, setRegistration] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentSent, setPaymentSent] = useState(false);
  const load = async () => {
    const result = await api("/registration?event=" + encodeURIComponent(event.id));
    setRegistration(result.registration);
  };
  useEffect(() => {
    let current = true;
    api("/registration?event=" + encodeURIComponent(event.id))
      .then((result) => {
        if (current) setRegistration(result.registration);
      })
      .catch((e) => {
        if (current) setError(e.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [event.id, user.id]);
  if (loading) return <p role="status">Checking your registration…</p>;
  if (registration)
    return (
      <div className="event-registration">
        <Badge tone={registration.status === "confirmed" ? "green" : "amber"}>
          {registrationLabels[registration.status] || registration.status}
        </Badge>
        <h3>
          {registration.status === "confirmed"
            ? "Your spot is confirmed."
            : "Thank you. Your details are saved."}
        </h3>
        <p>
          {registration.status === "confirmed"
            ? "The team has confirmed your attendance. Keep this registration in your member account."
            : registration.status === "payment_review"
              ? "Your EFT has been marked as sent. The team will check the payment before confirming your spot."
              : "Your place is awaiting confirmation from the team."}
        </p>
        <div className="registration-contact">
          <strong>{registration.details.name || user.name}</strong>
          <span>{registration.details.email || user.email}</span>
          <span>{registration.details.phone}</span>
        </div>
        {registration.status !== "confirmed" && (
          <EventBankDetails
            amount={registration.details.amount || 0}
            reference={registration.details.reference}
          />
        )}
        {registration.status === "pending_payment" && (
          <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setBusy(true);
              setError("");
              try {
                await api("/registration-payment", { id: registration.id, paymentSent });
                await load();
                toast.success("Payment sent for verification.");
              } catch (e: any) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="check-label">
              <input
                type="checkbox"
                checked={paymentSent}
                onChange={(e) => setPaymentSent(e.target.checked)}
                required
              />
              <span>I have made the EFT using the reference above.</span>
            </label>
            <Button type="submit" disabled={busy || !paymentSent}>
              {busy ? "Saving…" : "I've paid — notify the team"}
              <Check size={17} />
            </Button>
          </form>
        )}
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}
        <Button href="/member?tab=events" className="outline">
          View my registrations <ArrowRight size={17} />
        </Button>
      </div>
    );
  return (
    <div className="event-registration">
      <h3>Register your interest</h3>
      <p>
        Tell us who is coming. One registration reserves a request for one person; the team confirms
        your spot.
      </p>
      <EventBankDetails amount={Number(event.price) || 0} />
      <form
        className="form-grid two-column"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const values = Object.fromEntries(new FormData(e.currentTarget));
          setBusy(true);
          setError("");
          try {
            const r = await api("/register", {
              ...values,
              id: event.id,
              consent: values.consent === "on",
            });
            setRegistration(r.registration);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label="Full name"
          name="name"
          defaultValue={user.name}
          autoComplete="name"
          required
          maxLength={120}
        />
        <Field
          label="Email address"
          name="email"
          type="email"
          defaultValue={user.email}
          autoComplete="email"
          required
          maxLength={200}
        />
        <Field
          label="Contact number"
          name="phone"
          type="tel"
          defaultValue={user.phone}
          autoComplete="tel"
          required
          minLength={7}
          maxLength={40}
        />
        <Field
          label="Business / organisation (optional)"
          name="business"
          autoComplete="organization"
          maxLength={150}
        />
        <label className="check-label full-width">
          <input type="checkbox" name="consent" required />
          <span>
            I agree that SO LOVE KRUGERSDORP may use these details to manage my event registration.{" "}
            <AppLink href="/privacy" target="_blank" rel="noreferrer">
              Privacy policy
            </AppLink>
            .
          </span>
        </label>
        {error && (
          <p className="auth-error full-width" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="full-width">
          {busy ? "Saving your details…" : "Submit my registration"}
          <ArrowUpRight size={17} />
        </Button>
      </form>
    </div>
  );
}
function EventAttendees({ admin, onUpdate }: { admin: Item; onUpdate: () => void }) {
  const [selected, setSelected] = useState<Item | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="admin-panel event-attendees">
      <div className="panel-heading">
        <h2>Event registrations</h2>
      </div>
      <p className="panel-padding">
        Check each EFT in your bank account before confirming a paid spot.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Attendee</th>
              <th>Event</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {admin.registrations.map((r: Item) => (
              <tr key={r.id}>
                <td>
                  <strong>
                    {r.details.name || admin.users.find((u: Item) => u.id === r.user_id)?.name}
                  </strong>
                  <div>
                    {r.details.email || admin.users.find((u: Item) => u.id === r.user_id)?.email}
                  </div>
                  <div>{r.details.phone}</div>
                  {r.details.business && <small>{r.details.business}</small>}
                </td>
                <td>
                  {admin.entities.find((e: Item) => e.id === r.event_id)?.title || "Archived event"}
                </td>
                <td>
                  {r.details.amount > 0 ? money(r.details.amount) : "No payment requested"}
                  <div>
                    <code>{r.details.reference}</code>
                  </div>
                </td>
                <td>
                  <Badge tone={r.status === "confirmed" ? "green" : "amber"}>
                    {registrationLabels[r.status] || r.status}
                  </Badge>
                </td>
                <td>
                  {r.status !== "confirmed" && (
                    <Button
                      className="small outline"
                      onClick={() => {
                        setSelected(r);
                        setChecked(false);
                        setError("");
                      }}
                    >
                      Review registration
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!admin.registrations.length && (
        <Empty
          title="No registrations yet"
          description="Attendee details and payment references will appear here."
        />
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v && !busy) setSelected(null);
        }}
      >
        <DialogContent className="slk-dialog">
          <DialogHeader>
            <DialogTitle>Confirm this spot</DialogTitle>
            <DialogDescription>{selected?.details.name || "Event attendee"}</DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <p>
                {selected.details.amount > 0
                  ? `Verify ${money(selected.details.amount)} in your FNB account with reference ${selected.details.reference}. A member marking an EFT as sent is not proof that funds arrived.`
                  : "Confirm that this attendee has a place at the event. No payment is currently requested for this registration."}
              </p>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                <span>
                  {selected.details.amount > 0
                    ? "I have verified the EFT in the bank account and confirm this spot."
                    : "I confirm this attendee's spot."}
                </span>
              </label>
              {error && (
                <p role="alert" className="auth-error">
                  {error}
                </p>
              )}
              <Button
                disabled={busy || !checked}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await api("/admin/registration", {
                      id: selected.id,
                      confirm: checked,
                      paymentVerified: selected.details.amount > 0 && checked,
                    });
                    onUpdate();
                    setSelected(null);
                    toast.success("Spot confirmed.");
                  } catch (e: any) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Confirming…" : "Confirm spot"}
                <Check size={17} />
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
function About() {
  return (
    <>
      <section className="page-wrap">
        <PageTitle
          eyebrow="THE HEART BEHIND SO LOVE"
          title="Our town. Our people. Our purpose."
          description="Love becomes powerful when we put it into practice."
        />
        <div className="about-grid">
          <div className="about-photo-pair">
            <img
              src="/stock/about-detail.webp"
              alt="People collaborating around a shared idea"
              loading="lazy"
            />
            <div className="about-photo-caption">
              <span>Shared purpose.</span>
              <strong>Stronger connections.</strong>
            </div>
          </div>
          <div>
            <h2>Hope takes all of us.</h2>
            <p>
              Our faith inspires us to build connections across Krugersdorp and turn care for our
              neighbours into action.
            </p>
            <p>
              Through community projects, local business support and partnerships with ministries,
              we work towards a more connected town.
            </p>
            <Button href="/membership">
              Become part of the story <ArrowUpRight size={17} />
            </Button>
          </div>
        </div>
        <div className="action-grid">
          {[
            ["Connect", "Bring people, businesses and local organisations together."],
            ["Uplift", "Support practical community projects and opportunities to grow."],
            ["Multiply", "Help good ideas reach more people through shared resources."],
          ].map(([t, d]) => (
            <article className="action-card" key={t}>
              <Heart />
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="membership-banner">
        <div>
          <Eyebrow>LET'S BUILD SOMETHING GOOD</Eyebrow>
          <h2>Your next step starts here.</h2>
        </div>
        <Button href="/contact" className="white">
          Let's connect <ArrowUpRight />
        </Button>
      </section>
    </>
  );
}
function Vouchers() {
  const { data, session } = useSite();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  const [claims, setClaims] = useState<Item[]>([]);
  useEffect(() => {
    setClaims([]);
    let current = true;
    if (session.user)
      api("/wallet")
        .then((r) => {
          if (current) setClaims(r.claims);
        })
        .catch(() => {});
    return () => {
      current = false;
    };
  }, [session.user?.id]);
  const owned = claims.find((c) => c.voucher_id === selected?.id);
  const items = data.entities
    .filter(
      (i: Item) =>
        i.kind === "vouchers" && (!i.expires || i.expires >= new Date().toISOString().slice(0, 10)),
    )
    .filter((i: Item) =>
      (i.title + " " + i.business + " " + i.category).toLowerCase().includes(query.toLowerCase()),
    );
  const claim = async () => {
    setBusy(true);
    try {
      const result = await api("/claim", { id: selected?.id });
      setClaims((c) => [
        ...c,
        { id: result.id, voucher_id: selected?.id, status: "available", code: result.code },
      ]);
      toast.success("Claimed! Your voucher is waiting in your wallet.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page-wrap">
      <PageTitle
        eyebrow="LOCAL LOVE. MEMBER BENEFITS."
        title="Good things, around the corner."
        description="Discover offers from our local network. Everyone can browse. Active paid members can claim."
      />
      <div className="voucher-notice">
        <Ticket />
        <div>
          <strong>A little extra for being part of the community.</strong>
          <span>Join, have your payment verified, then claim and use your vouchers.</span>
        </div>
        <AppLink href={session.user?.active ? "/member?tab=wallet" : "/membership"}>
          {session.user?.active ? "Open my wallet" : "Unlock member benefits"}{" "}
          <ArrowRight size={17} />
        </AppLink>
      </div>
      <div className="search-control">
        <Search size={19} />
        <input
          aria-label="Search vouchers"
          placeholder="Search offers, businesses or categories"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="cards-grid">
        {items.map((i: Item) => (
          <button className="voucher-card" onClick={() => setSelected(i)} key={i.id}>
            <div className="card-photo">
              <img src={i.image || "/breakfast-cover.jpg"} alt={i.business || i.title} />
              <Badge>{i.demo ? "DEMO OFFER" : i.category || "Member offer"}</Badge>
              <div className="benefit">{i.benefit}</div>
            </div>
            <div className="card-body">
              <span className="small-label">{i.business}</span>
              <h3>{i.title}</h3>
              <p>Valid until {dateLabel(i.expires)}</p>
              <p className="voucher-window">
                <Clock size={16} /> Redeem within {i.redeemHours ?? 48} hours of claiming
              </p>
              <div className="ticket-divider" />
              <div className="card-foot">
                <span>
                  {claims.some((c) => c.voucher_id === i.id)
                    ? "In your wallet"
                    : session.user?.active
                      ? "View & claim"
                      : "Members-only access"}
                </span>
                {session.user?.active ? <ArrowUpRight size={19} /> : <LockKeyhole size={17} />}
              </div>
            </div>
          </button>
        ))}
        {!items.length && (
          <Empty
            title="Fresh local offers are on their way"
            description={
              query
                ? "Try a different search."
                : "Our team is adding offers from participating businesses."
            }
          />
        )}
      </div>
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="slk-dialog">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected?.business} · {selected?.benefit}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <p>{selected.description}</p>
              <div className="notice">
                <strong>Offer terms</strong>
                <p>
                  {selected.terms ||
                    "One claim per member. Present your voucher to the team for validation."}
                </p>
                <p>Expires: {dateLabel(selected.expires)}</p>
                <p>
                  <strong>Redeem within {selected.redeemHours ?? 48} hours after claiming.</strong>{" "}
                  The offer expiry applies if it is earlier. Your saved deadline appears in your
                  wallet.
                </p>
              </div>
              {owned ? (
                <div className="claim-success" role="status">
                  <span className="claim-success-icon">
                    <Check size={24} />
                  </span>
                  <h3>
                    {owned.status === "redeemed" ? "Already redeemed" : "Claimed. It's yours."}
                  </h3>
                  <p>
                    {owned.status === "redeemed"
                      ? "Your receipt is saved in your wallet."
                      : "Your redemption timer has started. Open your wallet to see the deadline, then redeem with staff before time runs out."}
                  </p>
                  <Button href={"/member?tab=wallet&claim=" + owned.id}>
                    Open my wallet <ArrowRight size={17} />
                  </Button>
                </div>
              ) : session.user?.active ? (
                <Button onClick={claim} disabled={busy}>
                  {busy ? "Claiming…" : "Claim this voucher"} <Ticket size={16} />
                </Button>
              ) : (
                <>
                  <p>An active paid membership is required to claim this offer.</p>
                  <Button href="/membership">
                    Become a member <ArrowUpRight size={16} />
                  </Button>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function Businesses() {
  const { data, session } = useSite();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const items = data.entities
    .filter((i: Item) => i.kind === "businesses")
    .filter((i: Item) =>
      (i.title + " " + i.category + " " + i.description)
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  return (
    <div className="page-wrap">
      <PageTitle
        eyebrow="MEET YOUR LOCAL NETWORK"
        title="Good people. Right here."
        description="Discover the businesses and organisations helping our community thrive."
      >
        <Button href="/member?tab=business" className="outline">
          List my business <Plus size={16} />
        </Button>
      </PageTitle>
      <div className="search-control">
        <Search size={19} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a business, service or organisation"
          aria-label="Search businesses"
        />
      </div>
      <div className="business-grid">
        {items.map((i: Item) => (
          <button className="business-card" onClick={() => setSelected(i)} key={i.id}>
            <div className="business-top">
              {i.image ? (
                <img src={i.image} alt="" />
              ) : (
                <div className="business-initial">
                  {i.title
                    .split(" ")
                    .slice(0, 2)
                    .map((s: string) => s[0])
                    .join("")}
                </div>
              )}
              <ArrowUpRight />
            </div>
            <Badge>{i.category}</Badge>
            <h3>{i.title}</h3>
            <p>{i.description}</p>
            <div className="date-meta">
              <MapPin size={14} />
              {i.location || "Krugersdorp"}
            </div>
          </button>
        ))}
        {!items.length && (
          <Empty
            title="No matching businesses"
            description="Try a different search or add your business to our community."
          />
        )}
      </div>
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="slk-dialog">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>{selected?.category}</DialogDescription>
          </DialogHeader>
          <p>{selected?.description}</p>
          {selected?.publicContact || session.user?.active ? (
            <div className="contact-links">
              {selected?.phone && (
                <AppLink href={"tel:" + selected.phone}>
                  <Phone />
                  {selected.phone}
                </AppLink>
              )}
              {selected?.email && (
                <AppLink href={"mailto:" + selected.email}>
                  <Mail />
                  {selected.email}
                </AppLink>
              )}
              {selected?.website && (
                <AppLink href={selected.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  Visit website
                </AppLink>
              )}
            </div>
          ) : (
            <div className="notice">
              Join as a paid member to access this business's member contact details.
              <Button href="/membership">View membership</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function InvolvementNav({ current }: { current: string }) {
  return (
    <nav className="involvement-nav" aria-label="Ways to get involved">
      {[
        ["/membership", "Membership"],
        ["/sponsor", "Sponsorship"],
        ["/donate", "Donations"],
      ].map(([href, label]) => (
        <AppLink
          href={href}
          key={href}
          aria-current={current === href ? "page" : undefined}
          className={current === href ? "selected" : ""}
        >
          {label}
        </AppLink>
      ))}
    </nav>
  );
}
function Membership() {
  const { data, session } = useSite();
  const join = session.user ? "/member?tab=membership" : "/member?tab=membership&auth=signup";
  const benefits = [
    [
      Ticket,
      "Little perks. Local love.",
      "Discover member vouchers from participating businesses. Claim, save and redeem from your phone.",
    ],
    [
      Building2,
      "Let your business belong.",
      "Create your business profile, join the directory and make meaningful local connections.",
    ],
    [
      CalendarDays,
      "Make time for good company.",
      "Find community gatherings and networking events, then keep your registrations together.",
    ],
    [
      Users,
      "A community in your pocket.",
      "Your own account brings your membership, vouchers, history and business details into one place.",
    ],
  ] as const;
  return (
    <div className="membership-page involvement-page">
      <InvolvementNav current="/membership" />
      <EditorialHero
        eyebrow="SO LOVE KRUGERSDORP MEMBERSHIP"
        title={
          <>
            You belong here.
            <br />
            Let's make it meaningful.
          </>
        }
        description="A familiar face. A new connection. A little more local love. Be part of a community that cares about Krugersdorp and the people who call it home."
        photo="membership-hero"
      >
        <Button href={join}>
          {session.user?.active ? "My membership" : "Yes, I'd love to join"}
          <ArrowUpRight size={18} />
        </Button>
        <span className="hero-price">
          {money(data.settings.membershipPrice)}
          <small>per year · after payment verification</small>
        </span>
      </EditorialHero>
      <section className="join-benefits" aria-labelledby="membership-benefits">
        <div className="join-section-heading">
          <Eyebrow>MORE REASONS TO BELONG</Eyebrow>
          <h2 id="membership-benefits">
            Good things happen
            <br />
            when we come together.
          </h2>
          <p>Make the most of your town, with a membership that keeps you connected.</p>
        </div>
        <div className="join-benefit-grid">
          {benefits.map(([Icon, title, description]) => (
            <article className="join-benefit" key={title}>
              <span>
                <Icon size={25} strokeWidth={1.5} />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="join-plan" aria-labelledby="membership-plan">
        <div className="join-plan-copy">
          <Eyebrow>ONE YEAR OF LOCAL LOVE</Eyebrow>
          <h2 id="membership-plan">
            A small commitment.
            <br />A meaningful connection.
          </h2>
          <p>
            Join for yourself, your business and your community. Everything starts with a simple
            account.
          </p>
          <div className="join-steps">
            {[
              ["01", "Make yourself at home", "Create your account with your email and password."],
              [
                "02",
                "Complete your membership",
                "Send your membership request and arrange payment with the team.",
              ],
              [
                "03",
                "Enjoy your local circle",
                "Once payment is verified, claim vouchers and share your business.",
              ],
            ].map(([step, title, description]) => (
              <div key={step}>
                <span>{step}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pricing-card welcome-price">
          <div className="plan-label">
            <Badge>YOUR ANNUAL MEMBERSHIP</Badge>
            <Heart size={26} strokeWidth={1.4} />
          </div>
          <h3>
            A whole year.
            <br />A little more connected.
          </h3>
          <div className="price">
            {money(data.settings.membershipPrice)}
            <span>/ year</span>
          </div>
          <p>One membership for your local circle.</p>
          <hr />
          <ul>
            {[
              "Member voucher access",
              "Your business profile & directory",
              "Personal voucher wallet & history",
              "Events and your member portal",
            ].map((t) => (
              <li key={t}>
                <Check size={17} />
                {t}
              </li>
            ))}
          </ul>
          <Button href={join}>
            {session.user?.active ? "View my membership" : "Become a member"}
            <ArrowUpRight size={18} />
          </Button>
          <small>
            Benefits start after the team verifies your payment. Creating an account does not charge
            you.
          </small>
        </div>
      </section>
      <section className="join-help">
        <div>
          <Eyebrow>A FRIENDLY FACE IS NEVER FAR AWAY</Eyebrow>
          <h2>New here? Let's connect.</h2>
          <p>Have a question about joining or your membership? The SLKD team is here to help.</p>
        </div>
        <Button href="/contact" className="outline">
          Talk to the team <ArrowRight size={18} />
        </Button>
      </section>
    </div>
  );
}
function RequestForm({ kind, onDone }: any) {
  const { session, data } = useSite();
  const [values, setValues] = useState<Item>({
    name: session.user?.name || "",
    email: session.user?.email || "",
    phone: session.user?.phone || "",
    amount: kind === "donation" ? 240 : data.settings.membershipPrice,
    consent: false,
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const set = (k: string, v: any) => setValues({ ...values, [k]: v });
  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("/submissions", { ...values, kind });
      setResult(r.message);
      onDone?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (result)
    return (
      <div className="form-success">
        <span>
          <Check size={28} />
        </span>
        <h3>Thank you for stepping in.</h3>
        <p>{result}</p>
        <Button href="/" className="outline">
          Back to the community
        </Button>
      </div>
    );
  return (
    <form onSubmit={submit} className="form-grid">
      {kind === "donation" && (
        <fieldset className="pledge-picker">
          <legend>Choose your pledge</legend>
          <div>
            {[100, 240, 500, 1000].map((amount) => (
              <button
                key={amount}
                type="button"
                aria-pressed={Number(values.amount) === amount}
                className={Number(values.amount) === amount ? "selected" : ""}
                onClick={() => set("amount", amount)}
              >
                {money(amount)}
              </button>
            ))}
          </div>
          <small>Or enter another amount below.</small>
        </fieldset>
      )}
      <Field
        label="Full name"
        autoComplete="name"
        value={values.name}
        required
        maxLength={120}
        onChange={(e: any) => set("name", e.target.value)}
      />
      <Field
        label="Email address"
        type="email"
        autoComplete="email"
        value={values.email}
        required
        onChange={(e: any) => set("email", e.target.value)}
      />
      <Field
        label="Phone number"
        type="tel"
        autoComplete="tel"
        value={values.phone}
        onChange={(e: any) => set("phone", e.target.value)}
      />
      {kind === "sponsor" && (
        <Field
          label="Business / organisation"
          value={values.company || ""}
          required
          onChange={(e: any) => set("company", e.target.value)}
        />
      )}{" "}
      {kind === "donation" && (
        <Field
          label="Donation pledge (ZAR)"
          type="number"
          min="1"
          max="10000000"
          required
          value={values.amount}
          onChange={(e: any) => set("amount", e.target.value)}
        />
      )}{" "}
      {kind === "membership" && (
        <Field
          label="Payment reference (if already paid)"
          value={values.reference || ""}
          onChange={(e: any) => set("reference", e.target.value)}
        />
      )}
      <Field label={kind === "sponsor" ? "How would you like to help?" : "Your message"}>
        <textarea
          rows={4}
          maxLength={5000}
          value={values.message || ""}
          onChange={(e) => set("message", e.target.value)}
          required={kind === "contact"}
        />
      </Field>
      <label className="check-label">
        <input
          type="checkbox"
          checked={values.consent}
          required
          onChange={(e) => set("consent", e.target.checked)}
        />
        <span>
          I agree that my details may be used to respond to this request.{" "}
          <AppLink href="/privacy">Privacy notice</AppLink>
        </span>
      </label>
      {kind === "donation" && (
        <p className="form-note">
          This records your pledge. No payment will be taken. The team will contact you to arrange
          your donation.
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy
          ? "Sending…"
          : kind === "membership"
            ? "Submit membership request"
            : kind === "donation"
              ? "Send my pledge"
              : kind === "sponsor"
                ? "Start the conversation"
                : "Send message"}
        <ArrowUpRight size={17} />
      </Button>
    </form>
  );
}
function Giving({ kind }: { kind: "sponsor" | "donation" }) {
  const { data } = useSite();
  const sponsor = kind === "sponsor";
  const partners = data.entities.filter((e: Item) => e.kind === "sponsors");
  return (
    <div className={"involvement-page giving-page " + (sponsor ? "sponsor-page" : "donation-page")}>
      <InvolvementNav current={sponsor ? "/sponsor" : "/donate"} />
      <EditorialHero
        compact
        eyebrow={sponsor ? "PARTNER WITH PURPOSE" : "GIVE CLOSE TO HOME"}
        title={
          sponsor ? (
            <>
              Good business.
              <br />
              Even greater purpose.
            </>
          ) : (
            <>
              Give a little love.
              <br />
              Make it local.
            </>
          )
        }
        description={
          sponsor
            ? "Bring your business, your skills and your heart. Together, we can create more moments that matter for Krugersdorp."
            : data.settings.donationIntro
        }
        photo={sponsor ? "sponsor-hero" : "donate-hero"}
      >
        <Button href="#giving-form-title">
          {sponsor ? "Become a partner" : "Make a pledge"}
          <ArrowUpRight size={18} />
        </Button>
        <AppLink className="hero-secondary" href="/contact">
          Talk to the team <ArrowRight size={17} />
        </AppLink>
      </EditorialHero>
      <div className="giving-layout">
        <div className="giving-story">
          <div className="giving-story-copy">
            <h2>
              {sponsor
                ? "There is more than one way to make a difference."
                : "Your generosity starts something good."}
            </h2>
            <p>
              {sponsor
                ? "Support a community event, share your expertise or offer practical resources. Tell us what feels right for your business and we will explore the possibilities together."
                : "Choose an amount that feels right for you. Your pledge goes to the SLKD team, who will contact you to arrange your donation and discuss how you would like to help."}
            </p>
          </div>
          <div className="giving-options">
            {(sponsor
              ? [
                  [CalendarDays, "Support an event", "Help bring people together."],
                  [Building2, "Share your skills", "Offer your time, services or expertise."],
                  [
                    HandHeart,
                    "Give practical support",
                    "Contribute resources where they can help.",
                  ],
                ]
              : [
                  [
                    Heart,
                    "Choose your contribution",
                    "Every pledge begins with what you can give.",
                  ],
                  [Users, "Connect with the team", "We will help arrange your donation."],
                  [HandHeart, "Support local good", "Be part of a community that shows up."],
                ]
            ).map(([Icon, title, description]: any) => (
              <div key={title}>
                <span>
                  <Icon size={22} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <section className="form-card giving-form" aria-labelledby="giving-form-title">
          <div className="giving-form-heading">
            <span className="icon-square">{sponsor ? <Building2 /> : <HandHeart />}</span>
            <Eyebrow>{sponsor ? "LET'S WORK TOGETHER" : "YOUR CONTRIBUTION"}</Eyebrow>
            <h2 id="giving-form-title">
              {sponsor ? "Start something good." : "Make a donation pledge."}
            </h2>
            <p>
              {sponsor
                ? "Tell us a little about your business and how you would like to get involved."
                : "Choose an amount below or enter your own. The team will follow up with payment arrangements."}
            </p>
          </div>
          <RequestForm key={kind} kind={kind} />
          <div className="giving-form-help">
            <Mail size={16} />
            <span>
              Prefer a conversation? <AppLink href="/contact">Contact the team</AppLink>
            </span>
          </div>
        </section>
      </div>
      {sponsor && partners.length > 0 && (
        <section className="partner-section">
          <div className="portal-section-heading">
            <h2>Our partners in good.</h2>
            <p>Local organisations making room for community.</p>
          </div>
          <div className="business-grid">
            {partners.map((e: Item) => (
              <AppLink href={e.website || "/contact"} className="business-card" key={e.id}>
                {e.image && <img className="sponsor-logo" src={e.image} alt={e.title} />}
                <h3>{e.title}</h3>
                <p>{e.description}</p>
              </AppLink>
            ))}
          </div>
        </section>
      )}
      <section className="join-help">
        <div>
          <h2>
            {sponsor ? "A different way to get involved?" : "Give your business a local purpose."}
          </h2>
          <p>
            {sponsor
              ? "Join as a member or pledge a donation. Every connection counts."
              : "Explore sponsorship if you would like to contribute services, resources or event support."}
          </p>
        </div>
        <Button href={sponsor ? "/membership" : "/sponsor"} className="outline">
          {sponsor ? "Explore membership" : "Become a sponsor"}
          <ArrowRight size={18} />
        </Button>
      </section>
    </div>
  );
}
function Contact() {
  const { data } = useSite();
  return (
    <div className="page-wrap">
      <PageTitle
        eyebrow="A CONVERSATION IS A GOOD START"
        title="Let's connect."
        description="A question, an idea or a way to help? We'd love to hear from you."
      />
      <div className="giving-grid">
        <div className="contact-panel">
          <h2>
            Good things start
            <br />
            with a hello.
          </h2>
          <AppLink href={"tel:" + data.settings.phone.replace(/\s/g, "")}>
            <Phone />
            {data.settings.phone}
          </AppLink>
          {data.settings.email && (
            <AppLink href={"mailto:" + data.settings.email}>
              <Mail />
              {data.settings.email}
            </AppLink>
          )}
          <p>
            <MapPin />
            Krugersdorp, Gauteng, South Africa
          </p>
          <div className="contact-location">
            <MapPin size={28} />
            <strong>
              Local roots.
              <br />
              An open door.
            </strong>
            <span>Krugersdorp · Gauteng</span>
          </div>
        </div>
        <div className="form-card">
          <h3>Send the team a message</h3>
          <RequestForm kind="contact" />
        </div>
      </div>
    </div>
  );
}
function SignIn() {
  const { refresh, search, path } = useSite();
  const [signup, setSignup] = useState(search.get("auth") === "signup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="signin-panel">
      <div className="signin-story">
        <img src="/stock/signin.webp" className="signin-story-photo" alt="" decoding="async" />
        <Eyebrow>YOUR COMMUNITY, IN YOUR POCKET</Eyebrow>
        <h1>
          Welcome to
          <br />
          your local circle.
        </h1>
        <p>Keep your vouchers, events and business profile together in your member account.</p>
        <div className="signin-benefits">
          <span>
            <Ticket />
            Your voucher wallet
          </span>
          <span>
            <Building2 />
            Your business profile
          </span>
          <span>
            <Users />
            Your community
          </span>
        </div>
      </div>
      <div className="form-card">
        <div className="icon-square">
          <Heart />
        </div>
        <h2>{signup ? "Become part of the community." : "Good to have you here."}</h2>
        <p>
          {signup
            ? "Create your account, then complete your membership application."
            : "Sign in with your email and password."}
        </p>
        <form
          className="form-grid"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            const values = Object.fromEntries(new FormData(event.currentTarget));
            setBusy(true);
            setError("");
            try {
              await api(signup ? "/auth/signup" : "/auth/login", {
                ...values,
                consent: values.consent === "on",
              });
              await refresh();
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {signup && (
            <Field
              label="Full name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
            />
          )}
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            required
            minLength={signup ? 12 : undefined}
            maxLength={256}
          />
          {signup && (
            <>
              <small>Choose a password with at least 12 characters.</small>
              <label className="auth-consent">
                <input type="checkbox" name="consent" required />
                <span>
                  I agree to the{" "}
                  <AppLink href="/privacy" target="_blank" rel="noreferrer">
                    privacy notice
                  </AppLink>
                  .
                </span>
              </label>
            </>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Please wait…" : signup ? "Create my member account" : "Sign in"}
            <ArrowRight size={18} />
          </Button>
        </form>
        <button
          type="button"
          className="text-link auth-switch"
          disabled={busy}
          onClick={() => {
            setSignup(!signup);
            setError("");
          }}
        >
          {signup ? "Already have an account? Sign in" : "New here? Create your account"}
        </button>
        <small>Voucher benefits become available after your membership payment is verified.</small>
        {!signup && (
          <details className="legacy-signin">
            <summary>Already have an account from the earlier demo?</summary>
            <p>
              Use your previous sign-in once, then set a password under My details to keep your
              existing membership and history.
            </p>
            <form action="/api/auth/legacy" method="post" target="_top">
              <input
                type="hidden"
                name="returnTo"
                value={path.startsWith("/admin") ? "/admin" : "/member?tab=profile"}
              />
              <button className="text-link" type="submit">
                Use previous sign-in
              </button>
            </form>
          </details>
        )}
        <AppLink className="text-link" href="/contact">
          Need help signing in?
        </AppLink>
      </div>
    </div>
  );
}
function PasswordForm() {
  const { session, refresh } = useSite();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="password-section">
      <h3>{session.user.hasPassword ? "Change your password" : "Set up email sign-in"}</h3>
      <p>Use {session.user.email} and your password to sign in to your account.</p>
      <form
        className="form-grid"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const form = event.currentTarget;
          const values = Object.fromEntries(new FormData(form));
          if (values.password !== values.confirmPassword) {
            setError("Your passwords do not match.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            await api("/auth/password", values);
            form.reset();
            await refresh();
            toast.success("Your password has been saved.");
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {session.user.hasPassword && (
          <Field
            label="Current password"
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            required
            maxLength={256}
          />
        )}
        <Field
          label="New password (at least 12 characters)"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={256}
          required
        />
        <Field
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={12}
          maxLength={256}
          required
        />
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </Button>
      </form>
    </section>
  );
}
function SignOut() {
  const { refresh } = useSite();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="text-link"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await api("/auth/logout", {});
          await refresh();
          await router.navigate({ href: "/" });
        } catch (e: any) {
          toast.error(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      Sign out <LogOut size={16} />
    </button>
  );
}
function Upload({ value, onChange }: any) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="upload-control">
      {value && <img src={value} alt="Current image" />}
      <label className="button outline">
        <ImagePlus size={17} />
        {busy ? "Uploading…" : value ? "Change image" : "Upload image"}
        <input
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              const f = new FormData();
              f.append("file", file);
              const r = await fetch("/api/upload", { method: "POST", body: f });
              const d = await r.json();
              if (!r.ok) throw Error(d.error);
              onChange(d.url);
            } catch (e: any) {
              toast.error(e.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <small>JPEG, PNG or WebP · up to 5 MB</small>
    </div>
  );
}
function Member() {
  const { session, refresh, search, data, sessionLoaded } = useSite();
  const [member, setMember] = useState<any>(null);
  const [error, setError] = useState("");
  const requestedTab = search.get("tab") || "overview";
  const tab = ["overview", "wallet", "events", "business", "membership", "profile"].includes(
    requestedTab,
  )
    ? requestedTab
    : "overview";
  const load = () =>
    api("/member")
      .then(setMember)
      .catch((e: any) => setError(e.message));
  useEffect(() => {
    setMember(null);
    if (session.user) load();
  }, [session.user?.id]);
  if (!sessionLoaded) return <SessionLoading />;
  if (!session.user) return <SignIn />;
  if (!member || member.user.id !== session.user.id)
    return (
      <div className="page-wrap">
        <Empty
          title={error || "Loading your account…"}
          description={error ? "Please try again shortly." : "Your community is on its way."}
        />
      </div>
    );
  const user = member.user;
  const save = async (e: any, path: string) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.target));
    try {
      await api(path, values);
      toast.success("Your profile has been saved.");
      load();
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  return (
    <div className="member-wrap">
      <PageTitle
        eyebrow="YOUR LOCAL CIRCLE"
        title={"Hello, " + user.name.split(" ")[0] + "."}
        description="Good to have you in the community."
      >
        <Badge tone={user.active ? "green" : "amber"}>
          {user.active
            ? "Active member"
            : user.membership === "pending"
              ? "Payment verification pending"
              : "Membership not active"}
        </Badge>
      </PageTitle>
      <nav className="portal-tabs" aria-label="Member pages">
        {(
          [
            ["overview", "Overview", LayoutDashboard],
            ["wallet", "My vouchers", Ticket],
            ["events", "My events", CalendarDays],
            ["business", "Business profile", Building2],
            ["membership", "Membership", Heart],
            ["profile", "My details", Users],
          ] as const
        ).map(([id, label, Icon]) => (
          <AppLink
            key={id}
            className={tab === id ? "selected" : ""}
            href={"/member?tab=" + id}
            aria-current={tab === id ? "page" : undefined}
          >
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
          </AppLink>
        ))}
      </nav>
      {tab === "overview" && (
        <>
          <div className="stats-grid">
            <Stat
              title="Vouchers in your wallet"
              value={member.claims.filter((c: Item) => c.status === "available").length}
              icon={Ticket}
            />
            <Stat
              title="Vouchers used"
              value={member.claims.filter((c: Item) => c.status === "redeemed").length}
              icon={Check}
            />
            <Stat
              title="Event registrations"
              value={member.registrations.length}
              icon={CalendarDays}
            />
          </div>
          <div className="member-feature">
            <div>
              <Eyebrow>MAKE THE MOST OF YOUR MEMBERSHIP</Eyebrow>
              <h2>
                {user.active ? "Your next local discovery awaits." : "Your community is waiting."}
              </h2>
              <p>
                {user.active
                  ? "Find a local offer and add it to your wallet."
                  : "Activate your membership to unlock local vouchers and list your business."}
              </p>
              <Button href={user.active ? "/vouchers" : "/member?tab=membership"}>
                {user.active ? "Explore vouchers" : "Activate my membership"}{" "}
                <ArrowUpRight size={17} />
              </Button>
            </div>
            <Ticket size={100} strokeWidth={0.8} />
          </div>
          <div className="account-actions">
            <Button className="outline" href="/member?tab=business">
              Update my business <Building2 size={16} />
            </Button>
            {user.role === "admin" && (
              <Button href="/admin" className="outline">
                Open admin portal <ShieldCheck size={17} />
              </Button>
            )}
            <SignOut />
          </div>
        </>
      )}
      {tab === "wallet" && <VoucherWallet initialClaims={member.claims} onUpdate={load} />}
      {tab === "events" && (
        <>
          <div className="portal-section-heading">
            <h2>Your community calendar</h2>
            <p>Your upcoming connections, gatherings and moments together.</p>
          </div>
          {member.registrations.length ? (
            <div className="cards-grid">
              {member.registrations.map((r: Item) => {
                const item = data.entities.find((i: Item) => i.id === r.event_id);
                return item ? (
                  <div className="registered-event" key={r.id}>
                    <Badge tone={r.status === "confirmed" ? "green" : "amber"}>
                      {registrationLabels[r.status] || r.status}
                    </Badge>
                    <EventCard item={item} />
                    <AppLink className="button outline" href={"/events?event=" + item.id}>
                      {r.status === "confirmed"
                        ? "View registration"
                        : "View payment & registration"}
                      <ArrowRight size={17} />
                    </AppLink>
                  </div>
                ) : (
                  <div className="notice" key={r.id}>
                    This registered event has been archived. Contact the team for details.
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              title="Good company is waiting"
              description="Register for an event to see it here."
            >
              <Button href="/events">Explore events</Button>
            </Empty>
          )}
        </>
      )}
      {tab === "business" &&
        (user.active ? (
          <BusinessForm business={member.businesses[0]} onSave={load} />
        ) : (
          <Empty
            title="Give your business a place in the community"
            description="Activate your paid membership to create a business listing."
          >
            <Button href="/member?tab=membership">Activate membership</Button>
          </Empty>
        ))}
      {tab === "membership" && (
        <div className="giving-grid">
          <div>
            <h2>Your annual membership</h2>
            <div className="price">
              {money(data.settings.membershipPrice)}
              <span>/ year</span>
            </div>
            <p>
              Membership status: <strong>{user.membership}</strong>
            </p>
            {user.expires && <p>Valid until {dateLabel(user.expires)}</p>}
            <div className="notice">
              <h3>Payment arrangements</h3>
              {member.paymentInstructions.bankAccount ? (
                <>
                  <p>Bank: {member.paymentInstructions.bankName}</p>
                  <p>Account: {member.paymentInstructions.bankAccount}</p>
                  <p>Reference: {member.paymentInstructions.bankReference} + your name</p>
                </>
              ) : (
                <p>
                  Please contact {data.settings.phone} for verified payment details. Submit your
                  request and the team will help you get started.
                </p>
              )}
              <p>Access is activated only after an administrator verifies your payment.</p>
            </div>
          </div>
          <div className="form-card">
            {user.active ? (
              <Empty title="You're all set" description="Your member benefits are active.">
                <Button href="/vouchers">Explore vouchers</Button>
              </Empty>
            ) : user.membership === "pending" ? (
              <Empty
                title="Your request is with the team"
                description="Your payment will be checked before your membership is activated. Contact the team if you need help."
              />
            ) : (
              <RequestForm
                kind="membership"
                onDone={() => {
                  load();
                  refresh();
                }}
              />
            )}
          </div>
        </div>
      )}
      {tab === "profile" && (
        <div className="form-card narrow">
          <h2>Your details</h2>
          <form className="form-grid" onSubmit={(e) => save(e, "/profile")}>
            <Field label="Full name" name="name" defaultValue={user.name} required />
            <Field label="Phone number" name="phone" defaultValue={user.phone} />
            <Field label="Sign-in email" value={user.email} readOnly />

            <Button type="submit">
              Save details <Check size={16} />
            </Button>
          </form>
          <PasswordForm />
        </div>
      )}
    </div>
  );
}
function VoucherWallet({
  initialClaims,
  onUpdate,
}: {
  initialClaims: Item[];
  onUpdate: () => void;
}) {
  const { search } = useSite();
  const [claims, setClaims] = useState<Item[]>(initialClaims);
  const [selectedId, setSelectedId] = useState<string | null>(search.get("claim"));
  const [filter, setFilter] = useState("available");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [clock, setClock] = useState({ server: 0, received: 0 });
  const [tick, setTick] = useState(Date.now());
  const requestEpoch = useRef(0);
  const mutating = useRef(false);
  const selectedClaim = claims.find((c) => c.id === selectedId);
  const checkStatus = async () => {
    if (mutating.current) return;
    const epoch = ++requestEpoch.current;
    setChecking(true);
    try {
      const result = await api("/wallet");
      if (epoch !== requestEpoch.current) return;
      setClaims(result.claims);
      setClock({ server: Date.parse(result.serverTime), received: Date.now() });
      setTick(Date.now());
      setError("");
    } catch (e: any) {
      if (epoch === requestEpoch.current) {
        setError(e.message);
        setClock({ server: 0, received: 0 });
      }
    } finally {
      if (epoch === requestEpoch.current) setChecking(false);
    }
  };
  useEffect(() => {
    void checkStatus();
    const timer = setInterval(() => void checkStatus(), 30000);
    const ticker = setInterval(() => setTick(Date.now()), 1000);
    return () => {
      requestEpoch.current++;
      clearInterval(timer);
      clearInterval(ticker);
    };
  }, []);
  useEffect(() => {
    if (!selectedId) return;
    setConfirmed(false);
    void checkStatus();
  }, [selectedId]);
  const checked = !!clock.received && tick - clock.received < 45000;
  const serverNow = clock.server + tick - clock.received;
  const timedOut = (c: Item) =>
    c.status === "available" && c.redeem_by && Date.parse(c.redeem_by) <= serverNow;
  const selected =
    selectedClaim && timedOut(selectedClaim)
      ? { ...selectedClaim, redeemable: false, invalidReason: "The redemption window has expired." }
      : selectedClaim;
  const timeLeft = (deadline: string) => {
    const seconds = Math.max(0, Math.ceil((Date.parse(deadline) - serverNow) / 1000));
    if (!seconds) return "Redemption window expired";
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s left to redeem`;
  };
  const freshReceipt =
    checked &&
    selected?.redeemed_at &&
    serverNow - Date.parse(selected.redeemed_at) >= 0 &&
    serverNow - Date.parse(selected.redeemed_at) < 120000;
  const stamp = (date: string) =>
    new Date(date).toLocaleString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      dateStyle: "medium",
      timeStyle: "medium",
    });
  const redeem = async () => {
    if (busy || !selected || !confirmed) return;
    mutating.current = true;
    requestEpoch.current++;
    setChecking(false);
    setBusy(true);
    setError("");
    try {
      const result = await api("/redeem", { id: selected.id, confirm: true });
      setClaims((rows) => rows.map((c) => (c.id === result.claim.id ? result.claim : c)));
      setClock({ server: Date.parse(result.serverTime), received: Date.now() });
      setTick(Date.now());
      setFilter("redeemed");
      setConfirmed(false);
      onUpdate();
      toast.success("Voucher redeemed. Show this receipt to staff.");
    } catch (e: any) {
      mutating.current = false;
      await checkStatus();
      setError(e.message);
    } finally {
      mutating.current = false;
      setBusy(false);
    }
  };
  const visible = claims.filter(
    (c) =>
      filter === "all" ||
      (filter === "redeemed" ? c.status === "redeemed" : c.status === "available"),
  );
  return (
    <section className="wallet-section">
      <div className="portal-section-heading">
        <div>
          <h2>Your voucher wallet</h2>
          <p>Claim now. Redeem when you are with staff.</p>
        </div>
        <Button href="/vouchers" className="outline">
          Find vouchers <Plus size={16} />
        </Button>
      </div>
      <div className="wallet-guide">
        <Ticket size={23} />
        <p>
          <strong>Ready to use a voucher?</strong> Open it below and show staff. Only confirm
          redemption when they are ready to accept it.
        </p>
      </div>
      <div className="filters wallet-filters" aria-label="Filter your vouchers">
        {[
          ["available", "Claimed"],
          ["redeemed", "Redeemed"],
          ["all", "All history"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={filter === value ? "selected" : ""}
            onClick={() => setFilter(value)}
          >
            {label}{" "}
            <span>
              {
                claims.filter(
                  (c) =>
                    value === "all" ||
                    c.status === (value === "available" ? "available" : "redeemed"),
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      {error && !selectedId && (
        <div className="notice" role="alert">
          {error}
          <button className="text-link" onClick={checkStatus}>
            Try again
          </button>
        </div>
      )}
      {!visible.length ? (
        <Empty
          title={
            filter === "redeemed"
              ? "Your redeemed vouchers will appear here"
              : "A little local love is waiting"
          }
          description={
            filter === "redeemed"
              ? "Every redemption is saved in your history."
              : "Explore local offers and claim one to add it to your wallet."
          }
        >
          <Button href="/vouchers">
            Browse vouchers <ArrowRight size={16} />
          </Button>
        </Empty>
      ) : (
        <div className="wallet-grid">
          {visible.map((claim) => {
            const c = timedOut(claim)
              ? { ...claim, redeemable: false, invalidReason: "The redemption window has expired." }
              : claim;
            const voucher = c.receipt || c.voucher || {};
            return (
              <button
                key={c.id}
                className="wallet-card"
                onClick={() => setSelectedId(c.id)}
                aria-label={"Open voucher: " + (voucher.title || "Archived offer")}
              >
                <div className="wallet-card-top">
                  <Ticket size={23} />
                  <Badge tone={c.status === "redeemed" ? "" : c.redeemable ? "green" : "amber"}>
                    {c.status === "redeemed"
                      ? "Redeemed"
                      : c.redeemable
                        ? "Claimed · ready to use"
                        : "Unavailable"}
                  </Badge>
                </div>
                <span className="small-label">{voucher.business || "SLKD community"}</span>
                <h3>{voucher.title || "Archived offer"}</h3>
                <strong className="wallet-benefit">{voucher.benefit}</strong>
                <p>
                  {c.status === "redeemed"
                    ? "Used " + stamp(c.redeemed_at)
                    : c.redeemable
                      ? c.voucher?.expires
                        ? "Valid until " + dateLabel(c.voucher.expires)
                        : "No fixed expiry"
                      : c.invalidReason}
                </p>
                {c.status === "available" && c.redeem_by && (
                  <div className={"voucher-countdown " + (timedOut(c) ? "expired" : "")}>
                    <Clock size={17} />
                    <span>{timeLeft(c.redeem_by)}</span>
                  </div>
                )}
                <div className="wallet-card-foot">
                  <span>{c.status === "redeemed" ? "View receipt" : "Open voucher"}</span>
                  <ArrowUpRight size={18} />
                </div>
              </button>
            );
          })}
        </div>
      )}
      <Dialog
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open && !busy) setSelectedId(null);
        }}
      >
        <DialogContent
          className="slk-dialog voucher-detail"
          onInteractOutside={(event) => {
            if (busy) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {selected?.status === "redeemed"
                ? "Your redemption receipt"
                : "Ready for a little local love?"}
            </DialogTitle>
            <DialogDescription>
              {selected?.status === "redeemed"
                ? "Keep this record and show it to staff."
                : "Show this screen before you redeem. Each voucher can be used once."}
            </DialogDescription>
          </DialogHeader>
          {!selected ? (
            <p role="status">
              {checking ? "Opening your voucher…" : "This voucher is not in your wallet."}
            </p>
          ) : (
            <>
              <div
                className={
                  "voucher-proof " +
                  (selected.status === "redeemed"
                    ? freshReceipt
                      ? "just-redeemed"
                      : "previously-redeemed"
                    : selected.redeemable && checked
                      ? "ready"
                      : "unavailable")
                }
                role="status"
                aria-live="polite"
              >
                <span className="proof-icon">
                  {selected.status === "redeemed" ? <Check size={32} /> : <ShieldCheck size={32} />}
                </span>
                <strong>
                  {selected.status === "redeemed"
                    ? freshReceipt
                      ? "Redeemed just now"
                      : "Already redeemed"
                    : !checked
                      ? "Status not confirmed"
                      : selected.redeemable
                        ? "Valid & ready to redeem"
                        : "Cannot be redeemed"}
                </strong>
                <span>
                  {selected.status === "redeemed"
                    ? freshReceipt
                      ? "Staff: this voucher was valid and has now been used."
                      : "This is a past receipt. This voucher cannot be used again."
                    : !checked
                      ? "Refresh the status before showing staff."
                      : selected.redeemable
                        ? "Staff: review the offer, then ask the member to confirm below."
                        : selected.invalidReason}
                </span>
              </div>
              <div className="voucher-summary">
                <span className="small-label">
                  {selected.receipt?.business || selected.voucher?.business}
                </span>
                <h3>{selected.receipt?.title || selected.voucher?.title || "Archived offer"}</h3>
                <strong>{selected.receipt?.benefit || selected.voucher?.benefit}</strong>
                {(selected.receipt?.demo || selected.voucher?.demo) && (
                  <Badge tone="amber">Demo offer</Badge>
                )}
              </div>
              <dl className="receipt-details">
                <div>
                  <dt>Voucher code</dt>
                  <dd>
                    <code>{selected.code}</code>
                  </dd>
                </div>
                {selected.receipt?.memberName && (
                  <div>
                    <dt>Member</dt>
                    <dd>{selected.receipt.memberName}</dd>
                  </div>
                )}
                <div>
                  <dt>Claimed</dt>
                  <dd>{stamp(selected.created_at)} SAST</dd>
                </div>
                {selected.redeemed_at ? (
                  <div>
                    <dt>Redeemed</dt>
                    <dd>{stamp(selected.redeemed_at)} SAST</dd>
                  </div>
                ) : (
                  <div>
                    <dt>Offer expires</dt>
                    <dd>
                      {selected.voucher?.expires
                        ? dateLabel(selected.voucher.expires)
                        : "No fixed expiry"}
                    </dd>
                  </div>
                )}
              </dl>
              {selected.status === "available" && selected.redeem_by && (
                <div className={"voucher-deadline " + (timedOut(selected) ? "expired" : "")}>
                  <div className="voucher-countdown">
                    <Clock size={20} />
                    <strong>{timeLeft(selected.redeem_by)}</strong>
                  </div>
                  <p>
                    Redeem by {stamp(selected.redeem_by)} SAST. This deadline was saved when you
                    claimed the voucher.
                  </p>
                </div>
              )}
              {selected.status === "available" && (
                <div className="voucher-terms">
                  <strong>Offer terms</strong>
                  <p>
                    {selected.voucher?.terms ||
                      "One use per member, subject to the participating business accepting the offer."}
                  </p>
                </div>
              )}
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}
              <div className="proof-refresh">
                <span>
                  <span className={checked ? "live-dot" : "offline-dot"} />
                  {checked ? "Status checked with SLKD" : "Connection needs checking"}
                </span>
                <button className="text-link" disabled={checking || busy} onClick={checkStatus}>
                  <RefreshCw size={15} />
                  {checking ? "Checking…" : "Refresh status"}
                </button>
              </div>
              {selected.status === "available" && selected.redeemable && (
                <div className="redeem-confirmation">
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      disabled={busy}
                      onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    <span>I am with staff and ready to use this voucher now.</span>
                  </label>
                  <Button disabled={!confirmed || !checked || busy || checking} onClick={redeem}>
                    {busy ? "Redeeming…" : "Redeem voucher now"}
                    <Check size={18} />
                  </Button>
                  <small>This uses your voucher once. It cannot be undone.</small>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
function BusinessForm({ business, onSave }: any) {
  const [v, setV] = useState<Item>(
    business || {
      title: "",
      category: "",
      description: "",
      phone: "",
      email: "",
      website: "",
      location: "Krugersdorp",
      publicContact: false,
      image: "",
    },
  );
  const [busy, setBusy] = useState(false);
  return (
    <div className="form-card">
      <h2>Your business profile</h2>
      <p className="muted">
        New listings and changes are reviewed before appearing in the directory.
      </p>
      {business && <Badge>{business.status}</Badge>}
      <form
        className="form-grid two-column"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/business", v);
            toast.success("Profile sent for review.");
            onSave();
          } catch (e: any) {
            toast.error(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {[
          ["title", "Business name"],
          ["category", "Category"],
          ["phone", "Business phone"],
          ["email", "Business email"],
          ["website", "Website (https://…)"],
          ["location", "Location"],
        ].map(([k, label]) => (
          <Field
            key={k}
            label={label}
            value={v[k] || ""}
            required={k === "title"}
            type={k === "website" ? "url" : k === "email" ? "email" : "text"}
            onChange={(e: any) => setV({ ...v, [k]: e.target.value })}
          />
        ))}
        <div className="full-width">
          <Field label="About your business">
            <textarea
              rows={4}
              value={v.description}
              onChange={(e) => setV({ ...v, description: e.target.value })}
            />
          </Field>
        </div>
        <div className="full-width">
          <Upload value={v.image} onChange={(image: string) => setV({ ...v, image })} />
        </div>
        <label className="check-label full-width">
          <input
            type="checkbox"
            checked={v.publicContact}
            onChange={(e) => setV({ ...v, publicContact: e.target.checked })}
          />
          <span>
            Display my business contact details publicly. Otherwise, only paid members can see them.
          </span>
        </label>
        <Button disabled={busy} type="submit">
          {busy ? "Saving…" : "Submit for review"} <ArrowUpRight size={16} />
        </Button>
      </form>
    </div>
  );
}
function Stat({ title, value, icon: Icon }: any) {
  return (
    <div className="stat-card">
      <div>
        <span>{title}</span>
        <Icon size={20} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}
function Admin() {
  const { session, refresh, search, path, sessionLoaded } = useSite();
  const [admin, setAdmin] = useState<any>(null);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<Item | null>(null);
  const [remove, setRemove] = useState<Item | null>(null);
  const [query, setQuery] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const alias: Record<string, string> = {
    contact: "settings",
    breakfast: "events",
    shop: "overview",
  };
  const rawTab = search.get("tab") || path.split("/")[2] || "overview";
  const tab = alias[rawTab] || rawTab;
  const load = () =>
    api("/admin")
      .then(setAdmin)
      .catch((e: any) => setError(e.message));
  useEffect(() => {
    setAdmin(null);
    if (session.user?.role === "admin") load();
  }, [session.user?.id, session.user?.role]);
  if (!sessionLoaded)
    return (
      <>
        <Header />
        <SessionLoading />
      </>
    );
  if (!session.user)
    return (
      <>
        <Header />
        <SignIn />
        <Footer />
      </>
    );
  if (session.user.role !== "admin")
    return (
      <>
        <Header />
        <div className="page-wrap">
          <div className="form-card narrow">
            <div className="icon-square">
              <ShieldCheck />
            </div>
            <h2>
              {session.adminConfigured ? "Admin access required" : "Set up your admin account"}
            </h2>
            <p>
              {session.adminConfigured
                ? "This area is available to approved administrators."
                : "Enter the private setup code supplied with this demo to appoint your signed-in account as the administrator."}
            </p>
            {!session.adminConfigured && (
              <form
                className="form-grid"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await api("/bootstrap", { key });
                    toast.success("Your admin account is ready.");
                    refresh();
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}
              >
                <Field
                  label="Private setup code"
                  type="password"
                  value={key}
                  onChange={(e: any) => setKey(e.target.value)}
                  required
                />
                <Button type="submit">
                  Activate admin access <ShieldCheck size={17} />
                </Button>
              </form>
            )}
            <AppLink href="/member" className="text-link">
              Back to my account
            </AppLink>
          </div>
        </div>
        <Footer />
      </>
    );
  const mutate = async (path: string, body: Item, message = "Changes saved.") => {
    try {
      await api(path, body);
      toast.success(message);
      load();
      refresh();
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  };
  const contentTab = ["events", "vouchers", "businesses", "sponsors"].includes(tab);
  const title = adminNav.find((n) => n[0] === tab)?.[1] || "Overview";
  const pending = admin?.submissions.filter((s: Item) => s.status === "new") || [];
  const exportCSV = (rows: any[], filename: string) => {
    if (!rows.length) {
      toast.info("No records to export.");
      return;
    }
    const keys = Object.keys(rows[0]);
    const quote = (v: any) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replace(/"/g, '""') +
      '"';
    const csv = [
      keys.map(quote).join(","),
      ...rows.map((r) =>
        keys.map((k) => quote(typeof r[k] === "object" ? JSON.stringify(r[k]) : r[k])).join(","),
      ),
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Logo />
        <span className="sidebar-label">COMMUNITY MANAGEMENT</span>
        <nav aria-label="Admin navigation">
          {adminNav.map(([id, label, Icon]) => (
            <AppLink key={id} href={"/admin?tab=" + id} className={tab === id ? "selected" : ""}>
              <Icon size={18} />
              {label}
              {id === "requests" && pending.length > 0 && <b>{pending.length}</b>}
            </AppLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <AppLink href="/">
            <ArrowUpRight size={17} />
            View website
          </AppLink>
          <AppLink href="/member">
            <Users size={17} />
            My member account
          </AppLink>
          <div className="admin-user">
            <span>{session.user.name[0]}</span>
            <div>
              <strong>{session.user.name}</strong>
              <small>Administrator</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-top">
          <span>
            So Love Krugersdorp <ChevronRight size={14} /> {title}
          </span>
          <Badge>NEW DEMO</Badge>
          <AppLink href="/" className="text-link">
            View website <ArrowUpRight size={16} />
          </AppLink>
        </div>
        <main id="main-content" className="admin-content">
          <div className="admin-heading">
            <div>
              <Eyebrow>YOUR COMMUNITY AT A GLANCE</Eyebrow>
              <h1>{tab === "overview" ? "A little love. A lot happening." : title}</h1>
              <p>
                {tab === "overview"
                  ? "Welcome back. Here’s where your attention can make a difference."
                  : "Keep your community informed, connected and moving forward."}
              </p>
            </div>
            {contentTab && (
              <Button
                onClick={() =>
                  setEditor({
                    kind: tab,
                    title: "",
                    description: "",
                    status: "draft",
                    image: "",
                    capacity: 100,
                    limit: 100,
                    publicContact: true,
                  })
                }
              >
                <Plus size={17} />
                Add {tab === "businesses" ? "business" : tab.slice(0, -1)}
              </Button>
            )}
          </div>
          {!admin ? (
            <Empty
              title={error || "Loading your community…"}
              description={error ? "Please try again." : ""}
            />
          ) : (
            <>
              {tab === "overview" && (
                <>
                  <div className="stats-grid four">
                    <Stat
                      title="Active members"
                      value={
                        admin.users.filter((u: Item) => u.membership === "active" && !u.disabled)
                          .length
                      }
                      icon={Users}
                    />
                    <Stat
                      title="Published vouchers"
                      value={
                        admin.entities.filter(
                          (e: Item) => e.kind === "vouchers" && e.status === "published",
                        ).length
                      }
                      icon={Ticket}
                    />
                    <Stat
                      title="Event registrations"
                      value={admin.registrations.length}
                      icon={CalendarDays}
                    />
                    <Stat title="Awaiting a response" value={pending.length} icon={Mail} />
                  </div>
                  <div className="admin-grid">
                    <section className="admin-panel">
                      <div className="panel-heading">
                        <h2>Needs a little attention</h2>
                        <AppLink href="/admin?tab=requests">
                          View all <ArrowRight size={15} />
                        </AppLink>
                      </div>
                      {pending.length ? (
                        pending.slice(0, 5).map((s: Item) => {
                          const d = JSON.parse(s.data);
                          return (
                            <AppLink className="request-row" href="/admin?tab=requests" key={s.id}>
                              <div className="request-icon">
                                <HandHeart size={20} />
                              </div>
                              <div>
                                <strong>{d.name}</strong>
                                <span>
                                  {s.kind === "membership"
                                    ? "Membership payment verification"
                                    : s.kind + " request"}
                                </span>
                              </div>
                              <Badge tone="amber">New</Badge>
                              <ChevronRight size={17} />
                            </AppLink>
                          );
                        })
                      ) : (
                        <Empty
                          title="All caught up"
                          description="New community requests will appear here."
                        />
                      )}
                    </section>
                    <section className="admin-panel">
                      <div className="panel-heading">
                        <h2>Make something happen</h2>
                      </div>
                      {[
                        [
                          "events",
                          CalendarDays,
                          "Create an event",
                          "Bring your community together",
                        ],
                        ["vouchers", Ticket, "Add a member voucher", "Share a little local value"],
                        [
                          "businesses",
                          Building2,
                          "Add a local business",
                          "Grow your community network",
                        ],
                      ].map(([kind, Icon, t, d]: any) => (
                        <button
                          className="quick-action"
                          onClick={() =>
                            setEditor({
                              kind,
                              title: "",
                              status: "draft",
                              capacity: 100,
                              limit: 100,
                            })
                          }
                          key={kind}
                        >
                          <Icon />
                          <span>
                            <strong>{t}</strong>
                            <small>{d}</small>
                          </span>
                          <ArrowUpRight size={18} />
                        </button>
                      ))}
                    </section>
                  </div>
                  <section className="admin-panel">
                    <div className="panel-heading">
                      <h2>Latest community activity</h2>
                      <AppLink href="/admin?tab=activity">
                        View activity <ArrowRight size={15} />
                      </AppLink>
                    </div>
                    {admin.audit.length ? (
                      admin.audit.slice(0, 4).map((a: Item) => (
                        <div className="activity-row" key={a.id}>
                          <Activity size={16} />
                          <span>{a.action.replaceAll(".", " ")}</span>
                          <time>{new Date(a.created_at).toLocaleString("en-ZA")}</time>
                        </div>
                      ))
                    ) : (
                      <p className="muted panel-padding">
                        Your activity history will appear as the community grows.
                      </p>
                    )}
                  </section>
                </>
              )}
              {contentTab && (
                <>
                  <div className="table-toolbar">
                    <div className="search-control">
                      <Search size={17} />
                      <input
                        aria-label="Search content"
                        placeholder={"Search " + tab + "…"}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    {tab === "events" && (
                      <Button
                        className="outline"
                        onClick={() =>
                          exportCSV(
                            admin.registrations.map((r: Item) => ({
                              event:
                                admin.entities.find((e: Item) => e.id === r.event_id)?.title ||
                                r.event_id,
                              name:
                                r.details.name ||
                                admin.users.find((u: Item) => u.id === r.user_id)?.name,
                              email:
                                r.details.email ||
                                admin.users.find((u: Item) => u.id === r.user_id)?.email,
                              phone: r.details.phone,
                              business: r.details.business,
                              status: r.status,
                              amount: r.details.amount,
                              reference: r.details.reference,
                              registered: r.created_at,
                            })),
                            "event-registrations",
                          )
                        }
                      >
                        <Download size={16} />
                        Attendees
                      </Button>
                    )}
                    <Button
                      className="outline"
                      onClick={() =>
                        exportCSV(
                          admin.entities.filter((e: Item) => e.kind === tab),
                          tab,
                        )
                      }
                    >
                      <Download size={16} />
                      Export
                    </Button>
                  </div>
                  <div className="admin-panel table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>{tab === "businesses" ? "Business" : "Title"}</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>
                            {tab === "events"
                              ? "Date"
                              : tab === "vouchers"
                                ? "Expires"
                                : "Location"}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admin.entities
                          .filter(
                            (i: Item) =>
                              i.kind === tab &&
                              i.status !== "archived" &&
                              i.title.toLowerCase().includes(query.toLowerCase()),
                          )
                          .map((i: Item) => (
                            <tr key={i.id}>
                              <td>
                                <div className="table-title">
                                  {i.image && <img src={i.image} alt="" />}
                                  <span>
                                    <strong>{i.title}</strong>
                                    <small>{i.business || ""}</small>
                                  </span>
                                </div>
                              </td>
                              <td>{i.category || "—"}</td>
                              <td>
                                <Badge tone={i.status === "published" ? "green" : "amber"}>
                                  {i.status}
                                </Badge>
                              </td>
                              <td>
                                {tab === "events"
                                  ? dateLabel(i.date)
                                  : tab === "vouchers"
                                    ? dateLabel(i.expires)
                                    : i.location || "—"}
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button
                                    onClick={() => setEditor(i)}
                                    aria-label={"Edit " + i.title}
                                  >
                                    <Pencil size={17} />
                                  </button>
                                  <button
                                    onClick={() => setRemove(i)}
                                    aria-label={"Delete " + i.title}
                                  >
                                    <Trash2 size={17} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {!admin.entities.some(
                      (i: Item) => i.kind === tab && i.status !== "archived",
                    ) && (
                      <Empty
                        title={"No " + tab + " yet"}
                        description="Add your first item to get started."
                      />
                    )}
                  </div>
                </>
              )}
              {tab === "events" && <EventAttendees admin={admin} onUpdate={load} />}
              {tab === "members" && (
                <>
                  <div className="table-toolbar">
                    <div className="search-control">
                      <Search size={17} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search members"
                        aria-label="Search members"
                      />
                    </div>
                    <Button className="outline" onClick={() => exportCSV(admin.users, "members")}>
                      <Download size={16} />
                      Export
                    </Button>
                  </div>
                  <div className="admin-panel table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Membership</th>
                          <th>Valid until</th>
                          <th>Account</th>
                          <th>Manage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admin.users
                          .filter((u: Item) =>
                            (u.name + " " + u.email).toLowerCase().includes(query.toLowerCase()),
                          )
                          .map((u: Item) => (
                            <tr key={u.id}>
                              <td>
                                <strong>{u.name}</strong>
                                <small>{u.email}</small>
                              </td>
                              <td>
                                <Badge tone={u.membership === "active" ? "green" : "amber"}>
                                  {u.membership}
                                </Badge>
                              </td>
                              <td>{u.expires ? dateLabel(u.expires) : "—"}</td>
                              <td>
                                {u.disabled
                                  ? "Paused"
                                  : u.role === "admin"
                                    ? "Administrator"
                                    : "Enabled"}
                              </td>
                              <td>
                                <Button
                                  className="outline small"
                                  onClick={() => setEditor({ ...u, kind: "member" })}
                                >
                                  Manage <Pencil size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {tab === "requests" && (
                <>
                  <div className="table-toolbar">
                    <div className="filters">
                      {["", "membership", "donation", "sponsor", "contact"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setQuery(f)}
                          className={query === f ? "selected" : ""}
                        >
                          {f || "All requests"}
                        </button>
                      ))}
                    </div>
                    <Button
                      className="outline"
                      onClick={() =>
                        exportCSV(
                          admin.submissions.map((s: Item) => ({
                            ...s,
                            ...JSON.parse(s.data),
                            data: undefined,
                          })),
                          "requests",
                        )
                      }
                    >
                      <Download size={16} />
                      Export
                    </Button>
                  </div>
                  <div className="admin-panel table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>From</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Received</th>
                          <th>Review</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admin.submissions
                          .filter((s: Item) => !query || s.kind === query)
                          .map((s: Item) => {
                            const d = JSON.parse(s.data);
                            return (
                              <tr key={s.id}>
                                <td>
                                  <strong>{d.name}</strong>
                                  <small>{d.email}</small>
                                </td>
                                <td>{s.kind}</td>
                                <td>{d.amount ? money(d.amount) : "—"}</td>
                                <td>
                                  <Badge tone={s.status === "new" ? "amber" : "green"}>
                                    {s.status}
                                  </Badge>
                                </td>
                                <td>{new Date(s.created_at).toLocaleDateString("en-ZA")}</td>
                                <td>
                                  <Button
                                    className="outline small"
                                    onClick={() =>
                                      setEditor({
                                        ...s,
                                        kind: "request",
                                        requestKind: s.kind,
                                        ...d,
                                      })
                                    }
                                  >
                                    Review
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    {!admin.submissions.length && <Empty title="Ready for your first enquiry" />}
                  </div>
                </>
              )}
              {tab === "redemptions" && (
                <>
                  <div className="redeem-bar">
                    <div>
                      <h2>Validate a member voucher</h2>
                      <p>Check the code and mark the voucher as used.</p>
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const code = new FormData(form).get("code");
                        if (
                          await mutate("/admin/redeem", { code }, "Voucher redeemed successfully.")
                        )
                          form.reset();
                      }}
                    >
                      <input
                        name="code"
                        placeholder="SLK-XXXXXXXXXXXX"
                        aria-label="Voucher redemption code"
                        required
                      />
                      <Button type="submit">
                        <ShieldCheck size={17} />
                        Redeem voucher
                      </Button>
                    </form>
                  </div>
                  <div className="admin-panel table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Member</th>
                          <th>Voucher</th>
                          <th>Status</th>
                          <th>Claimed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admin.claims.map((c: Item) => (
                          <tr key={c.id}>
                            <td>
                              <code>{c.code}</code>
                            </td>
                            <td>
                              {admin.users.find((u: Item) => u.id === c.user_id)?.name || "Member"}
                            </td>
                            <td>
                              {admin.entities.find((v: Item) => v.id === c.voucher_id)?.title ||
                                "Archived offer"}
                            </td>
                            <td>
                              <Badge tone={c.status === "available" ? "green" : ""}>
                                {c.status}
                              </Badge>
                            </td>
                            <td>{new Date(c.created_at).toLocaleDateString("en-ZA")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!admin.claims.length && <Empty title="No vouchers claimed yet" />}
                  </div>
                </>
              )}
              {tab === "settings" && (
                <div className="form-card">
                  <h2>The details that make it yours</h2>
                  <form
                    className="form-grid two-column"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await mutate(
                        "/admin/settings",
                        Object.fromEntries(new FormData(e.target)),
                        "Website settings updated.",
                      );
                    }}
                  >
                    {[
                      ["headline", "Home headline"],
                      ["intro", "Home introduction"],
                      ["phone", "Contact phone"],
                      ["email", "Contact email"],
                      ["membershipPrice", "Annual membership (ZAR)"],
                      ["donationIntro", "Donation introduction"],
                      ["bankName", "Bank name"],
                      ["bankAccount", "Bank account"],
                      ["bankReference", "Payment reference prefix"],
                    ].map(([k, l]) => (
                      <Field
                        key={k}
                        label={l}
                        name={k}
                        type={k === "membershipPrice" ? "number" : k === "email" ? "email" : "text"}
                        min={k === "membershipPrice" ? 1 : undefined}
                        defaultValue={admin.settings[k]}
                        required={["headline", "intro", "membershipPrice", "phone"].includes(k)}
                      />
                    ))}
                    <p className="form-note full-width">
                      Only enter banking details after confirming them with the organisation. They
                      will be shown to signed-in members for payment arrangements.
                    </p>
                    <Button type="submit">
                      Save website settings <Check size={17} />
                    </Button>
                  </form>
                </div>
              )}
              {tab === "activity" && (
                <div className="admin-panel">
                  <div className="panel-heading">
                    <h2>Activity history</h2>
                    <Button
                      className="outline small"
                      onClick={() => exportCSV(admin.audit, "activity-log")}
                    >
                      Export <Download size={15} />
                    </Button>
                  </div>
                  {admin.audit.map((a: Item) => (
                    <div className="activity-row" key={a.id}>
                      <Activity size={16} />
                      <span>
                        <strong>{a.action.replaceAll(".", " ")}</strong>
                        <small>
                          {admin.users.find((u: Item) => u.id === a.user_id)?.name || "Member"} ·{" "}
                          {a.target}
                        </small>
                      </span>
                      <time>{new Date(a.created_at).toLocaleString("en-ZA")}</time>
                    </div>
                  ))}
                  {!admin.audit.length && (
                    <Empty
                      title="A fresh start"
                      description="Content changes, membership updates and voucher activity will be recorded here."
                    />
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <Dialog open={!!editor} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="slk-dialog editor-dialog">
          <DialogHeader>
            <DialogTitle>
              {editor?.kind === "member"
                ? "Manage membership"
                : editor?.kind === "request"
                  ? "Review community request"
                  : editor?.id
                    ? "Edit " + editor?.title
                    : "Create " +
                      (editor?.kind === "businesses" ? "business" : editor?.kind?.slice(0, -1))}
            </DialogTitle>
            <DialogDescription>
              {editor?.kind === "request"
                ? "Review the details and update the request."
                : "Your changes will be saved to this independent demo."}
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <form
              className="form-grid"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const endpoint =
                    editor.kind === "member"
                      ? "/admin/member"
                      : editor.kind === "request"
                        ? "/admin/submission"
                        : "/admin/entity";
                  if (await mutate(endpoint, editor)) setEditor(null);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {editor.kind === "member" ? (
                <>
                  <p>
                    <strong>{editor.name}</strong>
                    <br />
                    {editor.email}
                  </p>
                  <Field label="Membership status">
                    <select
                      value={editor.membership}
                      onChange={(e) => setEditor({ ...editor, membership: e.target.value })}
                    >
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending payment verification</option>
                      <option value="active">Active — payment verified</option>
                    </select>
                  </Field>
                  <Field
                    label="Membership expiry"
                    type="date"
                    value={editor.expires || ""}
                    required={editor.membership === "active"}
                    onChange={(e: any) => setEditor({ ...editor, expires: e.target.value })}
                  />
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={!!editor.disabled}
                      onChange={(e) => setEditor({ ...editor, disabled: e.target.checked })}
                    />
                    Pause this account
                  </label>
                  <div className="notice">
                    Only activate membership after confirming payment independently.
                  </div>
                </>
              ) : editor.kind === "request" ? (
                <>
                  <Badge>{editor.requestKind}</Badge>
                  <p>
                    <strong>{editor.name}</strong>
                    <br />
                    {editor.email}
                    <br />
                    {editor.phone}
                  </p>
                  {editor.company && <p>{editor.company}</p>}
                  <p>{editor.message || "No additional message."}</p>
                  {editor.amount > 0 && (
                    <p>
                      Amount: <strong>{money(editor.amount)}</strong>
                    </p>
                  )}
                  {editor.reference && <p>Payment reference: {editor.reference}</p>}
                  <Field label="Request status">
                    <select
                      value={editor.status}
                      onChange={(e) => setEditor({ ...editor, status: e.target.value })}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="verified">Verified / fulfilled</option>
                      <option value="closed">Closed</option>
                    </select>
                  </Field>
                  {editor.requestKind === "membership" && editor.status === "verified" && (
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={!!editor.paymentConfirmed}
                        required
                        onChange={(e) =>
                          setEditor({ ...editor, paymentConfirmed: e.target.checked })
                        }
                      />
                      I independently verified this membership payment. Activate access for one
                      year.
                    </label>
                  )}
                </>
              ) : (
                <>
                  <Field
                    label="Title / name"
                    required
                    value={editor.title || ""}
                    onChange={(e: any) => setEditor({ ...editor, title: e.target.value })}
                  />
                  <Field label="Description">
                    <textarea
                      rows={3}
                      value={editor.description || ""}
                      onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                    />
                  </Field>
                  <div className="two-column form-grid">
                    <Field
                      label="Category"
                      value={editor.category || ""}
                      onChange={(e: any) => setEditor({ ...editor, category: e.target.value })}
                    />
                    <Field label="Status">
                      <select
                        value={editor.status}
                        onChange={(e) => setEditor({ ...editor, status: e.target.value })}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="pending">Pending review</option>
                      </select>
                    </Field>
                  </div>
                  <Upload
                    value={editor.image}
                    onChange={(image: string) => setEditor({ ...editor, image })}
                  />
                  {editor.kind === "events" && (
                    <div className="form-grid two-column">
                      {[
                        ["date", "Event date", "date"],
                        ["time", "Start time", "time"],
                        ["location", "Venue", "text"],
                        ["capacity", "Capacity", "number"],
                        ["price", "Event contribution (ZAR)", "number"],
                      ].map(([k, l, t]) => (
                        <Field
                          key={k}
                          label={l}
                          type={t}
                          min={0}
                          value={editor[k] || ""}
                          onChange={(e: any) => setEditor({ ...editor, [k]: e.target.value })}
                        />
                      ))}
                    </div>
                  )}
                  {editor.kind === "vouchers" && (
                    <>
                      {[
                        ["business", "Business name", "text"],
                        ["benefit", "Offer (e.g. 20% off)", "text"],
                        ["expires", "Expiry date", "date"],
                        ["limit", "Total claims available", "number"],
                      ].map(([k, l, t]) => (
                        <Field
                          key={k}
                          label={l}
                          type={t}
                          required
                          value={editor[k] || ""}
                          min={1}
                          onChange={(e: any) => setEditor({ ...editor, [k]: e.target.value })}
                        />
                      ))}
                      <Field
                        label="Hours to redeem after claiming"
                        type="number"
                        min={1}
                        max={8760}
                        step={1}
                        required
                        value={editor.redeemHours ?? 48}
                        onChange={(e: any) => setEditor({ ...editor, redeemHours: e.target.value })}
                      />
                      <p className="form-note">
                        Default: 48 hours. Changes apply to new claims. Existing claimed vouchers
                        keep their saved deadline. The offer expiry takes precedence when earlier.
                      </p>
                      <Field label="Terms & redemption instructions">
                        <textarea
                          required
                          rows={3}
                          value={editor.terms || ""}
                          onChange={(e) => setEditor({ ...editor, terms: e.target.value })}
                        />
                      </Field>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={!!editor.demo}
                          onChange={(e) => setEditor({ ...editor, demo: e.target.checked })}
                        />
                        Label this as a demonstration offer
                      </label>
                    </>
                  )}
                  {["businesses", "sponsors"].includes(editor.kind) && (
                    <>
                      {[
                        ["phone", "Phone"],
                        ["email", "Email"],
                        ["website", "Website"],
                        ["location", "Location"],
                      ].map(([k, l]) => (
                        <Field
                          key={k}
                          label={l}
                          type={k === "website" ? "url" : k === "email" ? "email" : "text"}
                          value={editor[k] || ""}
                          onChange={(e: any) => setEditor({ ...editor, [k]: e.target.value })}
                        />
                      ))}
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={!!editor.publicContact}
                          onChange={(e) =>
                            setEditor({ ...editor, publicContact: e.target.checked })
                          }
                        />
                        Show contact details publicly
                      </label>
                    </>
                  )}
                </>
              )}
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save changes"} <Check size={16} />
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!remove} onOpenChange={(v) => !v && setRemove(null)}>
        <AlertDialogContent className="slk-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {remove?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the item from the website. Existing voucher and event history will be
              retained.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep item</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await mutate("/admin/delete", { id: remove?.id }, "Item removed from the website.");
                setRemove(null);
              }}
            >
              Remove item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
function Privacy() {
  return (
    <div className="page-wrap">
      <PageTitle eyebrow="YOUR INFORMATION" title="A little care for your privacy." />
      <div className="form-card narrow">
        <p>
          We use the information you submit to manage your membership, respond to enquiries,
          coordinate events and keep a record of voucher activity.
        </p>
        <p>
          Business listings are reviewed before publication. You choose whether business contact
          details are public or visible only to paid members.
        </p>
        <p>
          Account and payment-verification information is accessible to authorised administrators.
          No card details are collected by this demo.
        </p>
        <p>
          Contact the SLKD team to request a correction or discuss removing your information. This
          demo privacy notice must be reviewed by the organisation before a public launch.
        </p>
        <Button href="/contact">Contact the team</Button>
      </div>
    </div>
  );
}
export default function Platform() {
  const loc = useLocation();
  const path = loc.pathname;
  const search = new URLSearchParams(loc.searchStr);
  const [data, setData] = useState<any>({ settings: defaultSettings, entities: initialEntities });
  const [session, setSession] = useState<any>({
    user: null,
    signedIn: false,
    adminConfigured: true,
  });
  const [error, setError] = useState("");
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const refresh = async () => {
    try {
      let s = await api("/session");
      if (s.signedIn && !s.user) {
        await api("/signin", {});
        s = await api("/session");
      }
      setSession(s);
      setSessionLoaded(true);
      const d = await api("/public");
      setData(d);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  };
  useEffect(() => {
    refresh();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  const admin = path.startsWith("/admin");
  let page = <Home />;
  if (path === "/events" || path === "/app/events" || path === "/app/breakfast") page = <Events />;
  else if (path === "/about") page = <About />;
  else if (path === "/vouchers" || path.startsWith("/app/voucher")) page = <Vouchers />;
  else if (path === "/businesses") page = <Businesses />;
  else if (path === "/membership" || path === "/signup" || path === "/onboarding")
    page = <Membership />;
  else if (path === "/sponsor") page = <Giving kind="sponsor" />;
  else if (path === "/donate") page = <Giving kind="donation" />;
  else if (path === "/contact") page = <Contact />;
  else if (path === "/privacy") page = <Privacy />;
  else if (
    path === "/member" ||
    path === "/login" ||
    path === "/access-code" ||
    path.startsWith("/app")
  )
    page = <Member />;
  else if (admin) page = <Admin />;
  return (
    <Context.Provider value={{ data, session, refresh, path, search, sessionLoaded }}>
      <div className={"slk-app editorial-theme " + (admin ? "admin-view" : "public-view")}>
        <AppLink href="#main-content" className="skip-link">
          Skip to content
        </AppLink>
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button onClick={refresh}>Try again</button>
          </div>
        )}
        {admin ? (
          page
        ) : (
          <>
            <Header />
            <main id="main-content">{page}</main>
            <Footer />
          </>
        )}
        <Toaster position="bottom-right" richColors />
      </div>
    </Context.Provider>
  );
}
