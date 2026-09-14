import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/vouchers")({
  head: () => pageSEO("/app/vouchers"),
  component: () => null,
});
