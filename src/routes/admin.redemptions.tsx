import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/redemptions")({
  head: () => pageSEO("/admin/redemptions"),
  component: () => null,
});
