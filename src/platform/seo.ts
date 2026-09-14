export const siteOrigin = "https://so-love-krugersdorp-new-demo.kelvinwjg.chatgpt.site";
export const publicPages: Record<string, [string, string]> = {
  "/": [
    "So Love Krugersdorp — A community with heart",
    "Discover community events, local businesses and member vouchers in Krugersdorp. Join So Love and help make a difference.",
  ],
  "/about": [
    "Our story | So Love Krugersdorp",
    "Meet the purpose behind So Love Krugersdorp: connecting neighbours, supporting local businesses and putting care into action.",
  ],
  "/events": [
    "Community events | So Love Krugersdorp",
    "Find So Love Krugersdorp gatherings and community events. View dates, venues and registration details.",
  ],
  "/businesses": [
    "Local business directory | So Love Krugersdorp",
    "Discover businesses, ministries and community organisations in Krugersdorp and connect with your local community.",
  ],
  "/vouchers": [
    "Member vouchers | So Love Krugersdorp",
    "Browse local member offers. Active members can claim vouchers, manage their wallet and redeem with participating businesses.",
  ],
  "/membership": [
    "Become a member | So Love Krugersdorp",
    "Join So Love Krugersdorp for local connections, community events and member voucher benefits.",
  ],
  "/sponsor": [
    "Become a sponsor | So Love Krugersdorp",
    "Support local community projects and explore sponsorship opportunities with So Love Krugersdorp.",
  ],
  "/donate": [
    "Support our community | So Love Krugersdorp",
    "Pledge a donation to support practical community work in Krugersdorp. The So Love team will help arrange your contribution.",
  ],
  "/contact": [
    "Contact the team | So Love Krugersdorp",
    "Contact So Love Krugersdorp for membership, events, sponsorship, donations or help with your member account.",
  ],
  "/privacy": [
    "Privacy notice | So Love Krugersdorp",
    "Read how So Love Krugersdorp uses membership, event, business listing and voucher information.",
  ],
};
export function pageSEO(path: string) {
  const page = publicPages[path];
  const title = page?.[0] || "Your account | So Love Krugersdorp";
  const description = page?.[1] || "Secure access to your So Love Krugersdorp account.";
  return {
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "robots",
        content: page ? "index,follow,max-image-preview:large" : "noindex,nofollow",
      },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "So Love Krugersdorp" },
      { property: "og:locale", content: "en_ZA" },
      { property: "og:url", content: siteOrigin + path },
      { name: "twitter:card", content: "summary" },
    ],
    links: page ? [{ rel: "canonical", href: siteOrigin + path }] : [],
  };
}
