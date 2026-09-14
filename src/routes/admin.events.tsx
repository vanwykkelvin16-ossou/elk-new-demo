import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/events")({
  head: () => pageSEO("/admin/events"),
  component: () => null,
});
