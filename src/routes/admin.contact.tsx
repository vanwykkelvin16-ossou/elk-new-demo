import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/contact")({
  head: () => pageSEO("/admin/contact"),
  component: () => null,
});
