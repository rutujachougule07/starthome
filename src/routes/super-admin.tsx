import { createFileRoute } from "@tanstack/react-router";
import { SuperAdminPage } from "../pages/SuperAdminPage";

export const Route = createFileRoute("/super-admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "live",
  }),
  component: () => {
    const search = Route.useSearch();
    return <SuperAdminPage tab={search.tab} />;
  },
  head: () => ({ meta: [{ title: "Super Admin — Smart Home Appliances" }] }),
});

export { NotificationsSection, ProfileSection, OrdersTable, EmployeeForm } from "../pages/SuperAdminPage";