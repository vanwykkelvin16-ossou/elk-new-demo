import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/shop")({
  head: () => pageSEO("/app/shop"),
  component: () => null,
});
