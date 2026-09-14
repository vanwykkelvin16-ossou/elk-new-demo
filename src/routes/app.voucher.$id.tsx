import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/voucher/$id")({
  head: () => pageSEO("/app/voucher/$id"),
  component: () => null,
});
