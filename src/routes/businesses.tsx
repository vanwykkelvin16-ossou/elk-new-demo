import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
import Platform from "@/platform/Platform";
export const Route = createFileRoute("/businesses")({
  head: () => pageSEO("/businesses"),
  component: Platform,
});
