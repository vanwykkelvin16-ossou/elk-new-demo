import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
import Platform from "@/platform/Platform";
export const Route = createFileRoute("/login")({
  head: () => pageSEO("/login"),
  component: Platform,
});
