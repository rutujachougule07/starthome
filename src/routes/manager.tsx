import { createFileRoute } from "@tanstack/react-router";
import { ManagerPage } from "../pages/ManagerPage";

export const Route = createFileRoute("/manager")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "overview",
  }),
  component: () => {
    const search = Route.useSearch();
    return <ManagerPage tab={search.tab} />;
  },
  head: () => ({ meta: [{ title: "Manager — Smart Home Appliances" }] }),
});