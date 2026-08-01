import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, useRouter, HeadContent, Scripts, useNavigate } from "@tanstack/react-router";
import { StoreProvider, useStore, User } from "../app/store";
import { useState } from "react";

export function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}



export function RootComponent({ queryClient }: { queryClient: QueryClient }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <Outlet />
        <QuickRoleSwitcher />
      </StoreProvider>
    </QueryClientProvider>
  );
}

function QuickRoleSwitcher() {
  const store = useStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (store.currentUser?.role === "employee") {
    return null;
  }

  const switchRole = (role: "superadmin" | "manager" | "employee" | "logout", employeeObj?: User) => {
    setIsOpen(false);
    if (role === "logout") {
      sessionStorage.removeItem("employee_verified");
      store.logout();
      navigate({ to: "/login" });
      return;
    }

    let targetUser = null;
    let targetPath = "/login";
    let searchParams = {};

    if (role === "superadmin") {
      targetUser = store.users.find(u => u.role === "superadmin") || ({ id: "u1", name: "Super Admin", username: "admin@gmail.com", role: "superadmin", email: "admin@gmail.com" } as User);
      targetPath = "/super-admin";
      searchParams = { tab: "live" };
    } else if (role === "manager") {
      targetUser = store.users.find(u => u.role === "manager") || store.users.find(u => u.id === "u2") || ({ id: "u2", name: "Rohan Patil", username: "manager@gmail.com", role: "manager" } as User);
      targetPath = "/manager";
      searchParams = { tab: "overview" };
    } else if (role === "employee" && employeeObj) {
      targetUser = employeeObj;
      targetPath = "/employee";
      searchParams = { tab: "overview" };
      sessionStorage.setItem("employee_verified", "true");
    }

    if (targetUser) {
      store.setState(s => ({ ...s, currentUser: targetUser as User }));
      navigate({ to: targetPath, search: searchParams });
    }
  };

  return null;
}

const btnStyle = {
  padding: "8px 10px",
  background: "#faf1dd",
  color: "#4a371d",
  border: "1px solid #e6d6b8",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "left" as const,
  display: "flex",
  alignItems: "center",
  gap: 8,
  transition: "background 0.2s"
};
