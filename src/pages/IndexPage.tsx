import { Navigate } from "@tanstack/react-router";
import { useStore, loadCurrentUser } from "../app/store";

export function IndexPage() {
  const store = useStore();
  const currentUser = store.currentUser || loadCurrentUser();

  if (currentUser) {
    if (currentUser.role === "superadmin") return <Navigate to="/super-admin" search={{ tab: "live" }} />;
    if (currentUser.role === "manager") return <Navigate to="/manager" search={{ tab: "overview" }} />;
    return <Navigate to="/employee" search={{ tab: "overview" }} />;
  }

  return <Navigate to="/login" />;
}
