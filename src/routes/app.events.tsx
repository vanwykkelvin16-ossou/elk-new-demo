import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/events")({
  head: () => pageSEO("/app/events"),
  component: () => null,
});
