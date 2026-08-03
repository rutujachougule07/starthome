import { Navigate, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useStore, Product, User, Order, Lead, Task } from "../app/store";
import { UnifiedEmployeeCard } from "../components/UnifiedEmployeeCard";
import { ProductBatchDetailsModal } from "../components/ProductBatchDetailsModal";
import { DashboardLayout, StatCard, Pill, BarChart, Modal, NavItem } from "../app/DashboardLayout";
import { AlertCircle, Snowflake, Clock, Flame, CheckCircle2, XCircle, MessageSquare, Briefcase, Calendar, Phone, User as UserIcon, Trash2, Mail, Key, Search, Download, Plus, SlidersHorizontal } from "lucide-react";
import { OrderDocumentModal } from "./EmployeePage";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getAutoProductImage } from "../utils/autoProductImage";

const NAV: NavItem[] = [
  { key: "live", label: "Live Dashboard", icon: "📡" },
  { key: "products", label: "Stocking Inventory", icon: "📦" },
  { key: "godown", label: "Godowns", icon: "🏭" },
  { key: "leads", label: "Lead Generation", icon: "🧲" },
  { key: "assign", label: "Add Employee / manager", icon: "📋" },
  { key: "task-assign", label: "Task Assign", icon: "📝" },
  { key: "orders", label: "Order Approvals", icon: "✅" },
  { key: "incentive", label: "Incentive", icon: "💰" },
];

interface SuperAdminPageProps {
  tab?: string;
}

export function DownloadDropdown({
  onPDF,
  onCSV,
  label = "Download"
}: {
  onPDF: () => void;
  onCSV: () => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        btnRef.current &&
        !btnRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((prev) => !prev);
  };

  const handlePDFClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onPDF();
  };

  const handleCSVClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onCSV();
  };

  return (
    <div data-download-dropdown style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          border: "1px solid rgba(109, 74, 255, 0.12)",
          background: "#ffffff",
          borderRadius: "40px",
          padding: "10px 22px",
          fontSize: "14px",
          fontWeight: 700,
          color: "#1E293B",
          cursor: "pointer",
          boxShadow: "0 8px 25px rgba(109, 74, 255, 0.12)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        <span>📥</span>
        <span>{label}</span>
        <span style={{ fontSize: "10px", opacity: 0.75 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          data-download-dropdown
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: dropPos.top,
            right: dropPos.right,
            background: "#ffffff",
            border: "1px solid rgba(109, 74, 255, 0.12)",
            borderRadius: "16px",
            boxShadow: "0 12px 30px rgba(109, 74, 255, 0.18)",
            padding: "8px",
            minWidth: "170px",
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}
        >
          <button
            type="button"
            onClick={handlePDFClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 12px",
              border: "none",
              background: "transparent",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1E293B",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "background 0.15s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#F3F0FF")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span>📄</span>
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={handleCSVClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 12px",
              border: "none",
              background: "transparent",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1E293B",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "background 0.15s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#F3F0FF")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span>📊</span>
            <span>Export CSV</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export function SuperAdminPage({ tab = "live" }: SuperAdminPageProps) {
  const store = useStore();
  const active = tab || "live";
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(true);

  const pendingApprovals = store.orders.filter(o => o.status === "Pending" && !o.isIncentive && o.customerId !== "c_incentive" && o.customerName !== "Incentive Sell Request").length;

  const setActive = (tab: string) => {
    navigate({ to: "/super-admin", search: { tab } });
  };

  if (!store.currentUser || store.currentUser.role !== "superadmin") return <Navigate to="/login" />;

  return (
    <>
      <style>{`
        @keyframes popupSlideDown {
          0% { transform: translate(-50%, -100%); opacity: 0; }
          60% { transform: translate(-50%, 5%); opacity: 1; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes bellRing {
          0% { transform: rotate(0); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-15deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
          100% { transform: rotate(0); }
        }
        .btn-review-now:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.2) !important;
        }
        .btn-dismiss-pop:hover {
          background: rgba(255,255,255,0.2) !important;
        }
        .btn-success {
          background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%) !important;
          box-shadow: 0 12px 26px -10px rgba(124, 58, 237, 0.6),
            inset 0 1px 1px rgba(255, 255, 255, 0.35) !important;
          color: #FFFFFF !important;
          border: 1px solid rgba(255, 255, 255, 0.35) !important;
        }
        .btn-success:hover {
          background: linear-gradient(135deg, #6D28D9 0%, #DB2777 100%) !important;
          transform: scale(1.02) translateY(-2px) !important;
          box-shadow: 0 12px 24px rgba(124, 58, 237, 0.5) !important;
        }
      `}</style>
      {pendingApprovals > 0 && showNotification && (
        <div style={{
          position: "fixed",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
          color: "white",
          padding: "14px 14px 14px 28px",
          borderRadius: "100px",
          zIndex: 9999,
          boxShadow: "0 15px 35px rgba(255, 65, 108, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          fontWeight: 500,
          border: "1px solid rgba(255,255,255,0.2)",
          animation: "popupSlideDown 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
        }}>
          <span style={{ fontSize: "28px", display: "inline-block", animation: "bellRing 1.5s ease-in-out infinite", transformOrigin: "top center", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))" }}>🔔</span>
          <span style={{ fontSize: "16px", letterSpacing: "0.3px", fontWeight: 600 }}>You have <strong style={{ fontSize: "18px", background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: "12px", margin: "0 4px" }}>{pendingApprovals}</strong> pending request(s) for approval!</span>
          <button
            className="btn-review-now"
            onClick={() => {
              setShowNotification(false);
              setActive("orders");
            }}
            style={{
              background: "#ffffff",
              border: "none",
              color: "#ff416c",
              padding: "12px 28px",
              borderRadius: "100px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            Review Now
          </button>
        </div>
      )}
      <DashboardLayout role="superadmin" title="Super Admin" nav={NAV} active={active} onNav={setActive}>
        {active === "live" && <LiveDashboard />}
        {active === "leads" && <LeadsSection />}
        {active === "assign" && <TasksAssignSection />}
        {active === "task-assign" && <TaskAssignmentSection />}
        {active === "managers" && <ManagersSection />}
        {active === "employees" && <EmployeesSection />}
        {active === "products" && <ProductsSection />}
        {active === "godown" && <SuperAdminGodownSection />}
        {active === "orders" && <OrderApprovalSection />}
        {active === "incentive" && <SuperAdminIncentiveSection />}
        {active === "notifications" && <NotificationsSection role="superadmin" />}
      </DashboardLayout>
    </>
  );
}

function LiveDashboard() {
  const { products } = useStore();
  const navigate = useNavigate();

  const totalProducts = products.length;
  const lowStock = products.filter(p => (p.qty ?? p.stock ?? 0) < 20).length;
  const highStock = products.filter(p => (p.qty ?? p.stock ?? 0) >= 50).length;

  const incentive90Days = products.filter(p => {
    if (!p.date || !p.incentive || p.incentive <= 0) return false;
    const diffTime = new Date().getTime() - new Date(p.date).getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > 90;
  }).length;

  const goTo = (tab: string) => navigate({ to: "/super-admin", search: { tab } });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <div>
          <h2 className="page-title">📡 Live Dashboard Overview</h2>
          <p className="page-sub" style={{ margin: 0 }}>Real-time lead statistics and follow-ups overview</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 4 }}>
        <StatCard icon="📦" label="TOTAL PRODUCTS" value={totalProducts} onClick={() => goTo("products")} />
        <StatCard icon="⚠️" label="LOW STOCK (< 20)" value={lowStock} onClick={() => goTo("products")} />
        <StatCard icon="📈" label="HIGH STOCK (≥ 50)" value={highStock} onClick={() => goTo("products")} />
        <StatCard icon="💰" label="INCENTIVE (> 90 DAYS)" value={incentive90Days} onClick={() => goTo("incentive")} />
      </div>

      <DashboardLeadPipelineOverview />
      <UpcomingFollowUps />
    </div>
  );
}

function Overview() {
  const { users, products, customers, orders, notifications } = useStore();
  const totalEmp = users.filter((u) => u.role === "employee").length;
  const totalPage = users.filter((u) => u.role === "manager").length;
  const revenue = orders.filter((o) => o.status === "Approved").reduce((s, o) => s + o.total, 0);

  const chartData = useMemo(() => {
    const byStatus = { Pending: 0, Approved: 0, Rejected: 0, Delivered: 0 };
    orders.forEach((o) => { byStatus[o.status]++; });
    return [
      { label: "Pending", value: byStatus.Pending },
      { label: "Approved", value: byStatus.Approved },
      { label: "Rejected", value: byStatus.Rejected },
      { label: "Delivered", value: byStatus.Delivered },
      { label: "Products", value: products.length },
      { label: "Customers", value: customers.length },
    ];
  }, [orders, products, customers]);

  return (
    <>
      <h2 className="page-title">Dashboard Overview</h2>
      <p className="page-sub">Full system snapshot across managers, employees, products & orders.</p>
      <div className="stat-grid">
        <StatCard icon="👥" label="Employees" value={totalEmp} />
        <StatCard icon="👔" label="Managers" value={totalPage} />
        <StatCard icon="🧑‍💼" label="Customers" value={customers.length} />
        <StatCard icon="🧾" label="Orders" value={orders.length} />
        <StatCard icon="📦" label="Products" value={products.length} />
        <StatCard icon="💰" label="Revenue" value={`₹${revenue.toLocaleString()}`} />
      </div>

      <div className="row-2">
        <div className="panel">
          <div className="panel-head"><h3 className="panel-title">Activity Snapshot</h3></div>
          <BarChart data={chartData} />
        </div>
        <div className="panel">
          <div className="panel-head"><h3 className="panel-title">Recent Activities</h3></div>
          <ul className="notif-list">
            {notifications.slice(0, 6).map((n) => (
              <li key={n.id}>
                <span className="notif-from">{n.from}</span> — {n.message}
                <span className="notif-date">{n.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function ManagersSection() {
  const { users, setState, uid } = useStore();
  const managers = users.filter((u) => u.role === "manager");
  const [editing, setEditing] = useState<User | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const remove = (id: string) => {
    if (!confirm("Delete this manager?")) return;
    setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h2 className="page-title">Manage Managers</h2>
          <p className="page-sub">Add, edit, or remove managers in the system.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              const headers = ["Sr. No.", "Manager ID", "Full Name", "Phone", "Email"];
              const rows = managers.map((m, index) => [index + 1, m.username || m.id, m.name, m.phone || "—", m.email || "—"]);
              openPDFPreview("Managers Directory Report", headers, rows, `Total Managers: ${managers.length}`);
            }}
            style={{ border: "1px solid var(--border)", background: "white", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}
          >
            📄 Download PDF
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => exportManagersReport(managers)}
            style={{ border: "1px solid var(--border)", background: "white", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">All Managers ({managers.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Manager</button>
        </div>
        <div className={managers.length > 0 ? "card-grid" : ""}>
          {managers.map((m) => (
            <div key={m.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <h4 className="data-card-title">{m.name}</h4>
                  <span className="data-card-subtitle">{m.email}</span>
                </div>
                <div className="actions-row">
                  <button className="btn btn-circle" onClick={() => setEditing(m)} title="Edit Manager" style={{ width: 32, height: 32, fontSize: 14 }}>✏️</button>
                  <button className="btn btn-circle btn-circle-danger" onClick={() => remove(m.id)} title="Delete Manager" style={{ width: 32, height: 32, fontSize: 14 }}>🗑️</button>
                </div>
              </div>
              <div className="data-card-body">
                <div className="data-row"><span className="data-label">ID / Username</span><span className="data-value">{m.username}</span></div>
                <div className="data-row"><span className="data-label">Password</span><span className="data-value">{m.password ?? "—"}</span></div>
                <div className="data-row"><span className="data-label">Phone</span><span className="data-value">{m.phone ?? "—"}</span></div>
              </div>
            </div>
          ))}
          {managers.length === 0 && <div className="empty">No managers yet.</div>}
        </div>
      </div>

      {showAdd && (
        <UserForm
          title="Add Manager"
          onClose={() => setShowAdd(false)}
          onSave={(data) => {
            const nextId = uid("u");
            setState((s) => ({ ...s, users: [...s.users, { id: nextId, role: "manager", ...data }] }));
            setShowAdd(false);
          }}
        />
      )}
      {editing && (
        <UserForm
          title="Edit Manager"
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            setState((s) => ({ ...s, users: s.users.map((u) => u.id === editing.id ? { ...u, ...data } : u) }));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function UserForm({ title, initial, onSave, onClose }: { title: string; initial?: User; onSave: (d: Omit<User, "id" | "role">) => void; onClose: () => void }) {
  const { users } = useStore();
  const [managerId, setManagerId] = useState(initial?.employeeId || initial?.username || "");
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [status, setStatus] = useState(initial?.status ?? "Verified");
  const [isPasswordEdited, setIsPasswordEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-generate managerId (MGR00x) if it is a new manager
  useEffect(() => {
    if (!initial && !managerId) {
      const managers = users.filter((u) => u.role === "manager");
      let maxNum = 0;
      managers.forEach(m => {
        const idStr = m.employeeId || m.username || "";
        const match = idStr.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      setManagerId(`MGR${String(maxNum + 1).padStart(3, "0")}`);
    }
  }, [users, initial]);

  // Auto-generate password from Name or Email
  useEffect(() => {
    if (initial) return;
    if (isPasswordEdited) return;

    let generatedPass = "";
    if (name.trim()) {
      const firstName = name.trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      if (firstName) {
        generatedPass = `${firstName}123`;
      }
    } else if (email.trim()) {
      const prefix = email.split("@")[0].toLowerCase().trim().replace(/[^a-z0-9]/g, "");
      if (prefix) {
        generatedPass = `${prefix}123`;
      }
    }
    setPassword(generatedPass);
  }, [name, email, isPasswordEdited, initial]);

  const handleSave = () => {
    if (!name || isSaving) return;
    setIsSaving(true);
    const username = managerId || (email ? email.toLowerCase().trim() : name.toLowerCase().replace(/\s+/g, "") + "@smarthome.com");
    onSave({
      name,
      username,
      email: email || undefined,
      phone: phone || undefined,
      employeeId: managerId || undefined,
      password: password || undefined,
      address: address || undefined,
      status
    });
  };

  const modalTitle = title.includes("Add") ? "+ Register New Manager" : title;

  return (
    <Modal title={modalTitle} onClose={onClose} className="modal-lg">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.2fr", gap: "10px", marginBottom: 8 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>MANAGER ID</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🆔</span>
            <input
              className="form-input"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              placeholder="MGR001"
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>FULL NAME</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>👤</span>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: 8 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>PHONE NUMBER</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>📱</span>
            <input
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>LOGIN PASSWORD</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🔐</span>
            <input
              type="text"
              className="form-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setIsPasswordEdited(true);
              }}
              placeholder="Set password"
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
            />
          </div>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 8 }}>
        <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>ADDRESS</label>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "6px 10px" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>🏠</span>
          <textarea
            className="form-textarea"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Residential Address"
            style={{ border: "none", background: "transparent", padding: "4px 8px", color: "#1E293B", fontWeight: 600, resize: "none", width: "100%", outline: "none" }}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 8 }}>
        <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>EMAIL ADDRESS (OPTIONAL)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>📧</span>
          <input
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
          />
        </div>
      </div>

      <div className="modal-actions" style={{ justifyContent: "flex-start", gap: 12, marginTop: 8 }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
          style={{ opacity: isSaving ? 0.7 : 1 }}
        >
          {isSaving ? "Saving..." : "💾 Save Manager"}
        </button>
        <button className="btn btn-ghost" onClick={onClose} style={{ background: "#F8FAFC", border: "1px solid #F3EEFF", color: "#7C3AED", fontWeight: 700 }}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function EmployeeForm({
  title,
  initial,
  onSave,
  onClose
}: {
  title: string;
  initial?: User;
  onSave: (d: Omit<User, "id" | "role">) => void;
  onClose: () => void;
}) {
  const { users } = useStore();
  const [employeeId, setEmployeeId] = useState(initial?.employeeId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "Sales Associate");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [status, setStatus] = useState(initial?.status ?? "Verified");
  const [isPasswordEdited, setIsPasswordEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-generate employeeId (EMP00x) if it is a new employee
  useEffect(() => {
    if (!initial && !employeeId) {
      const employees = users.filter((u) => u.role === "employee");
      let maxNum = 0;
      employees.forEach(e => {
        if (e.employeeId) {
          const match = e.employeeId.match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxNum) maxNum = num;
          }
        }
      });
      setEmployeeId(`EMP${String(maxNum + 1).padStart(3, "0")}`);
    }
  }, [users, initial]);

  // Auto-generate password from Name or Email (e.g. first_name + '123')
  useEffect(() => {
    if (initial) return;
    if (isPasswordEdited) return;

    let generatedPass = "";
    if (name.trim()) {
      const firstName = name.trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      if (firstName) {
        generatedPass = `${firstName}123`;
      }
    } else if (email.trim()) {
      const prefix = email.split("@")[0].toLowerCase().trim().replace(/[^a-z0-9]/g, "");
      if (prefix) {
        generatedPass = `${prefix}123`;
      }
    }
    setPassword(generatedPass);
  }, [name, email, isPasswordEdited, initial]);

  const handleSave = () => {
    if (!name || isSaving) return;
    setIsSaving(true);
    const username = email ? email.toLowerCase().trim() : name.toLowerCase().replace(/\s+/g, "") + "@smarthome.com";
    onSave({
      name,
      username,
      email: email || undefined,
      phone: phone || undefined,
      employeeId: employeeId || undefined,
      jobTitle,
      password: password || undefined,
      address: address || undefined,
      status
    });
  };

  const modalTitle = initial ? "Edit Employee" : "+ Register New Employee";

  return (
    <Modal title={modalTitle} onClose={onClose} className="modal-lg">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.2fr", gap: "10px", marginBottom: 8 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>EMPLOYEE ID</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🆔</span>
            <input
              className="form-input"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="EMP001"
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>FULL NAME</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>👤</span>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: "10px", marginBottom: 8 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>PHONE NUMBER</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>📱</span>
            <input
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>ROLE</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>💼</span>
            <select
              className="form-input"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600, appearance: "auto" }}
            >
              <option value="Sales Associate">Sales Associate</option>
              <option value="Technician">Technician</option>
              <option value="Support Specialist">Support Specialist</option>
              <option value="Inventory Manager">Inventory Manager</option>
              <option value="Delivery Agent">Delivery Agent</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>LOGIN PASSWORD</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🔐</span>
            <input
              type="text"
              className="form-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setIsPasswordEdited(true);
              }}
              placeholder="Set password"
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
            />
          </div>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 8 }}>
        <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>ADDRESS</label>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "6px 10px" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>🏠</span>
          <textarea
            className="form-textarea"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Residential Address"
            style={{ border: "none", background: "transparent", padding: "4px 8px", color: "#1E293B", fontWeight: 600, resize: "none", width: "100%", outline: "none" }}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 8 }}>
        <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>EMAIL ADDRESS (OPTIONAL)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>📧</span>
          <input
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
          />
        </div>
      </div>

      <div className="modal-actions" style={{ justifyContent: "flex-start", gap: 12, marginTop: 8 }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
          style={{ opacity: isSaving ? 0.7 : 1 }}
        >
          {isSaving ? "Saving..." : "💾 Save Employee"}
        </button>
        <button className="btn btn-ghost" onClick={onClose} style={{ background: "#F8FAFC", border: "1px solid #F3EEFF", color: "#7C3AED", fontWeight: 700 }}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function EmployeeWorkDetailsModal({ employee, onClose }: { employee: User; onClose: () => void }) {
  const { tasks, orders, products } = useStore();
  const empTasks = tasks.filter((t) => t.assignedTo === employee.id);
  const empOrders = orders.filter((o) => o.assignedTo === employee.id);

  const completedTasks = empTasks.filter((t) => t.status === "Completed").length;
  const pendingTasks = empTasks.filter((t) => t.status !== "Completed").length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 850, width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 className="modal-title">📊 Work Details: {employee.name}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 15 }}>
            <div style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, textAlign: "center" }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <div style={{ fontSize: 12, color: "var(--brown)", marginTop: 4 }}>Total Tasks</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--brown-dark)" }}>{empTasks.length}</div>
            </div>
            <div style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, textAlign: "center" }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div style={{ fontSize: 12, color: "var(--brown)", marginTop: 4 }}>Completed Tasks</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>{completedTasks}</div>
            </div>
            <div style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, textAlign: "center" }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <div style={{ fontSize: 12, color: "var(--brown)", marginTop: 4 }}>Pending Tasks</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{pendingTasks}</div>
            </div>
            <div style={{ background: "var(--warm-white)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, textAlign: "center" }}>
              <span style={{ fontSize: 20 }}>🚚</span>
              <div style={{ fontSize: 12, color: "var(--brown)", marginTop: 4 }}>Assigned Orders</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--brown-dark)" }}>{empOrders.length}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {/* Tasks Panel */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 15 }}>
              <h4 style={{ margin: "0 0 10px 0", color: "var(--brown-dark)", display: "flex", alignItems: "center", gap: 6 }}>
                📝 Task List
              </h4>
              <div style={{ maxHeight: 250, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 5 }}>
                {empTasks.map((t) => (
                  <div key={t.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--warm-white)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <strong style={{ color: "var(--brown-dark)", fontSize: 13 }}>{t.title}</strong>
                      <span className={`pill pill-${t.status === "Completed" ? "completed" : t.status === "In Progress" ? "progress" : "pending"}`} style={{ fontSize: 10 }}>
                        {t.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--light-brown)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} /> {t.date}
                    </div>
                  </div>
                ))}
                {empTasks.length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "var(--light-brown)", fontSize: 12 }}>
                    No tasks assigned.
                  </div>
                )}
              </div>
            </div>

            {/* Orders Panel */}
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 15 }}>
              <h4 style={{ margin: "0 0 10px 0", color: "var(--brown-dark)", display: "flex", alignItems: "center", gap: 6 }}>
                📦 Assigned Orders
              </h4>
              <div style={{ maxHeight: 250, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 5 }}>
                {empOrders.map((o) => {
                  const product = products.find(p => p.id === o.productId || p.name.toLowerCase() === o.productName.toLowerCase());
                  const brandStr = product?.brand ? ` (${product.brand})` : "";
                  return (
                    <div key={o.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--warm-white)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <strong style={{ color: "var(--brown-dark)", fontSize: 13 }}>{o.id}</strong>
                        <span className={`pill pill-${o.status.toLowerCase()}`} style={{ fontSize: 10 }}>
                          {o.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--brown-dark)", marginBottom: 4 }}>
                        {o.customerName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--light-brown)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Briefcase size={12} /> {o.qty}x {o.productName}{brandStr}
                      </div>
                    </div>
                  );
                })}
                {empOrders.length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "var(--light-brown)", fontSize: 12 }}>
                    No orders assigned.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeesSection() {
  const { users, tasks, setState, uid } = useStore();
  const employees = users.filter((u) => u.role === "employee");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [viewingWork, setViewingWork] = useState<User | null>(null);

  const remove = (id: string) => {
    if (!confirm("Delete this employee?")) return;
    setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h2 className="page-title">Employee Details</h2>
          <p className="page-sub">Manage employees and view their workload.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              const headers = ["Sr. No.", "Employee ID", "Full Name", "Job Role", "Phone", "Email", "Status"];
              const rows = employees.map((e, index) => [index + 1, e.employeeId || e.id, e.name, e.jobTitle || "Sales Associate", e.phone || "—", e.email || e.username || "—", e.status || "Verified"]);
              openPDFPreview("Employees Roster Report", headers, rows, `Total Employees: ${employees.length}`);
            }}
            style={{ border: "1px solid var(--border)", background: "white", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}
          >
            📄 Download PDF
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => exportEmployeesReport(employees)}
            style={{ border: "1px solid var(--border)", background: "white", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}
          >
            📥 Export CSV
          </button>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">All Employees ({employees.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Employee</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginTop: 15 }}>
          {employees.map((e) => {
            const list = tasks.filter((t) => t.assignedTo === e.id || t.assignedToName === e.name);
            const comp = list.filter((t) => t.status === "Completed").length;
            const total = list.length;
            const score = total ? Math.round((comp / total) * 100) : 0;
            const initials = (e.name || "U").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

            return (
              <div
                key={e.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  padding: "24px",
                  border: "1px solid #E2E8F0",
                  borderTop: "4px solid var(--accent)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  position: "relative",
                  transition: "transform 0.2s ease, boxShadow 0.2s ease"
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent, #d97706), #b45309)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "16px",
                      boxShadow: "0 4px 10px rgba(217, 119, 6, 0.25)"
                    }}>
                      {initials}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: "#0f172a", fontSize: "17px", fontWeight: 800 }}>{e.name}</h4>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "inline-block", marginTop: "2px" }}>
                        • ID: {e.employeeId ?? "EMP001"} •
                      </span>
                    </div>
                  </div>
                  <span className={`pill ${e.status === "Inactive" ? "pill-rejected" : "pill-approved"}`} style={{ fontSize: "11px", padding: "3px 10px", fontWeight: 700 }}>
                    {e.status ?? "Verified"}
                  </span>
                </div>

                {/* Info Fields Grid */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#f8fafc", padding: "14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      💼 ROLE
                    </span>
                    <strong style={{ color: "#0f172a", fontWeight: 800 }}>{e.jobTitle ?? "Sales Associate"}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      👤 USERNAME
                    </span>
                    <strong style={{ color: "#0f172a", fontWeight: 700 }}>{e.username ?? "—"}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      🔑 PASSWORD
                    </span>
                    <strong style={{ color: "#0f172a", fontWeight: 700, background: "#ffffff", padding: "2px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                      {e.password ?? "—"}
                    </strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      📞 PHONE
                    </span>
                    <strong style={{ color: "#0f172a", fontWeight: 700 }}>{e.phone ?? "—"}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      ✉ EMAIL
                    </span>
                    <strong style={{ color: "#0f172a", fontWeight: 700 }}>{e.email || e.username || "—"}</strong>
                  </div>
                </div>

                {/* Progress Score Bar */}
                <div style={{ background: "#ffffff", borderRadius: "12px", padding: "10px 14px", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "11px" }}>
                    <span style={{ fontWeight: 700, color: "#64748b" }}>WORK COMPLETED</span>
                    <span style={{ fontWeight: 800, color: "var(--success, #10b981)" }}>{comp} / {total} ({score}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "#E2E8F0", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${score}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #059669)", borderRadius: "999px", transition: "width 0.4s ease" }} />
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "8px", marginTop: "auto", paddingTop: "4px" }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => setViewingWork(e)}
                    title="View Work Details"
                    style={{ background: "#F5F3FF", color: "#7C3AED", border: "1px solid #E9D8FD", fontWeight: 700, borderRadius: "10px", padding: "6px 12px", fontSize: "12px" }}
                  >
                    📊 View Work
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setEditing(e)}
                    title="Edit Employee"
                    style={{ background: "#fffbe6", color: "#d97706", border: "1px solid #fde68a", fontWeight: 700, borderRadius: "10px", padding: "6px 12px", fontSize: "12px" }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => remove(e.id)}
                    title="Delete Employee"
                    style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", fontWeight: 700, borderRadius: "10px", padding: "6px 12px", fontSize: "12px" }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
          {employees.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--light-brown)" }}>
              No employees yet.
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <EmployeeForm
          title="Register New Employee"
          onClose={() => setShowAdd(false)}
          onSave={(data) => {
            const nextId = uid("u");
            setState((s) => ({ ...s, users: [...s.users, { id: nextId, role: "employee", ...data }] }));
            setShowAdd(false);
          }}
        />
      )}
      {editing && (
        <EmployeeForm
          title="Edit Employee"
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            setState((s) => ({ ...s, users: s.users.map((u) => u.id === editing.id ? { ...u, ...data } : u) }));
            setEditing(null);
          }}
        />
      )}
      {viewingWork && (
        <EmployeeWorkDetailsModal
          employee={viewingWork}
          onClose={() => setViewingWork(null)}
        />
      )}
    </>
  );
}

function ProductsSection() {
  const { products, setState, uid } = useStore();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [viewingBatches, setViewingBatches] = useState<Product & { batches: Product[] } | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Products");
  const [stockFilter, setStockFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Calculations for cards
  const locProducts = locationFilter === "All" ? products : products.filter(p => (p.location || "Unassigned") === locationFilter);

  // Gather unique categories dynamically
  const categories = useMemo(() => {
    const defaultCats = ["All Products", "Fans", "AC Units", "Microwaves", "Lighting", "Kitchen"];
    const dbCats = products.map((p) => p.category).filter(Boolean);
    const combined = new Set([...defaultCats, ...dbCats]);
    return Array.from(combined);
  }, [products]);

  // Filter products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q);
      const matchCat = categoryFilter === "All Products" || categoryFilter === "All" || p.category.toLowerCase().includes(categoryFilter.toLowerCase());
      let matchStock = true;
      if (stockFilter === "Low") {
        matchStock = (p.qty ?? p.stock ?? 0) > 0 && (p.qty ?? p.stock ?? 0) < 20;
      } else if (stockFilter === "InStock") {
        matchStock = (p.qty ?? p.stock ?? 0) >= 20;
      } else if (stockFilter === "OutOfStock") {
        matchStock = (p.qty ?? p.stock ?? 0) === 0;
      }
      const matchLoc = locationFilter === "All" || (p.location || "Unassigned") === locationFilter;
      return matchSearch && matchCat && matchStock && matchLoc;
    }).sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });
  }, [products, searchQuery, categoryFilter, stockFilter, locationFilter]);

  const groupedProducts = useMemo(() => {
    const map = new Map<string, Product & { batches: Product[] }>();
    filteredProducts.forEach(p => {
      const key = (p.sku || p.name).toLowerCase();
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.qty = (existing.qty ?? existing.stock ?? 0) + (p.qty ?? p.stock ?? 0);
        existing.stock = existing.qty;
        existing.batches.push(p);
      } else {
        map.set(key, { ...p, batches: [p] });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredProducts]);

  const remove = (id: string) => {
    if (!confirm("Delete this product?")) return;
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  };

  return (
    <div className="inventory-page">
      {/* Header */}
      <div className="top-section">
        <div>
          <div className="title-row">
            <div className="title-icon">
              📦
            </div>
            <div>
              <h1>Stocking Inventory</h1>
              <p>
                Manage and track your electronic appliances catalog across all godowns.
              </p>
            </div>
          </div>
        </div>

        <div className="header-buttons" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAdd(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 18px",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>

          <DownloadDropdown
            label="Download"
            onPDF={() => {
              const headers = ["Sr. No.", "Product Name", "SKU", "Brand", "Location", "Quantity", "Unit Cost", "Total Cost", "Supplier", "Date", "Status"];
              const rows = filteredProducts.map((p, index) => {
                const qty = p.qty ?? p.stock ?? 0;
                const unitCost = p.cost || 0;
                const totalCost = qty * unitCost;
                const formattedDate = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                return [index + 1, p.name, p.sku || "", p.brand || "—", p.location || "Unassigned", qty, unitCost, totalCost, p.supplier || "—", formattedDate, p.status || "Verified"];
              });
              openPDFPreview("Stocking Inventory Report", headers, rows, `Total Products: ${filteredProducts.length}`, "pdf");
            }}
            onCSV={() => {
              const headers = ["Sr. No.", "Product Name", "SKU", "Brand", "Location", "Quantity", "Unit Cost", "Total Cost", "Supplier", "Date", "Status"];
              const rows = filteredProducts.map((p, index) => {
                const qty = p.qty ?? p.stock ?? 0;
                const unitCost = p.cost || 0;
                const totalCost = qty * unitCost;
                const formattedDate = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                return [index + 1, p.name, p.sku || "", p.brand || "—", p.location || "Unassigned", qty, unitCost, totalCost, p.supplier || "—", formattedDate, p.status || "Verified"];
              });
              openPDFPreview("Stocking Inventory Report", headers, rows, `Total Products: ${filteredProducts.length}`, "csv");
            }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="search-box">
        <Search size={18} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search product name, category or SKU..."
        />
      </div>



      {/* Stats */}
      <div className="stats">
        <div className="stat-card" onClick={() => setStockFilter("All")}>
          <span>📦</span>
          <div>
            <small>Total Products</small>
            <h2>{products.length}</h2>
          </div>
        </div>

        <div className="stat-card" onClick={() => setStockFilter("InStock")}>
          <span>🟢</span>
          <div>
            <small>In Stock</small>
            <h2>{products.filter(p => (p.qty ?? p.stock ?? 0) >= 20).length}</h2>
          </div>
        </div>

        <div className="stat-card" onClick={() => setStockFilter("Low")}>
          <span>⚠️</span>
          <div>
            <small>Low Stock</small>
            <h2>{products.filter(p => (p.qty ?? p.stock ?? 0) > 0 && (p.qty ?? p.stock ?? 0) < 20).length}</h2>
          </div>
        </div>

        <div className="stat-card" onClick={() => setStockFilter("OutOfStock")}>
          <span>❌</span>
          <div>
            <small>Out Of Stock</small>
            <h2>{products.filter(p => (p.qty ?? p.stock ?? 0) === 0).length}</h2>
          </div>
        </div>
      </div>



      {/* Floating Button */}
      {createPortal(
        <div className="floating-btn" title="Add Product" onClick={() => setShowAdd(true)}>
          ⚡
        </div>,
        document.body
      )}

      <div className="panel" style={{ marginTop: "24px" }}>
        <div className="panel-head">
          <h3 className="panel-title">📋 Full Inventory Register</h3>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>SKU</th>
                <th>CATEGORY</th>
                <th>QTY</th>
                <th>UNIT COST</th>
                <th style={{ whiteSpace: "nowrap" }}>TOTAL COST</th>
                <th>SUPPLIER</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {groupedProducts.map((p) => {
                const totalValue = (p.qty ?? p.stock ?? 0) * p.cost;
                const formattedDate = p.date ? new Date(p.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                }) : "—";
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--brown)", marginTop: 2 }}>
                        <span>Brand: {p.brand || "—"}</span>
                        {p.warranty && <span> · Warranty: {p.warranty}</span>}
                      </div>
                    </td>
                    <td>{p.sku}</td>
                    <td>
                      {(() => {
                        const loc = p.location || "Unassigned";
                        const locMap: Record<string, { bg: string; color: string; icon: string; label: string }> = {
                          "Shop": { bg: "#FDF2F8", color: "#DB2777", icon: "🏪", label: "Shop" },
                          "Godown 1": { bg: "#F3EEFF", color: "#7C3AED", icon: "🏭", label: "Godown 1" },
                          "Godown 2": { bg: "#F0FDFA", color: "#0D9488", icon: "🏭", label: "Godown 2" },
                          "Display": { bg: "#F0FDF4", color: "#16A34A", icon: "📺", label: "Display" },
                          "Unassigned": { bg: "#FFF7ED", color: "#EA580C", icon: "🚫", label: "Unassigned" },
                        };
                        const style = locMap[loc] || { bg: "#FFF7ED", color: "#EA580C", icon: "🚫", label: loc };
                        return (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: style.bg,
                              color: style.color,
                              borderRadius: "10px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: 700,
                              whiteSpace: "nowrap"
                            }}
                          >
                            <span>{style.icon}</span>
                            <span>{style.label}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#1E293B" }}>{p.qty ?? p.stock ?? 0}</span>
                    </td>
                    <td>₹{p.cost.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>₹{totalValue.toLocaleString()}</td>
                    <td>{p.supplier}</td>
                    <td>{formattedDate}</td>
                    <td><span style={{ fontWeight: 600 }}>{p.status}</span></td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-circle"
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.setItem("product_detail_preview", JSON.stringify(p));
                          localStorage.setItem("product_detail_role", "superadmin");
                          window.location.href = "/product-detail";
                        }}
                        title="View Product & Batch Details"
                        style={{ background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}
                      >
                        ℹ️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={10} className="empty">No products found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <ProductForm
          title="+ New Product"
          onClose={() => setShowAdd(false)}
          onSave={(d) => {
            const nextId = uid("p");
            setState((s) => ({ ...s, products: [...s.products, { id: nextId, ...d }] }));
            setShowAdd(false);
          }}
        />
      )}
      {editing && <ProductForm title="Edit Product" initial={editing} onClose={() => setEditing(null)} onSave={(d) => { setState((s) => ({ ...s, products: s.products.map((p) => p.id === editing.id ? { ...p, ...d } : p) })); setEditing(null); }} />}

      {viewingBatches && (
        <ProductBatchDetailsModal
          product={viewingBatches}
          isAdmin={true}
          onClose={() => setViewingBatches(null)}
          onEditBatch={(b) => {
            setEditing(b);
            setViewingBatches(null);
          }}
          onDeleteBatch={(bId) => {
            if (confirm("Delete this batch?")) {
              setState((s: any) => ({ ...s, products: s.products.filter((p: any) => p.id !== (bId || viewingBatches.id)) }));
              setViewingBatches(null);
            }
          }}
        />
      )}
    </div>
  );
}

const PRODUCT_BRAND_MAP: { keywords: string[]; brands: string[] }[] = [
  {
    keywords: ["refrigerator", "fridge", "freezer"],
    brands: ["Samsung", "LG", "Whirlpool", "Haier", "Godrej", "Panasonic", "Bosch", "Electrolux"]
  },
  {
    keywords: ["washing", "machine", "dryer", "washer"],
    brands: ["Samsung", "LG", "Whirlpool", "Bosch", "IFB", "Haier", "Godrej", "Panasonic"]
  },
  {
    keywords: ["ac", "air conditioner", "aircon", "split ac"],
    brands: ["Voltas", "Daikin", "LG", "Samsung", "Blue Star", "Lloyd", "Panasonic", "Hitachi", "Carrier"]
  },
  {
    keywords: ["microwave", "oven", "microwave oven"],
    brands: ["IFB", "LG", "Samsung", "Bajaj", "Morphy Richards", "Panasonic", "Haier"]
  },
  {
    keywords: ["air purifier"],
    brands: ["Philips", "Dyson", "Coway", "Honeywell", "Sharp", "Xiaomi", "Levoit", "Blueair", "Kent", "Eureka Forbes"]
  },
  {
    keywords: ["water purifier", "purifier", "aquaguard", "pureit", "livpure"],
    brands: ["Kent", "Eureka Forbes", "Pureit", "Livpure", "Blue Star", "AO Smith"]
  },
  {
    keywords: ["kettle", "electric kettle"],
    brands: ["Prestige", "Butterfly", "Pigeon", "Kent", "Bajaj", "Havells", "Morphy Richards", "Philips"]
  },
  {
    keywords: ["mixer", "grinder", "juicer", "blender", "mixer grinder"],
    brands: ["Philips", "Sujata", "Preethi", "Bajaj", "Prestige", "Morphy Richards", "Maharaja Whiteline", "Bosch"]
  },
  {
    keywords: ["vacuum", "cleaner", "vacuum cleaner"],
    brands: ["Dyson", "Eureka Forbes", "Philips", "Kent", "Panasonic", "Karcher", "Black + Decker", "Agaro"]
  },
  {
    keywords: ["fan", "ceiling fan", "table fan"],
    brands: ["Crompton", "Usha", "Orient", "Havells", "Bajaj", "Luminous", "Atomberg"]
  },
  {
    keywords: ["geyser", "heater", "water heater"],
    brands: ["AO Smith", "Racold", "V-Guard", "Havells", "Bajaj", "Venus", "Crompton", "Hindware"]
  },
  {
    keywords: ["bulb", "smart bulb", "led bulb", "lamp"],
    brands: ["Philips Hue", "Wipro", "Syska", "Xiaomi", "Halonix", "TP-Link", "Havells", "Realme"]
  },
  {
    keywords: ["switch", "smart switch"],
    brands: ["Wipro", "Anchor", "Schneider Electric", "Legrand", "Crabtree", "Oakter"]
  },
  {
    keywords: ["door lock", "smart lock", "smart door lock"],
    brands: ["Yale", "Godrej", "Ozone", "Lavna", "Qubo", "Valencia"]
  },
  {
    keywords: ["cctv", "camera", "cctv camera", "ip camera"],
    brands: ["CP Plus", "Hikvision", "Dahua", "Qubo", "Xiaomi", "TP-Link", "Imou", "EZVIZ"]
  },
  {
    keywords: ["tv", "television", "smart tv", "led tv"],
    brands: ["Sony", "LG", "Samsung", "OnePlus", "Xiaomi", "Realme", "TCL", "VU"]
  },
  {
    keywords: ["speaker", "smart speaker", "echo", "alexa", "nest mini"],
    brands: ["Amazon Echo", "Google Nest", "Apple HomePod", "JBL", "Bose", "Sony"]
  },
  {
    keywords: ["doorbell", "video doorbell", "smart doorbell"],
    brands: ["Qubo", "Ring", "Yale", "CP Plus", "Hikvision", "Tapo", "Arlo"]
  },
  {
    keywords: ["sensor", "motion sensor", "motion"],
    brands: ["Philips Hue", "Oakter", "Tapo", "Xiaomi", "Sonoff", "Tuya", "Qubo"]
  },
  {
    keywords: ["plug", "smart plug"],
    brands: ["Wipro", "TP-Link", "Oakter", "Syska", "Realme", "Xiaomi"]
  }
];

function CustomSelect({
  value,
  options,
  onChange,
  onDelete,
  placeholder,
  hasOther = true
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  onDelete: (val: string) => void;
  placeholder: string;
  hasOther?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        className="form-input"
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--warm-white)" }}
      >
        <span style={{ color: value ? "inherit" : "#aaa" }}>{value || placeholder}</span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, minWidth: "100%", width: options.length > 6 ? "220%" : "100%", background: "var(--warm-white)", border: "1px solid var(--border)", zIndex: 100, boxShadow: "var(--shadow-md)", borderRadius: 8, marginTop: 6, padding: 6 }}>
          {hasOther && (
            <div
              style={{ padding: "8px 12px", cursor: "pointer", color: "var(--accent-dark)", fontWeight: 600, background: "var(--biscuit-light)", borderRadius: 6, marginBottom: 6, display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}
              onClick={() => { onChange("Other"); setOpen(false); }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--biscuit)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--biscuit-light)")}
            >
              <span style={{ fontSize: 16 }}>+</span> Other (Type Custom)
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: options.length > 6 ? "1fr 1fr" : "1fr", gap: 4 }}>
            {options.map(opt => (
              <div
                key={opt}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", cursor: "pointer", borderRadius: 6, transition: "background 0.2s" }}
                onClick={() => { onChange(opt); setOpen(false); }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ flex: 1, fontWeight: value === opt ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: value === opt ? "var(--accent-dark)" : "var(--brown-dark)" }}>{opt}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(opt); }}
                  style={{ background: "transparent", border: "none", color: "#bbb", cursor: "pointer", padding: "2px 6px", fontSize: 12, flexShrink: 0, borderRadius: 4, transition: "color 0.2s, background 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "#f4d6d2"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#bbb"; e.currentTarget.style.background = "transparent"; }}
                  title="Delete Option"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export function ProductForm({ title, initial, onSave, onClose, isIncentiveMode, isGodownOnly }: { title: string; initial?: Product; onSave: (d: Omit<Product, "id">) => void; onClose: () => void; isIncentiveMode?: boolean; isGodownOnly?: boolean }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [warranty, setWarranty] = useState(initial?.warranty ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Electronics");
  const [qty, setQty] = useState(initial?.qty ?? 0);
  const [cost, setCost] = useState(initial?.cost ?? 0);
  const [incentive, setIncentive] = useState(initial?.incentive ?? 0);
  const [supplier, setSupplier] = useState(initial?.supplier ?? "");
  const [location, setLocation] = useState<"Shop" | "Godown 1" | "Godown 2" | "Display">(initial?.location ?? "Shop");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState(initial?.status ?? "Verified");
  const [image, setImage] = useState(initial?.image ?? "");
  const [imageName, setImageName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [totalCost, setTotalCost] = useState(initial ? parseFloat((initial.qty * initial.cost).toFixed(2)) : 0);
  const { products, users } = useStore();
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(initial?.assignedEmployeeId ?? "");
  const [serialNumbers, setSerialNumbers] = useState<string[]>(() => Array(initial?.qty ?? 0).fill(""));
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);
  const [showSerials, setShowSerials] = useState(false);
  const [incentivePercent, setIncentivePercent] = useState(() => {
    if (initial && initial.cost > 0 && initial.incentive) {
      const pct = Math.round((initial.incentive / initial.cost) * 100);
      return pct.toString();
    }
    return "0";
  });

  const [isCustomBrand, setIsCustomBrand] = useState(() => {
    if (initial?.brand) {
      const initialName = (initial?.name ?? "").toLowerCase();
      const match = PRODUCT_BRAND_MAP.find((item) =>
        item.keywords.some((kw) => initialName.includes(kw))
      );
      if (match) {
        const customBrands = products
          .filter((p) => p.brand && match.keywords.some((kw) => p.name.toLowerCase().includes(kw)))
          .map((p) => p.brand);
        return !match.brands.includes(initial.brand) && !customBrands.includes(initial.brand);
      }
    }
    return false;
  });

  const [localCustomBrands, setLocalCustomBrands] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("sham_custom_brands") || "[]"); } catch { return []; }
  });
  const [localCustomCategories, setLocalCustomCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("sham_custom_categories") || "[]"); } catch { return []; }
  });
  const [localDeletedBrands, setLocalDeletedBrands] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("sham_deleted_brands") || "[]"); } catch { return []; }
  });
  const [localDeletedCategories, setLocalDeletedCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("sham_deleted_categories") || "[]"); } catch { return []; }
  });

  const addLocalBrand = (b: string) => {
    if (!b || b === "Other") return;
    setLocalCustomBrands(prev => {
      if (prev.includes(b)) return prev;
      const next = [...prev, b];
      localStorage.setItem("sham_custom_brands", JSON.stringify(next));
      return next;
    });
  };

  const hideBrand = (b: string) => {
    setLocalDeletedBrands(prev => {
      if (prev.includes(b)) return prev;
      const next = [...prev, b];
      localStorage.setItem("sham_deleted_brands", JSON.stringify(next));
      return next;
    });
    setLocalCustomBrands(prev => {
      const next = prev.filter(x => x !== b);
      localStorage.setItem("sham_custom_brands", JSON.stringify(next));
      return next;
    });
  };

  const addLocalCategory = (c: string) => {
    if (!c || c === "Other") return;
    setLocalCustomCategories(prev => {
      if (prev.includes(c)) return prev;
      const next = [...prev, c];
      localStorage.setItem("sham_custom_categories", JSON.stringify(next));
      return next;
    });
  };

  const hideCategory = (c: string) => {
    setLocalDeletedCategories(prev => {
      if (prev.includes(c)) return prev;
      const next = [...prev, c];
      localStorage.setItem("sham_deleted_categories", JSON.stringify(next));
      return next;
    });
    setLocalCustomCategories(prev => {
      const next = prev.filter(x => x !== c);
      localStorage.setItem("sham_custom_categories", JSON.stringify(next));
      return next;
    });
  };

  const lowercaseName = name.toLowerCase().trim();

  const brandOptions = useMemo(() => {
    if (!lowercaseName) return null;
    const match = PRODUCT_BRAND_MAP.find((item) =>
      item.keywords.some((kw) => lowercaseName.includes(kw))
    );
    if (!match) return null;

    const customBrands = products
      .filter((p) => p.brand && match.keywords.some((kw) => p.name.toLowerCase().includes(kw)))
      .map((p) => p.brand as string)
      .filter((b) => b && !match.brands.includes(b));

    const uniqueCustomBrands = Array.from(new Set([...customBrands, ...localCustomBrands]));

    return ([...match.brands, ...uniqueCustomBrands].filter((b): b is string => !!b && !localDeletedBrands.includes(b)));
  }, [lowercaseName, products, localCustomBrands, localDeletedBrands]);

  useEffect(() => {
    setIsCustomBrand(false);
  }, [brandOptions]);

  const defaultCategories = useMemo(() => ["Electronics", "Lighting", "Climate", "Cleaning", "Security", "Hub"], []);
  const [isCustomCategory, setIsCustomCategory] = useState(() => {
    if (initial?.category) {
      const customCategories = products
        .map((p) => p.category)
        .filter((c) => c && !defaultCategories.includes(c));
      return !defaultCategories.includes(initial.category) && !customCategories.includes(initial.category) && !localCustomCategories.includes(initial.category);
    }
    return false;
  });

  const categoryOptions = useMemo(() => {
    const customCategories = products
      .map(p => p.category)
      .filter(c => c && !defaultCategories.includes(c));
    const uniqueCustomCategories = Array.from(new Set([...customCategories, ...localCustomCategories]));
    return [...defaultCategories, ...uniqueCustomCategories].filter(c => !localDeletedCategories.includes(c));
  }, [products, defaultCategories, localCustomCategories, localDeletedCategories]);

  const processFile = (file: File) => {
    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // 1. Immediately set the original image as a fallback and for instant UI feedback
      setImage(base64);

      // 2. Attempt to compress the image asynchronously in the background
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
            setImage(compressedBase64);
          }
        } catch (err) {
          console.error("Canvas compression failed, keeping original:", err);
        }
      };
      img.onerror = (err) => {
        console.error("Failed to load image for compression, keeping original:", err);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const save = () => {
    if (!name) return;
    const autoImage = getAutoProductImage(name, brand, category, image);
    onSave({
      name,
      sku,
      brand,
      warranty,
      category,
      qty,
      stock: qty,
      cost,
      price: cost,
      incentive,
      supplier,
      location: location as any,
      date,
      status,
      image: autoImage,
      assignedEmployeeId
    });
  };

  const modalTitle = initial ? "Edit Stock Entry" : "+ New Stock Entry";

  return (
    <Modal title={modalTitle} onClose={onClose} className="modal-lg">
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: 8 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>PRODUCT NAME</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>📦</span>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wireless Headset X200"
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>SKU</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🏷️</span>
            <input
              className="form-input"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="WH-X200-BLK"
              style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: 8 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>BRAND</label>
          {brandOptions && !isCustomBrand ? (
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <CustomSelect
                value={brandOptions.includes(brand) || (brand && brand !== "Other") ? brand : ""}
                options={brandOptions}
                placeholder="Select Brand"
                onChange={(val) => {
                  if (val === "Other") {
                    setIsCustomBrand(true);
                    setBrand("");
                  } else {
                    setBrand(val);
                  }
                }}
                onDelete={hideBrand}
              />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6, width: "100%" }}>
              <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                <input
                  className="form-input"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Type brand name..."
                  style={{ width: "100%", background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, color: "#1E293B", fontWeight: 600 }}
                />
              </div>
              {brandOptions && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { addLocalBrand(brand); setIsCustomBrand(false); }}
                  style={{ padding: "4px 8px", fontSize: 11, background: "#F5F3FF", height: "36px", alignSelf: "center", border: "1px solid #E9D8FD", color: "#7C3AED", borderRadius: 10 }}
                  title="Show suggestions list"
                >
                  📋 List
                </button>
              )}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>WARRANTY</label>
          <input
            className="form-input"
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
            placeholder="e.g. 1 Year, 6 Months"
            style={{ background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, color: "#1E293B", fontWeight: 600 }}
          />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>CATEGORY</label>
          {categoryOptions && !isCustomCategory ? (
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <CustomSelect
                value={categoryOptions.includes(category) || (category && category !== "Other") ? category : ""}
                options={categoryOptions}
                placeholder="Select Category"
                onChange={(val) => {
                  if (val === "Other") {
                    setIsCustomCategory(true);
                    setCategory("");
                  } else {
                    setCategory(val);
                  }
                }}
                onDelete={hideCategory}
              />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6, width: "100%" }}>
              <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                <input
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Type category name..."
                  style={{ width: "100%", background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, color: "#1E293B", fontWeight: 600 }}
                />
              </div>
              {categoryOptions && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { addLocalCategory(category); setIsCustomCategory(false); }}
                  style={{ padding: "4px 8px", fontSize: 11, background: "#F5F3FF", height: "36px", alignSelf: "center", border: "1px solid #E9D8FD", color: "#7C3AED", borderRadius: 10 }}
                  title="Show suggestions list"
                >
                  📋 List
                </button>
              )}
            </div>
          )}
        </div>
      </div>



      {isIncentiveMode ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 8 }}>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>ASSIGN EMPLOYEE</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>👤</span>
              <select
                className="form-input"
                value={assignedEmployeeId}
                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600, appearance: "auto" }}
              >
                <option value="">-- Select Employee --</option>
                <option value="all">All Employees</option>
                {users.filter(u => u.role === "employee").map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 8 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>QUANTITY</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🧮</span>
                <input
                  type="number"
                  className="form-input"
                  value={qty || ""}
                  onChange={(e) => {
                    const val = Math.max(0, +e.target.value);
                    setQty(val);
                    setTotalCost(parseFloat((val * cost).toFixed(2)));
                    setSerialNumbers(prev => {
                      const next = Array(val).fill("");
                      for (let i = 0; i < Math.min(prev.length, val); i++) next[i] = prev[i];
                      return next;
                    });
                  }}
                  placeholder="0"
                  style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>UNIT COST (₹)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, fontWeight: 700 }}>₹</span>
                <input
                  type="number"
                  className="form-input"
                  value={cost || ""}
                  onChange={(e) => {
                    const val = +e.target.value;
                    setCost(val);
                    setTotalCost(parseFloat((val * qty).toFixed(2)));
                  }}
                  placeholder="0.00"
                  style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>TOTAL COST (₹)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>💵</span>
                <input
                  type="number"
                  className="form-input"
                  value={totalCost || ""}
                  onChange={(e) => {
                    const val = +e.target.value;
                    setTotalCost(val);
                    const calculatedCost = qty > 0 ? parseFloat((val / qty).toFixed(2)) : 0;
                    setCost(calculatedCost);
                  }}
                  placeholder="0.00"
                  style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 8 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>LOCATION</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>📍</span>
                <select
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value as any)}
                  style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600, appearance: "auto" }}
                >
                  {!isGodownOnly && <option value="Shop">In Stock</option>}
                  <option value="Godown 1">Godown 1</option>
                  <option value="Godown 2">Godown 2</option>
                  {!isGodownOnly && <option value="Display">Display</option>}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>SUPPLIER</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>👤</span>
                <input
                  className="form-input"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Supplier Name"
                  style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>STOCK DATE</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>📅</span>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ border: "none", background: "transparent", padding: "6px 8px", color: "#1E293B", fontWeight: 600 }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {serialNumbers.length > 0 && (
        <div style={{ marginTop: 10, borderTop: "1.5px dashed var(--border)", paddingTop: 10 }}>
          {/* Collapsible header */}
          <button
            type="button"
            onClick={() => setShowSerials(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: showSerials ? "linear-gradient(135deg, #fdf6ec, #f9ede0)" : "#f8f9fa",
              border: "1.5px solid var(--border)", borderRadius: 10, padding: "8px 12px",
              cursor: "pointer", transition: "all 0.2s", marginBottom: showSerials ? 8 : 0
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15 }}>📦</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brown-dark)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Serial / Batch Numbers
              </span>
              <span style={{
                background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 700,
                borderRadius: 20, padding: "2px 8px"
              }}>
                {serialNumbers.length} items
              </span>
              {serialNumbers.filter(s => s.trim()).length > 0 && (
                <span style={{
                  background: "#dcfce7", color: "#166534", fontSize: 10, fontWeight: 700,
                  borderRadius: 20, padding: "2px 8px"
                }}>
                  ✓ {serialNumbers.filter(s => s.trim()).length} filled
                </span>
              )}
            </div>
            <span style={{
              fontSize: 16, color: "var(--brown)", transform: showSerials ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s", lineHeight: 1
            }}>▾</span>
          </button>

          {showSerials && (
            <div style={{ animation: "fadeIn 0.2s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 8 }}>
                {serialNumbers.map((sn, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--brown)", textTransform: "uppercase" }}>Item #{i + 1}</label>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        className="form-input"
                        style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, flex: 1, borderColor: sn.trim() ? "var(--accent)" : undefined }}
                        value={sn}
                        onChange={(e) => {
                          const next = [...serialNumbers];
                          next[i] = e.target.value;
                          setSerialNumbers(next);
                        }}
                        placeholder={`Serial #${i + 1}`}
                      />
                      <button
                        type="button"
                        title="Scan Barcode"
                        onClick={() => setScanningIndex(i)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: "1.5px solid var(--accent)",
                          background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                          color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 16, flexShrink: 0,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.12)", transition: "transform 0.15s"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="modal-actions" style={{ justifyContent: "flex-start", gap: 12, marginTop: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          style={{
            background: "linear-gradient(135deg, #38BDF8 0%, #6D28D9 100%)",
            border: "none",
            color: "#ffffff",
            borderRadius: 12,
            padding: "10px 24px",
            fontWeight: 700,
            fontSize: 14,
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
            cursor: "pointer"
          }}
        >
          💾 Save Entry
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClose}
          style={{
            background: "#F5F3FF",
            border: "1px solid #E9D8FD",
            color: "#7C3AED",
            borderRadius: 12,
            padding: "10px 24px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
      </div>


      {scanningIndex !== null && (
        <BarcodeScannerModal
          onDetected={(code) => {
            const next = [...serialNumbers];
            next[scanningIndex] = code;
            setSerialNumbers(next);
            setScanningIndex(null);
          }}
          onClose={() => setScanningIndex(null)}
          itemLabel={`Item #${scanningIndex + 1}`}
        />
      )}
    </Modal>
  );
}

function BarcodeScannerModal({ onDetected, onClose, itemLabel }: { onDetected: (code: string) => void; onClose: () => void; itemLabel: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        // Start scanning using BarcodeDetector if available
        if ("BarcodeDetector" in window) {
          // @ts-ignore
          const detector = new window.BarcodeDetector({ formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "itf", "codabar", "data_matrix", "aztec", "pdf417"] });
          const scan = async () => {
            if (!active || !videoRef.current) return;
            try {
              // @ts-ignore
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                if (active) { onDetected(code); stop(); }
                return;
              }
            } catch (_) { }
            if (active) animFrameRef.current = requestAnimationFrame(scan);
          };
          if (videoRef.current) {
            videoRef.current.addEventListener("playing", () => { if (active) scan(); }, { once: true });
          }
        } else {
          setError("Barcode scanner not supported in this browser. Please enter manually.");
        }
      })
      .catch(() => setError("Camera access denied. Please allow camera or enter manually."));

    const stop = () => {
      active = false;
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };

    return stop;
  }, []);

  const handleManual = () => {
    if (manualCode.trim()) { onDetected(manualCode.trim()); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "24px 22px", width: 340,
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", gap: 14
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--brown-dark)" }}>📷 Scan Barcode</div>
            <div style={{ fontSize: 12, color: "var(--brown)", marginTop: 2 }}>Scanning for: <b>{itemLabel}</b></div>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#64748b" }}>✕</button>
        </div>

        {error ? (
          <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        ) : (
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#000", aspectRatio: "1" }}>
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              playsInline
              muted
            />
            {/* Scanner overlay */}
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none"
            }}>
              <div style={{
                width: 180, height: 180, border: "3px solid #22c55e", borderRadius: 14,
                boxShadow: "0 0 0 4000px rgba(0,0,0,0.35)"
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 24, height: 24, borderTop: "4px solid #22c55e", borderLeft: "4px solid #22c55e", borderRadius: "4px 0 0 0" }} />
                <div style={{ position: "absolute", top: 0, right: 0, width: 24, height: 24, borderTop: "4px solid #22c55e", borderRight: "4px solid #22c55e", borderRadius: "0 4px 0 0" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, width: 24, height: 24, borderBottom: "4px solid #22c55e", borderLeft: "4px solid #22c55e", borderRadius: "0 0 0 4px" }} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderBottom: "4px solid #22c55e", borderRight: "4px solid #22c55e", borderRadius: "0 0 4px 0" }} />
              </div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: "#64748b", textAlign: "center" }}>
          Barcode camera frame madhe dhara — automatic detect hoil
        </div>

        <div style={{ borderTop: "1px dashed #E2E8F0", paddingTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brown)", marginBottom: 6, textTransform: "uppercase" }}>Manually Enter</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="form-input"
              style={{ flex: 1, fontSize: 13 }}
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Type barcode / serial..."
              onKeyDown={e => { if (e.key === "Enter") handleManual(); }}
            />
            <button
              onClick={handleManual}
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                color: "#fff", border: "none", borderRadius: 8, padding: "0 14px",
                fontWeight: 700, cursor: "pointer", fontSize: 13
              }}
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



export function CustomersSection() {
  const { customers, orders } = useStore();
  return (
    <>
      <h2 className="page-title">Customers</h2>
      <p className="page-sub">All customers and their order history.</p>
      <div className="panel">
        <div className="panel-head"><h3 className="panel-title">All Customers</h3></div>
        <div className={customers.length > 0 ? "card-grid" : ""}>
          {customers.map((c) => (
            <div key={c.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <h4 className="data-card-title">{c.name}</h4>
                  <span className="data-card-subtitle">{c.email}</span>
                </div>
                <div><Pill status={c.status} /></div>
              </div>
              <div className="data-card-body">
                <div className="data-row"><span className="data-label">Phone</span><span className="data-value">{c.phone}</span></div>
                <div className="data-row"><span className="data-label">Address</span><span className="data-value" style={{ textAlign: "right", maxWidth: "60%" }}>{c.address}</span></div>
                <div className="data-row"><span className="data-label">Orders</span><span className="data-value">{orders.filter((o) => o.customerId === c.id).length}</span></div>
              </div>
            </div>
          ))}
          {customers.length === 0 && <div className="empty">No customers yet.</div>}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3 className="panel-title">All Orders</h3></div>
        <OrdersTable />
      </div>
    </>
  );
}

export function OrdersTable() {
  const { orders, products } = useStore();
  return (
    <div className={orders.length > 0 ? "card-grid" : ""}>
      {orders.map((o) => {
        const product = products.find(p => p.id === o.productId || p.name.toLowerCase() === o.productName.toLowerCase());
        const brandStr = product?.brand ? ` (${product.brand})` : "";
        return (
          <div key={o.id} className="data-card">
            <div className="data-card-header">
              <div>
                <h4 className="data-card-title">Order #{o.id}</h4>
                <span className="data-card-subtitle">{o.date}</span>
              </div>
              <div><Pill status={o.status} /></div>
            </div>
            <div className="data-card-body">
              <div className="data-row"><span className="data-label">Customer</span><span className="data-value">{o.customerName}</span></div>
              <div className="data-row"><span className="data-label">Product</span><span className="data-value">{o.productName}{brandStr} (x{o.qty})</span></div>
              <div className="data-row"><span className="data-label">Assigned</span><span className="data-value">{o.assignedToName ?? "—"}</span></div>
            </div>
            <div className="data-card-footer" style={{ justifyContent: "space-between" }}>
              <span className="data-label" style={{ alignSelf: "center" }}>Total</span>
              <span style={{ fontWeight: 700, color: "var(--brown-dark)", fontSize: 16 }}>₹{o.total.toLocaleString()}</span>
            </div>
          </div>
        );
      })}
      {orders.length === 0 && <div className="empty">No orders yet.</div>}
    </div>
  );
}

function OrderApprovalSection() {
  const { orders, products, users, setState, uid } = useStore();
  const [filter, setFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("all");

  const approvalOrders = useMemo(() => {
    return orders.filter((o) => !o.isIncentive && o.customerId !== "c_incentive" && o.customerName !== "Incentive Sell Request");
  }, [orders]);

  const list = filter === "all" ? approvalOrders : approvalOrders.filter((o) => o.status === filter);
  const [editDiscounts, setEditDiscounts] = useState<Record<string, number>>({});
  const [activeDoc, setActiveDoc] = useState<{ order: Order; type: "Bill" | "Order Copy" } | null>(null);

  const decide = (id: string, status: "Approved" | "Rejected", newDiscountPct?: number) => {
    const notifId2 = uid("n");
    setState((s) => {
      const order = s.orders.find((o) => o.id === id);
      let updatedProducts = s.products;
      if (order && status === "Approved") {
        updatedProducts = s.products.map((p) => {
          if (p.id === order.productId || p.name.toLowerCase() === order.productName.toLowerCase()) {
            const newQty = Math.max(0, (p.qty ?? p.stock ?? 0) - order.qty);
            const newStock = Math.max(0, (p.stock ?? p.qty ?? 0) - order.qty);
            return { ...p, qty: newQty, stock: newStock };
          }
          return p;
        });
      }
      const orderDetailsStr = order
        ? `Order #${id} for ${order.customerName} (${order.qty}x ${order.productName}) has been ${status.toLowerCase()}`
        : `Order #${id} has been ${status.toLowerCase()}`;
      const updatedNotifications = s.notifications.map((n) => {
        if (n.to === "superadmin" && n.message.toLowerCase().includes("pending")) {
          if (order && n.message.toLowerCase().includes(order.customerName.toLowerCase())) {
            return { ...n, read: true };
          }
          if (n.message.toLowerCase().includes("pending for approval")) {
            const otherPendingOrders = s.orders.filter(o => o.id !== id && o.status === "Pending");
            if (otherPendingOrders.length === 0) {
              return { ...n, read: true };
            }
          }
        }
        return n;
      });

      return {
        ...s,
        products: updatedProducts,
        orders: s.orders.map((o) => {
          if (o.id === id) {
            let finalTotal = o.total;
            let finalDiscount = o.discount;
            if (status === "Approved" && newDiscountPct !== undefined) {
              const product = s.products.find(p => p.id === o.productId || p.name.toLowerCase() === o.productName.toLowerCase());
              const basePrice = product ? product.price : Math.round(o.total / (1 - ((o.discount || 0) / 100)));
              finalDiscount = newDiscountPct;
              finalTotal = Math.max(0, (basePrice * o.qty) - Math.round((newDiscountPct / 100) * (basePrice * o.qty)));
            }
            return { ...o, status, discount: finalDiscount, total: finalTotal, sentToEmployee: true };
          }
          return o;
        }),
        notifications: [
          { id: notifId2, to: "employee", from: "Super Admin", message: orderDetailsStr, date: new Date().toISOString().slice(0, 10), read: false },
          ...updatedNotifications,
        ],
      };
    });
  };

  return (
    <>
      <h2 className="page-title">Order Approvals</h2>
      <p className="page-sub">Approve or reject orders created by managers.</p>
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">Orders ({list.length})</h3>
          <select className="form-select" style={{ maxWidth: 180 }} value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className={list.length > 0 ? "card-grid" : ""}>
          {list.map((o) => {
            const product = products.find(p => p.id === o.productId || p.name.toLowerCase() === o.productName.toLowerCase());
            const brandStr = product?.brand ? ` (${product.brand})` : "";
            const orderBasePrice = Math.round(o.total / (1 - ((o.discount || 0) / 100)));
            const currentDiscount = editDiscounts[o.id] !== undefined ? editDiscounts[o.id] : (o.discount || 0);
            const calculatedTotal = o.status === "Pending" ? Math.max(0, orderBasePrice - Math.round((currentDiscount / 100) * orderBasePrice)) : o.total;

            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const isProdIncentive = !!(product && (product.incentive ?? 0) > 0 && product.date && new Date(product.date) < ninetyDaysAgo);
            const isIncentiveOrder = o.isIncentive ?? isProdIncentive;

            const creatorUser = users.find(u => u.id === o.createdBy || u.username === o.createdBy || u.name.toLowerCase() === o.createdBy.toLowerCase());
            const creatorName = creatorUser ? `${creatorUser.name} (${creatorUser.role === "employee" ? "Employee" : creatorUser.role === "manager" ? "Manager" : "Admin"})` : (o.assignedToName ? `${o.assignedToName} (Employee)` : o.createdBy);

            return (
              <div key={o.id} className="data-card">
                <div className="data-card-header">
                  <div>
                    <h4 className="data-card-title">Order #{o.id}</h4>
                    <span className="data-card-subtitle" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                      <span className="pill" style={{ background: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", fontSize: "10px", padding: "2px 6px", fontWeight: 700 }}>
                        👤 By: {creatorName}
                      </span>
                      {isIncentiveOrder ? (
                        <span className="pill" style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde047", fontSize: "10px", padding: "2px 6px" }}>
                          ✨ Incentive {o.discount ? `(${o.discount}%)` : ""}
                        </span>
                      ) : (
                        <span className="pill" style={{ background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb", fontSize: "10px", padding: "2px 6px" }}>
                          Regular
                        </span>
                      )}
                      <span className="pill" style={{
                        background: o.docType === "Order Copy" ? "#f3e8ff" : "#e0f2fe",
                        color: o.docType === "Order Copy" ? "#6D28D9" : "#0369a1",
                        border: o.docType === "Order Copy" ? "1px solid #e9d5ff" : "1px solid #bae6fd",
                        fontSize: "10px",
                        padding: "2px 6px",
                        fontWeight: 700
                      }}>
                        {o.docType === "Order Copy" ? "📄 Order Copy" : "🧾 Bill / Invoice"}
                      </span>
                      {o.docType === "Order Copy" && o.bookingExpiryDate && (
                        o.bookingExpiryDate < new Date().toISOString().slice(0, 10) ? (
                          <span className="pill" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", fontSize: "10px", padding: "2px 6px", fontWeight: 800, animation: "pulse 1.5s infinite" }}>
                            🚨 Booking Expired ({o.bookingExpiryDate})
                          </span>
                        ) : (
                          <span className="pill" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontSize: "10px", padding: "2px 6px", fontWeight: 600 }}>
                            ⏳ Valid Until {o.bookingExpiryDate}
                          </span>
                        )
                      )}
                    </span>
                  </div>
                  <div><Pill status={o.status} /></div>
                </div>
                <div className="data-card-body">
                  <div className="data-row">
                    <span className="data-label">Placed By</span>
                    <span className="data-value" style={{ fontWeight: 800, color: "var(--accent, #d97706)" }}>
                      👤 {creatorName}
                    </span>
                  </div>
                  <div className="data-row">
                    <span className="data-label">Document Type</span>
                    <span className="data-value">
                      <span style={{
                        display: "inline-block",
                        background: o.docType === "Order Copy" ? "#f3e8ff" : "#e0f2fe",
                        color: o.docType === "Order Copy" ? "#6D28D9" : "#0369a1",
                        border: o.docType === "Order Copy" ? "1px solid #e9d5ff" : "1px solid #bae6fd",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "11px"
                      }}>
                        {o.docType === "Order Copy" ? "📄 Order Copy" : "🧾 Bill / Invoice"}
                      </span>
                    </span>
                  </div>
                  {o.bookingExpiryDate && (
                    <div className="data-row">
                      <span className="data-label">Booking Expiry</span>
                      <span className="data-value" style={{ color: o.bookingExpiryDate < new Date().toISOString().slice(0, 10) ? "#dc2626" : "#166534", fontWeight: 700 }}>
                        {o.bookingExpiryDate < new Date().toISOString().slice(0, 10) ? `🚨 Expired (${o.bookingExpiryDate})` : `⏳ Valid until ${o.bookingExpiryDate}`}
                      </span>
                    </div>
                  )}
                  <div className="data-row"><span className="data-label">Customer</span><span className="data-value">{o.customerName}</span></div>
                  <div className="data-row"><span className="data-label">Product</span><span className="data-value">{o.productName}{brandStr} (x{o.qty})</span></div>
                  <div className="data-row"><span className="data-label">Unit Price</span><span className="data-value">₹{Math.round(orderBasePrice / o.qty).toLocaleString()}</span></div>
                  {o.customerBargain && (
                    <div className="data-row"><span className="data-label">Bargaining</span><span className="data-value" style={{ color: "var(--danger)", fontWeight: 600, textAlign: "right" }}>{o.customerBargain}</span></div>
                  )}
                  <div className="data-row"><span className="data-label">Assigned</span><span className="data-value">{o.assignedToName ?? "—"}</span></div>
                </div>
                <div className="data-card-footer" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {o.status === "Pending" ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--biscuit-light)", padding: "8px 12px", borderRadius: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--brown-dark)" }}>DISCOUNT (%)</span>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: "80px", height: "30px", textAlign: "right" }}
                        value={currentDiscount}
                        onChange={(e) => setEditDiscounts({ ...editDiscounts, [o.id]: Number(e.target.value) })}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        min={0}
                        max={100}
                      />
                    </div>
                  ) : (
                    o.discount && o.discount > 0 ? (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--brown)" }}>
                        <span>Discount Applied:</span>
                        <span style={{ fontWeight: 600 }}>{o.discount}%</span>
                      </div>
                    ) : null
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "6px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 700, color: "var(--brown-dark)", fontSize: 16 }}>
                        ₹{calculatedTotal.toLocaleString()}
                      </span>
                      {o.status === "Pending" && currentDiscount > 0 && (
                        <span style={{ fontSize: "10px", color: "var(--brown)" }}>Includes discount</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", fontSize: 11, background: (!o.docType || o.docType === "Bill") ? "#e0f2fe" : undefined, borderColor: "#bae6fd", color: (!o.docType || o.docType === "Bill") ? "#0369a1" : undefined, fontWeight: (!o.docType || o.docType === "Bill") ? 700 : 500 }} onClick={() => setActiveDoc({ order: o, type: "Bill" })}>🧾 View Bill</button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", fontSize: 11, background: o.docType === "Order Copy" ? "#f3e8ff" : undefined, borderColor: "#e9d5ff", color: o.docType === "Order Copy" ? "#6D28D9" : undefined, fontWeight: o.docType === "Order Copy" ? 700 : 500 }} onClick={() => setActiveDoc({ order: o, type: "Order Copy" })}>📄 View Order Copy</button>
                      {o.status === "Pending" ? (
                        <div className="actions-row">
                          <button className="btn btn-success btn-sm" onClick={() => decide(o.id, "Approved", editDiscounts[o.id])}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => decide(o.id, "Rejected")}>Reject</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {list.length === 0 && <div className="empty">No orders.</div>}
        </div>
      </div>
      {activeDoc && (
        <OrderDocumentModal
          order={activeDoc.order}
          type={activeDoc.type}
          onClose={() => setActiveDoc(null)}
        />
      )}
    </>
  );
}

export function NotificationsSection({ role }: { role: "superadmin" | "manager" | "employee" }) {
  const { notifications, setState, orders, users, tasks, uid } = useStore();
  const navigate = useNavigate();

  const seen = new Set<string>();
  const list = notifications.filter((n) => {
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
        const hasPending = orders.some(o => o.status === "Pending");
        if (!hasPending) return false;
      }
    }
    return true;
  });

  // Mark all visible notifications of the role as read on unmount
  useEffect(() => {
    return () => {
      setState((s) => {
        const visibleUnreadIds = s.notifications
          .filter((n) => (n.to === role || n.to === "all") && !n.read)
          .map((n) => n.id);

        if (visibleUnreadIds.length > 0) {
          return {
            ...s,
            notifications: s.notifications.map((n) =>
              visibleUnreadIds.includes(n.id) ? { ...n, read: true } : n
            ),
          };
        }
        return s;
      });
    };
  }, [role, setState]);

  const unreadCount = list.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const unreadIds = list.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          unreadIds.includes(n.id) ? { ...n, read: true } : n
        ),
      }));
    }
  };

  const markAsRead = (id: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  };


  const getEnrichedMessage = (message: string) => {
    // Matches "Order #o2 approved" or "Order otcw9gf approved" or similar status transitions
    const match = message.match(/order\s*#?([a-z0-9]+)\s+(approved|rejected|delivered|pending)/i);
    if (match) {
      const orderId = match[1];
      const action = match[2].toLowerCase();

      const order = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
      if (order) {
        return `Order #${order.id} for ${order.customerName} (${order.qty}x ${order.productName}) has been ${action}`;
      }
    }
    return message;
  };

  const parseNotification = (n: { from: string; message: string }) => {
    let title = "System Update";
    let icon = "🔔";
    let color = "var(--info)";

    const msg = n.message.toLowerCase();

    if (msg.includes("approved")) {
      title = "Order Approved";
      icon = "✅";
      color = "var(--success)";
    } else if (msg.includes("delivered")) {
      title = "Order Delivered";
      icon = "🚚";
      color = "#38BDF8";
    } else if (msg.includes("pending") || msg.includes("created")) {
      title = "New Order Pending";
      icon = "⏳";
      color = "var(--accent)";
    } else if (msg.includes("rejected")) {
      title = "Order Rejected";
      icon = "❌";
      color = "var(--danger)";
    } else if (msg.includes("task")) {
      title = "Task Assignment";
      icon = "📝";
      color = "var(--accent)";
    }

    return { title, icon, color };
  };

  return (
    <>
      <h2 className="page-title">Notifications</h2>
      <p className="page-sub">Inbox of system events.</p>
      <div className="panel">
        <div className="panel-head" style={{ marginBottom: 18 }}>
          <h3 className="panel-title">Inbox ({list.length})</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {unreadCount > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--success)", borderColor: "var(--success)" }}
                onClick={markAllAsRead}
              >
                ✓ Mark all as read
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: "#c0473b" }}
              onClick={() => {
                if (confirm("Delete all notifications?")) {
                  setState((s) => ({
                    ...s,
                    notifications: s.notifications.filter((n) => n.to !== role && n.to !== "all"),
                  }));
                }
              }}
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <ul className="notif-list" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0 }}>
            {list.map((n) => {
              const { title, icon, color } = parseNotification(n);

              // Find assigned employee
              let assignedEmployee: User | undefined = undefined;
              let order: Order | undefined = undefined;
              let empTasks = 0;
              let empCompleted = 0;
              let empScore = 0;

              const match = n.message.match(/order\s*#?([a-z0-9]+)/i);
              if (match) {
                const orderId = match[1];
                const foundOrder = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
                if (foundOrder && foundOrder.assignedTo) {
                  order = foundOrder;
                  assignedEmployee = users.find(u => u.id === foundOrder.assignedTo);
                  if (assignedEmployee) {
                    const empId = assignedEmployee.id;
                    const uTasks = tasks.filter(t => t.assignedTo === empId);
                    empTasks = uTasks.length;
                    empCompleted = uTasks.filter(t => t.status === "Completed").length;
                    empScore = empTasks > 0 ? Math.round((empCompleted / empTasks) * 100) : 0;
                  }
                }
              }

              return (
                <li
                  key={n.id}
                  className={`notif-card ${n.read ? "read" : "unread"}`}
                  style={{
                    borderLeft: `5px solid ${color}`
                  }}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                  }}
                  title={!n.read ? "Click to mark as read" : ""}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: `${color}15`,
                      color: color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20
                    }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--brown-dark)" }}>{title}</span>
                        {!n.read && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: "white",
                              background: color,
                              padding: "2px 6px",
                              borderRadius: 4,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              boxShadow: `0 2px 4px ${color}40`
                            }}>
                              New
                            </span>
                            <span className="notif-unread-dot" style={{ backgroundColor: color }} />
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 13, marginTop: 3, color: "var(--brown)" }}>{getEnrichedMessage(n.message)}</div>

                      {role === "manager" && (
                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }} onClick={(e) => e.stopPropagation()}>
                          {assignedEmployee && (
                            <div style={{
                              padding: "6px 10px",
                              background: "rgba(122, 90, 50, 0.05)",
                              borderRadius: 8,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 10,
                              flexWrap: "wrap",
                              border: "1px solid rgba(122, 90, 50, 0.1)"
                            }}>
                              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--brown)" }}>
                                Assigned to: <strong style={{ color: "var(--brown-dark)" }}>{assignedEmployee.name}</strong>
                              </span>

                              {order && !order.sentToEmployee ? (
                                <button
                                  className="btn btn-sm"
                                  style={{
                                    padding: "2px 8px",
                                    fontSize: 11,
                                    background: "var(--success)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    boxShadow: "var(--shadow-sm)"
                                  }}
                                  onClick={() => {
                                    const currentOrder = order!;
                                    setState((s) => ({
                                      ...s,
                                      orders: s.orders.map((o) => o.id === currentOrder.id ? { ...o, sentToEmployee: true } : o),
                                      notifications: [
                                        {
                                          id: uid("n"),
                                          to: "employee",
                                          from: "Manager",
                                          message: `New approved order #${currentOrder.id} sent to your updates`,
                                          date: new Date().toISOString().slice(0, 10),
                                          read: false
                                        },
                                        ...s.notifications
                                      ]
                                    }));
                                  }}
                                >
                                  ✉️ Send to Employee
                                </button>
                              ) : (
                                <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 600 }}>✓ Sent to Employee Updates</span>
                              )}
                            </div>
                          )}

                          <div style={{ background: "var(--biscuit-light)", borderRadius: "12px", padding: "12px 16px", display: "flex", justifyContent: "space-between", maxWidth: "250px" }}>
                            <div>
                              <div style={{ color: "var(--brown)", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>TASKS</div>
                              <div style={{ color: "var(--brown-dark)", fontSize: "16px", fontWeight: 800 }}>{empCompleted} / {empTasks}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ color: "var(--brown)", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>SCORE</div>
                              <div style={{ color: "var(--success, #059669)", fontSize: "16px", fontWeight: 800 }}>{empScore}%</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "var(--light-brown)" }}>
                        <span>👤 {n.from}</span>
                        <span>📅 {n.date}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-circle btn-circle-danger"
                      style={{
                        width: 30,
                        height: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        setState((s) => ({ ...s, notifications: s.notifications.filter((notif) => notif.id !== n.id) }));
                      }}
                      title="Delete Notification"
                    >
                      🗑️
                    </button>
                  </div>

                </li>
              );
            })}
            {list.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--brown)",
                background: "var(--warm-white)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                borderStyle: "dashed"
              }}>
                <span style={{ fontSize: 32 }}>🔔</span>
                <p style={{ marginTop: 8, fontSize: 14, fontWeight: 500 }}>All caught up! No new notifications.</p>
              </div>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

export function ProfileSection() {
  const { currentUser } = useStore();
  if (!currentUser) return null;
  const initials = currentUser.name.split(" ").map((s) => s[0]).slice(0, 2).join("");
  const [showPassword, setShowPassword] = useState(false);

  // Custom badges and descriptions based on user role
  const roleConfig = {
    superadmin: {
      badgeClass: "badge-superadmin",
      label: "Super Admin",
      desc: "Full system administration and control",
      icon: "👑"
    },
    manager: {
      badgeClass: "badge-manager",
      label: "Store Manager",
      desc: "Manage inventory, users, and orders",
      icon: "💼"
    },
    employee: {
      badgeClass: "badge-employee",
      label: "Employee",
      desc: "Handle daily tasks, operations, and sales",
      icon: "👥"
    }
  };

  const config = roleConfig[currentUser.role] || roleConfig.employee;

  return (
    <div className="profile-container animated fadeIn">
      <h2 className="page-title">Profile</h2>
      <p className="page-sub">Account information and specifications.</p>

      <div className="profile-premium-card">
        {/* Banner Area containing Avatar & Name inside the brown banner! */}
        <div className="profile-banner">
          <div className="profile-banner-pattern" />

          <div className="profile-header-wrap">
            <div className="profile-avatar-large">
              {initials}
            </div>
            <div className="profile-title-area">
              <h3 className="profile-name">{currentUser.name}</h3>
              <span className={`profile-role-badge ${config.badgeClass}`}>
                {config.icon} {config.label}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details Body */}
        <div className="profile-body-content">
          <h4 className="profile-section-title">📌 Personal Specifications</h4>

          <div className="profile-info-grid">
            <div className="profile-info-card">
              <div className="profile-info-icon">📧</div>
              <div className="profile-info-details">
                <div className="profile-info-label">Email Address</div>
                <div className="profile-info-value">{currentUser.email ?? "—"}</div>
              </div>
            </div>

            <div className="profile-info-card">
              <div className="profile-info-icon">📞</div>
              <div className="profile-info-details">
                <div className="profile-info-label">Phone Number</div>
                <div className="profile-info-value">{currentUser.phone ?? "—"}</div>
              </div>
            </div>

            <div className="profile-info-card">
              <div className="profile-info-icon">👤</div>
              <div className="profile-info-details">
                <div className="profile-info-label">Username</div>
                <div className="profile-info-value">{currentUser.username}</div>
              </div>
            </div>

            <div className="profile-info-card">
              <div className="profile-info-icon">🆔</div>
              <div className="profile-info-details">
                <div className="profile-info-label">User / Employee ID</div>
                <div className="profile-info-value">{currentUser.employeeId ?? currentUser.id}</div>
              </div>
            </div>

            {currentUser.password && (
              <div className="profile-info-card">
                <div className="profile-info-icon">🔑</div>
                <div className="profile-info-details">
                  <div className="profile-info-label">Login Password</div>
                  <div className="profile-info-value" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontFamily: showPassword ? "monospace" : "inherit", letterSpacing: showPassword ? "0.5px" : "normal", fontWeight: 600 }}>
                      {showPassword ? currentUser.password : "••••••••"}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0, opacity: 0.8, display: "inline-flex", alignSelf: "center" }}
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentUser.jobTitle && (
              <div className="profile-info-card">
                <div className="profile-info-icon">💼</div>
                <div className="profile-info-details">
                  <div className="profile-info-label">Job Designation</div>
                  <div className="profile-info-value">{currentUser.jobTitle}</div>
                </div>
              </div>
            )}

            {currentUser.address && (
              <div className="profile-info-card">
                <div className="profile-info-icon">📍</div>
                <div className="profile-info-details">
                  <div className="profile-info-label">Residential Address</div>
                  <div className="profile-info-value">{currentUser.address}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--brown)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4f8a55" }} />
              Active System Session
            </span>
            <span style={{ fontSize: 12, color: "var(--brown)" }}>
              Access Level: <strong>{currentUser.role.toUpperCase()}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UpcomingFollowUps() {
  const { leads, currentUser, setState, users } = useStore();
  const navigate = useNavigate();
  const isSuperAdmin = currentUser?.role === "superadmin";

  const userLeads = useMemo(() => {
    if (currentUser?.role === "employee" || currentUser?.role === "manager") {
      return leads.filter(l => l.assignedTo === currentUser.id || (l.createdBy && l.createdBy === currentUser.name));
    }
    return leads;
  }, [leads, currentUser]);

  const handleViewAll = () => {
    if (!currentUser) return;
    const path = currentUser.role === "superadmin" ? "/super-admin" : `/${currentUser.role}`;
    navigate({ to: path, search: { tab: "leads" } });
  };

  const handleClearReminder = (leadId: string) => {
    if (!confirm("Are you sure you want to remove this follow-up reminder?")) return;
    setState(s => ({
      ...s,
      leads: s.leads.map(lead => lead.id === leadId ? { ...lead, followUpDate: undefined } : lead)
    }));
  };

  const getRelativeDays = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "In 1 days";
    if (diffDays > 1) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const formatFollowUpDate = (dStr: string) => {
    try {
      const date = new Date(dStr);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dStr;
    }
  };

  const getStatusColor = (status: Lead["status"]) => {
    const colors: Record<Lead["status"], string> = {
      New: "#38BDF8",
      Cold: "#6b7280",
      Warm: "#d97706",
      Hot: "#ef4444",
      Enrolled: "#10b981",
      Cancelled: "#db2777"
    };
    return colors[status] || "#38BDF8";
  };

  const upcoming = userLeads.filter(l => l.followUpDate && new Date(l.followUpDate) >= new Date(new Date().setHours(0, 0, 0, 0)));
  upcoming.sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime());

  return (
    <div className="panel" style={{ padding: "24px", background: "rgba(255, 255, 255, 0.72)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", borderRadius: "24px", border: "1px solid rgba(255, 255, 255, 0.5)", boxShadow: "0 15px 40px rgba(0, 0, 0, 0.06)" }}>
      <div className="panel-head" style={{ marginBottom: upcoming.length ? "16px" : "0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px", color: "#1E293B" }}>🔔</span>
          <h3 className="panel-title" style={{ fontSize: "22px", color: "#1F1F1F", fontWeight: 700 }}>Upcoming Follow-ups</h3>
        </div>
        {currentUser?.role !== "superadmin" && (
          <button className="btn btn-secondary btn-sm" style={{ padding: "8px 16px" }} onClick={handleViewAll}>View All Inquiries</button>
        )}
      </div>

      {upcoming.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "24px",
          color: "#8a6632",
          fontSize: "14px"
        }}>
          No upcoming follow-ups scheduled.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "16px" }}>
          {upcoming.map(l => {
            return (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  padding: "16px 20px",
                  background: "#fff",
                  border: "1px solid #f2e6d0",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(122, 90, 50, 0.01)"
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: getStatusColor(l.status),
                        marginRight: "10px",
                        display: "inline-block"
                      }}
                    />
                    <strong style={{ fontSize: "15px", fontWeight: 700, color: "#5c4115" }}>{l.name}</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        background: "#F5F3FF",
                        color: "#6D28D9",
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: "99px"
                      }}
                    >
                      {getRelativeDays(l.followUpDate!)}
                    </span>
                    {!isSuperAdmin && (
                      <button
                        onClick={() => handleClearReminder(l.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#991b1b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "4px",
                          borderRadius: "6px"
                        }}
                        title="Clear Reminder"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#8a6632" }}>
                    <Briefcase size={14} style={{ color: "#a8a29e" }} />
                    <span>{l.product || "N/A"}{l.brand ? ` - ${l.brand}` : ""}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#8a6632" }}>
                    <Calendar size={14} style={{ color: "#a8a29e" }} />
                    <span>{formatFollowUpDate(l.followUpDate!)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#8a6632" }}>
                    <Phone size={14} style={{ color: "#a8a29e" }} />
                    <span>{l.phone}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#8a6632" }}>
                    <UserIcon size={14} style={{ color: "#a8a29e" }} />
                    <span>Added By: <strong style={{ color: "#5c4115" }}>
                      {l.createdBy || "System"}
                      {(() => {
                        const creator = users.find(u => u.username === l.createdBy || u.name === l.createdBy);
                        return creator?.role ? ` (${creator.role.charAt(0).toUpperCase() + creator.role.slice(1)})` : "";
                      })()}
                    </strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export function TasksAssignSection({ readOnly = false }: { readOnly?: boolean } = {}) {
  const { currentUser, users, tasks, setState, uid } = useStore();
  const managers = users.filter(u => u.role === "manager");
  const employees = users.filter(u => u.role === "employee");

  const isManager = currentUser?.role === "manager";

  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [showAddManager, setShowAddManager] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const removeUser = (id: string, role: string) => {
    if (!confirm(`Delete this ${role}?`)) return;
    setState((s: any) => ({ ...s, users: s.users.filter((u: User) => u.id !== id) }));
  };

  const [activeTab, setActiveTab] = useState<"employee" | "manager">("employee");

  return (
    <>
      <h2 className="page-title">{isManager ? "Manage Employees" : "Add Employee / manager"}</h2>
      <p className="page-sub">{isManager ? "Manage your team — add, edit, or remove employees." : "Manage your team — add, edit, or remove managers and employees."}</p>

      {/* ── Tab Buttons ── */}
      {!isManager && (
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab("employee")} style={{
            padding: "12px 24px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "15px",
            borderRadius: "20px",
            background: activeTab === "employee" ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
            color: activeTab === "employee" ? "#FFFFFF" : "#1E293B",
            transition: "all 300ms ease",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: activeTab === "employee" ? "0 8px 25px rgba(124, 58, 237, 0.35)" : "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <span style={{ color: activeTab === "employee" ? "#FFFFFF" : "#1E293B" }}>👤 Employees</span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              fontSize: "12px",
              background: activeTab === "employee" ? "rgba(255, 255, 255, 0.25)" : "rgba(56, 189, 248, 0.14)",
              color: activeTab === "employee" ? "#FFFFFF" : "#1E293B",
              fontWeight: 800,
            }}>{employees.length}</span>
          </button>
          <button onClick={() => setActiveTab("manager")} style={{
            padding: "12px 24px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "15px",
            borderRadius: "20px",
            background: activeTab === "manager" ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
            color: activeTab === "manager" ? "#FFFFFF" : "#1E293B",
            transition: "all 300ms ease",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: activeTab === "manager" ? "0 8px 25px rgba(124, 58, 237, 0.35)" : "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <span style={{ color: activeTab === "manager" ? "#FFFFFF" : "#1E293B" }}>👔 Managers</span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              fontSize: "12px",
              background: activeTab === "manager" ? "rgba(255, 255, 255, 0.25)" : "rgba(56, 189, 248, 0.14)",
              color: activeTab === "manager" ? "#FFFFFF" : "#1E293B",
              fontWeight: 800,
            }}>{managers.length}</span>
          </button>
        </div>
      )}

      {/* ── Employee Tab Content ── */}
      {activeTab === "employee" && (
        <div style={{
          background: "#FFFFFF",
          borderRadius: "16px", padding: "20px", border: "1px solid #EEF1F8",
          boxShadow: "0 4px 20px rgba(124, 58, 237, 0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>👤 All Employees</span>
            </h3>
            {!readOnly && (
              <button onClick={() => setShowAddEmployee(true)} className="btn btn-primary btn-sm" style={{
                padding: "10px 22px", borderRadius: "999px", border: "none",
                background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)", color: "#FFFFFF",
                cursor: "pointer", fontSize: "13px", fontWeight: 700,
                boxShadow: "0 8px 20px rgba(124, 58, 237, 0.25)",
                transition: "all 300ms ease",
              }}>+ Add Employee</button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
            {employees.map(e => (
              <UnifiedEmployeeCard
                key={e.id}
                employee={e}
                userTasks={tasks.filter(t => t.assignedTo === e.id)}
                actions={!readOnly ? (
                  <>
                    <button onClick={() => setEditingEmployee(e)} title="Edit" style={{
                      width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #F3EEFF",
                      background: "#F5F3FF", color: "#7C3AED", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: "14px", transition: "all 0.2s"
                    }}>✏️</button>
                    <button onClick={() => removeUser(e.id, "employee")} title="Delete" style={{
                      width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #fee2e2",
                      background: "#fef2f2", color: "#ef4444", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : undefined}
              />
            ))}
            {employees.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#64748B", padding: "20px 0", fontSize: "12px" }}>No employees yet. Click + Add Employee to create one.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Manager Tab Content ── */}
      {activeTab === "manager" && (
        <div style={{
          background: "#FFFFFF",
          borderRadius: "16px", padding: "20px", border: "1px solid #EEF1F8",
          boxShadow: "0 4px 20px rgba(124, 58, 237, 0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>👔 All Managers</span>
            </h3>
            {!readOnly && (
              <button onClick={() => setShowAddManager(true)} className="btn btn-primary btn-sm" style={{
                padding: "10px 22px", borderRadius: "999px", border: "none",
                background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)", color: "#FFFFFF",
                cursor: "pointer", fontSize: "13px", fontWeight: 700,
                boxShadow: "0 8px 20px rgba(124, 58, 237, 0.25)",
                transition: "all 300ms ease",
              }}>+ Add Manager</button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
            {managers.map(m => (
              <UnifiedEmployeeCard
                key={m.id}
                employee={m}
                actions={!readOnly ? (
                  <>
                    <button onClick={() => setEditingManager(m)} title="Edit" style={{
                      width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #F3EEFF",
                      background: "#F5F3FF", color: "#7C3AED", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: "14px", transition: "all 0.2s"
                    }}>✏️</button>
                    <button onClick={() => removeUser(m.id, "manager")} title="Delete" style={{
                      width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #fee2e2",
                      background: "#fef2f2", color: "#ef4444", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : undefined}
              />
            ))}
            {managers.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#64748B", padding: "20px 0", fontSize: "12px" }}>No managers yet. Click + Add Manager to create one.</div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Manager */}
      {showAddManager && (
        <UserForm title="Add Manager" onClose={() => setShowAddManager(false)}
          onSave={(data) => { setState((s: any) => ({ ...s, users: [...s.users, { id: uid("u"), role: "manager", ...data }] })); setShowAddManager(false); }} />
      )}
      {editingManager && (
        <UserForm title="Edit Manager" initial={editingManager} onClose={() => setEditingManager(null)}
          onSave={(data) => { setState((s: any) => ({ ...s, users: s.users.map((u: User) => u.id === editingManager.id ? { ...u, ...data } : u) })); setEditingManager(null); }} />
      )}

      {/* Add/Edit Employee */}
      {showAddEmployee && (
        <EmployeeForm title="Add Employee" onClose={() => setShowAddEmployee(false)}
          onSave={(data) => { setState((s: any) => ({ ...s, users: [...s.users, { id: uid("u"), role: "employee", ...data }] })); setShowAddEmployee(false); }} />
      )}
      {editingEmployee && (
        <EmployeeForm title="Edit Employee" initial={editingEmployee} onClose={() => setEditingEmployee(null)}
          onSave={(data) => { setState((s: any) => ({ ...s, users: s.users.map((u: User) => u.id === editingEmployee.id ? { ...u, ...data } : u) })); setEditingEmployee(null); }} />
      )}
    </>
  );
}

export function TaskAssignmentSection() {
  const { users, tasks, setState, uid, currentUser } = useStore();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (tasks.some((t) => t.title.includes("Sell Request"))) {
      setState((s: any) => ({
        ...s,
        tasks: s.tasks.filter((t: any) => !t.title.includes("Sell Request"))
      }));
    }
  }, [tasks, setState]);

  const handleEditTaskSave = (taskId: string, newTitle: string, newAssigneeId: string) => {
    const assignee = users.find(u => u.id === newAssigneeId);
    if (!assignee) return;

    setState((s: any) => ({
      ...s,
      tasks: s.tasks.map((t: any) => t.id === taskId ? { ...t, title: newTitle, assignedTo: newAssigneeId, assignedToName: assignee.name } : t)
    }));
    setEditingTask(null);
  };

  const isSuperAdmin = currentUser?.role === "superadmin";

  const managers = users.filter(u => u.role === "manager");
  const employees = users.filter(u => u.role === "employee");

  const regularTasks = useMemo(() => tasks.filter((t) => !t.title.includes("Sell Request")), [tasks]);

  // Only show employees/managers who currently have at least one task assigned
  const employeesWithTasks = employees.filter(e => regularTasks.some(t => t.assignedTo === e.id));
  const managersWithTasks = managers.filter(m => regularTasks.some(t => t.assignedTo === m.id));

  const [activeTab, setActiveTab] = useState<"employee" | "manager">("employee");

  const eligibleAssignees = useMemo(() => {
    if (isSuperAdmin) {
      return users.filter(u => u.role === "employee" || u.role === "manager");
    } else {
      return users.filter(u => u.role === "employee");
    }
  }, [users, isSuperAdmin]);

  const handleAssignTaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("taskTitle") as string;
    const assigneeId = formData.get("assigneeId") as string;

    if (!title.trim() || !assigneeId) return;

    const assignee = users.find(u => u.id === assigneeId);
    if (!assignee) return;

    const taskId = uid("t");
    const notifId = uid("n");
    const today = new Date().toISOString().slice(0, 10);

    setState((s: any) => ({
      ...s,
      tasks: [
        ...s.tasks,
        {
          id: taskId,
          title: title.trim(),
          assignedTo: assigneeId,
          assignedToName: assignee.name,
          status: "Pending",
          date: today,
        }
      ],
      notifications: [
        {
          id: notifId,
          to: assignee.role,
          from: isSuperAdmin ? "Super Admin" : "Manager",
          message: `New task assigned: ${title.trim()}`,
          date: today,
          read: false,
        },
        ...s.notifications,
      ]
    }));

    setShowAssignModal(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    setState((s: any) => ({
      ...s,
      tasks: s.tasks.filter((t: any) => t.id !== taskId)
    }));
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>Task Assign</h2>
          <p className="page-sub" style={{ margin: "4px 0 0 0" }}>View members with assigned tasks and track progress.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAssignModal(true)}>+ Assign Task</button>
      </div>

      {/* ── Tab Buttons (Show only if Admin) ── */}
      {isSuperAdmin ? (
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab("employee")} style={{
            padding: "12px 24px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "15px",
            borderRadius: "20px",
            background: activeTab === "employee" ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
            color: activeTab === "employee" ? "#FFFFFF" : "#1E293B",
            transition: "all 300ms ease",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: activeTab === "employee" ? "0 8px 25px rgba(124, 58, 237, 0.3)" : "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <span style={{ color: activeTab === "employee" ? "#FFFFFF" : "#1E293B" }}>👤 Employees</span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              fontSize: "12px",
              background: activeTab === "employee" ? "rgba(255, 255, 255, 0.2)" : "#F2F2F2",
              color: activeTab === "employee" ? "#FFFFFF" : "#1E293B",
              fontWeight: 800,
            }}>{employeesWithTasks.length}</span>
          </button>
          <button onClick={() => setActiveTab("manager")} style={{
            padding: "12px 24px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "15px",
            borderRadius: "20px",
            background: activeTab === "manager" ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
            color: activeTab === "manager" ? "#FFFFFF" : "#1E293B",
            transition: "all 300ms ease",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: activeTab === "manager" ? "0 8px 25px rgba(124, 58, 237, 0.3)" : "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <span style={{ color: activeTab === "manager" ? "#FFFFFF" : "#1E293B" }}>👔 Managers</span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              fontSize: "12px",
              background: activeTab === "manager" ? "rgba(255, 255, 255, 0.2)" : "#F2F2F2",
              color: activeTab === "manager" ? "#FFFFFF" : "#2E3A31",
              fontWeight: 800,
            }}>{managersWithTasks.length}</span>
          </button>
        </div>
      ) : null}

      {/* ── Employee List (Active Tab = Employee or if user is Manager) ── */}
      {(activeTab === "employee" || !isSuperAdmin) && (
        <div style={{
          background: "#FFFFFF",
          borderRadius: "16px", padding: "20px", border: "1px solid #EEF1F8",
          boxShadow: "0 4px 20px rgba(124, 58, 237, 0.04)",
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>👤 Employees Tasks</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
            {employeesWithTasks.map(e => (
              <UnifiedEmployeeCard
                key={e.id}
                employee={e}
                userTasks={regularTasks.filter(t => t.assignedTo === e.id)}
                actions={
                  <>
                    <button onClick={() => {
                      const userTasks = regularTasks.filter(t => t.assignedTo === e.id);
                      if (userTasks.length > 0) {
                        setEditingTask(userTasks[0]);
                      }
                    }} title="Edit Task" style={{
                      width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #F3EEFF",
                      background: "#F5F3FF", color: "#7C3AED", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: "14px", transition: "all 0.2s"
                    }}>✏️</button>
                    <button onClick={() => {
                      const userTasks = regularTasks.filter(t => t.assignedTo === e.id);
                      if (userTasks.length > 0) {
                        handleDeleteTask(userTasks[0].id);
                      }
                    }} title="Delete Task" style={{
                      width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #fee2e2",
                      background: "#fef2f2", color: "#ef4444", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                }
              >
                {/* Tasks Section */}
                <div style={{ marginTop: "12px", borderTop: "1px solid #EEF1F8", paddingTop: "10px" }}>
                  <div style={{ fontWeight: 700, fontSize: "12px", color: "#1E293B", marginBottom: "6px" }}>📋 Tasks:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {regularTasks.filter(t => t.assignedTo === e.id).map(t => {
                      const styles = t.status === "Completed"
                        ? { bg: "#f0fdf4", color: "#16a34a", border: "#dcfce7", bar: "#10b981" }
                        : t.status === "In Progress"
                          ? { bg: "#F5F3FF", color: "#7C3AED", border: "#F3EEFF", bar: "#38BDF8" }
                          : { bg: "#fff5f5", color: "#e53e3e", border: "#fed7d7", bar: "#fc8181" };
                      return (
                        <div
                          key={t.id}
                          className="task-item-premium"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            background: "#F8FAFC",
                            border: "1px solid #EEF1F8",
                            borderLeft: `4px solid ${styles.bar}`,
                            padding: "10px 14px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            transition: "all 0.2s ease-in-out",
                            cursor: "default"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "#1E293B", fontWeight: 600 }}>{t.title}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "10px",
                                padding: "3px 8px",
                                borderRadius: "20px",
                                background: styles.bg,
                                color: styles.color,
                                border: `1px solid ${styles.border}`,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px"
                              }}>
                                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: styles.color }} />
                                {t.status}
                              </span>
                            </div>
                          </div>

                          {/* Task Proof Details for completed tasks */}
                          {t.status === "Completed" && (t.proofNote || t.proofUrl) && (
                            <div style={{
                              marginTop: "4px",
                              padding: "8px 10px",
                              background: "#f0fdf4",
                              border: "1px solid #bfeaca",
                              borderRadius: "6px",
                              fontSize: "11px",
                              color: "#14532d"
                            }}>
                              <div style={{ fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                <span>📄</span> Proof of Completion:
                              </div>
                              {t.proofNote && <div style={{ fontStyle: "italic", whiteSpace: "pre-wrap" }}>"{t.proofNote}"</div>}
                              {t.proofUrl && (
                                <div style={{ marginTop: "8px" }}>
                                  <a
                                    href={t.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      color: "#16a34a",
                                      textDecoration: "underline",
                                      fontWeight: 600
                                    }}
                                  >
                                    📸 View Attachment/Photo
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </UnifiedEmployeeCard>
            ))}
            {employeesWithTasks.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#64748B", padding: "20px 0", fontSize: "12px" }}>No employees with assigned tasks.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Manager List (Only if Admin & Tab = Manager) ── */}
      {isSuperAdmin && activeTab === "manager" && (
        <div style={{
          background: "#FFFFFF",
          borderRadius: "16px", padding: "20px", border: "1px solid #EEF1F8",
          boxShadow: "0 4px 20px rgba(124, 58, 237, 0.04)",
        }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>👔 Managers Tasks</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
            {managersWithTasks.map(m => (
              <div key={m.id} style={{
                background: "#FFFFFF", borderRadius: "12px", padding: "14px",
                border: "1px solid #EEF1F8", boxShadow: "0 4px 12px rgba(124,58,237,0.03)",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#1E293B", marginBottom: "10px" }}>{m.name}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Briefcase size={12} style={{ color: "#7C3AED" }} />
                      <span style={{ color: "#64748B", width: "65px" }}>Role:</span>
                      <strong style={{ color: "#1E293B" }}>{m.jobTitle || "Manager"}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <UserIcon size={12} style={{ color: "#7C3AED" }} />
                      <span style={{ color: "#64748B", width: "65px" }}>Username:</span>
                      <strong style={{ color: "#1E293B" }}>{m.username || "—"}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Phone size={12} style={{ color: "#7C3AED" }} />
                      <span style={{ color: "#64748B", width: "65px" }}>Phone:</span>
                      <strong style={{ color: "#1E293B" }}>{m.phone || "—"}</strong>
                    </div>
                  </div>

                  {/* Tasks Section */}
                  <div style={{ marginTop: "12px", borderTop: "1px solid #EEF1F8", paddingTop: "10px" }}>
                    <div style={{ fontWeight: 700, fontSize: "12px", color: "#1E293B", marginBottom: "6px" }}>📋 Tasks:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {regularTasks.filter(t => t.assignedTo === m.id).map(t => (
                        <div key={t.id} style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#F8FAFC", border: "1px solid #EEF1F8", padding: "8px 10px", borderRadius: "8px", fontSize: "11px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "#1E293B", fontWeight: 600 }}>{t.title}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{
                                fontSize: "9px",
                                padding: "2px 4px",
                                borderRadius: "3px",
                                background: t.status === "Completed" ? "#d1fae5" : t.status === "In Progress" ? "#F3EEFF" : "#fee2e2",
                                color: t.status === "Completed" ? "#065f46" : t.status === "In Progress" ? "#6D28D9" : "#991b1b",
                                fontWeight: 700
                              }}>{t.status}</span>
                              <button onClick={() => handleDeleteTask(t.id)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#ef4444", padding: 0, fontWeight: 700 }}>✕</button>
                            </div>
                          </div>

                          {/* Task Proof Details for completed manager tasks */}
                          {t.status === "Completed" && (t.proofNote || t.proofUrl) && (
                            <div style={{
                              marginTop: "4px",
                              padding: "6px 8px",
                              background: "#f0fdf4",
                              border: "1px solid #bfeaca",
                              borderRadius: "6px",
                              fontSize: "10px",
                              color: "#14532d"
                            }}>
                              <div style={{ fontWeight: 700, marginBottom: "2px" }}>📄 Proof of Completion:</div>
                              {t.proofNote && <div style={{ fontStyle: "italic", whiteSpace: "pre-wrap" }}>"{t.proofNote}"</div>}
                              {t.proofUrl && (
                                <div style={{ marginTop: "4px" }}>
                                  <a
                                    href={t.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      color: "#16a34a",
                                      textDecoration: "underline",
                                      fontWeight: 600
                                    }}
                                  >
                                    📸 View Attachment
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {managersWithTasks.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#c4956a", padding: "20px 0", fontSize: "12px" }}>No managers with assigned tasks.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Assign Task Modal ── */}
      {showAssignModal && (
        <Modal title="+ Assign New Task" onClose={() => setShowAssignModal(false)}>
          <form onSubmit={handleAssignTaskSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>TASK DESCRIPTION</label>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "6px 10px" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>📝</span>
                <textarea
                  name="taskTitle"
                  placeholder="Describe the task details..."
                  rows={3}
                  style={{
                    width: "100%", border: "none", background: "transparent", padding: "4px 8px",
                    fontSize: "13px", color: "#1E293B", fontWeight: 600, outline: "none", resize: "none"
                  }}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>SELECT ASSIGNEE</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>👤</span>
                <select
                  name="assigneeId"
                  style={{
                    width: "100%", border: "none", background: "transparent", padding: "6px 8px",
                    fontSize: "13px", color: "#1E293B", fontWeight: 600, outline: "none", appearance: "auto"
                  }}
                  required
                >
                  <option value="">-- Choose Member --</option>
                  {eligibleAssignees.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === "manager" ? "Manager" : "Employee"}{u.jobTitle ? ` - ${u.jobTitle}` : ""})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button className="btn btn-ghost" type="button" onClick={() => setShowAssignModal(false)} style={{ background: "#F8FAFC", border: "1px solid #F3EEFF", color: "#7C3AED", fontWeight: 700 }}>Cancel</button>
              <button className="btn btn-primary" type="submit">Assign Task</button>
            </div>
          </form>
        </Modal>
      )}

      {editingTask && (
        <Modal title="Edit Task" onClose={() => setEditingTask(null)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get("taskTitle") as string;
            const assigneeId = formData.get("assigneeId") as string;
            if (title.trim() && assigneeId) {
              handleEditTaskSave(editingTask.id, title.trim(), assigneeId);
            }
          }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>TASK DESCRIPTION</label>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "6px 10px" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>📝</span>
                <textarea
                  name="taskTitle"
                  defaultValue={editingTask.title}
                  placeholder="Describe the task details..."
                  rows={3}
                  style={{
                    width: "100%", border: "none", background: "transparent", padding: "4px 8px",
                    fontSize: "13px", color: "#1E293B", fontWeight: 600, outline: "none", resize: "none"
                  }}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, marginBottom: 3, color: "#7C3AED", fontWeight: 800 }}>SELECT ASSIGNEE</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: "1px solid #F3EEFF", borderRadius: 12, padding: "2px 10px" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F3FF", border: "1px solid #E9D8FD", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>👤</span>
                <select
                  name="assigneeId"
                  defaultValue={editingTask.assignedTo}
                  style={{
                    width: "100%", border: "none", background: "transparent", padding: "6px 8px",
                    fontSize: "13px", color: "#1E293B", fontWeight: 600, outline: "none", appearance: "auto"
                  }}
                  required
                >
                  <option value="">-- Choose Member --</option>
                  {eligibleAssignees.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === "manager" ? "Manager" : "Employee"}{u.jobTitle ? ` - ${u.jobTitle}` : ""})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button className="btn btn-ghost" type="button" onClick={() => setEditingTask(null)} style={{ background: "#F8FAFC", border: "1px solid #F3EEFF", color: "#7C3AED", fontWeight: 700 }}>Cancel</button>
              <button className="btn btn-primary" type="submit">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function LeadPipelineOverview({ activeFilter, onFilterChange }: { activeFilter?: string, onFilterChange?: (status: string) => void }) {
  const { leads } = useStore();
  const getCount = (status: string) => leads.filter(l => l.status === status).length;

  const getCardStyle = (status: string) => ({
    cursor: onFilterChange ? "pointer" : "default",
    border: activeFilter === status ? "2px solid #d97706" : undefined,
    boxShadow: activeFilter === status ? "0 4px 12px rgba(217, 119, 6, 0.2)" : undefined,
    transform: activeFilter === status ? "scale(1.02)" : "none",
    transition: "all 0.2s ease"
  });

  const statuses = [
    { key: "New", label: "New Leads", color: "#38BDF8", bg: "#F5F3FF", icon: "🆕" },
    { key: "Cold", label: "Cold Leads", color: "#6b7280", bg: "#f3f4f6", icon: "❄️" },
    { key: "Warm", label: "Warm Leads", color: "#f59e0b", bg: "#fef3c7", icon: "🌤️" },
    { key: "Hot", label: "Hot Leads", color: "#ef4444", bg: "#fee2e2", icon: "🔥" },
    { key: "Enrolled", label: "Enrolled", color: "#10b981", bg: "#d1fae5", icon: "🎓" },
    { key: "Cancelled", label: "Cancelled", color: "#ec4899", bg: "#fce7f3", icon: "❌" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
      {statuses.map(st => (
        <div
          key={st.key}
          className="panel"
          style={{
            ...getCardStyle(st.key),
            background: st.bg,
            borderColor: activeFilter === st.key ? st.color : "transparent",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            textAlign: "center"
          }}
          onClick={() => onFilterChange && onFilterChange(st.key)}
        >
          <span style={{ fontSize: "24px", marginBottom: "8px" }}>{st.icon}</span>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>{st.label}</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: st.color, marginTop: "4px" }}>{getCount(st.key)}</div>
        </div>
      ))}
    </div>
  );
}

export function LeadCard({ lead, onDelete, onEdit }: { lead: Lead; onDelete: (id: string) => void; onEdit: (lead: Lead) => void }) {
  const { setState, users, currentUser } = useStore();
  const [localNotes, setLocalNotes] = useState(lead.notes || "");
  const [localDate, setLocalDate] = useState(lead.followUpDate || "");
  const isSuperAdmin = currentUser?.role === "superadmin";

  useEffect(() => {
    setLocalNotes(lead.notes || "");
    setLocalDate(lead.followUpDate || "");
  }, [lead]);

  const updateStatus = (status: Lead["status"]) => {
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === lead.id ? { ...l, status } : l)),
    }));
  };

  const handleNotesBlur = () => {
    if (localNotes !== (lead.notes || "")) {
      setState((s) => ({
        ...s,
        leads: s.leads.map((l) => (l.id === lead.id ? { ...l, notes: localNotes || undefined } : l)),
      }));
    }
  };

  const handleSetReminder = () => {
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === lead.id ? { ...l, followUpDate: localDate || undefined } : l)),
    }));
  };

  const handleClearReminder = () => {
    setLocalDate("");
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === lead.id ? { ...l, followUpDate: undefined } : l)),
    }));
  };

  const handleAssignChange = (assignedTo: string) => {
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === lead.id ? { ...l, assignedTo: assignedTo || undefined } : l)),
    }));
  };

  const getStatusBadgeStyle = (status: Lead["status"]) => {
    const styles: Record<Lead["status"], { bg: string; color: string }> = {
      New: { bg: "#F5F3FF", color: "#6D28D9" },
      Cold: { bg: "#f3f4f6", color: "#475569" },
      Warm: { bg: "#fffbeb", color: "#d97706" },
      Hot: { bg: "#fef2f2", color: "#dc2626" },
      Enrolled: { bg: "#ecfdf5", color: "#059669" },
      Cancelled: { bg: "#fdf2f8", color: "#db2777" },
    };
    return styles[status] || styles.New;
  };

  const formatReminderDate = (dStr: string) => {
    try {
      const date = new Date(dStr);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dStr;
    }
  };

  const statusOptions: { key: Lead["status"]; label: string; color: string; border: string; dot: string }[] = [
    { key: "Cold", label: "Cold", color: "#4b5563", border: "#d1d5db", dot: "#6b7280" },
    { key: "Warm", label: "Warm", color: "#d97706", border: "#fde68a", dot: "#d97706" },
    { key: "Hot", label: "Hot", color: "#dc2626", border: "#fecaca", dot: "#dc2626" },
    { key: "Enrolled", label: "Enrolled", color: "#059669", border: "#a7f3d0", dot: "#059669" },
    { key: "Cancelled", label: "Cancel", color: "#db2777", border: "#fbcfe8", dot: "#db2777" },
    { key: "New", label: "New", color: "#6D28D9", border: "#E9D8FD", dot: "#6D28D9" }
  ];

  const badgeStyle = getStatusBadgeStyle(lead.status);

  return (
    <div className="panel animate fadeIn" style={{ padding: "28px", border: "1px solid #f1ece4", borderRadius: "20px", background: "#ffffff", marginBottom: "24px", boxShadow: "0 10px 30px rgba(122, 90, 50, 0.04)" }}>
      {/* Top Profile & Header Row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
        <div style={{
          width: "42px", height: "42px", borderRadius: "50%", background: "#fffbeb",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", fontSize: "18px",
          marginTop: "2px"
        }}>
          👤
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: 700, color: "#1c1917", fontFamily: "Georgia, serif", textTransform: "uppercase", letterSpacing: "1px" }}>
            {lead.name}
          </h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              background: "#f3f4f6", color: "#4b5563", fontSize: "12px", fontWeight: 600,
              padding: "4px 12px", borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "6px", border: "1px solid #e5e7eb"
            }}>
              👤 {lead.status}
            </span>
            {lead.product && (
              <span style={{
                background: "#fff7ed", color: "#ea580c", fontSize: "12px", fontWeight: 600,
                padding: "4px 12px", borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "6px", border: "1px solid #ffedd5"
              }}>
                📋 {lead.product}{lead.brand ? ` - ${lead.brand}` : ""}
              </span>
            )}
            <span style={{
              background: "#f5f3ff", color: "#6d28d9", fontSize: "12px", fontWeight: 600,
              padding: "4px 12px", borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "6px", border: "1px solid #ede9fe"
            }}>
              ✍️ Added By: {lead.createdBy || "System"}
              {(() => {
                const creator = users.find(u => u.username === lead.createdBy || u.name === lead.createdBy);
                return creator?.role ? ` (${creator.role.charAt(0).toUpperCase() + creator.role.slice(1)})` : "";
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Button Row: Status switches + Remove */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingBottom: "20px", borderBottom: "1px solid #f5ede0", marginBottom: "24px" }}>
        {statusOptions.map(opt => {
          const isActive = lead.status === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => {
                if (isSuperAdmin) return;
                updateStatus(opt.key);
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "99px",
                fontSize: "12px", fontWeight: 600, cursor: isSuperAdmin ? "default" : "pointer", transition: "all 0.2s ease",
                backgroundColor: isActive ? opt.color : "#ffffff", color: isActive ? "#ffffff" : opt.color,
                border: `1px solid ${isActive ? opt.color : opt.border}`,
                opacity: isSuperAdmin && !isActive ? 0.6 : 1,
              }}
            >
              {opt.key === "Cancelled" ? <span>🚫</span> : <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isActive ? "#ffffff" : opt.dot }} />}
              {opt.label}
            </button>
          );
        })}

        {!isSuperAdmin && (
          <>
            <div style={{ width: "1px", height: "24px", backgroundColor: "#f5ede0", margin: "0 6px" }} />
            <button
              onClick={() => onDelete(lead.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "99px",
                fontSize: "12px", fontWeight: 600, cursor: "pointer", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fee2e2", transition: "all 0.2s ease"
              }}
            >
              🗑 Remove
            </button>
          </>
        )}

        {!isSuperAdmin && (
          <button
            onClick={() => onEdit(lead)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "99px",
              fontSize: "12px", fontWeight: 600, cursor: "pointer", backgroundColor: "#fafaf9", color: "#5c4115", border: "1px solid #e7e5e4", transition: "all 0.2s ease", marginLeft: "auto"
            }}
          >
            ✏ Edit Details
          </button>
        )}
      </div>

      {/* Grid of detail list items */}
      <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px", color: "#57534e", fontSize: "14px", fontWeight: 500 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "16px" }}>✉</span>
            <span>{lead.email || "--"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "16px" }}>📖</span>
            <span>{lead.gender ? `Gender: ${lead.gender}` : "NA"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "16px" }}>📍</span>
            <span style={{ textTransform: "uppercase" }}>{lead.city || "UNKNOWN"}</span>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "16px" }}>📞</span>
            <span>{lead.phone}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "16px" }}>📅</span>
            <span>{new Date(lead.date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>

      <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "24px" }}>
        {/* Info Boxes */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#8a6632", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lead Details</div>
          <div style={{ background: "#fcfaf5", border: "1px solid #f1ece1", borderRadius: "12px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#8a6632" }}>
              PRODUCT: <span style={{ color: "#5c4115", fontSize: "14px", marginLeft: "6px" }}>{lead.product || "N/A"}{lead.brand ? ` (${lead.brand})` : ""}</span>
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#8a6632" }}>
              SOURCE: <span style={{ color: "#5c4115", fontSize: "14px", marginLeft: "6px", textTransform: "uppercase" }}>{lead.source || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Admin Comments Box */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#8a6632", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Admin Comments</div>
          <textarea
            className="form-textarea"
            style={{ flex: 1, minHeight: "72px", resize: "none", background: "#fcfaf5", borderColor: "#f1ece1", padding: "12px" }}
            placeholder={isSuperAdmin ? "No comments added." : "Add your comments here..."}
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={handleNotesBlur}
            disabled={isSuperAdmin}
          />
        </div>
      </div>

      {/* Bottom Row: Date / Reminder Panel */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span>📅</span>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#8a6632", textTransform: "uppercase", letterSpacing: "0.5px" }}>Next Follow-up Date</span>
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input
              type="date"
              className="form-input"
              style={{ margin: 0, height: "42px", background: "#ffffff" }}
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              disabled={isSuperAdmin}
            />
            {!isSuperAdmin && (
              <button
                onClick={handleSetReminder}
                className="btn btn-primary"
                style={{
                  backgroundColor: "#d97706",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: 700,
                  padding: "0 20px",
                  height: "42px",
                  whiteSpace: "nowrap",
                  cursor: "pointer"
                }}
              >
                Set Reminder
              </button>
            )}
          </div>

          {/* Alert Set Banner */}
          {lead.followUpDate && (
            <div style={{
              background: "#fffdf0",
              border: "1px solid #fde047",
              borderRadius: "8px",
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#854d0e" }}>
                <span>🔔</span>
                <span>Reminder set for: {formatReminderDate(lead.followUpDate)}</span>
              </div>
              {!isSuperAdmin && (
                <button
                  onClick={handleClearReminder}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#dc2626",
                    padding: 0
                  }}
                  title="Remove Reminder"
                >
                  🗑
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardLeadPipelineOverview({
  activeFilter,
  onFilterChange,
  showTitle = true,
}: {
  activeFilter?: string;
  onFilterChange?: (status: string) => void;
  showTitle?: boolean;
} = {}) {
  const { leads, currentUser } = useStore();
  const navigate = useNavigate();

  const userLeads = useMemo(() => {
    if (currentUser?.role === "employee" || currentUser?.role === "manager") {
      return leads.filter(l => l.assignedTo === currentUser.id || (l.createdBy && l.createdBy === currentUser.name));
    }
    return leads;
  }, [leads, currentUser]);

  const handleViewAll = () => {
    if (!currentUser) return;
    const path = currentUser.role === "superadmin" ? "/super-admin" : `/${currentUser.role}`;
    navigate({ to: path, search: { tab: "leads" } });
  };

  const getCount = (status: Lead["status"]) => userLeads.filter(l => l.status === status).length;

  const cards: { key: Lead["status"] | "All"; label: string; count: number; color: string; bg: string; border: string; icon: any }[] = [
    { key: "All", label: "All Leads", count: userLeads.length, color: "#7C3AED", bg: "rgba(124, 58, 237, 0.12)", border: "rgba(124, 58, 237, 0.28)", icon: MessageSquare },
    { key: "New", label: "New Leads", count: getCount("New"), color: "#38BDF8", bg: "rgba(56, 189, 248, 0.14)", border: "rgba(56, 189, 248, 0.3)", icon: AlertCircle },
    { key: "Cold", label: "Cold", count: getCount("Cold"), color: "#64748B", bg: "rgba(148, 163, 184, 0.16)", border: "rgba(148, 163, 184, 0.3)", icon: Snowflake },
    { key: "Warm", label: "Warm", count: getCount("Warm"), color: "#F59E0B", bg: "rgba(245, 158, 11, 0.14)", border: "rgba(245, 158, 11, 0.3)", icon: Clock },
    { key: "Hot", label: "Hot", count: getCount("Hot"), color: "#EC4899", bg: "rgba(236, 72, 153, 0.14)", border: "rgba(236, 72, 153, 0.3)", icon: Flame },
    { key: "Enrolled", label: "Enrolled", count: getCount("Enrolled"), color: "#10B981", bg: "rgba(16, 185, 129, 0.14)", border: "rgba(16, 185, 129, 0.3)", icon: CheckCircle2 },
    { key: "Cancelled", label: "Cancelled", count: getCount("Cancelled"), color: "#F43F5E", bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.28)", icon: XCircle }
  ];

  return (
    <div className="panel" style={{ padding: "22px", background: "rgba(255, 255, 255, 0.72)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", borderRadius: "24px", border: "1px solid rgba(255, 255, 255, 0.5)", boxShadow: "0 15px 40px rgba(0, 0, 0, 0.06)", marginBottom: "24px" }}>
      {showTitle && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <MessageSquare className="size-5" style={{ color: "#1E293B" }} />
            <h3 style={{ fontSize: "18px", color: "#1F1F1F", fontWeight: 700, margin: 0 }}>Lead Pipeline Overview</h3>
          </div>
          <button
            onClick={handleViewAll}
            style={{ color: "#1E293B", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "13px", outline: "none" }}
          >
            View All Inquiries →
          </button>
        </div>
      )}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        width: "100%",
        gap: "10px"
      }}>
        {cards.map((c, idx) => {
          const Icon = c.icon;
          const isSelected = activeFilter === c.key;
          return (
            <div
              key={idx}
              onClick={() => onFilterChange && onFilterChange(c.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                background: c.bg,
                border: isSelected ? `2px solid ${c.color}` : `1px solid ${c.border}`,
                borderRadius: "12px",
                cursor: onFilterChange ? "pointer" : "default",
                transform: isSelected ? "scale(1.02)" : "none",
                boxShadow: isSelected ? `0 4px 12px ${c.color}30` : "none",
                transition: "all 0.2s ease"
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: `${c.color}15`,
                  color: c.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span style={{ fontSize: "11px", color: "var(--brown)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</span>
                <span style={{ fontSize: "20px", fontWeight: 800, color: c.color, lineHeight: "1.1", marginTop: "2px" }}>{c.count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LeadsSection() {
  const { leads, users, products, setState, uid, currentUser } = useStore();
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSource, setFormSource] = useState("Walk-in");
  const [formProduct, setFormProduct] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formGender, setFormGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [formStatus, setFormStatus] = useState<Lead["status"]>("New");
  const [formFollowUpDate, setFormFollowUpDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formCity, setFormCity] = useState("");

  const availableBrands = useMemo(() => {
    if (!formProduct) return [];
    const match = PRODUCT_BRAND_MAP.find(m => m.keywords.some(k => formProduct.toLowerCase().includes(k)));
    return match ? match.brands : [];
  }, [formProduct]);

  useEffect(() => {
    if (availableBrands.length > 0 && !availableBrands.includes(formBrand)) {
      setFormBrand("");
    } else if (availableBrands.length === 0 && formBrand !== "") {
      setFormBrand("");
    }
  }, [availableBrands, formBrand]);

  useEffect(() => {
    if (editingLead) {
      setFormName(editingLead.name || "");
      setFormPhone(editingLead.phone || "");
      setFormEmail(editingLead.email || "");
      setFormSource(editingLead.source || "Walk-in");
      setFormProduct(editingLead.product || "");
      setFormBrand(editingLead.brand || "");
      setFormGender(editingLead.gender || "");
      setFormStatus(editingLead.status || "New");
      setFormFollowUpDate(editingLead.followUpDate || "");
      setFormNotes(editingLead.notes || "");
      setFormAssignedTo(editingLead.assignedTo || "");
      setFormCity(editingLead.city || "");
    } else {
      setFormName("");
      setFormPhone("");
      setFormEmail("");
      setFormSource("Walk-in");
      setFormProduct(products[0]?.name || "");
      setFormBrand("");
      setFormGender("");
      setFormStatus("New");
      setFormFollowUpDate("");
      setFormNotes("");
      if (currentUser?.role === "employee" || currentUser?.role === "manager") {
        setFormAssignedTo(currentUser.id);
      } else {
        setFormAssignedTo("");
      }
      setFormCity("");
    }
  }, [editingLead, showAddModal, products, currentUser]);



  const handleSave = () => {
    if (!formName || !formPhone) return;

    if (editingLead) {
      setState((s) => ({
        ...s,
        leads: s.leads.map((l) =>
          l.id === editingLead.id
            ? {
              ...l,
              name: formName,
              phone: formPhone,
              email: formEmail || undefined,
              source: formSource || undefined,
              product: formProduct || undefined,
              brand: formBrand || undefined,
              gender: (formGender as any) || undefined,
              status: formStatus,
              followUpDate: formFollowUpDate || undefined,
              notes: formNotes || undefined,
              assignedTo: formAssignedTo || undefined,
              city: formCity || undefined,
            }
            : l
        ),
      }));
      setEditingLead(null);
    } else {
      const newLead: Lead = {
        id: uid("l"),
        name: formName,
        phone: formPhone,
        email: formEmail || undefined,
        source: formSource || undefined,
        product: formProduct || undefined,
        brand: formBrand || undefined,
        gender: (formGender as any) || undefined,
        status: formStatus,
        followUpDate: formFollowUpDate || undefined,
        notes: formNotes || undefined,
        assignedTo: formAssignedTo || undefined,
        city: formCity || undefined,
        date: new Date().toISOString(),
        createdBy: currentUser?.name || "System",
      };
      setState((s) => ({
        ...s,
        leads: [newLead, ...s.leads],
      }));
      setShowAddModal(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    setState((s) => ({
      ...s,
      leads: s.leads.filter((l) => l.id !== id),
    }));
  };

  const userLeads = useMemo(() => {
    if (currentUser?.role === "employee" || currentUser?.role === "manager") {
      return leads.filter(l => l.assignedTo === currentUser.id || (l.createdBy && l.createdBy === currentUser.name));
    }
    return leads;
  }, [leads, currentUser]);

  const filteredLeads = useMemo(() => {
    return userLeads
      .filter((l) => {
        const matchesFilter = (activeFilter && activeFilter !== "All") ? l.status === activeFilter : true;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          l.name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          (l.product && l.product.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.city && l.city.toLowerCase().includes(q)) ||
          (l.source && l.source.toLowerCase().includes(q));
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [userLeads, activeFilter, searchQuery]);

  const assignableUsers = useMemo(() => {
    return users.filter((u) => u.role === "manager" || u.role === "employee");
  }, [users]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 className="page-title">Lead Generation</h2>
          <p className="page-sub">Track customer inquiries, status updates, and assign them to staff members.</p>
        </div>
        {(currentUser?.role === "employee" || currentUser?.role === "manager") && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add New Lead
          </button>
        )}
      </div>

      <DashboardLeadPipelineOverview
        activeFilter={activeFilter}
        onFilterChange={(st) => setActiveFilter((prev) => (prev === st ? "" : st))}
        showTitle={false}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", alignItems: "start" }}>
        {/* Left Column: Leads Custom Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#5c4115", margin: 0 }}>
              {activeFilter ? `${activeFilter} Leads` : "All Leads"} ({filteredLeads.length})
            </h3>

            {/* Search Box */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", minWidth: "260px" }}>
              <span style={{ position: "absolute", left: "10px", color: "var(--text-muted)", fontSize: "14px" }}>🔍</span>
              <input
                className="form-input"
                style={{ paddingLeft: "32px", margin: 0, height: "36px", fontSize: "13px" }}
                placeholder="Search name, phone, product, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "var(--text-muted)",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredLeads.map((l) => (
              <LeadCard key={l.id} lead={l} onDelete={handleDelete} onEdit={(lead) => setEditingLead(lead)} />
            ))}
            {filteredLeads.length === 0 && (
              <div className="panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", border: "1px solid #f2e6d0", borderRadius: "12px" }}>
                No inquiry leads found matching current filters.
              </div>
            )}
          </div>
        </div>


      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingLead !== null) && (
        <Modal
          title={editingLead ? "Edit Lead Details" : "Create New Inquiry Lead"}
          onClose={() => {
            setShowAddModal(false);
            setEditingLead(null);
          }}
        >
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Full Name <span style={{ color: "#dc2626" }}>*</span></label>
              <input
                className="form-input"
                placeholder="Enter your full name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp No</label>
              <input
                className="form-input"
                placeholder="+91 XXXXX XXXXX"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                placeholder="example@gmail.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">City</label>
              <input
                className="form-input"
                placeholder="Your City"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ textTransform: "none", fontSize: "14px", fontWeight: 600 }}>Gender</label>
              <div style={{ display: "flex", gap: "24px", marginTop: "12px", marginBottom: "8px" }}>
                {(["Male", "Female", "Other"] as const).map(g => (
                  <label key={g} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setFormGender(g)}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%", border: formGender === g ? "2px solid #d97706" : "1px solid #d6d3d1",
                      display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff",
                      transition: "all 0.2s"
                    }}>
                      {formGender === g && <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#d97706", animation: "fade-in 0.2s ease" }} />}
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#4a3411" }}>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product of Interest</label>
              <select className="form-input" value={formProduct} onChange={(e) => setFormProduct(e.target.value)}>
                <option value="">Select a Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
                <option value="Other Product">Other Product</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Product Brand</label>
              {availableBrands.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#a8a29e", padding: "10px", background: "#f5f5f5", borderRadius: "8px", border: "1px solid #e5e5e5" }}>No Brands Available</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                  {[...availableBrands, "Other"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFormBrand(b)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "20px",
                        border: formBrand === b ? "1px solid #d97706" : "1px solid #d6d3d1",
                        background: formBrand === b ? "#fef3c7" : "#ffffff",
                        color: formBrand === b ? "#92400e" : "#57534e",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Lead Source</label>
              <select className="form-input" value={formSource} onChange={(e) => setFormSource(e.target.value)}>
                <option value="Walk-in">Walk-in</option>
                <option value="Phone">Phone Call</option>
                <option value="Online">Online Form</option>
                <option value="Referral">Referral</option>
                <option value="Advertisement">Advertisement</option>
              </select>
            </div>

            {currentUser?.role !== "employee" && currentUser?.role !== "manager" && (
              <div className="form-group">
                <label className="form-label">Assign Lead to Staff</label>
                <select
                  className="form-input"
                  value={formAssignedTo}
                  onChange={(e) => setFormAssignedTo(e.target.value)}
                  disabled={!!(editingLead && editingLead.assignedTo)}
                >
                  <option value="" disabled hidden>Select Staff</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}



            <div className="modal-actions" style={{ marginTop: "10px" }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLead(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!formName || !formPhone}
                style={{ background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)", border: "none" }}
              >
                {editingLead ? "Update Lead" : "Add Lead"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}


export function SuperAdminIncentiveSection() {
  const { products, setState, users, currentUser } = useStore();
  const [editing, setEditing] = useState<Product | null>(null);
  const [incentiveMode, setIncentiveMode] = useState<boolean>(false);
  const [viewingBatches, setViewingBatches] = useState<Product & { batches: Product[] } | null>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);

  // Incentive Assignment Form Modal States
  const [showGiveIncentiveModal, setShowGiveIncentiveModal] = useState<boolean>(false);
  const [selectedProductForIncentive, setSelectedProductForIncentive] = useState<(Product & { batches: Product[] }) | null>(null);
  const [incentiveFormEmpId, setIncentiveFormEmpId] = useState<string>("");
  const [incentiveFormAmount, setIncentiveFormAmount] = useState<number>(0);
  const [incentiveFormPercent, setIncentiveFormPercent] = useState<number | string>("");
  const [incentiveFormQty, setIncentiveFormQty] = useState<number | string>("");
  const [incentiveInputMode, setIncentiveInputMode] = useState<"percent" | "amount">("percent");
  const [incentiveFormNotes, setIncentiveFormNotes] = useState<string>("");
  const [incentiveFormError, setIncentiveFormError] = useState<string>("");
  const [incentiveSuccessMsg, setIncentiveSuccessMsg] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const employees = useMemo(() => users.filter((u) => u.role === "employee" || u.role === "manager"), [users]);

  const handleAssignIncentiveSubmit = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!selectedProductForIncentive) return;

    if (!incentiveFormEmpId) {
      setIncentiveFormError("Please select an employee or manager");
      return;
    }

    const qtyVal = Number(incentiveFormQty);
    if (!incentiveFormQty || isNaN(qtyVal) || qtyVal < 1) {
      setIncentiveFormError("Please enter a valid quantity (at least 1)");
      return;
    }

    const maxAvailable = selectedProductForIncentive.qty ?? selectedProductForIncentive.stock ?? 1;
    if (qtyVal > maxAvailable) {
      setIncentiveFormError(`Quantity cannot exceed available stock (${maxAvailable} units)`);
      return;
    }

    const discountVal = typeof incentiveFormPercent === "number" ? incentiveFormPercent : (parseFloat(incentiveFormPercent as string) || 0);
    if (discountVal <= 0) {
      setIncentiveFormError("Please enter a valid incentive percentage (> 0%)");
      return;
    }

    const targetEmpId = incentiveFormEmpId;
    const selectedUser = users.find((u) => u.id === targetEmpId);
    const assignedEmpName = targetEmpId === "all"
      ? "All Employees"
      : (selectedUser?.name || "Employee");

    const pctDisplay = `${discountVal}%`;
    const unitPrice = selectedProductForIncentive.cost || selectedProductForIncentive.price || 0;
    const today = new Date().toISOString().split("T")[0];
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    const batchIds = selectedProductForIncentive.batches ? selectedProductForIncentive.batches.map((b) => b.id) : [selectedProductForIncentive.id];

    const newNotification = {
      id: `n_${Date.now()}`,
      to: targetEmpId === "all" ? "all" : (selectedUser?.role || "employee"),
      from: currentUser?.name || "Super Admin",
      message: `💰 Incentive Sell Request: Assigned to sell ${qtyVal} unit(s) of ${selectedProductForIncentive.name} with ${pctDisplay ? `${pctDisplay} (` : ""}₹${incentiveFormAmount}/unit${pctDisplay ? ")" : ""} incentive!`,
      date: new Date().toLocaleString(),
      read: false
    };

    const newOrder: Order = {
      id: orderId,
      customerId: "c_incentive",
      customerName: "Incentive Sell Request",
      productId: selectedProductForIncentive.id,
      productName: selectedProductForIncentive.name,
      qty: qtyVal,
      total: unitPrice * qtyVal,
      discount: 0,
      createdBy: currentUser?.name || "Super Admin",
      status: "Approved",
      date: today,
      assignedTo: targetEmpId === "all" ? "all" : (selectedUser?.id || targetEmpId),
      assignedToName: assignedEmpName,
      sentToEmployee: true,
      isIncentive: true
    };

    setState((s: any) => ({
      ...s,
      products: (s.products || []).map((prod: any) =>
        prod && batchIds.includes(prod.id)
          ? {
            ...prod,
            assignedEmployeeId: targetEmpId,
            incentive: incentiveFormAmount >= 0 ? incentiveFormAmount : prod.incentive,
          }
          : prod
      ),
      orders: [newOrder, ...(s.orders || [])],
      notifications: [newNotification, ...(s.notifications || [])]
    }));

    setShowGiveIncentiveModal(false);
    setSelectedProductForIncentive(null);
    setIncentiveFormNotes("");
    setIncentiveFormError("");
    setIncentiveFormEmpId("");
    setIncentiveFormPercent("");
    setIncentiveFormQty("");
    setIncentiveSuccessMsg(`✅ Incentive (${pctDisplay}) & Sell Request for ${qtyVal} unit(s) of "${selectedProductForIncentive.name}" successfully assigned to ${assignedEmpName}!`);
    setTimeout(() => setIncentiveSuccessMsg(""), 5000);
  };

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const groupedOldProducts = useMemo(() => {
    const oldBatches = products.filter(p => p.date && new Date(p.date) < ninetyDaysAgo);
    const map = new Map<string, Product & { batches: Product[] }>();
    oldBatches.forEach(p => {
      const key = (p.sku || p.name).toLowerCase();
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.qty = (existing.qty ?? existing.stock ?? 0) + (p.qty ?? p.stock ?? 0);
        existing.stock = existing.qty;
        existing.batches.push(p);
        if (!existing.assignedEmployeeId && p.assignedEmployeeId) {
          existing.assignedEmployeeId = p.assignedEmployeeId;
        }
      } else {
        map.set(key, { ...p, batches: [p] });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(groupedOldProducts.length / itemsPerPage) || 1;

  const paginatedProducts = useMemo(() => {
    return groupedOldProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [groupedOldProducts, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const remove = (id: string) => {
    if (!confirm("Delete this product?")) return;
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 className="page-title">💰 Products Eligible for Incentive</h2>
          <p className="page-sub">Products older than 90 days eligible for incentive assignment.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: "#F3E8FF", color: "#6D28D9", padding: "6px 16px", borderRadius: 40, fontWeight: 700, fontSize: 13 }}>&gt; 90 Days</span>
          <DownloadDropdown
            onPDF={() => {
              const headers = ["Sr. No.", "Product Name", "SKU", "Brand", "Location", "Qty (>90 Days)", "Incentive / Unit", "Total Incentive"];
              const rows = groupedOldProducts.map((p, index) => {
                const qty = p.qty ?? p.stock ?? 0;
                const unitIncentive = p.incentive || 0;
                const totalIncentive = qty * unitIncentive;
                return [index + 1, p.name, p.sku || "", p.brand || "—", p.location || "Unassigned", qty, unitIncentive, totalIncentive];
              });
              openPDFPreview("Incentive Products Report (>90 Days)", headers, rows, `Total Incentive Products: ${groupedOldProducts.length}`, "pdf");
            }}
            onCSV={() => {
              const headers = ["Sr. No.", "Product Name", "SKU", "Brand", "Location", "Qty (>90 Days)", "Incentive / Unit", "Total Incentive"];
              const rows = groupedOldProducts.map((p, index) => {
                const qty = p.qty ?? p.stock ?? 0;
                const unitIncentive = p.incentive || 0;
                const totalIncentive = qty * unitIncentive;
                return [index + 1, p.name, p.sku || "", p.brand || "—", p.location || "Unassigned", qty, unitIncentive, totalIncentive];
              });
              openPDFPreview("Incentive Products Report (>90 Days)", headers, rows, `Total Incentive Products: ${groupedOldProducts.length}`, "csv");
            }}
          />
        </div>
      </div>

      {incentiveSuccessMsg && (
        <div style={{ background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, marginBottom: "16px" }}>
          {incentiveSuccessMsg}
        </div>
      )}


      {/* Table Body / Rows */}
      <div>
        {paginatedProducts.map((p) => {
          const hasUnseen = p.batches.some(b => !b.incentiveSeen);
          const assignedEmp = p.assignedEmployeeId || p.batches.find(b => b.assignedEmployeeId)?.assignedEmployeeId || "";

          return (
            <div className="product-card-premium" key={p.id}>
              {/* 1. 3D CYLINDRICAL PEDESTAL STAND */}
              <div className="product-img-platform">
                <img
                  src={getAutoProductImage(p.name, p.brand, p.category, p.image)}
                  alt={p.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getAutoProductImage(p.name, p.brand, p.category);
                  }}
                />
              </div>

              {/* 2. PRODUCT INFO */}
              <div className="product-name-premium">
                <h2>{p.name.toLowerCase()}</h2>
                <p>Brand: {p.brand || "—"}</p>
              </div>

              {/* 3. SKU */}
              <div className="sku-premium">
                {p.sku || "—"}
              </div>

              {/* 4. LOCATION CAPSULE */}
              <div>
                <span className="location-chip-premium">📍 🏪 {p.location || "Shop"}</span>
              </div>

              {/* 5. QUANTITY RING GAUGE (CLICKABLE FOR BATCH DETAILS) */}
              <div>
                <div
                  className="qty-circle-premium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingBatches(p);
                    const unseenBatches = (p.batches || []).filter(b => !b.incentiveSeen);
                    if (unseenBatches.length > 0) {
                      setState((s: any) => ({
                        ...s,
                        products: s.products.map((prod: any) =>
                          unseenBatches.some(ub => ub.id === prod.id)
                            ? { ...prod, incentiveSeen: true }
                            : prod
                        )
                      }));
                    }
                  }}
                  title="Click to view batch & product details"
                >
                  <span className="num">{p.qty ?? p.stock}</span>
                  <span className="lbl">Units</span>
                  {hasUnseen && <div style={{ position: "absolute", top: "2px", right: "2px", width: "10px", height: "10px", background: "#ef4444", borderRadius: "50%", border: "2px solid white" }}></div>}
                </div>
              </div>

              {/* 6. INCENTIVE PEACH BOX */}
              <div className="incentive-box-premium">
                <span className="icon">🏷️</span>
                <div className="details">
                  <span className="amount">₹{(p.cost || p.price || 0).toLocaleString()}</span>
                  <span className="subtext">/ unit</span>
                </div>
              </div>

              {/* 7. ASSIGN BTN */}
              <div>
                <button
                  className="assign-btn-premium"
                  onClick={() => {
                    setSelectedProductForIncentive(p);
                    setIncentiveFormEmpId(assignedEmp || (employees[0]?.id || "all"));
                    setIncentiveFormPercent("");
                    setIncentiveFormAmount(p.incentive || 0);
                    setIncentiveFormQty(p.qty ?? p.stock ?? 1);
                    setIncentiveFormNotes("");
                    setIncentiveFormError("");
                    setShowGiveIncentiveModal(true);
                  }}
                >
                  <span className="btn-icon">👤⁺</span>
                  <span>Assign</span>
                  <small>Employee</small>
                </button>
              </div>
            </div>
          );
        })}
        {groupedOldProducts.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, background: "#ffffff", borderRadius: 20, color: "#64748B", border: "1px solid rgba(226, 232, 240, 0.8)" }}>
            No products eligible for incentive (&gt; 90 days) found.
          </div>
        )}
      </div>



      {editing && (
        <ProductForm
          title={incentiveMode ? "Update Incentive" : "Edit Product"}
          initial={editing}
          isIncentiveMode={true}
          onClose={() => { setEditing(null); setIncentiveMode(false); }}
          onSave={(d) => {
            setState((s) => ({ ...s, products: s.products.map((p) => p.id === editing.id ? { ...p, ...d } : p) }));
            setEditing(null);
            setIncentiveMode(false);
          }}
        />
      )}

      {viewingBatches && (() => {
        const batchList = (viewingBatches.batches && viewingBatches.batches.length > 0) ? viewingBatches.batches : [viewingBatches];
        return (
          <Modal title="Product & Batch Details" onClose={() => setViewingBatches(null)} className="modal-lg">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "20px", background: "#EEF4EC", padding: "16px", borderRadius: "16px", border: "1px solid #E2EBE0", alignItems: "flex-start" }}>
              <img
                src={getAutoProductImage(viewingBatches.name, viewingBatches.brand, viewingBatches.category, viewingBatches.image)}
                alt={viewingBatches.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getAutoProductImage(viewingBatches.name, viewingBatches.brand, viewingBatches.category);
                }}
                style={{ width: "100px", height: "100px", objectFit: "contain", borderRadius: "12px", border: "1px solid #E2EBE0", background: "#FFFFFF", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "20px", color: "#1E293B", textTransform: "capitalize", fontWeight: 800 }}>{viewingBatches.name}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px 16px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}><span style={{ color: "#6F767E", fontWeight: 500 }}>SKU</span> <strong style={{ textAlign: "right", color: "#1E293B" }}>{viewingBatches.sku || "—"}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}><span style={{ color: "#6F767E", fontWeight: 500 }}>Brand</span> <strong style={{ textAlign: "right", color: "#1E293B" }}>{viewingBatches.brand || "—"}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}><span style={{ color: "#6F767E", fontWeight: 500 }}>Category</span> <strong style={{ textAlign: "right", color: "#1E293B" }}>{viewingBatches.category || "—"}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}><span style={{ color: "#6F767E", fontWeight: 500 }}>Warranty</span> <strong style={{ textAlign: "right", color: "#1E293B" }}>{viewingBatches.warranty || "—"}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}><span style={{ color: "#6F767E", fontWeight: 500 }}>Location</span> <strong style={{ textAlign: "right", color: "#1E293B" }}>{viewingBatches.location || "Unassigned"}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}><span style={{ color: "#6F767E", fontWeight: 500 }}>Total Stock</span> <strong style={{ textAlign: "right", fontSize: "15px", color: "#7C3AED", fontWeight: 800 }}>{viewingBatches.qty ?? viewingBatches.stock ?? 0}</strong></div>
                </div>
              </div>
            </div>

            <h4 style={{ borderBottom: "2px solid #E2EBE0", paddingBottom: "10px", marginBottom: "16px", color: "#1E293B", fontWeight: 800 }}>Batch History</h4>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr style={{ background: "#F5F3FF" }}>
                    <th style={{ color: "#1E293B" }}>Date Added</th>
                    <th style={{ color: "#1E293B" }}>Quantity</th>
                    <th style={{ color: "#1E293B" }}>Unit Cost</th>
                    <th style={{ color: "#1E293B" }}>Supplier</th>
                    <th style={{ color: "#1E293B" }}>Status</th>
                    <th style={{ color: "#1E293B" }}>Incentive</th>
                  </tr>
                </thead>
                <tbody>
                  {batchList.map((b, idx) => (
                    <tr key={b.id || idx}>
                      <td>
                        <div style={{ fontWeight: 600, color: "#1E293B" }}>{b.date ? new Date(b.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
                        {idx === batchList.length - 1 && <div style={{ fontSize: "10px", color: "#7C3AED", marginTop: "2px", fontWeight: 700 }}>Latest Batch</div>}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: "15px", color: "#1E293B" }}>{b.qty ?? b.stock ?? 0}</td>
                      <td style={{ color: "#1E293B" }}>₹{(b.cost || 0).toLocaleString()}</td>
                      <td style={{ color: "#1E293B" }}>{b.supplier || "—"}</td>
                      <td>
                        <span className="pill" style={{ background: b.status === "Verified" ? "#f3e8ff" : "#fef9c3", color: b.status === "Verified" ? "#7c3aed" : "#854d0e", fontSize: "11px", padding: "4px 8px" }}>
                          {b.status || "In Stock"}
                        </span>
                      </td>
                      <td style={{ color: "#7C3AED", fontWeight: 700 }}>₹{(b.incentive || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button className="btn btn-primary" style={{ color: "#FFFFFF", borderRadius: "999px", padding: "10px 24px" }} onClick={() => setViewingBatches(null)}>Close</button>
            </div>
          </Modal>
        );
      })()}

      {showGiveIncentiveModal && selectedProductForIncentive && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.55)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "28px",
            width: "100%",
            maxWidth: "540px",
            boxShadow: "0 25px 60px rgba(124, 58, 237, 0.25)",
            border: "1px solid rgba(221, 214, 254, 0.8)",
            overflow: "hidden",
            animation: "scaleUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          }}>
            {/* Header (Matching Purple-to-Pink Gradient) */}
            <div style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
              padding: "14px 22px",
              color: "#FFFFFF",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.4)"
                }}>
                  💰
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.3px" }}>Assign Employee Incentive</h3>
                  <p style={{ margin: "1px 0 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}>Select employee to assign incentive</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGiveIncentiveModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.22)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                  color: "#FFFFFF",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}
              >
                ✕
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleAssignIncentiveSubmit} style={{ padding: "16px 20px" }}>
              {incentiveFormError && (
                <div style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "8px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, marginBottom: "12px" }}>
                  ⚠️ {incentiveFormError}
                </div>
              )}

              {(() => {
                const baseUnitPrice = selectedProductForIncentive?.price || selectedProductForIncentive?.cost || selectedProductForIncentive?.batches?.[0]?.cost || selectedProductForIncentive?.batches?.[0]?.price || 0;
                const qtyNum = parseInt(incentiveFormQty as any) || 1;
                const pctNum = parseFloat(incentiveFormPercent as any) || 0;
                const perUnitIncentive = Math.round((baseUnitPrice * pctNum) / 100);
                const totalIncentiveCalculated = perUnitIncentive * qtyNum;

                return (
                  <>
                    {/* Product Summary Card with 3D Stand */}
                    <div style={{
                      background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
                      border: "1px solid #DDD6FE",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      boxShadow: "inset 0 1px 3px rgba(255, 255, 255, 0.9)"
                    }}>
                      <div className="product-img-platform" style={{ width: 50, height: 44, flexShrink: 0 }}>
                        <img
                          src={getAutoProductImage(selectedProductForIncentive.name, selectedProductForIncentive.brand, selectedProductForIncentive.category, selectedProductForIncentive.image)}
                          alt={selectedProductForIncentive.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getAutoProductImage(selectedProductForIncentive.name, selectedProductForIncentive.brand, selectedProductForIncentive.category);
                          }}
                          style={{ width: 36, height: 36, objectFit: "contain" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: "15px", color: "#1E2937", textTransform: "lowercase" }}>{selectedProductForIncentive.name}</div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: 2, fontWeight: 500 }}>
                          SKU: <strong style={{ color: "#334155" }}>{selectedProductForIncentive.sku || "—"}</strong> &nbsp;|&nbsp;
                          Location: <strong style={{ color: "#7C3AED", fontWeight: 800 }}>{selectedProductForIncentive.location || "Shop"}</strong> &nbsp;|&nbsp;
                          Price: <strong style={{ color: "#059669", fontWeight: 800 }}>₹{baseUnitPrice.toLocaleString()} / unit</strong>
                        </div>
                      </div>
                    </div>

                    {/* 1. Select Employee / Manager */}
                    <div style={{ marginBottom: "12px" }}>
                      <label className="form-label" style={{ fontSize: 10, marginBottom: 2, color: "#7C3AED", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        👤 SELECT EMPLOYEE / MANAGER <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <select
                        value={incentiveFormEmpId}
                        onChange={(e) => {
                          setIncentiveFormEmpId(e.target.value);
                          setIncentiveFormError("");
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "12px",
                          border: "1px solid #C4B5FD",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#2E1065",
                          background: "#F5F3FF",
                          outline: "none",
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(124, 58, 237, 0.04)"
                        }}
                      >
                        <option value="">-- Select Employee --</option>
                        <option value="all" style={{ fontWeight: 800, color: "#7C3AED" }}>👥 All Employees</option>
                        {employees.map((u) => (
                          <option key={u.id} value={u.id}>
                            👤 {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Quantity & Incentive (%) (Side by Side) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <label className="form-label" style={{ fontSize: 10, color: "#7C3AED", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                            📦 QUANTITY <span style={{ color: "#EF4444" }}>*</span>
                          </label>
                          {selectedProductForIncentive && (
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>
                              Max: <strong>{selectedProductForIncentive.qty ?? selectedProductForIncentive.stock ?? 1} units</strong>
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min="1"
                          max={selectedProductForIncentive?.qty ?? selectedProductForIncentive?.stock ?? 9999}
                          value={incentiveFormQty}
                          onChange={(e) => {
                            setIncentiveFormQty(e.target.value === "" ? "" : parseInt(e.target.value) || "");
                            setIncentiveFormError("");
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "12px",
                            border: "1px solid #C4B5FD",
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#2E1065",
                            background: "#F5F3FF",
                            outline: "none",
                            boxSizing: "border-box",
                            boxShadow: "0 2px 6px rgba(124, 58, 237, 0.04)"
                          }}
                          placeholder="e.g. 5"
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: 10, marginBottom: 2, color: "#7C3AED", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                          💰 INCENTIVE (%) <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={incentiveFormPercent}
                            onChange={(e) => {
                              const valStr = e.target.value;
                              setIncentiveFormPercent(valStr);
                              setIncentiveFormError("");
                              const pctVal = parseFloat(valStr) || 0;
                              if (baseUnitPrice > 0) {
                                setIncentiveFormAmount(Math.round((baseUnitPrice * pctVal) / 100));
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 34px 10px 14px",
                              borderRadius: "12px",
                              border: "1px solid #C4B5FD",
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "#7C3AED",
                              background: "#F5F3FF",
                              outline: "none",
                              boxSizing: "border-box",
                              boxShadow: "0 2px 6px rgba(124, 58, 237, 0.04)"
                            }}
                            placeholder="e.g. 10"
                          />
                          <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", fontWeight: 800, fontSize: "16px", color: "#7C3AED" }}>%</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Incentive Calculation Breakdown */}
                    <div style={{
                      background: "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)",
                      border: "1px solid #A7F3D0",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      marginBottom: "16px",
                      boxShadow: "0 3px 10px rgba(16, 185, 129, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px"
                    }}>
                      <div>
                        <div style={{ fontSize: "10px", color: "#047857", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          💰 INCENTIVE BREAKDOWN
                        </div>
                        <div style={{ fontSize: "12px", color: "#065F46", marginTop: "2px", fontWeight: 600 }}>
                          1 Unit Price: <strong>₹{baseUnitPrice.toLocaleString()}</strong> &nbsp;×&nbsp; {qtyNum} {qtyNum === 1 ? "unit" : "units"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "10px", color: "#047857", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          EMPLOYEE EARNS ({pctNum}%)
                        </div>
                        <div style={{ fontSize: "18px", color: "#059669", fontWeight: 900, lineHeight: 1.1, marginTop: "1px" }}>
                          ₹{totalIncentiveCalculated.toLocaleString()}
                        </div>
                        <div style={{ fontSize: "10px", color: "#065F46", fontWeight: 600, marginTop: "1px" }}>
                          ({qtyNum > 1 ? `₹${perUnitIncentive.toLocaleString()} / unit` : "total payout"})
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Form Action Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowGiveIncentiveModal(false);
                    setIncentiveFormError("");
                  }}
                  style={{
                    padding: "9px 22px",
                    borderRadius: "30px",
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#6D28D9",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.2s ease"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "9px 26px",
                    borderRadius: "30px",
                    border: "none",
                    background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 10px 25px rgba(124, 58, 237, 0.4)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span>✓</span>
                  <span>Assign Incentive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function SuperAdminGodownSection() {
  const { products, setState, uid } = useStore();
  const [activeTab, setActiveTab] = useState<"Godown 1" | "Godown 2">("Godown 1");
  const [showAdd, setShowAdd] = useState(false);

  const godown1Products = products.filter(p => p.location === "Godown 1");
  const godown2Products = products.filter(p => p.location === "Godown 2");
  const activeProducts = activeTab === "Godown 1" ? godown1Products : godown2Products;

  const activeTotalQty = activeProducts.reduce((acc, p) => acc + (p.qty ?? p.stock ?? 0), 0);
  const activeTotalCost = activeProducts.reduce((acc, p) => acc + ((p.qty ?? p.stock ?? 0) * (p.cost || 0)), 0);

  const handlePDFExport = (locationTag: "Godown 1" | "Godown 2") => {
    const list = locationTag === "Godown 1" ? godown1Products : godown2Products;
    const totalValuation = list.reduce((acc, p) => acc + ((p.qty ?? p.stock ?? 0) * (p.cost || 0)), 0);
    const headers = ["Sr. No.", "Product Name", "SKU", "Category", "Qty", "Unit Cost (₹)", "Total Cost (₹)"];
    const rows = list.map((p, index) => {
      const qty = p.qty ?? p.stock ?? 0;
      const totalValue = qty * (p.cost || 0);
      return [index + 1, p.name, p.sku || "—", p.category || "—", qty, p.cost || 0, totalValue];
    });
    openPDFPreview(`${locationTag} Stock Inventory Report`, headers, rows, `Total Items: ${list.length} | Valuation: ₹${totalValuation.toLocaleString()}`);
  };

  const renderTable = (prods: Product[]) => (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>IMAGE</th>
            <th>PRODUCT</th>
            <th>SKU</th>
            <th>CATEGORY</th>
            <th>QTY</th>
            <th>UNIT COST</th>
            <th>TOTAL COST</th>
          </tr>
        </thead>
        <tbody>
          {prods.map(p => {
            const qty = p.qty ?? p.stock ?? 0;
            const totalValue = qty * p.cost;
            return (
              <tr key={p.id}>
                <td>
                  <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", border: "1px solid #EAE2D5", background: "#F5EFE6" }}>
                    <img
                      src={getAutoProductImage(p.name, p.brand, p.category, p.image)}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getAutoProductImage(p.name, p.brand, p.category);
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.sku || "—"}</td>
                <td>{p.category}</td>
                <td style={{ fontWeight: 600, color: qty < 20 ? "var(--danger)" : "inherit" }}>{qty}</td>
                <td>₹{p.cost.toLocaleString()}</td>
                <td style={{ fontWeight: 600 }}>₹{totalValue.toLocaleString()}</td>
              </tr>
            );
          })}
          {prods.length === 0 && (
            <tr>
              <td colSpan={7} className="empty">No products found in this godown.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="page-title">Godown Management & Stock Reports</h2>
          <p className="page-sub">Manage stock and generate detailed reports for Godown 1 and Godown 2.</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "12px", marginTop: "20px", marginBottom: "24px", background: "#F8FAFC", padding: "12px", borderRadius: "24px", border: "1px solid #EEF1F8" }}>
        <button
          onClick={() => setActiveTab("Godown 1")}
          style={{
            flex: "1 1 140px",
            maxWidth: "250px",
            padding: "12px 24px",
            borderRadius: "999px",
            border: activeTab === "Godown 1" ? "none" : "1px solid #E2E8F0",
            background: activeTab === "Godown 1" ? "linear-gradient(135deg, #7C3AED 0%, #7C3AED 100%)" : "#FFFFFF",
            color: activeTab === "Godown 1" ? "#FFFFFF" : "#475569",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 300ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: activeTab === "Godown 1" ? "0 8px 22px rgba(124, 58, 237, 0.35)" : "0 2px 8px rgba(0,0,0,0.03)"
          }}
          onMouseOver={(e) => { if (activeTab !== "Godown 1") e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseOut={(e) => { if (activeTab !== "Godown 1") e.currentTarget.style.transform = "none"; }}
        >
          <span style={{ fontSize: "18px" }}>🏫</span>
          <span style={{ color: activeTab === "Godown 1" ? "#FFFFFF" : "#1E293B" }}>Godown 1</span>
          <span style={{
            background: activeTab === "Godown 1" ? "rgba(255, 255, 255, 0.25)" : "#F3EEFF",
            color: activeTab === "Godown 1" ? "#FFFFFF" : "#7C3AED",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            fontSize: "12px",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {godown1Products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("Godown 2")}
          style={{
            flex: "1 1 140px",
            maxWidth: "250px",
            padding: "12px 24px",
            borderRadius: "999px",
            border: activeTab === "Godown 2" ? "none" : "1px solid #E2E8F0",
            background: activeTab === "Godown 2" ? "linear-gradient(135deg, #7C3AED 0%, #7C3AED 100%)" : "#FFFFFF",
            color: activeTab === "Godown 2" ? "#FFFFFF" : "#475569",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 300ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: activeTab === "Godown 2" ? "0 8px 22px rgba(124, 58, 237, 0.35)" : "0 2px 8px rgba(0,0,0,0.03)"
          }}
          onMouseOver={(e) => { if (activeTab !== "Godown 2") e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseOut={(e) => { if (activeTab !== "Godown 2") e.currentTarget.style.transform = "none"; }}
        >
          <span style={{ fontSize: "18px" }}>🏫</span>
          <span style={{ color: activeTab === "Godown 2" ? "#FFFFFF" : "#1E293B" }}>Godown 2</span>
          <span style={{
            background: activeTab === "Godown 2" ? "rgba(255, 255, 255, 0.25)" : "#F3EEFF",
            color: activeTab === "Godown 2" ? "#FFFFFF" : "#7C3AED",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            fontSize: "12px",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {godown2Products.length}
          </span>
        </button>
      </div>

      <div className="panel" style={{ margin: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px", width: "100%", flexWrap: "nowrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
            <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, fontSize: "16px", fontWeight: 800, whiteSpace: "nowrap" }}>
              <span>🏭 {activeTab} Inventory</span>
            </h3>
            <span style={{ fontSize: 12, background: "#F3EEFF", color: "#7C3AED", padding: "4px 12px", borderRadius: "10px", fontWeight: 700, whiteSpace: "nowrap" }}>
              {activeProducts.length} Products | Total Qty: {activeTotalQty} | Value: ₹{activeTotalCost.toLocaleString()}
            </span>
          </div>
          <DownloadDropdown
            onPDF={() => handlePDFExport(activeTab)}
            onCSV={() => {
              const list = activeTab === "Godown 1" ? godown1Products : godown2Products;
              const totalValuation = list.reduce((acc, p) => acc + ((p.qty ?? p.stock ?? 0) * (p.cost || 0)), 0);
              const headers = ["Sr. No.", "Product Name", "SKU", "Category", "Qty", "Unit Cost (₹)", "Total Cost (₹)"];
              const rows = list.map((p, index) => [index + 1, p.name, p.sku || "—", p.category || "—", p.qty ?? p.stock ?? 0, p.cost || 0, (p.qty ?? p.stock ?? 0) * (p.cost || 0)]);
              openPDFPreview(`${activeTab} Stock Inventory Report`, headers, rows, `Total Items: ${list.length} | Valuation: ₹${totalValuation.toLocaleString()}`, "csv");
            }}
          />
        </div>
        {renderTable(activeProducts)}
      </div>

      {showAdd && (
        <ProductForm
          title={`Add Product to ${activeTab}`}
          initial={{ location: activeTab } as any}
          isGodownOnly={true}
          onSave={(data) => {
            const nextId = uid("p");
            setState((s) => ({ ...s, products: [...s.products, { id: nextId, ...data }] }));
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}

function IncentiveSellOrderModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { customers, users, setState, uid, currentUser } = useStore();
  const assignableUsers = users.filter((u) => u.role === "employee" || u.role === "manager");

  const [assignedEmployeeId, setAssignedEmployeeId] = useState(assignableUsers[0]?.id || "all");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [docType, setDocType] = useState<"Bill" | "Order Copy">("Bill");
  const [bookingExpiryDate, setBookingExpiryDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [qty, setQty] = useState(1);
  const [discountPct, setDiscountPct] = useState<number | "">("");
  const [customerBargain, setCustomerBargain] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const unitPrice = product.price || product.cost || 0;
  const finalTotal = unitPrice * qty;
  const incPctNum = Number(discountPct) || 0;
  const incPerUnit = incPctNum > 0 ? Math.round((incPctNum / 100) * unitPrice) : (product.incentive || 0);
  const totalEmployeeIncentivePayout = incPerUnit * qty;

  const handleSubmit = () => {
    const selectedUser = users.find((u) => u.id === assignedEmployeeId);
    const empId = assignedEmployeeId === "all" ? "all" : (selectedUser?.id || currentUser?.id || "all");
    const empName = assignedEmployeeId === "all" ? "All Employees" : (selectedUser?.name || currentUser?.name || "Assignee");

    const orderId = uid("o");
    const today = new Date().toISOString().slice(0, 10);
    const finalCustName = customerName.trim() || "Incentive Direct Sale";
    const incVal = Number(discountPct) || 0;
    const calculatedIncentive = incVal > 0 ? Math.round((incVal / 100) * unitPrice) : (product.incentive || 0);

    setState((s) => {
      let customerId = "c_inc_direct";
      let nextCustomers = s.customers;
      if (customerName.trim()) {
        let existingCust = s.customers.find(
          (c) => c.name.trim().toLowerCase() === customerName.trim().toLowerCase()
        );
        if (existingCust) {
          customerId = existingCust.id;
        } else {
          customerId = uid("c");
          const newCust = {
            id: customerId,
            name: customerName.trim(),
            phone: customerPhone.trim(),
            address: customerAddress.trim(),
            email: "",
            status: "Active"
          };
          nextCustomers = [...s.customers, newCust];
        }
      }

      const nextProducts = s.products.map((p) =>
        p.id === product.id
          ? {
            ...p,
            incentive: calculatedIncentive > 0 ? calculatedIncentive : p.incentive,
            assignedEmployeeId: empId
          }
          : p
      );

      const newOrder: Order = {
        id: orderId,
        customerId,
        customerName: finalCustName,
        productId: product.id,
        productName: product.name,
        qty,
        total: finalTotal,
        discount: 0,
        createdBy: currentUser?.name || "Admin",
        status: "Approved",
        date: today,
        assignedTo: empId,
        assignedToName: empName,
        sentToEmployee: true,
        customerBargain: customerBargain.trim() || undefined,
        docType,
        bookingExpiryDate: docType === "Order Copy" ? bookingExpiryDate : undefined,
        isIncentive: true
      };

      const notifId = uid("n");
      const docLabel = docType === "Bill" ? "Bill" : "Order Copy";
      const expiryStr = docType === "Order Copy" && bookingExpiryDate ? ` (Valid Until: ${bookingExpiryDate})` : "";
      const notifMsg = `New Incentive ${docLabel} order assigned to ${empName} (Order #${orderId})${expiryStr}`;
      const empNotifMsg = `New Incentive order (${incVal > 0 ? `${incVal}%` : "assigned"} incentive) assigned for ${product.name} (Order #${orderId})`;

      return {
        ...s,
        customers: nextCustomers,
        products: nextProducts,
        orders: [...s.orders, newOrder],
        notifications: [
          {
            id: notifId,
            to: empId === "all" ? "all" : (selectedUser?.role as any || "employee"),
            from: currentUser?.name || "Admin",
            message: empNotifMsg,
            date: today,
            read: false
          },
          {
            id: uid("n"),
            to: "superadmin",
            from: currentUser?.name || "Admin",
            message: notifMsg,
            date: today,
            read: false
          },
          ...s.notifications
        ]
      };
    });

    setSuccessMsg(`Incentive Order #${orderId} sent to ${empName}'s Orders successfully!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <Modal title={`➕ Add Incentive Order — ${product.name}`} onClose={onClose}>
      {errorMsg && (
        <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Selected Product Summary Card */}
      <div style={{ background: "#fef3c7", border: "1px solid #fde047", padding: "12px 16px", borderRadius: "12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, color: "#92400e", fontSize: "15px" }}>📦 {product.name} {product.brand ? `(${product.brand})` : ""}</div>
          <div style={{ fontSize: "12px", color: "#b45309", marginTop: "2px" }}>SKU: {product.sku || "—"} · Stock Available: {product.qty ?? product.stock ?? 0}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 600 }}>Incentive Payout:</div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#15803d" }}>₹{totalEmployeeIncentivePayout.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Employee & Manager Selection dropdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
            Select Assignee *
          </label>
          <select
            className="form-select"
            value={assignedEmployeeId}
            onChange={(e) => setAssignedEmployeeId(e.target.value)}
            style={{ fontWeight: 700, fontSize: "14px" }}
          >
            <option value="all">🌐 All Employees & Managers</option>
            <optgroup label="Employees">
              {users.filter((u) => u.role === "employee").map((emp) => (
                <option key={emp.id} value={emp.id}>
                  👤 {emp.name} ({emp.employeeId || emp.jobTitle || "Employee"})
                </option>
              ))}
            </optgroup>
            <optgroup label="Managers">
              {users.filter((u) => u.role === "manager").map((mgr) => (
                <option key={mgr.id} value={mgr.id}>
                  👔 {mgr.name} ({mgr.employeeId || mgr.jobTitle || "Manager"})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Quantity & Incentive Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
              Quantity *
            </label>
            <input
              type="number"
              className="form-input"
              min={1}
              max={product.qty ?? product.stock ?? 999}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              style={{ fontWeight: 700, fontSize: "15px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
              INCENTIVE (%)
            </label>
            <input
              type="number"
              className="form-input"
              min={0}
              max={100}
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter incentive % (e.g. 10)"
              style={{ fontWeight: 700, fontSize: "15px" }}
            />
          </div>
        </div>

        {/* Total calculation & Incentive Payout preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "14px", background: "#fef3c7", border: "1px solid #fde047", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#92400e", fontWeight: 700 }}>Total Order Value (Selling Price):</div>
              <div style={{ fontSize: "11px", color: "#b45309", marginTop: "2px" }}>
                ₹{unitPrice.toLocaleString()} / unit × {qty} Qty
              </div>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#92400e" }}>₹{finalTotal.toLocaleString()}</div>
          </div>

          {incPctNum > 0 && (
            <div style={{ borderTop: "1px dashed #fcd34d", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#15803d", fontWeight: 700 }}>Employee Incentive Payout ({incPctNum}%):</div>
                <div style={{ fontSize: "11px", color: "#166534", marginTop: "2px" }}>
                  ₹{incPerUnit.toLocaleString()} / unit × {qty} Qty
                </div>
              </div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#15803d" }}>₹{totalEmployeeIncentivePayout.toLocaleString()}</div>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: "12px" }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-dark))", border: "none", color: "#fff", fontWeight: 700 }}
          >
            ➕ Submit Incentive Order
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ========================================================
// SECTION PDF DOWNLOAD & CSV REPORT UTILITIES FOR ALL SECTIONS
// ========================================================

export function openPDFPreview(
  sectionTitle: string,
  tableHeaders: string[],
  rows: (string | number)[][],
  summaryText?: string,
  exportType: "pdf" | "csv" | "both" = "pdf"
) {
  const event = new CustomEvent("open-pdf-preview", {
    detail: { sectionTitle, tableHeaders, rows, summaryText, exportType }
  });
  window.dispatchEvent(event);
}

export function PDFPreviewContainer() {
  const [data, setData] = useState<{
    sectionTitle: string;
    tableHeaders: string[];
    rows: (string | number)[][];
    summaryText?: string;
    exportType?: "pdf" | "csv" | "both";
  } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        setData(custom.detail);
      }
    };
    window.addEventListener("open-pdf-preview", handler);
    return () => window.removeEventListener("open-pdf-preview", handler);
  }, []);

  if (!data) return null;

  const mode = data.exportType || "pdf";
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const handleConfirmPDF = () => {
    downloadSectionPDF(data.sectionTitle, data.tableHeaders, data.rows, data.summaryText);
    setData(null);
  };

  const handleConfirmCSV = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const fileName = `${data.sectionTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${todayStr}.csv`;
    exportToCSV(fileName, data.tableHeaders, data.rows);
    setData(null);
  };

  return (
    <Modal title={`📄 Report Document Preview`} className="modal-report-preview" onClose={() => setData(null)}>
      <div style={{ padding: "16px 20px", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          padding: 24,
          fontFamily: "Inter, system-ui, sans-serif"
        }}>
          <div style={{ borderBottom: "2px solid #7C3AED", paddingBottom: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: "#1e293b", fontWeight: 700 }}>
                Smart Home Systems - {data.sectionTitle}
              </h2>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Super Admin System Report | Generated: {today}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", background: "#F5F3FF", color: "#6D28D9", borderRadius: 6, border: "1px solid #E9D8FD" }}>
              {mode === "csv" ? "CSV / EXCEL PREVIEW MODE" : mode === "pdf" ? "PDF PREVIEW MODE" : "REPORT PREVIEW MODE"}
            </span>
          </div>

          {data.summaryText && (
            <div style={{
              background: "#f8fafc",
              border: "1px solid #E2E8F0",
              borderRadius: 6,
              padding: "10px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: "#334155",
              marginBottom: 16
            }}>
              📋 {data.summaryText}
            </div>
          )}

          <div style={{ overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F5F3FF", color: "#6D28D9" }}>
                  {data.tableHeaders.map((h, idx) => (
                    <th key={idx} style={{ padding: "12px 14px", fontWeight: 800, color: "#6D28D9", backgroundColor: "#F5F3FF", borderBottom: "2px solid #E9D8FD", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: "9px 12px", borderBottom: "1px solid #E2E8F0", color: "#334155", whiteSpace: "nowrap" }}>
                        {String(cell ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={data.tableHeaders.length} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>
                      No items found in this report section.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 20, paddingTop: 12, borderTop: "1px solid #E2E8F0" }}>
          <button
            className="btn btn-ghost"
            onClick={() => setData(null)}
            style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid var(--border)", fontWeight: 600 }}
          >
            ✕ Close
          </button>

          {mode === "csv" ? (
            <button
              className="btn btn-primary"
              onClick={handleConfirmCSV}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                background: "#7C3AED",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer"
              }}
            >
              📊 Download CSV
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleConfirmPDF}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                background: "#7C3AED",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer"
              }}
            >
              📄 Download PDF
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function downloadSectionPDF(sectionTitle: string, tableHeaders: string[], rows: (string | number)[][], summaryText?: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // Document Title Header
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(`Smart Home Systems - ${sectionTitle}`, 14, 16);

  // Metadata Subtitle
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Super Admin System Report | Generated: ${today}`, 14, 22);

  let startY = 27;

  if (summaryText) {
    doc.setFillColor(248, 250, 252);
    doc.rect(14, startY, 182, 9, "F");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(summaryText, 18, startY + 6);
    startY += 13;
  }

  // Generate Table
  autoTable(doc, {
    startY: startY,
    head: [tableHeaders],
    body: rows.map(r => r.map(c => String(c ?? "—"))),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  const fileName = `${sectionTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvRows = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","),
    ...rows.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
  ];
  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportProductsReport(products: Product[]) {
  const today = new Date().toISOString().slice(0, 10);
  const headers = ["Sr. No.", "Product Name", "SKU", "Brand", "Location", "Quantity", "Unit Cost (₹)", "Total Cost (₹)", "Selling Price (₹)", "Supplier", "Date Added", "Status"];
  const rows = products.map((p, index) => {
    const qty = p.qty ?? p.stock ?? 0;
    const unitCost = p.cost || 0;
    const totalCost = qty * unitCost;
    const formattedDate = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    return [
      index + 1,
      p.name,
      p.sku || "",
      p.brand || "—",
      p.location || "Unassigned",
      qty,
      unitCost,
      totalCost,
      p.price || 0,
      p.supplier || "—",
      formattedDate,
      p.status || "Verified"
    ];
  });
  exportToCSV(`Inventory_Stock_Report_${today}.csv`, headers, rows);
}

export function exportGodownReport(products: Product[], location: "Godown 1" | "Godown 2" | "All Godowns" = "All Godowns") {
  const today = new Date().toISOString().slice(0, 10);
  const filtered = location === "All Godowns"
    ? products.filter(p => p.location === "Godown 1" || p.location === "Godown 2")
    : products.filter(p => p.location === location);

  const headers = ["Sr. No.", "Product Name", "SKU", "Category", "Brand", "Location", "Quantity", "Unit Cost (₹)", "Total Cost (₹)", "Selling Price (₹)", "Supplier", "Date Added", "Status"];
  const rows = filtered.map((p, index) => {
    const qty = p.qty ?? p.stock ?? 0;
    const unitCost = p.cost || 0;
    const totalCost = qty * unitCost;
    const formattedDate = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    return [
      index + 1,
      p.name,
      p.sku || "",
      p.category || "—",
      p.brand || "—",
      p.location || "Unassigned",
      qty,
      unitCost,
      totalCost,
      p.price || 0,
      p.supplier || "—",
      formattedDate,
      p.status || "Verified"
    ];
  });
  const fileTag = location.replace(/\s+/g, "_");
  exportToCSV(`${fileTag}_Stock_Report_${today}.csv`, headers, rows);
}

export function exportOrdersReport(orders: Order[]) {
  const today = new Date().toISOString().slice(0, 10);
  const headers = ["Order ID", "Customer Name", "Product Name", "Quantity", "Total Amount (₹)", "Discount (%)", "Doc Type", "Status", "Created By", "Assigned To", "Date"];
  const rows = orders.map(o => [
    o.id,
    o.customerName || "",
    o.productName || "",
    o.qty || 1,
    o.total || 0,
    o.discount || 0,
    o.docType || "Bill",
    o.status,
    o.createdBy || "",
    o.assignedToName || o.assignedTo || "",
    o.date || ""
  ]);
  exportToCSV(`Orders_Approval_Report_${today}.csv`, headers, rows);
}

export function exportIncentiveReport(products: Product[]) {
  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const oldBatches = products.filter(p => p.date && new Date(p.date) < ninetyDaysAgo);

  const headers = ["Product ID", "Product Name", "SKU", "Brand", "Location", "Quantity (>90 Days)", "Incentive Per Unit (₹)", "Total Potential Incentive (₹)", "Assigned Seller ID", "Date Added"];
  const rows = oldBatches.map(p => [
    p.id,
    p.name,
    p.sku || "",
    p.brand || "",
    p.location || "Unassigned",
    p.qty ?? p.stock ?? 0,
    p.incentive || 0,
    (p.qty ?? p.stock ?? 0) * (p.incentive || 0),
    p.assignedEmployeeId || "Unassigned",
    p.date || ""
  ]);
  exportToCSV(`Incentive_Products_Report_${today}.csv`, headers, rows);
}

export function exportLeadsReport(leads: Lead[], users: User[] = []) {
  const headers = ["Lead ID", "Customer Name", "Phone", "Email", "Status", "Source", "Interested Product", "Assigned Employee", "Date Created"];
  const rows = leads.map(l => [
    l.id,
    l.name,
    l.phone || "",
    l.email || "",
    l.status,
    l.source || "",
    l.product || "",
    users.find(u => u.id === l.assignedTo)?.name || l.assignedTo || "",
    l.date || ""
  ]);
  openPDFPreview("Lead Generation Pipeline Report", headers, rows, `Total Leads: ${leads.length}`, "pdf");
}

export function exportTasksReport(tasks: Task[]) {
  const headers = ["Task ID", "Task Title", "Assigned Employee", "Status", "Assigned Date"];
  const rows = tasks.map(t => [
    t.id,
    t.title,
    t.assignedToName || t.assignedTo || "",
    t.status,
    t.date || ""
  ]);
  openPDFPreview("Employee Task Assignment Report", headers, rows, `Total Tasks: ${tasks.length}`, "pdf");
}

export function exportEmployeesReport(employees: User[]) {
  const headers = ["Sr. No.", "Employee ID", "Full Name", "Job Role", "Phone", "Email", "Status"];
  const rows = employees.map((e, index) => [
    index + 1,
    e.employeeId || e.id,
    e.name,
    e.jobTitle || "Sales Associate",
    e.phone || "—",
    e.email || e.username || "—",
    e.status || "Verified"
  ]);
  openPDFPreview("Employees Roster Report", headers, rows, `Total Employees: ${employees.length}`, "pdf");
}

export function exportManagersReport(managers: User[]) {
  const headers = ["Sr. No.", "Manager ID", "Full Name", "Phone", "Email"];
  const rows = managers.map((m, index) => [
    index + 1,
    m.username || m.id,
    m.name,
    m.phone || "—",
    m.email || "—"
  ]);
  openPDFPreview("Managers Directory Report", headers, rows, `Total Managers: ${managers.length}`, "pdf");
}

export function SuperAdminReportsSection() {
  const { products, orders, leads, tasks, users } = useStore();
  const [reportType, setReportType] = useState<"all" | "products" | "godown1" | "godown2" | "orders" | "incentive" | "leads" | "tasks" | "employees" | "managers">("all");

  const godown1Products = useMemo(() => products.filter(p => p.location === "Godown 1"), [products]);
  const godown2Products = useMemo(() => products.filter(p => p.location === "Godown 2"), [products]);
  const g1Valuation = useMemo(() => godown1Products.reduce((acc, p) => acc + ((p.qty ?? p.stock ?? 0) * (p.cost || 0)), 0), [godown1Products]);
  const g2Valuation = useMemo(() => godown2Products.reduce((acc, p) => acc + ((p.qty ?? p.stock ?? 0) * (p.cost || 0)), 0), [godown2Products]);

  const ninetyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d;
  }, []);

  const incentiveProducts = useMemo(() => {
    return products.filter(p => p.date && new Date(p.date) < ninetyDaysAgo);
  }, [products, ninetyDaysAgo]);

  const totalInventoryValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + ((p.qty ?? p.stock ?? 0) * (p.cost || p.price || 0)), 0);
  }, [products]);

  const totalOrderRevenue = useMemo(() => {
    return orders.filter(o => o.status === "Approved" || o.status === "Delivered").reduce((acc, o) => acc + (o.total || 0), 0);
  }, [orders]);

  const totalIncentivePool = useMemo(() => {
    return incentiveProducts.reduce((acc, p) => acc + ((p.qty ?? p.stock ?? 0) * (p.incentive || 0)), 0);
  }, [incentiveProducts]);

  const employees = useMemo(() => users.filter(u => u.role === "employee"), [users]);
  const managers = useMemo(() => users.filter(u => u.role === "manager"), [users]);

  const handleExportAll = () => {
    exportProductsReport(products);
    exportGodownReport(products, "Godown 1");
    exportGodownReport(products, "Godown 2");
    exportOrdersReport(orders);
    exportIncentiveReport(products);
    exportLeadsReport(leads, users);
    exportTasksReport(tasks);
    exportEmployeesReport(employees);
    exportManagersReport(managers);
  };

  return (
    <div className="animated fadeIn">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-report, .printable-report * { visibility: visible; }
          .printable-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 className="page-title">📊 Reports & Analytics Hub</h2>
          <p className="page-sub">Generate, preview, and download detailed reports for all business sections including Godown stock.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn btn-ghost"
            onClick={() => window.print()}
            style={{ border: "1px solid var(--border)", padding: "8px 16px", borderRadius: 10, fontWeight: 600, background: "white" }}
          >
            🖨️ Print / Save PDF
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExportAll}
            style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)", padding: "8px 18px", borderRadius: 10, fontWeight: 700, boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}
          >
            📥 Export All Reports (CSV)
          </button>
        </div>
      </div>

      {/* Summary Stat Grid */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="📦" label="INVENTORY COST VALUATION" value={`₹${totalInventoryValuation.toLocaleString()}`} />
        <StatCard icon="🏭" label="GODOWN 1 VALUATION" value={`₹${g1Valuation.toLocaleString()}`} />
        <StatCard icon="🏭" label="GODOWN 2 VALUATION" value={`₹${g2Valuation.toLocaleString()}`} />
        <StatCard icon="🧾" label="APPROVED SALES REVENUE" value={`₹${totalOrderRevenue.toLocaleString()}`} />
        <StatCard icon="👥" label="ACTIVE EMPLOYEES" value={users.filter(u => u.role === "employee").length} />
      </div>

      {/* Module Export Cards */}
      <div className="no-print" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="panel" style={{ margin: 0, padding: 18, borderLeft: "4px solid #38BDF8", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📦 Total Inventory & Stock Report</h4>
            <span style={{ fontSize: 11, background: "#F5F3FF", color: "#6D28D9", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{products.length} Items</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--brown)", margin: "0 0 14px 0" }}>Stock quantities, cost prices, selling values & godown locations.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const headers = ["Sr. No.", "Product Name", "SKU", "Brand", "Location", "Qty", "Unit Cost", "Total Cost", "Supplier", "Date", "Status"];
                const rows = products.map((p, index) => {
                  const qty = p.qty ?? p.stock ?? 0;
                  const unitCost = p.cost || 0;
                  const totalCost = qty * unitCost;
                  const formattedDate = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                  return [index + 1, p.name, p.sku || "", p.brand || "—", p.location || "Unassigned", qty, unitCost, totalCost, p.supplier || "—", formattedDate, p.status || "Verified"];
                });
                openPDFPreview("Stocking Inventory Report", headers, rows, `Total Items: ${products.length} | Valuation: ₹${totalInventoryValuation.toLocaleString()}`);
              }}
              style={{ border: "1px solid var(--border)", flex: 1, justifyContent: "center" }}
            >
              📄 PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => exportProductsReport(products)} style={{ flex: 1, justifyContent: "center" }}>
              📥 CSV
            </button>
          </div>
        </div>

        {/* Godown 1 Module Card */}
        <div className="panel" style={{ margin: 0, padding: 18, borderLeft: "4px solid #0284c7", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>🏭 Godown 1 Stock Report</h4>
            <span style={{ fontSize: 11, background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{godown1Products.length} Items</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--brown)", margin: "0 0 14px 0" }}>Stock items, quantities & valuation stored inside Godown 1.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const headers = ["Sr. No.", "Product Name", "SKU", "Category", "Qty", "Unit Cost (₹)", "Total Cost (₹)"];
                const rows = godown1Products.map((p, index) => {
                  const qty = p.qty ?? p.stock ?? 0;
                  const totalValue = qty * (p.cost || 0);
                  return [index + 1, p.name, p.sku || "—", p.category || "—", qty, p.cost || 0, totalValue];
                });
                openPDFPreview("Godown 1 Stock Inventory Report", headers, rows, `Total Items: ${godown1Products.length} | Valuation: ₹${g1Valuation.toLocaleString()}`);
              }}
              style={{ border: "1px solid var(--border)", flex: 1, justifyContent: "center" }}
            >
              📄 PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => exportGodownReport(products, "Godown 1")} style={{ flex: 1, justifyContent: "center", background: "#0284c7" }}>
              📥 CSV
            </button>
          </div>
        </div>

        {/* Godown 2 Module Card */}
        <div className="panel" style={{ margin: 0, padding: 18, borderLeft: "4px solid #0d9488", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>🏭 Godown 2 Stock Report</h4>
            <span style={{ fontSize: 11, background: "#ccfbf1", color: "#0f766e", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{godown2Products.length} Items</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--brown)", margin: "0 0 14px 0" }}>Stock items, quantities & valuation stored inside Godown 2.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const headers = ["Sr. No.", "Product Name", "SKU", "Category", "Qty", "Unit Cost (₹)", "Total Cost (₹)"];
                const rows = godown2Products.map((p, index) => {
                  const qty = p.qty ?? p.stock ?? 0;
                  const totalValue = qty * (p.cost || 0);
                  return [index + 1, p.name, p.sku || "—", p.category || "—", qty, p.cost || 0, totalValue];
                });
                openPDFPreview("Godown 2 Stock Inventory Report", headers, rows, `Total Items: ${godown2Products.length} | Valuation: ₹${g2Valuation.toLocaleString()}`);
              }}
              style={{ border: "1px solid var(--border)", flex: 1, justifyContent: "center" }}
            >
              📄 PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => exportGodownReport(products, "Godown 2")} style={{ flex: 1, justifyContent: "center", background: "#0d9488" }}>
              📥 CSV
            </button>
          </div>
        </div>

        <div className="panel" style={{ margin: 0, padding: 18, borderLeft: "4px solid #10b981", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>✅ Orders & Sales Report</h4>
            <span style={{ fontSize: 11, background: "#ecfdf5", color: "#047857", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{orders.length} Orders</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--brown)", margin: "0 0 14px 0" }}>Customer orders, approval statuses, quantities & total sales value.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const headers = ["Order #", "Customer", "Product", "Qty", "Total (₹)", "Status", "Date"];
                const rows = orders.map(o => [o.id, o.customerName, o.productName, o.qty, o.total, o.status, o.date]);
                openPDFPreview("Orders & Sales Approvals Report", headers, rows, `Total Orders: ${orders.length} | Approved Revenue: ₹${totalOrderRevenue.toLocaleString()}`);
              }}
              style={{ border: "1px solid var(--border)", flex: 1, justifyContent: "center" }}
            >
              📄 PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => exportOrdersReport(orders)} style={{ flex: 1, justifyContent: "center" }}>
              📥 CSV
            </button>
          </div>
        </div>

        <div className="panel" style={{ margin: 0, padding: 18, borderLeft: "4px solid #f59e0b", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>💰 Incentive Products Report</h4>
            <span style={{ fontSize: 11, background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{incentiveProducts.length} Eligible</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--brown)", margin: "0 0 14px 0" }}>Products older than 90 days, unit incentives & assigned sellers.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const headers = ["Sr. No.", "Product Name", "SKU", "Brand", "Location", "Qty (>90 Days)", "Incentive / Unit", "Total Incentive"];
                const rows = incentiveProducts.map((p, index) => {
                  const qty = p.qty ?? p.stock ?? 0;
                  const unitIncentive = p.incentive || 0;
                  const totalIncentive = qty * unitIncentive;
                  return [index + 1, p.name, p.sku || "", p.brand || "—", p.location || "Unassigned", qty, unitIncentive, totalIncentive];
                });
                openPDFPreview("Incentive Products Report (>90 Days)", headers, rows, `Eligible Products: ${incentiveProducts.length} | Total Incentive Pool: ₹${totalIncentivePool.toLocaleString()}`);
              }}
              style={{ border: "1px solid var(--border)", flex: 1, justifyContent: "center" }}
            >
              📄 PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => exportIncentiveReport(products)} style={{ flex: 1, justifyContent: "center", background: "#d97706" }}>
              📥 CSV
            </button>
          </div>
        </div>

        <div className="panel" style={{ margin: 0, padding: 18, borderLeft: "4px solid #8b5cf6", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>🧲 Leads & Deals Report</h4>
            <span style={{ fontSize: 11, background: "#f5f3ff", color: "#6d28d9", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{leads.length} Leads</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--brown)", margin: "0 0 14px 0" }}>Lead stages, customer contact details & assigned employees.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const headers = ["ID", "Customer Name", "Phone", "Status", "Source", "Product", "Date"];
                const rows = leads.map(l => [l.id, l.name, l.phone || "", l.status, l.source || "", l.product || "", l.date]);
                openPDFPreview("Lead Generation Pipeline Report", headers, rows, `Total Leads: ${leads.length}`);
              }}
              style={{ border: "1px solid var(--border)", flex: 1, justifyContent: "center" }}
            >
              📄 PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => exportLeadsReport(leads, users)} style={{ flex: 1, justifyContent: "center", background: "#7c3aed" }}>
              📥 CSV
            </button>
          </div>
        </div>

        <div className="panel" style={{ margin: 0, padding: 18, borderLeft: "4px solid #ec4899", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📝 Employee Tasks Report</h4>
            <span style={{ fontSize: 11, background: "#fce7f3", color: "#be185d", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{tasks.length} Tasks</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--brown)", margin: "0 0 14px 0" }}>Task assignments, completion statuses & assigned employees.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const headers = ["ID", "Task Title", "Assigned Employee", "Status", "Date"];
                const rows = tasks.map(t => [t.id, t.title, t.assignedToName || t.assignedTo || "", t.status, t.date]);
                openPDFPreview("Employee Task Assignment Report", headers, rows, `Total Tasks: ${tasks.length}`);
              }}
              style={{ border: "1px solid var(--border)", flex: 1, justifyContent: "center" }}
            >
              📄 PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => exportTasksReport(tasks)} style={{ flex: 1, justifyContent: "center", background: "#db2777" }}>
              📥 CSV
            </button>
          </div>
        </div>

        <div className="panel" style={{ margin: 0, padding: 18, borderLeft: "4px solid #06b6d4", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>👥 Employees Roster Report</h4>
            <span style={{ fontSize: 11, background: "#ecfeff", color: "#0891b2", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{employees.length} Staff</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--brown)", margin: "0 0 14px 0" }}>Employee list, job roles, contact details & account status.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const headers = ["Sr. No.", "Employee ID", "Full Name", "Job Role", "Phone", "Email", "Status"];
                const rows = employees.map((e, index) => [index + 1, e.employeeId || e.id, e.name, e.jobTitle || "Sales Associate", e.phone || "—", e.email || e.username || "—", e.status || "Verified"]);
                openPDFPreview("Employees Roster Report", headers, rows, `Total Employees: ${employees.length}`);
              }}
              style={{ border: "1px solid var(--border)", flex: 1, justifyContent: "center" }}
            >
              📄 PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => exportEmployeesReport(employees)} style={{ flex: 1, justifyContent: "center", background: "#0891b2" }}>
              📥 CSV
            </button>
          </div>
        </div>

        <div className="panel" style={{ margin: 0, padding: 18, borderLeft: "4px solid #6366f1", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>👔 Managers Directory Report</h4>
            <span style={{ fontSize: 11, background: "#F3EEFF", color: "#7C3AED", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{managers.length} Managers</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--brown)", margin: "0 0 14px 0" }}>Managers directory, IDs, passwords & contact info.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const headers = ["Sr. No.", "Manager ID", "Full Name", "Phone", "Email"];
                const rows = managers.map((m, index) => [index + 1, m.username || m.id, m.name, m.phone || "—", m.email || "—"]);
                openPDFPreview("Managers Directory Report", headers, rows, `Total Managers: ${managers.length}`);
              }}
              style={{ border: "1px solid var(--border)", flex: 1, justifyContent: "center" }}
            >
              📄 PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => exportManagersReport(managers)} style={{ flex: 1, justifyContent: "center", background: "#7C3AED" }}>
              📥 CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filterable Live Printable Report Preview */}
      <div className="panel printable-report" style={{ marginTop: 24, borderRadius: 14, overflow: "hidden" }}>
        <div className="panel-head no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h3 className="panel-title">📋 Live Report Preview</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className={`btn btn-sm ${reportType === "all" ? "btn-primary" : "btn-ghost"}`} onClick={() => setReportType("all")}>All Summary</button>
            <button className={`btn btn-sm ${reportType === "products" ? "btn-primary" : "btn-ghost"}`} onClick={() => setReportType("products")}>All Inventory ({products.length})</button>
            <button className={`btn btn-sm ${reportType === "godown1" ? "btn-primary" : "btn-ghost"}`} onClick={() => setReportType("godown1")}>Godown 1 ({godown1Products.length})</button>
            <button className={`btn btn-sm ${reportType === "godown2" ? "btn-primary" : "btn-ghost"}`} onClick={() => setReportType("godown2")}>Godown 2 ({godown2Products.length})</button>
            <button className={`btn btn-sm ${reportType === "orders" ? "btn-primary" : "btn-ghost"}`} onClick={() => setReportType("orders")}>Orders ({orders.length})</button>
            <button className={`btn btn-sm ${reportType === "incentive" ? "btn-primary" : "btn-ghost"}`} onClick={() => setReportType("incentive")}>Incentive ({incentiveProducts.length})</button>
            <button className={`btn btn-sm ${reportType === "leads" ? "btn-primary" : "btn-ghost"}`} onClick={() => setReportType("leads")}>Leads ({leads.length})</button>
            <button className={`btn btn-sm ${reportType === "tasks" ? "btn-primary" : "btn-ghost"}`} onClick={() => setReportType("tasks")}>Tasks ({tasks.length})</button>
            <button className={`btn btn-sm ${reportType === "employees" ? "btn-primary" : "btn-ghost"}`} onClick={() => setReportType("employees")}>Employees ({employees.length})</button>
            <button className={`btn btn-sm ${reportType === "managers" ? "btn-primary" : "btn-ghost"}`} onClick={() => setReportType("managers")}>Managers ({managers.length})</button>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", borderBottom: "2px solid var(--border)", paddingBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: "var(--text)" }}>Business Executive Report</h3>
              <span style={{ fontSize: 12, color: "var(--brown)" }}>Generated on: {new Date().toLocaleString()}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", background: "var(--biscuit)", borderRadius: 6 }}>
              Super Admin System Report
            </span>
          </div>

          {/* Godown 1 Section */}
          {(reportType === "all" || reportType === "godown1") && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "var(--primary)" }}>🏭 Godown 1 Stock ({godown1Products.length} Items | Total Value: ₹{g1Valuation.toLocaleString()})</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-ghost btn-sm no-print"
                    onClick={() => {
                      const headers = ["Sr. No.", "Product Name", "SKU", "Category", "Qty", "Unit Cost (₹)", "Total Cost (₹)"];
                      const rows = godown1Products.map((p, index) => {
                        const qty = p.qty ?? p.stock ?? 0;
                        const totalValue = qty * (p.cost || 0);
                        return [index + 1, p.name, p.sku || "—", p.category || "—", qty, p.cost || 0, totalValue];
                      });
                      openPDFPreview("Godown 1 Stock Inventory Report", headers, rows, `Total Items: ${godown1Products.length} | Valuation: ₹${g1Valuation.toLocaleString()}`);
                    }}
                  >
                    📄 PDF
                  </button>
                  <button className="btn btn-ghost btn-sm no-print" onClick={() => exportGodownReport(products, "Godown 1")}>📥 CSV</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Sr. No.</th>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Unit Cost (₹)</th>
                      <th>Total Cost (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {godown1Products.map((p, index) => {
                      const qty = p.qty ?? p.stock ?? 0;
                      const unitCost = p.cost || 0;
                      const totalCost = qty * unitCost;
                      return (
                        <tr key={p.id}>
                          <td>{index + 1}</td>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.sku || "—"}</td>
                          <td>{p.category || "—"}</td>
                          <td>{qty}</td>
                          <td>₹{unitCost.toLocaleString()}</td>
                          <td>₹{totalCost.toLocaleString()}</td>
                          <td>{p.status || "Verified"}</td>
                        </tr>
                      );
                    })}
                    {godown1Products.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center" }}>No products in Godown 1.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Godown 2 Section */}
          {(reportType === "all" || reportType === "godown2") && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "var(--primary)" }}>🏭 Godown 2 Stock ({godown2Products.length} Items | Total Value: ₹{g2Valuation.toLocaleString()})</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-ghost btn-sm no-print"
                    onClick={() => {
                      const headers = ["Sr. No.", "Product Name", "SKU", "Category", "Qty", "Unit Cost (₹)", "Total Cost (₹)"];
                      const rows = godown2Products.map((p, index) => {
                        const qty = p.qty ?? p.stock ?? 0;
                        const totalValue = qty * (p.cost || 0);
                        return [index + 1, p.name, p.sku || "—", p.category || "—", qty, p.cost || 0, totalValue];
                      });
                      openPDFPreview("Godown 2 Stock Inventory Report", headers, rows, `Total Items: ${godown2Products.length} | Valuation: ₹${g2Valuation.toLocaleString()}`);
                    }}
                  >
                    📄 PDF
                  </button>
                  <button className="btn btn-ghost btn-sm no-print" onClick={() => exportGodownReport(products, "Godown 2")}>📥 CSV</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Sr. No.</th>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Unit Cost (₹)</th>
                      <th>Total Cost (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {godown2Products.map((p, index) => {
                      const qty = p.qty ?? p.stock ?? 0;
                      const unitCost = p.cost || 0;
                      const totalCost = qty * unitCost;
                      return (
                        <tr key={p.id}>
                          <td>{index + 1}</td>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.sku || "—"}</td>
                          <td>{p.category || "—"}</td>
                          <td>{qty}</td>
                          <td>₹{unitCost.toLocaleString()}</td>
                          <td>₹{totalCost.toLocaleString()}</td>
                          <td>{p.status || "Verified"}</td>
                        </tr>
                      );
                    })}
                    {godown2Products.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center" }}>No products in Godown 2.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportType === "all" || reportType === "products") && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "var(--accent)" }}>📦 Stocking Inventory ({products.length} Products)</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-ghost btn-sm no-print"
                    onClick={() => {
                      const headers = ["Sr. No.", "Product Name", "SKU", "Brand", "Location", "Qty", "Unit Cost", "Total Cost", "Supplier", "Date", "Status"];
                      const rows = products.map((p, index) => {
                        const qty = p.qty ?? p.stock ?? 0;
                        const unitCost = p.cost || 0;
                        const totalCost = qty * unitCost;
                        const formattedDate = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                        return [index + 1, p.name, p.sku || "", p.brand || "—", p.location || "Unassigned", qty, unitCost, totalCost, p.supplier || "—", formattedDate, p.status || "Verified"];
                      });
                      openPDFPreview("Stocking Inventory Report", headers, rows, `Total Products: ${products.length}`);
                    }}
                  >
                    📄 PDF
                  </button>
                  <button className="btn btn-ghost btn-sm no-print" onClick={() => exportProductsReport(products)}>📥 CSV</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Sr. No.</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Brand</th>
                      <th>Location</th>
                      <th>Qty</th>
                      <th>Unit Cost (₹)</th>
                      <th>Total Cost (₹)</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Selling Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 10).map((p, index) => {
                      const qty = p.qty ?? p.stock ?? 0;
                      const unitCost = p.cost || 0;
                      const totalCost = qty * unitCost;
                      const formattedDate = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                      return (
                        <tr key={p.id}>
                          <td>{index + 1}</td>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.sku || "—"}</td>
                          <td>{p.brand || "—"}</td>
                          <td>{p.location || "Unassigned"}</td>
                          <td>{qty}</td>
                          <td>₹{unitCost.toLocaleString()}</td>
                          <td>₹{totalCost.toLocaleString()}</td>
                          <td>{p.supplier || "—"}</td>
                          <td>{formattedDate}</td>
                          <td>₹{(p.price || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {products.length === 0 && <tr><td colSpan={11} style={{ textAlign: "center" }}>No products found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportType === "all" || reportType === "orders") && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "var(--green)" }}>✅ Order Approvals & Sales ({orders.length} Orders)</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-ghost btn-sm no-print"
                    onClick={() => {
                      const headers = ["Order #", "Customer", "Product", "Qty", "Total (₹)", "Status", "Date"];
                      const rows = orders.map(o => [o.id, o.customerName, o.productName, o.qty, o.total, o.status, o.date]);
                      openPDFPreview("Orders & Sales Approvals Report", headers, rows, `Total Orders: ${orders.length}`);
                    }}
                  >
                    📄 PDF
                  </button>
                  <button className="btn btn-ghost btn-sm no-print" onClick={() => exportOrdersReport(orders)}>📥 CSV</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Total (₹)</th>
                      <th>Doc Type</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((o) => (
                      <tr key={o.id}>
                        <td><strong>#{o.id}</strong></td>
                        <td>{o.customerName}</td>
                        <td>{o.productName}</td>
                        <td>{o.qty}</td>
                        <td style={{ fontWeight: 700 }}>₹{o.total.toLocaleString()}</td>
                        <td>{o.docType || "Bill"}</td>
                        <td><Pill status={o.status} /></td>
                        <td>{o.assignedToName || "—"}</td>
                        <td>{o.date}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center" }}>No orders found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportType === "all" || reportType === "incentive") && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "#d97706" }}>💰 Incentive Products (&gt;90 Days) ({incentiveProducts.length} Items)</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-ghost btn-sm no-print"
                    onClick={() => {
                      const headers = ["Sr. No.", "Product Name", "SKU", "Brand", "Location", "Qty (>90 Days)", "Incentive / Unit", "Total Incentive"];
                      const rows = incentiveProducts.map((p, index) => {
                        const qty = p.qty ?? p.stock ?? 0;
                        const unitIncentive = p.incentive || 0;
                        const totalIncentive = qty * unitIncentive;
                        return [index + 1, p.name, p.sku || "", p.brand || "—", p.location || "Unassigned", qty, unitIncentive, totalIncentive];
                      });
                      openPDFPreview("Incentive Products Report (>90 Days)", headers, rows, `Eligible Products: ${incentiveProducts.length}`);
                    }}
                  >
                    📄 PDF
                  </button>
                  <button className="btn btn-ghost btn-sm no-print" onClick={() => exportIncentiveReport(products)}>📥 CSV</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Location</th>
                      <th>Stock Qty</th>
                      <th>Incentive / Unit (₹)</th>
                      <th>Total Pool (₹)</th>
                      <th>Assigned Seller</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incentiveProducts.slice(0, 10).map((p) => {
                      const assignedName = p.assignedEmployeeId === "all"
                        ? "All Employees"
                        : (users.find(u => u.id === p.assignedEmployeeId)?.name || p.assignedEmployeeId || "Unassigned");
                      return (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong> {p.brand ? `(${p.brand})` : ""}</td>
                          <td>{p.sku || "—"}</td>
                          <td>{p.location || "Unassigned"}</td>
                          <td>{p.qty ?? p.stock}</td>
                          <td style={{ color: "var(--green)", fontWeight: 700 }}>₹{p.incentive.toLocaleString()}</td>
                          <td style={{ fontWeight: 700 }}>₹{((p.qty ?? p.stock ?? 0) * (p.incentive || 0)).toLocaleString()}</td>
                          <td>{assignedName}</td>
                        </tr>
                      );
                    })}
                    {incentiveProducts.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center" }}>No eligible incentive products found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportType === "all" || reportType === "leads") && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "#7c3aed" }}>🧲 Lead Generation Pipeline ({leads.length} Leads)</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-ghost btn-sm no-print"
                    onClick={() => {
                      const headers = ["ID", "Customer Name", "Phone", "Status", "Source", "Product", "Date"];
                      const rows = leads.map(l => [l.id, l.name, l.phone || "", l.status, l.source || "", l.product || "", l.date]);
                      openPDFPreview("Lead Generation Pipeline Report", headers, rows, `Total Leads: ${leads.length}`);
                    }}
                  >
                    📄 PDF
                  </button>
                  <button className="btn btn-ghost btn-sm no-print" onClick={() => exportLeadsReport(leads, users)}>📥 CSV</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Source</th>
                      <th>Interested Product</th>
                      <th>Assigned To</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 10).map((l) => (
                      <tr key={l.id}>
                        <td><strong>{l.name}</strong></td>
                        <td>{l.phone || "—"}</td>
                        <td><span className="pill">{l.status}</span></td>
                        <td>{l.source || "—"}</td>
                        <td>{l.product || "—"}</td>
                        <td>{users.find(u => u.id === l.assignedTo)?.name || l.assignedTo || "—"}</td>
                        <td>{l.date}</td>
                      </tr>
                    ))}
                    {leads.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center" }}>No leads found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportType === "all" || reportType === "tasks") && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "#db2777" }}>📝 Employee Tasks ({tasks.length} Tasks)</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-ghost btn-sm no-print"
                    onClick={() => {
                      const headers = ["ID", "Task Title", "Assigned Employee", "Status", "Date"];
                      const rows = tasks.map(t => [t.id, t.title, t.assignedToName || t.assignedTo || "", t.status, t.date]);
                      openPDFPreview("Employee Task Assignment Report", headers, rows, `Total Tasks: ${tasks.length}`);
                    }}
                  >
                    📄 PDF
                  </button>
                  <button className="btn btn-ghost btn-sm no-print" onClick={() => exportTasksReport(tasks)}>📥 CSV</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Assigned Employee</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.slice(0, 10).map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.title}</strong></td>
                        <td>{t.assignedToName || t.assignedTo || "—"}</td>
                        <td><Pill status={t.status} /></td>
                        <td>{t.date}</td>
                      </tr>
                    ))}
                    {tasks.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center" }}>No tasks found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportType === "all" || reportType === "employees") && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "#0891b2" }}>👥 Active Employees ({employees.length} Staff)</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-ghost btn-sm no-print"
                    onClick={() => {
                      const headers = ["Sr. No.", "Employee ID", "Full Name", "Job Role", "Phone", "Email", "Status"];
                      const rows = employees.map((e, index) => [index + 1, e.employeeId || e.id, e.name, e.jobTitle || "Sales Associate", e.phone || "—", e.email || e.username || "—", e.status || "Verified"]);
                      openPDFPreview("Employees Roster Report", headers, rows, `Total Employees: ${employees.length}`);
                    }}
                  >
                    📄 PDF
                  </button>
                  <button className="btn btn-ghost btn-sm no-print" onClick={() => exportEmployeesReport(employees)}>📥 CSV</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Sr. No.</th>
                      <th>Employee ID</th>
                      <th>Full Name</th>
                      <th>Job Role</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((e, index) => (
                      <tr key={e.id}>
                        <td>{index + 1}</td>
                        <td><strong>{e.employeeId || e.id}</strong></td>
                        <td>{e.name}</td>
                        <td>{e.jobTitle || "Sales Associate"}</td>
                        <td>{e.phone || "—"}</td>
                        <td>{e.email || e.username || "—"}</td>
                        <td><span className="pill pill-approved">{e.status || "Verified"}</span></td>
                      </tr>
                    ))}
                    {employees.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center" }}>No employees found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(reportType === "all" || reportType === "managers") && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "#7C3AED" }}>👔 System Managers ({managers.length} Managers)</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-ghost btn-sm no-print"
                    onClick={() => {
                      const headers = ["Sr. No.", "Manager ID", "Full Name", "Phone", "Email"];
                      const rows = managers.map((m, index) => [index + 1, m.username || m.id, m.name, m.phone || "—", m.email || "—"]);
                      openPDFPreview("Managers Directory Report", headers, rows, `Total Managers: ${managers.length}`);
                    }}
                  >
                    📄 PDF
                  </button>
                  <button className="btn btn-ghost btn-sm no-print" onClick={() => exportManagersReport(managers)}>📥 CSV</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Sr. No.</th>
                      <th>Manager ID</th>
                      <th>Full Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((m, index) => (
                      <tr key={m.id}>
                        <td>{index + 1}</td>
                        <td><strong>{m.username || m.id}</strong></td>
                        <td>{m.name}</td>
                        <td>{m.phone || "—"}</td>
                        <td>{m.email || "—"}</td>
                      </tr>
                    ))}
                    {managers.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center" }}>No managers found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
