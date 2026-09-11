import { useEffect, useState, createContext, useContext } from "react";
import { useLocation } from "@tanstack/react-router";
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
import { defaultSettings, initialEntities } from "./seed";
import "./platform.css";
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
function Logo() {
  return (
    <a href="/" className="logo" aria-label="So Love Krugersdorp home">
      <img src="/brand-heart.png" alt="" />
      <span>
        so love<span>KRUGERSDORP</span>
      </span>
    </a>
  );
}
function Button({ children, href, className = "", ...props }: any) {
  return href ? (
    <a className={"button " + className} href={href} {...props}>
      {children}
    </a>
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
function PageTitle({ eyebrow, title, description, children }: any) {
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
  const { session, path } = useSite();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="topbar">
        <span>Rooted in faith. Connected by community.</span>
        <a href="/sponsor">
          Make a difference <ArrowUpRight size={13} />
        </a>
      </div>
      <header className="header">
        <Logo />
        <nav className={open ? "nav open" : "nav"} aria-label="Main navigation">
          {publicNav.map(([href, label]) => (
            <a key={href} href={href} className={path === href ? "active" : ""}>
              {label}
            </a>
          ))}
          <a className="mobile-only" href="/contact">
            Contact us
          </a>
        </nav>
        <div className="header-actions">
          <a href="/member" className="login-link">
            {session.user ? "My account" : "Member login"}
          </a>
          <Button href="/membership">
            Become a member <ArrowUpRight size={16} />
          </Button>
          <button
            className="menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
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
          <a href="/about">Our story</a>
          <a href="/events">Community events</a>
          <a href="/businesses">Business directory</a>
          <a href="/vouchers">Member vouchers</a>
        </div>
        <div>
          <h4>Make a difference</h4>
          <a href="/membership">Become a member</a>
          <a href="/sponsor">Become a sponsor</a>
          <a href="/donate">Give a donation</a>
          <a href="/contact">Contact us</a>
        </div>
        <div>
          <h4>Let's connect</h4>
          <a href={"tel:" + data.settings.phone.replace(/\s/g, "")}>{data.settings.phone}</a>
          <span>Krugersdorp, Gauteng</span>
          <a href="/member">
            Member portal <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} So Love Krugersdorp</span>
        <div>
          <a href="/privacy">Privacy</a>
          <a href="/admin">
            Admin portal <LockKeyhole size={12} />
          </a>
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
      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>A COMMUNITY WITH HEART</Eyebrow>
          <h1>
            {data.settings.headline === defaultSettings.headline ? (
              <>
                A little love.
                <br />A stronger
                <br />
                <em>Krugersdorp.</em>
              </>
            ) : (
              data.settings.headline
            )}
          </h1>
          <p>{data.settings.intro}</p>
          <div className="button-row">
            <Button href="/membership">
              Find your place <ArrowUpRight size={18} />
            </Button>
            <a className="text-link" href="/about">
              Meet our community <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-note">
            <div className="mini-hearts">
              <Heart />
              <Building2 />
              <Users />
            </div>
            <span>
              Local people. Shared purpose.
              <br />
              <strong>A town worth coming together for.</strong>
            </span>
          </div>
        </div>
        <div className="hero-photo">
          <img
            src="/community/gathering.jpg"
            alt="The Krugersdorp community gathered for Speak Jesus"
            fetchPriority="high"
          />
          <div className="photo-shade" />
          <span className="photo-label">
            <MapPin size={15} /> KRUGERSDORP, SOUTH AFRICA
          </span>
          <div className="photo-caption">
            <span>
              One town.
              <br />
              So much heart.
            </span>
            <div className="photo-heart">
              <Heart size={36} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </section>
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
            <a className="action-card" href={href} key={n}>
              <div className="action-top">
                <Icon />
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <ArrowUpRight className="card-arrow" />
            </a>
          ))}
        </div>
      </section>
      <section className="story-band">
        <div className="story-image">
          <img
            src="/community/outreach.jpg"
            alt="People connecting at a So Love Krugersdorp community gathering"
            loading="lazy"
          />
        </div>
        <div>
          <Eyebrow>LOCAL ROOTS. SHARED HOPE.</Eyebrow>
          <h2>
            We believe in
            <br />
            the good in
            <br />
            <em>our town.</em>
          </h2>
          <p>
            Born from the vision of Speak Jesus, So Love Krugersdorp brings faith and practical care
            into community life.
          </p>
          <p>
            We connect residents, businesses and ministries around a shared purpose: helping
            Krugersdorp flourish.
          </p>
          <Button href="/about" className="outline">
            This is our story <ArrowUpRight size={18} />
          </Button>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <Eyebrow>MAKE TIME FOR COMMUNITY</Eyebrow>
            <h2>Better when we're together.</h2>
          </div>
          <a className="text-link" href="/events">
            Explore events <ArrowRight size={18} />
          </a>
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
    <a href={"/events?event=" + item.id} className="event-card">
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
    </a>
  );
}
function Events() {
  const { data, session, search } = useSite();
  const [filter, setFilter] = useState("All events");
  const items = data.entities.filter((i: Item) => i.kind === "events");
  const selected = items.find((i: Item) => i.id === search.get("event"));
  const register = async () => {
    try {
      await api("/register", { id: selected.id });
      toast.success(selected.date ? "You are registered." : "Your interest has been registered.");
    } catch (e: any) {
      toast.error(e.message);
    }
  };
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
          if (!v) window.location.href = "/events";
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
              {selected.price > 0 && (
                <p>
                  Event contribution: {money(selected.price)}. Payment arrangements will be
                  confirmed by the team.
                </p>
              )}
              {session.user ? (
                <Button onClick={register}>
                  {selected.date ? "Register for this event" : "Register my interest"}
                  <ArrowUpRight size={16} />
                </Button>
              ) : (
                <Button href="/member">
                  Sign in to register <ArrowUpRight size={16} />
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
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
          <img src="/community/team.jpg" alt="Community members meeting at Curamus School" />
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
      await api("/claim", { id: selected?.id });
      toast.success("Voucher added to your wallet.");
      setSelected(null);
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
        <a href={session.user?.active ? "/member?tab=wallet" : "/membership"}>
          {session.user?.active ? "Open my wallet" : "Unlock member benefits"}{" "}
          <ArrowRight size={17} />
        </a>
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
              <div className="ticket-divider" />
              <div className="card-foot">
                <span>{session.user?.active ? "View & claim" : "Members-only access"}</span>
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
              </div>
              {session.user?.active ? (
                <Button onClick={claim} disabled={busy}>
                  {busy ? "Claiming…" : "Add to my vouchers"} <Ticket size={16} />
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
                <a href={"tel:" + selected.phone}>
                  <Phone />
                  {selected.phone}
                </a>
              )}
              {selected?.email && (
                <a href={"mailto:" + selected.email}>
                  <Mail />
                  {selected.email}
                </a>
              )}
              {selected?.website && (
                <a href={selected.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  Visit website
                </a>
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
function Membership() {
  const { data, session } = useSite();
  return (
    <div className="page-wrap">
      <PageTitle
        eyebrow="BELONG TO SOMETHING GOOD"
        title="Your community. Your membership."
        description="Support local connections and enjoy the benefits of being part of So Love Krugersdorp."
      />
      <div className="membership-grid">
        <div className="benefit-list">
          <h2>
            More than a membership.
            <br />A place to belong.
          </h2>
          {[
            ["A community of connections", "Meet people who share your care for our town."],
            [
              "Member-only vouchers",
              "Claim local offers and keep your voucher history in one place.",
            ],
            [
              "A place for your business",
              "Create your business profile and connect with the network.",
            ],
            ["Moments that matter", "Discover events and register your interest."],
          ].map(([t, d]) => (
            <div className="benefit-row" key={t}>
              <span>
                <Check size={19} />
              </span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pricing-card">
          <Badge>ANNUAL MEMBERSHIP</Badge>
          <h3>
            A little commitment.
            <br />A lot of local love.
          </h3>
          <div className="price">
            {money(data.settings.membershipPrice)}
            <span>/ year</span>
          </div>
          <p>One membership. Your connection to the community.</p>
          <hr />
          <ul>
            <li>
              <Check />
              Local voucher access
            </li>
            <li>
              <Check />
              Business profile & directory
            </li>
            <li>
              <Check />
              Your personal member portal
            </li>
            <li>
              <Check />
              Voucher wallet & history
            </li>
          </ul>
          <Button href={session.user ? "/member?tab=membership" : "/member"}>
            {session.user?.active ? "View my membership" : "Become a member"}{" "}
            <ArrowUpRight size={17} />
          </Button>
          <small>Membership starts after the team verifies your payment.</small>
        </div>
      </div>
      <div className="steps">
        <div>
          <span>01</span>
          <h3>Create your account</h3>
          <p>Sign in and tell us a little about yourself.</p>
        </div>
        <div>
          <span>02</span>
          <h3>Arrange your payment</h3>
          <p>Submit your membership request and payment reference.</p>
        </div>
        <div>
          <span>03</span>
          <h3>You're part of the community</h3>
          <p>Once verified, your member benefits are ready to use.</p>
        </div>
      </div>
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
      <Field
        label="Full name"
        value={values.name}
        required
        maxLength={120}
        onChange={(e: any) => set("name", e.target.value)}
      />
      <Field
        label="Email address"
        type="email"
        value={values.email}
        required
        onChange={(e: any) => set("email", e.target.value)}
      />
      <Field
        label="Phone number"
        type="tel"
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
          <a href="/privacy">Privacy notice</a>
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
function Giving({ kind }: any) {
  const { data } = useSite();
  return (
    <div className="page-wrap">
      <PageTitle
        eyebrow={kind === "sponsor" ? "PARTNER WITH PURPOSE" : "GIVE CLOSE TO HOME"}
        title={
          kind === "sponsor"
            ? "Your business. A bigger difference."
            : "A little generosity goes a long way."
        }
        description={
          kind === "sponsor"
            ? "Bring your resources, skills and care to a community that needs all of us."
            : data.settings.donationIntro
        }
      />
      <div className="giving-grid">
        <div>
          <img
            src="/community/team.jpg"
            className="giving-image"
            alt="Local community members working together"
          />
          <h2>{kind === "sponsor" ? "Together, we can do more." : "Turn care into action."}</h2>
          <p>
            {kind === "sponsor"
              ? "Sponsor an initiative, offer a service or contribute to a community event. Tell us what you have in mind and we will find a way to work together."
              : "Every contribution starts a conversation about what our community needs. Pledge an amount and our team will help you with the next step."}
          </p>
          <div className="giving-points">
            <span>
              <Heart />
              Community initiatives
            </span>
            <span>
              <Users />
              Local opportunities
            </span>
            <span>
              <HandHeart />
              Practical support
            </span>
          </div>
        </div>
        <div className="form-card">
          <h3>{kind === "sponsor" ? "Let’s make a connection" : "Make a donation pledge"}</h3>
          <RequestForm kind={kind} />
        </div>
      </div>
      {kind === "sponsor" && (
        <div className="section">
          <h2>Our partners in good.</h2>
          <div className="business-grid">
            {data.entities
              .filter((e: Item) => e.kind === "sponsors")
              .map((e: Item) => (
                <a href={e.website || "/contact"} className="business-card" key={e.id}>
                  {e.image && <img className="sponsor-logo" src={e.image} alt={e.title} />}
                  <h3>{e.title}</h3>
                  <p>{e.description}</p>
                </a>
              ))}
          </div>
        </div>
      )}
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
          <a href={"tel:" + data.settings.phone.replace(/\s/g, "")}>
            <Phone />
            {data.settings.phone}
          </a>
          {data.settings.email && (
            <a href={"mailto:" + data.settings.email}>
              <Mail />
              {data.settings.email}
            </a>
          )}
          <p>
            <MapPin />
            Krugersdorp, Gauteng, South Africa
          </p>
          <img src="/community/outreach.jpg" alt="SLKD community gathering" />
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
  const { session } = useSite();
  return (
    <div className="signin-panel">
      <div>
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
        <h2>Good to have you here.</h2>
        <p>Sign in securely to create or access your personal account.</p>
        <Button href="/signin-with-chatgpt?return_to=%2Fmember" target="_top">
          Sign in with ChatGPT <ArrowUpRight size={18} />
        </Button>
        <small>
          This demo uses your ChatGPT account for secure sign-in. Paid membership is verified
          separately.
        </small>
        <a className="text-link" href="/membership">
          Explore member benefits <ArrowRight size={16} />
        </a>
      </div>
    </div>
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
  const { session, refresh, search, data } = useSite();
  const [member, setMember] = useState<any>(null);
  const [error, setError] = useState("");
  const tab = search.get("tab") || "overview";
  const load = () =>
    api("/member")
      .then(setMember)
      .catch((e: any) => setError(e.message));
  useEffect(() => {
    if (session.user) load();
  }, [session.user?.id]);
  if (!session.user) return <SignIn />;
  if (!member)
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
        {[
          ["overview", "Overview"],
          ["wallet", "My vouchers"],
          ["events", "My events"],
          ["business", "Business profile"],
          ["membership", "Membership"],
          ["profile", "My details"],
        ].map(([id, label]) => (
          <a key={id} className={tab === id ? "selected" : ""} href={"/member?tab=" + id}>
            {label}
          </a>
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
            <a href="/signout-with-chatgpt?return_to=%2F" target="_top" className="text-link">
              Sign out <LogOut size={16} />
            </a>
          </div>
        </>
      )}
      {tab === "wallet" && (
        <>
          <h2>Your voucher wallet</h2>
          <p className="muted">
            Present your code to the SLKD team for validation. Each voucher can be redeemed once.
          </p>
          {!member.claims.length ? (
            <Empty
              title="Your wallet is ready for a little local love"
              description="Claim your first voucher to get started."
            >
              <Button href="/vouchers">
                Browse vouchers <ArrowRight size={16} />
              </Button>
            </Empty>
          ) : (
            <div className="wallet-grid">
              {member.claims.map((c: Item) => {
                const v = data.entities.find((i: Item) => i.id === c.voucher_id);
                return (
                  <div className="wallet-card" key={c.id}>
                    <Badge tone={c.status === "redeemed" ? "" : "green"}>{c.status}</Badge>
                    <h3>{v?.title || "Archived offer"}</h3>
                    <p>{v?.business}</p>
                    <code>{c.code}</code>
                    <p>Claimed {new Date(c.created_at).toLocaleDateString("en-ZA")}</p>
                    {c.redeemed_at && (
                      <p>Redeemed {new Date(c.redeemed_at).toLocaleDateString("en-ZA")}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {tab === "events" && (
        <>
          <h2>Your community calendar</h2>
          {member.registrations.length ? (
            <div className="cards-grid">
              {member.registrations.map((r: Item) => {
                const item = data.entities.find((i: Item) => i.id === r.event_id);
                return item ? (
                  <EventCard item={item} key={r.id} />
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
            <p className="form-note">Your email comes from your secure sign-in account.</p>
            <Button type="submit">
              Save details <Check size={16} />
            </Button>
          </form>
        </div>
      )}
    </div>
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
  const { session, refresh, search, path } = useSite();
  const [admin, setAdmin] = useState<any>(null);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<Item | null>(null);
  const [remove, setRemove] = useState<Item | null>(null);
  const [query, setQuery] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const alias:Record<string,string>={contact:"settings",breakfast:"events",shop:"overview"};
  const rawTab = search.get("tab") || path.split("/")[2] || "overview";
  const tab=alias[rawTab]||rawTab;
  const load = () =>
    api("/admin")
      .then(setAdmin)
      .catch((e: any) => setError(e.message));
  useEffect(() => {
    if (session.user?.role === "admin") load();
  }, [session.user?.role]);
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
            <a href="/member" className="text-link">
              Back to my account
            </a>
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
            <a key={id} href={"/admin?tab=" + id} className={tab === id ? "selected" : ""}>
              <Icon size={18} />
              {label}
              {id === "requests" && pending.length > 0 && <b>{pending.length}</b>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/">
            <ArrowUpRight size={17} />
            View website
          </a>
          <a href="/member">
            <Users size={17} />
            My member account
          </a>
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
          <a href="/" className="text-link">
            View website <ArrowUpRight size={16} />
          </a>
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
                        <a href="/admin?tab=requests">
                          View all <ArrowRight size={15} />
                        </a>
                      </div>
                      {pending.length ? (
                        pending.slice(0, 5).map((s: Item) => {
                          const d = JSON.parse(s.data);
                          return (
                            <a className="request-row" href="/admin?tab=requests" key={s.id}>
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
                            </a>
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
                      <a href="/admin?tab=activity">
                        View activity <ArrowRight size={15} />
                      </a>
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
                    {tab === "events" && <Button className="outline" onClick={() => exportCSV(admin.registrations.map((r:Item)=>({event:admin.entities.find((e:Item)=>e.id===r.event_id)?.title||r.event_id,name:admin.users.find((u:Item)=>u.id===r.user_id)?.name,email:admin.users.find((u:Item)=>u.id===r.user_id)?.email,registered:r.created_at})),"event-registrations")}><Download size={16}/>Attendees</Button>}
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
  const refresh = async () => {
    try {
      let s = await api("/session");
      if (s.signedIn && !s.user) {
        await api("/signin", {});
        s = await api("/session");
      }
      setSession(s);
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
    <Context.Provider value={{ data, session, refresh, path, search }}>
      <div className="slk-app">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
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
