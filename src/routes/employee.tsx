import { createFileRoute } from "@tanstack/react-router";
import { EmployeePage } from "../pages/EmployeePage";

export const Route = createFileRoute("/employee")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "overview",
  }),
  component: () => {
    const search = Route.useSearch();
    return <EmployeePage tab={search.tab} />;
  },
  head: () => ({ meta: [{ title: "Employee — Smart Home Appliances" }] }),
});