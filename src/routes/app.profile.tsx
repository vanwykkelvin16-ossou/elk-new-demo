import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/profile")({
  head: () => pageSEO("/app/profile"),
  component: () => null,
});
