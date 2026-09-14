import { createFileRoute } from "@tanstack/react-router";
import Platform from "@/platform/Platform";
import { pageSEO } from "@/platform/seo";
export const Route = createFileRoute("/reset-password")({
  head: () => pageSEO("/reset-password"),
  component: Platform,
});
