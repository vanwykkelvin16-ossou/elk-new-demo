import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/vouchers")({
  head: () => pageSEO("/admin/vouchers"),
  component: () => null,
});
