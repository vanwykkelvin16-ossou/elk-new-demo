import { pageSEO } from "@/platform/seo";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/my-vouchers")({
  head: () => pageSEO("/app/my-vouchers"),
  component: () => null,
});
