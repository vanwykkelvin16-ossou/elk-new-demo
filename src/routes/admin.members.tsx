import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/members")({
  head: () => pageSEO("/admin/members"),
  component: () => null,
});
