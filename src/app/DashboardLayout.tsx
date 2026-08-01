import { ReactNode, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useStore, Role } from "./store";

export interface NavItem { key: string; label: string; icon: string; }

interface Props {
  role: Role;
  title: string;
  nav: NavItem[];
  active: string;
  onNav: (key: string) => void;
  children: ReactNode;
}

export function DashboardLayout({ role, title, nav, active, onNav, children }: Props) {
  const { currentUser, logout, notifications, orders, tasks } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const seen = new Set<string>();
  const filteredNotifications = notifications.filter((n) => {
    if (n.to !== role && n.to !== "all") return false;

    // Filter out duplicates
    const key = `${n.to}-${n.message}`;
    if (seen.has(key)) return false;
    seen.add(key);

    const msg = n.message.toLowerCase();
    if (msg.includes("pending")) {
      const match = n.message.match(/pending for\s+(.+)/i);
      if (match) {
        const customerName = match[1].trim().toLowerCase();
        const hasPending = orders.some(o => o.customerName.toLowerCase() === customerName && o.status === "Pending");
        if (!hasPending) return false;
      } else if (msg.includes("pending for approval")) {
        const hasPending = orders.some(o => o.status === "Pending" && !o.isIncentive && o.customerId !== "c_incentive" && o.customerName !== "Incentive Sell Request");
        if (!hasPending) return false;
      }
    }
    return true;
  });

  const unread = filteredNotifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const getBadgeCount = (key: string): number => {
    if (key === "notifications") {
      return unread;
    }
    if (role === "superadmin" && key === "orders") {
      return orders.filter((o) => o.status === "Pending" && !o.isIncentive && o.customerId !== "c_incentive" && o.customerName !== "Incentive Sell Request").length;
    }
    if (role === "employee" && key === "tasks" && currentUser) {
      return tasks.filter((t) => t.assignedTo === currentUser.id && t.status !== "Completed").length;
    }
    if (role === "employee" && key === "orders" && currentUser) {
      return orders.filter((o) => o.assignedTo === currentUser.id && o.sentToEmployee && o.status === "Approved").length;
    }
    return 0;
  };

  const initials = (currentUser?.name ?? "Vaishnavi Bhosale").split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <div className="sham-app">
      <div className="dash">
        <div className={`sidebar-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
        {/* FULL HEIGHT REFERENCE MATCHING SOFT LAVENDER SIDEBAR */}
        <aside className={`sidebar ${open ? "open" : ""}`}>
          {/* Top Section: Brand + Navigation Links */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* Brand Logo Header */}
            <div className="sidebar-brand">
              <span className="logo-sq">⚡</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.4px", lineHeight: 1.1 }}>ElectroHub</span>
                <span style={{ fontSize: "12px", color: "#556052", fontWeight: 600 }}>Electric Shop</span>
              </div>
            </div>

            {/* Navigation items (Fixed non-scrolling container) */}
            <div className="sidebar-nav-container" style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden"
            }}>
              {nav.map((n) => {
                const badgeCount = getBadgeCount(n.key);
                const isActive = active === n.key;
                return (
                  <button
                    key={n.key}
                    className={`sidebar-item nav-item ${isActive ? "active" : ""}`}
                    onClick={() => { onNav(n.key); setOpen(false); }}
                  >
                    <span className="nav-icon">{n.icon}</span>
                    <span className="nav-label">{n.label}</span>
                    {badgeCount > 0 && (
                      <span className="nav-badge" style={{
                        background: isActive ? "rgba(255, 255, 255, 0.25)" : "#EDE4FF",
                        color: isActive ? "#FFFFFF" : "#7C3AED",
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        marginLeft: "auto"
                      }}>
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Section: Pinned Logout Link matching Image 2 */}
          <div style={{ paddingTop: "12px", borderTop: "1px solid #E2E8F0", marginTop: "8px" }}>
            <button
              type="button"
              className="sidebar-item nav-item"
              onClick={handleLogout}
              style={{
                color: "#E11D48",
                height: "48px"
              }}
            >
              <span style={{ fontSize: "18px", color: "#E11D48" }}>🚪</span>
              <span style={{ color: "#E11D48", fontWeight: 600 }}>Logout</span>
            </button>
          </div>
        </aside>

        <div className="main" style={{ marginLeft: "260px", width: "calc(100% - 260px)", maxWidth: "calc(100% - 260px)", height: "100vh", maxHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden", overflowY: "auto" }}>
          <div className="topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="menu-btn"
                onClick={() => setOpen((o) => !o)}
                aria-label="Toggle Menu"
              >
                ☰
              </button>
              <div className="topbar-search">
                <span>🔍</span>
                <input placeholder={`Search in ${title}...`} />
              </div>
            </div>
            <div className="topbar-right">
              <div className="profile-chip">
                <span className="avatar">{initials}</span>
                <div style={{ fontSize: 12, lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 700 }}>{currentUser?.name}</div>
                  <div style={{ color: "var(--brown)" }}>{title}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="content" style={{ padding: "20px 28px 60px", flex: 1 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  onClick,
  variant,
  trend,
  isNegative
}: {
  icon: string;
  label: string;
  value: string | number;
  onClick?: () => void;
  variant?: "pink" | "purple" | "orange" | "rose" | "coral" | "default";
  trend?: string;
  isNegative?: boolean;
}) {
  const iconBgs: Record<string, { bg: string; color: string }> = {
    pink: { bg: "rgba(236, 72, 153, 0.14)", color: "#EC4899" },
    purple: { bg: "rgba(124, 58, 237, 0.14)", color: "#7C3AED" },
    orange: { bg: "rgba(245, 158, 11, 0.16)", color: "#F59E0B" },
    rose: { bg: "rgba(236, 72, 153, 0.14)", color: "#EC4899" },
    coral: { bg: "rgba(245, 158, 11, 0.16)", color: "#F59E0B" },
    default: { bg: "rgba(56, 189, 248, 0.16)", color: "#7C3AED" }
  };

  const currentIconTheme = iconBgs[variant || "default"] || iconBgs.default;

  const gradId = `sparklineGrad-${label.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div
      className="floating-card"
      onClick={onClick}
      style={{
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        borderRadius: "24px",
        padding: "22px",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 15px 40px rgba(0, 0, 0, 0.06)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "14px" }}>
        {/* 52px Soft Circular Container */}
        <div style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: currentIconTheme.bg,
          color: currentIconTheme.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          flexShrink: 0
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", color: "#6F6F6F", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, marginBottom: "4px" }}>
            {label}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#1F1F1F", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            {value}
          </div>
          {trend && (
            <div style={{ fontSize: "11px", fontWeight: 700, color: isNegative ? "#EF4444" : "#1E293B", display: "flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
              <span>{isNegative ? "↓" : "↑"}</span> {trend}
            </div>
          )}
        </div>
      </div>

      {/* Mini SVG Sparkline at Bottom with Primary Green Soft Gradient Area Fill */}
      <svg
        viewBox="0 0 220 40"
        style={{
          width: "100%",
          height: "36px",
          opacity: 0.85,
          pointerEvents: "none",
          marginTop: "4px"
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 0 30 Q 35 15 70 25 T 140 18 T 220 8" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 0 30 Q 35 15 70 25 T 140 18 T 220 8 L 220 40 L 0 40 Z" fill={`url(#${gradId})`} />
      </svg>
    </div>
  );
}

export function Pill({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Pending": "pending",
    "Approved": "approved",
    "Rejected": "rejected",
    "Active": "active",
    "Inactive": "inactive",
    "Completed": "completed",
    "In Progress": "progress",
    "Contacted": "progress",
  };
  const key = map[status] ?? "pending";
  return <span className={`pill pill-${key}`}>{status}</span>;
}

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bar-chart" style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "160px", paddingTop: "20px" }}>
      {data.map((d) => (
        <div className="bar-col" key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div
              className="bar"
              style={{
                height: `${(d.value / max) * 100}%`,
                width: "100%",
                maxWidth: "32px",
                background: "linear-gradient(180deg, #7C3AED 0%, #EC4899 100%)",
                borderRadius: "10px 10px 0 0",
                transition: "height 300ms ease"
              }}
            />
          </div>
          <div className="bar-label" style={{ fontSize: "11px", color: "#6F6F6F", fontWeight: 700, marginTop: "8px" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0) {
    return (
      <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--brown)", fontSize: "13px" }}>
        📊 No work activity data recorded yet.
      </div>
    );
  }

  let accumulatedAngle = 0;
  const radius = 70;
  const cx = 100;
  const cy = 100;

  const slices = data.map((d) => {
    const percentage = d.value / total;
    const angle = percentage * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle += angle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = angle >= 359.9
      ? `M ${cx - radius},${cy} A ${radius},${radius} 0 1,0 ${cx + radius},${cy} A ${radius},${radius} 0 1,0 ${cx - radius},${cy}`
      : `M ${cx},${cy} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`;

    return {
      ...d,
      percentage: Math.round(percentage * 100),
      pathData,
    };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "20px" }}>
      <div style={{ position: "relative", width: "160px", height: "160px" }}>
        <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
          {slices.map((slice, idx) => (
            <path
              key={idx}
              d={slice.pathData}
              fill={slice.color}
              stroke="#E0D8C8"
              strokeWidth="2"
              style={{ transition: "all 0.3s ease", cursor: "pointer" }}
            >
              <title>{`${slice.label}: ${slice.value} (${slice.percentage}%)`}</title>
            </path>
          ))}
          <circle cx="100" cy="100" r="40" fill="#F7F4ED" />
        </svg>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none"
        }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--brown-dark)" }}>{total}</div>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--brown)", textTransform: "uppercase" }}>Total Work</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "160px" }}>
        {slices.map((slice, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: slice.color, display: "inline-block" }} />
              <span style={{ fontWeight: 600, color: "#2C352B" }}>{slice.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: 700, color: "var(--brown-dark)" }}>{slice.value}</span>
              <span style={{ fontSize: "11px", color: "var(--brown)", fontWeight: 600 }}>({slice.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, className }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const maxWidth = className?.includes("modal-report-preview") ? 1200 : className?.includes("modal-lg") ? 880 : 680;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simply hide overflow - prevents scroll without affecting layout
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus card with preventScroll to prevent browser auto-scrolling
    cardRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single fixed wrapper covers full viewport, flexbox centers the card
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)"
      }}
    >
      {/* Card stops click from closing */}
      <div
        ref={(el) => { cardRef.current = el; }}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: "24px",
          padding: "22px 26px",
          width: "92%",
          maxWidth: maxWidth + "px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 65px rgba(0, 0, 0, 0.4)",
          border: "1px solid #E2E8F0",
          position: "relative",
          flexShrink: 0,
          boxSizing: "border-box",
          outline: "none"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderBottom: "1px solid #F1F5F9", paddingBottom: "12px", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1E293B", margin: 0, letterSpacing: "-0.3px" }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "50%", width: "32px", height: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px", color: "#64748B", fontWeight: 700, flexShrink: 0 }}
          >✕</button>
        </div>
        {/* Scrollable body with hidden scrollbar */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none", color: "#1E293B", minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}