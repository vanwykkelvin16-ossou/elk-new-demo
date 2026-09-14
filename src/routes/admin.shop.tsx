import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/shop")({
  head: () => pageSEO("/admin/shop"),
  component: () => null,
});
