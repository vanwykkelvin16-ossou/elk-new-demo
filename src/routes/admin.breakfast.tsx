import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/breakfast")({
  head: () => pageSEO("/admin/breakfast"),
  component: () => null,
});
