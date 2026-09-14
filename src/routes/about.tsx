import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
import Platform from "@/platform/Platform";
export const Route = createFileRoute("/about")({
  head: () => pageSEO("/about"),
  component: Platform,
});
