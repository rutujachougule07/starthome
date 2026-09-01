
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { useStore, loadCurrentUser, Customer, Product, Order, Task } from "../app/store";
import { DashboardLayout, StatCard, Pill, NavItem, Modal, BarChart } from "../app/DashboardLayout";
import { NotificationsSection, ProfileSection, LeadsSection, DashboardLeadPipelineOverview, UpcomingFollowUps, ProductForm, BarcodeScannerModal, QuotationsSection } from "./SuperAdminPage";
import { getAutoProductImage } from "../utils/autoProductImage";

const NAV: NavItem[] = [
  { key: "overview", label: "Live Dashboard", icon: "📡" },
  { key: "products", label: "Stocking Inventory", icon: "📦" },
  { key: "leads", label: "Lead Generation", icon: "🧲" },
  { key: "quotations", label: "Quotations", icon: "📑" },
  { key: "tasks", label: "Assigned Tasks", icon: "📝" },
  { key: "orders", label: "Order Updates", icon: "🧾" },
  { key: "profile", label: "Profile", icon: "⚙" },
];

interface EmployeePageProps {
  tab?: string;
}

export function EmployeePage({ tab = "overview" }: EmployeePageProps) {
  const store = useStore();
  const active = tab || "overview";
  const navigate = useNavigate();

  const setActive = (tab: string) => {
    navigate({ to: "/employee", search: { tab } });
  };

  const user = store.currentUser || loadCurrentUser();
  if (!user || user.role !== "employee") {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout role="employee" title="Employee" nav={NAV} active={active} onNav={setActive}>
      {active === "overview" && <Overview />}
      {active === "tasks" && <TasksSection />}
      {active === "leads" && <LeadsSection />}
      {active === "quotations" && <QuotationsSection />}
      {active === "orders" && <OrderUpdates />}
      {active === "products" && <ProductsSection />}
      {active === "incentive" && <EmployeeIncentiveSection />}
      {active === "profile" && <ProfileSection />}
    </DashboardLayout>
  );
}

function Overview() {
  const { currentUser, tasks, orders, products } = useStore();
  const navigate = useNavigate();
  const mine = tasks.filter((t) => t.assignedTo === currentUser!.id);
  const goTo = (tab: string) => navigate({ to: "/employee", search: { tab } });

  // Punch In State per Employee
  const userPunchKey = `punch_in_${currentUser?.id}`;
  const userPunchTimeKey = `punch_time_${currentUser?.id}`;
  const userPunchCountKey = `punch_count_${currentUser?.id}`;

  const [isPunchedIn, setIsPunchedIn] = useState<boolean>(() => {
    return localStorage.getItem(userPunchKey) === "true";
  });
  const [punchInTime, setPunchInTime] = useState<string>(() => {
    return localStorage.getItem(userPunchTimeKey) || "";
  });
  const [punchCount, setPunchCount] = useState<number>(() => {
    return Number(localStorage.getItem(userPunchCountKey)) || (isPunchedIn ? 1 : 0);
  });

  const handleTogglePunchIn = () => {
    if (isPunchedIn) {
      // Punch Out
      setIsPunchedIn(false);
      localStorage.setItem(userPunchKey, "false");
    } else {
      // Punch In
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newCount = punchCount + 1;
      setIsPunchedIn(true);
      setPunchInTime(nowStr);
      setPunchCount(newCount);
      localStorage.setItem(userPunchKey, "true");
      localStorage.setItem(userPunchTimeKey, nowStr);
      localStorage.setItem(userPunchCountKey, String(newCount));
    }
  };

  // 1. Incentive Metrics
  const assignedIncentiveProducts = products.filter(p => p.assignedEmployeeId === currentUser?.id);
  const assignedIncentiveOrders = orders.filter(o => o.assignedTo === currentUser?.id && (o.isIncentive || (o.discount || 0) > 0));
  const incentiveCount = assignedIncentiveProducts.length + assignedIncentiveOrders.length;
  const incentiveEarnedTotal = assignedIncentiveProducts.reduce((acc, p) => acc + (p.incentive || 0), 0) + assignedIncentiveOrders.reduce((acc, o) => acc + Math.round((o.total * (o.discount || 0)) / 100), 0);

  // 2. Task Complete Metrics
  const completedCount = mine.filter((t) => t.status === "Completed").length;

  // 3. Orders Metrics
  const approvedOrders = orders.filter((o) => (o.assignedTo === currentUser?.id || o.createdBy === currentUser?.name) && (o.status === "Approved" || o.status === "Delivered"));
  const ordersCount = approvedOrders.length;

  // 4. Punch In Attendance Metric & Percentage
  const punchAttendancePercentage = isPunchedIn ? 100 : 85; // Attendance percentage
  const punchVal = punchAttendancePercentage;

  // Bar Chart Data (Incentive, Task Complete, Order, Punch In)
  const chartData = [
    {
      label: "Incentive",
      value: incentiveCount > 0 ? incentiveCount : (incentiveEarnedTotal > 0 ? 1 : 0),
      displayValue: incentiveEarnedTotal > 0 ? `₹${incentiveEarnedTotal.toLocaleString()}` : `${incentiveCount}`,
      color: "linear-gradient(180deg, #7C3AED 0%, #6D28D9 100%)"
    },
    {
      label: "Task Complete",
      value: completedCount,
      displayValue: `${completedCount}`,
      color: "linear-gradient(180deg, #10B981 0%, #059669 100%)"
    },
    {
      label: "Orders",
      value: ordersCount,
      displayValue: `${ordersCount}`,
      color: "linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)"
    },
    {
      label: "Punch In",
      value: punchVal,
      displayValue: `${punchAttendancePercentage}%`,
      color: "linear-gradient(180deg, #F59E0B 0%, #D97706 100%)"
    }
  ];

  // Pie Chart Proportions (Weights for 4 slices)
  const incWeight = incentiveCount > 0 ? incentiveCount : (incentiveEarnedTotal > 0 ? 2 : 1);
  const taskWeight = completedCount > 0 ? completedCount : 1;
  const orderWeight = ordersCount > 0 ? ordersCount : 1;
  const punchWeight = Math.round((punchAttendancePercentage / 100) * 2) || 1;

  const totalPieWeight = incWeight + taskWeight + orderWeight + punchWeight;
  const totalPieDisplayCount = (incentiveCount || (incentiveEarnedTotal ? 1 : 0)) + completedCount + ordersCount + 1;

  const incPct = Math.round((incWeight / totalPieWeight) * 100);
  const taskPct = Math.round((taskWeight / totalPieWeight) * 100);
  const orderPct = Math.round((orderWeight / totalPieWeight) * 100);
  const punchPct = Math.max(1, 100 - (incPct + taskPct + orderPct));

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <h2 className="page-title" style={{ margin: 0 }}>Welcome, {currentUser?.name?.split(" ")[0]}</h2>
        <p className="page-sub" style={{ margin: "4px 0 0 0" }}>Here's your work overview for today.</p>
      </div>

      <DashboardLeadPipelineOverview />
      <UpcomingFollowUps />

      <div className="stat-grid">
        <StatCard icon="💰" label="Incentive" value={incentiveEarnedTotal > 0 ? `₹${incentiveEarnedTotal.toLocaleString()}` : `${incentiveCount}`} onClick={() => goTo("products")} />
        <StatCard icon="✅" label="Task Complete" value={completedCount} onClick={() => goTo("tasks")} />
        <StatCard icon="🧾" label="Orders" value={ordersCount} onClick={() => goTo("orders")} />
        <StatCard icon="⏰" label="Punch In" value={`${punchAttendancePercentage}%`} onClick={() => goTo("profile")} />
      </div>

      {/* Bar Chart & Pie Chart Row with Requested 4 Metrics */}
      <div className="row-2" style={{ marginBottom: "24px" }}>
        {/* Performance Bar Chart (Incentive, Task Complete, Order, Punch In) */}
        <div className="panel" style={{ background: "rgba(255, 255, 255, 0.72)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", borderRadius: "24px", border: "1px solid rgba(255, 255, 255, 0.5)", padding: "22px", boxShadow: "0 15px 40px rgba(0, 0, 0, 0.06)" }}>
          <div className="panel-head" style={{ marginBottom: "16px" }}>
            <h3 className="panel-title" style={{ fontSize: "16px", fontWeight: 800, color: "#1F1F1F", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📊 Employee Performance Overview Chart</span>
            </h3>
          </div>
          <BarChart data={chartData} />
        </div>

        {/* Performance Breakdown Pie Chart */}
        <div className="panel" style={{ background: "rgba(255, 255, 255, 0.72)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", borderRadius: "24px", border: "1px solid rgba(255, 255, 255, 0.5)", padding: "22px", boxShadow: "0 15px 40px rgba(0, 0, 0, 0.06)" }}>
          <div className="panel-head" style={{ marginBottom: "16px" }}>
            <h3 className="panel-title" style={{ fontSize: "16px", fontWeight: 800, color: "#1F1F1F", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🥧 Performance Status Breakdown</span>
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "16px", padding: "10px 0" }}>
            {/* SVG Donut / Pie Chart */}
            <div style={{ position: "relative", width: "130px", height: "130px" }}>
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                {/* Background Ring */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(148, 163, 184, 0.22)" strokeWidth="4" />
                {/* Incentive Slice (Purple) */}
                <circle
                  cx="18" cy="18" r="15.915" fill="none"
                  stroke="#7C3AED" strokeWidth="4.5"
                  strokeDasharray={`${incPct} ${100 - incPct}`}
                  strokeDashoffset="0"
                />
                {/* Task Complete Slice (Green) */}
                <circle
                  cx="18" cy="18" r="15.915" fill="none"
                  stroke="#10B981" strokeWidth="4.5"
                  strokeDasharray={`${taskPct} ${100 - taskPct}`}
                  strokeDashoffset={`-${incPct}`}
                />
                {/* Orders Slice (Blue) */}
                <circle
                  cx="18" cy="18" r="15.915" fill="none"
                  stroke="#2563EB" strokeWidth="4.5"
                  strokeDasharray={`${orderPct} ${100 - orderPct}`}
                  strokeDashoffset={`-${incPct + taskPct}`}
                />
                {/* Punch In Slice (Yellow) */}
                <circle
                  cx="18" cy="18" r="15.915" fill="none"
                  stroke="#F59E0B" strokeWidth="4.5"
                  strokeDasharray={`${punchPct} ${100 - punchPct}`}
                  strokeDashoffset={`-${incPct + taskPct + orderPct}`}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#1F1F1F" }}>{totalPieDisplayCount}</span>
                <span style={{ fontSize: "10px", color: "#6F6F6F", fontWeight: 700, textTransform: "uppercase" }}>Activity</span>
              </div>
            </div>

            {/* Pie Chart Legend with exact requested items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#7C3AED", display: "inline-block" }} />
                <span style={{ color: "#6F6F6F", fontWeight: 600 }}>Incentive:</span>
                <span style={{ fontWeight: 800, color: "#1F1F1F" }}>{incentiveEarnedTotal > 0 ? `₹${incentiveEarnedTotal.toLocaleString()}` : incentiveCount}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                <span style={{ color: "#6F6F6F", fontWeight: 600 }}>Task Complete:</span>
                <span style={{ fontWeight: 800, color: "#1F1F1F" }}>{completedCount}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#2563EB", display: "inline-block" }} />
                <span style={{ color: "#6F6F6F", fontWeight: 600 }}>Orders:</span>
                <span style={{ fontWeight: 800, color: "#1F1F1F" }}>{ordersCount}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                <span style={{ color: "#6F6F6F", fontWeight: 600 }}>Punch In:</span>
                <span style={{ fontWeight: 800, color: "#D97706" }}>{punchAttendancePercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3 className="panel-title">My Recent Tasks</h3></div>
        <div className={mine.length > 0 ? "card-grid" : ""}>
          {mine.slice(0, 5).map((t) => (
            <div key={t.id} className="data-card">
              <div className="data-card-header">
                <h4 className="data-card-title">{t.title}</h4>
                <Pill status={t.status} />
              </div>
              <div className="data-card-body">
                <div className="data-row"><span className="data-label">Date</span><span className="data-value">{t.date}</span></div>
              </div>
            </div>
          ))}
          {mine.length === 0 && <div className="empty">No tasks yet.</div>}
        </div>
      </div>
    </>
  );
}

function TasksSection() {
  const { currentUser, tasks, setState } = useStore();
  const mine = tasks.filter((t) => t.assignedTo === currentUser!.id);
  const [proofTask, setProofTask] = useState<Task | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofType, setProofType] = useState<"text" | "photo">("text");
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const update = (id: string, status: "In Progress" | "Completed") => {
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => t.id === id ? { ...t, status } : t) }));
  };

  const saveProof = () => {
    if (proofTask) {
      if (proofType === "text" && !proofNote.trim()) {
        alert("Please enter proof details or notes.");
        return;
      }
      if (proofType === "photo" && !proofUrl) {
        alert("Please upload a photo as proof.");
        return;
      }

      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === proofTask.id
            ? {
              ...t,
              proofNote: proofType === "text" ? proofNote.trim() : undefined,
              proofUrl: proofType === "photo" ? proofUrl : undefined
            }
            : t
        )
      }));
      setProofTask(null);
      setProofNote("");
      setProofUrl("");
      setProofType("text");
    }
  };

  const [filterStatus, setFilterStatus] = useState<"All" | "Completed" | "In Progress" | "Pending">("All");

  const total = mine.length;
  const completed = mine.filter((t) => t.status === "Completed").length;
  const inProgress = mine.filter((t) => t.status === "In Progress").length;
  const pending = mine.filter((t) => t.status === "Pending").length;

  const displayTasks = filterStatus === "All" ? mine : mine.filter((t) => t.status === filterStatus);

  return (
    <>
      <h2 className="page-title">Assigned Tasks</h2>
      <p className="page-sub">Pick up tasks and mark them complete when done.</p>

      {/* Task summary cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard icon="📝" label="Total" value={total} onClick={() => setFilterStatus("All")} />
        <StatCard icon="✅" label="Completed" value={completed} onClick={() => setFilterStatus("Completed")} />
        <StatCard icon="⚙" label="In Progress" value={inProgress} onClick={() => setFilterStatus("In Progress")} />
        <StatCard icon="⏳" label="Pending" value={pending} onClick={() => setFilterStatus("Pending")} />
      </div>

      <div className="panel">
        {filterStatus !== "All" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "10px 16px", background: "rgba(124, 58, 237, 0.08)", borderRadius: "12px", border: "1px solid rgba(124, 58, 237, 0.2)" }}>
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#6D28D9" }}>
              🔍 Showing: <strong>{filterStatus} Tasks</strong> ({displayTasks.length})
            </span>
            <button
              onClick={() => setFilterStatus("All")}
              style={{ background: "#7C3AED", color: "#FFF", border: "none", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
            >
              Show All
            </button>
          </div>
        )}
        <div className={displayTasks.length > 0 ? "card-grid" : ""}>
          {displayTasks.map((t) => (
            <div key={t.id} className="data-card">
              <div className="data-card-header">
                <h4 className="data-card-title">{t.title}</h4>
                <Pill status={t.status} />
              </div>
              <div className="data-card-body">
                <div className="data-row"><span className="data-label">Date</span><span className="data-value">{t.date}</span></div>
                {(t.proofNote || t.proofUrl) && (
                  <div style={{ marginTop: 12, background: "var(--biscuit-light)", padding: "10px", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--brown-dark)", marginBottom: "6px" }}>📎 Task Proof Attached:</div>
                    {t.proofNote && <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", wordBreak: "break-all" }}>{t.proofNote}</div>}
                    {t.proofUrl && (
                      <div style={{ marginTop: "6px" }}>
                        <div onClick={() => setViewingImage(t.proofUrl || null)} style={{ cursor: "pointer", display: "inline-block" }} title="Click to view full image">
                          <img src={t.proofUrl} alt="Proof" style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4, border: "1px solid var(--border)" }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="data-card-footer" style={{ justifyContent: "flex-end" }}>
                <div className="actions-row">
                  <button className="btn btn-ghost btn-sm" onClick={() => { setProofTask(t); setProofNote(t.proofNote || ""); setProofUrl(t.proofUrl || ""); setProofType(t.proofUrl ? "photo" : "text"); }}>Proof</button>
                  {t.status === "Pending" && <button className="btn btn-ghost btn-sm" onClick={() => update(t.id, "In Progress")}>Start</button>}
                  {t.status !== "Completed" && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => {
                        if (!t.proofNote && !t.proofUrl) {
                          alert("Please submit proof first before marking this task as completed.");
                          setProofTask(t);
                          setProofNote(t.proofNote || "");
                          setProofUrl(t.proofUrl || "");
                          setProofType(t.proofUrl ? "photo" : "text");
                        } else {
                          update(t.id, "Completed");
                        }
                      }}
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {mine.length === 0 && <div className="empty">No tasks assigned.</div>}
        </div>
      </div>

      {proofTask && (
        <Modal title="Submit Task Proof" onClose={() => setProofTask(null)}>
          <div className="form-group">
            <label className="form-label">Proof Type</label>
            <select className="form-input" value={proofType} onChange={(e) => setProofType(e.target.value as any)}>
              <option value="text">Text Note</option>
              <option value="photo">Upload Photo</option>
            </select>
          </div>

          {proofType === "text" ? (
            <div className="form-group">
              <label className="form-label">Proof Information / Note</label>
              <textarea
                className="form-input"
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                placeholder="Enter details or proof link here..."
                rows={4}
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => setProofUrl(event.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {proofUrl && <img src={proofUrl} alt="Proof" style={{ width: "100%", maxHeight: 200, objectFit: "contain", marginTop: 10, borderRadius: 8 }} />}
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setProofTask(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveProof}>Save Proof</button>
          </div>
        </Modal>
      )}
      {viewingImage && (
        <Modal title="Task Proof" onClose={() => setViewingImage(null)}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "10px" }}>
            <img src={viewingImage} alt="Full Proof" style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px" }} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setViewingImage(null)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function CustomerComm() {
  const { customers, products, setState } = useStore();
  const [inquiry, setInquiry] = useState<Customer | null>(null);

  const setStatus = (id: string, status: string) => {
    setState((s) => ({ ...s, customers: s.customers.map((c) => c.id === id ? { ...c, status } : c) }));
  };

  return (
    <>
      <h2 className="page-title">Customer Communication</h2>
      <p className="page-sub">Update customer status and handle product inquiries.</p>
      <div className="panel">
        <div className={customers.length > 0 ? "card-grid" : ""}>
          {customers.map((c) => (
            <div key={c.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <h4 className="data-card-title">{c.name}</h4>
                  <span className="data-card-subtitle">{c.phone}</span>
                </div>
                <div><Pill status={c.status} /></div>
              </div>
              <div className="data-card-footer" style={{ justifyContent: "flex-end" }}>
                <div className="actions-row">
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatus(c.id, "Contacted")}>Contacted</button>
                  <button className="btn btn-success btn-sm" onClick={() => setStatus(c.id, "Active")}>Active</button>
                  <button className="btn btn-primary btn-sm" onClick={() => setInquiry(c)}>Inquiry</button>
                </div>
              </div>
            </div>
          ))}
          {customers.length === 0 && <div className="empty">No customers available.</div>}
        </div>
      </div>

      {inquiry && (
        <Modal title={`Product Inquiry — ${inquiry.name}`} onClose={() => setInquiry(null)}>
          <p style={{ fontSize: 13, color: "var(--brown)" }}>Available products to discuss with the customer:</p>
          <ul className="notif-list">
            {products.filter((p) => p.status === "Active").map((p) => (
              <li key={p.id}><b>{p.name}</b>{p.brand ? ` (${p.brand})` : ""} — ₹{p.price} · Stock: {p.qty ?? p.stock}</li>
            ))}
          </ul>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => setInquiry(null)}>Done</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function OrderUpdates() {
  const { orders, products, currentUser, setState, uid } = useStore();
  const [activeDoc, setActiveDoc] = useState<{ order: Order; type: "Bill" | "Order Copy" } | null>(null);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const handleDeleteOrder = (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      setState((s) => ({
        ...s,
        orders: s.orders.filter((o) => o.id !== id)
      }));
    }
  };

  const isMyOrderMatch = (o: Order) => {
    return (
      o.assignedTo === currentUser?.id ||
      o.assignedTo === currentUser?.name ||
      (o.assignedToName && o.assignedToName.toLowerCase() === currentUser?.name?.toLowerCase()) ||
      (o.createdBy && o.createdBy.toLowerCase() === currentUser?.name?.toLowerCase())
    );
  };

  const isMyOrder = (o: Order) => {
    if (!o.sentToEmployee) return false;
    if (o.status !== "Approved" && o.status !== "Delivered") return false;
    return isMyOrderMatch(o);
  };

  const myPendingOrders = orders.filter((o) => o.status === "Pending" && isMyOrderMatch(o));
  const myOrders = orders.filter(isMyOrder);
  const otherOrders = orders.filter((o) => o.sentToEmployee && (o.status === "Approved" || o.status === "Delivered") && !isMyOrder(o));

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h2 className="page-title">Order Updates</h2>
          <p className="page-sub">Live order statuses and pending approvals from Super Admin.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddOrder(true)}
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
            fontWeight: 800,
            borderRadius: "20px",
            padding: "8px 18px",
            fontSize: "13px",
            border: "none",
            color: "#FFFFFF",
            cursor: "pointer",
            boxShadow: "0 3px 12px rgba(124, 58, 237, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          🛒 + Create / Sell Order
        </button>
      </div>

      {/* My Pending Orders (Awaiting Approval) */}
      {myPendingOrders.length > 0 && (
        <div className="panel" style={{ marginBottom: 24, borderLeft: "4px solid #F59E0B" }}>
          <div className="panel-head">
            <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              ⏳ My Pending Orders (Awaiting Admin Approval)
              <span className="pill" style={{ background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE047" }}>{myPendingOrders.length}</span>
            </h3>
          </div>
          <div className="card-grid">
            {myPendingOrders.map((o) => {
              const product = products.find(p => p.id === o.productId || p.name.toLowerCase() === o.productName.toLowerCase());
              const brandStr = product?.brand ? ` (${product.brand})` : "";
              const isIncentiveOrder = product && (product.incentive ?? 0) > 0;
              const orderBasePrice = Math.round(o.total / (1 - ((o.discount || 0) / 100)));
              const orderUnitPrice = Math.round(orderBasePrice / o.qty);

              return (
                <div key={o.id} className="data-card" style={{ borderLeft: "4px solid #F59E0B", background: "#FFFBEB" }}>
                  <div className="data-card-header">
                    <div>
                      <h4 className="data-card-title">Order #{o.id}</h4>
                      <span className="data-card-subtitle" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                        <span>{o.customerName}</span>
                        {isIncentiveOrder ? (
                          <span className="pill" style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde047", fontSize: "10px", padding: "2px 6px" }}>
                            ✨ Incentive
                          </span>
                        ) : (
                          <span className="pill" style={{ background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb", fontSize: "10px", padding: "2px 6px" }}>
                            Regular
                          </span>
                        )}
                        {o.docType && (
                          <span className="pill" style={{
                            background: o.docType === "Bill" ? "#e0f2fe" : "#f3e8ff",
                            color: o.docType === "Bill" ? "#0369a1" : "#6D28D9",
                            border: o.docType === "Bill" ? "1px solid #bae6fd" : "1px solid #e9d5ff",
                            fontSize: "10px",
                            padding: "2px 6px",
                            fontWeight: 600
                          }}>
                            {o.docType === "Bill" ? "🧾 Bill" : "📄 Order Copy"}
                          </span>
                        )}
                      </span>
                    </div>
                    <div><Pill status="Pending" /></div>
                  </div>

                  <div className="data-card-body">
                    <div className="data-row"><span className="data-label">Product</span><span className="data-value">{o.productName}{brandStr} (x{o.qty})</span></div>
                    <div className="data-row"><span className="data-label">Unit Price</span><span className="data-value">₹{orderUnitPrice.toLocaleString()}</span></div>
                    <div className="data-row"><span className="data-label">Total</span><span className="data-value" style={{ fontWeight: 700 }}>₹{o.total.toLocaleString()}</span></div>
                    <div className="data-row"><span className="data-label">Status</span><span className="data-value" style={{ color: "#D97706", fontWeight: 700 }}>⏳ Submitted for Approval</span></div>
                  </div>

                  <div className="data-card-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #FDE68A" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, cursor: "pointer", color: "#475569" }}
                        onClick={() => setActiveDoc({ order: o, type: "Bill" })}
                      >
                        🧾 Bill
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, cursor: "pointer", color: "#475569" }}
                        onClick={() => setActiveDoc({ order: o, type: "Order Copy" })}
                      >
                        📄 Order Copy
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button className="btn btn-circle" onClick={() => setEditingOrder(o)} title="Edit Order">✏️</button>
                      <button className="btn btn-circle btn-circle-danger" onClick={() => handleDeleteOrder(o.id)} title="Delete Order">🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Assigned Orders */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-head">
          <h3 className="panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            🎯 My Assigned Orders
            <span className="pill pill-approved">{myOrders.length}</span>
          </h3>
        </div>
        <div className={myOrders.length > 0 ? "card-grid" : ""}>
          {myOrders.map((o) => {
            const product = products.find(p => p.id === o.productId || p.name.toLowerCase() === o.productName.toLowerCase());
            const brandStr = product?.brand ? ` (${product.brand})` : "";
            const isIncentiveOrder = product && (product.incentive ?? 0) > 0;
            const orderBasePrice = Math.round(o.total / (1 - ((o.discount || 0) / 100)));
            const orderUnitPrice = Math.round(orderBasePrice / o.qty);

            return (
              <div key={o.id} className="data-card" style={{ borderLeft: "4px solid var(--accent)" }}>
                <div className="data-card-header">
                  <div>
                    <h4 className="data-card-title">Order #{o.id}</h4>
                    <span className="data-card-subtitle" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                      <span>{o.customerName}</span>
                      {isIncentiveOrder ? (
                        <span className="pill" style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde047", fontSize: "10px", padding: "2px 6px" }}>
                          ✨ Incentive
                        </span>
                      ) : (
                        <span className="pill" style={{ background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb", fontSize: "10px", padding: "2px 6px" }}>
                          Regular
                        </span>
                      )}
                      {o.docType && (
                        <span className="pill" style={{
                          background: o.docType === "Bill" ? "#e0f2fe" : "#f3e8ff",
                          color: o.docType === "Bill" ? "#0369a1" : "#6D28D9",
                          border: o.docType === "Bill" ? "1px solid #bae6fd" : "1px solid #e9d5ff",
                          fontSize: "10px",
                          padding: "2px 6px",
                          fontWeight: 600
                        }}>
                          {o.docType === "Bill" ? "🧾 Bill" : "📄 Order Copy"}
                        </span>
                      )}
                    </span>
                  </div>
                  <div><Pill status={o.status} /></div>
                </div>

                <div className="data-card-body">
                  <div className="data-row"><span className="data-label">Product</span><span className="data-value">{o.productName}{brandStr} (x{o.qty})</span></div>
                  <div className="data-row"><span className="data-label">Unit Price</span><span className="data-value">₹{orderUnitPrice.toLocaleString()}</span></div>
                  <div className="data-row"><span className="data-label">Total</span><span className="data-value" style={{ fontWeight: 700 }}>₹{(o.total || 0).toLocaleString()}</span></div>
                </div>

                <div className="data-card-footer" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, padding: "7px 12px", fontSize: 12, fontWeight: 700, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => setActiveDoc({ order: o, type: "Bill" })}
                    >
                      🧾 Bill
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, padding: "7px 12px", fontSize: 12, fontWeight: 700, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => setActiveDoc({ order: o, type: "Order Copy" })}
                    >
                      📄 Order Copy
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
                    <div>
                      {o.status === "Approved" ? (
                        <button
                          className="btn btn-success btn-sm"
                          style={{ padding: "6px 14px", fontSize: 11, borderRadius: 20, background: "linear-gradient(135deg, #06B6D4 0%, #0D9488 100%)", color: "#FFFFFF", border: "none", cursor: "pointer", fontWeight: 800, boxShadow: "0 3px 10px rgba(13, 148, 136, 0.25)" }}
                          onClick={() => {
                            if (confirm("Mark this order as delivered?")) {
                              setState((s) => ({
                                ...s,
                                orders: s.orders.map((order) => order.id === o.id ? { ...order, status: "Delivered" } : order)
                              }));
                            }
                          }}
                        >
                          🚚 Mark Delivered
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700, background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "4px 12px", borderRadius: 20 }}>Completed</span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button className="btn btn-circle" onClick={() => setEditingOrder(o)} title="Edit Order">✏️</button>
                      <button className="btn btn-circle btn-circle-danger" onClick={() => handleDeleteOrder(o.id)} title="Delete Order">🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {myOrders.length === 0 && <div className="empty">No orders currently assigned to you.</div>}
        </div>
      </div>

      {/* All Other Orders */}
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">All Other Orders</h3>
        </div>
        <div className={otherOrders.length > 0 ? "card-grid" : ""}>
          {otherOrders.map((o) => {
            const product = products.find(p => p.id === o.productId || p.name.toLowerCase() === o.productName.toLowerCase());
            const brandStr = product?.brand ? ` (${product.brand})` : "";
            const isIncentiveOrder = product && (product.incentive ?? 0) > 0;
            const orderBasePrice = Math.round(o.total / (1 - ((o.discount || 0) / 100)));
            const orderUnitPrice = Math.round(orderBasePrice / o.qty);

            return (
              <div key={o.id} className="data-card">
                <div className="data-card-header">
                  <div>
                    <h4 className="data-card-title">Order #{o.id}</h4>
                    <span className="data-card-subtitle" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                      <span>{o.customerName}</span>
                      {isIncentiveOrder ? (
                        <span className="pill" style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde047", fontSize: "10px", padding: "2px 6px" }}>
                          ✨ Incentive
                        </span>
                      ) : (
                        <span className="pill" style={{ background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb", fontSize: "10px", padding: "2px 6px" }}>
                          Regular
                        </span>
                      )}
                      {o.docType && (
                        <span className="pill" style={{
                          background: o.docType === "Bill" ? "#e0f2fe" : "#f3e8ff",
                          color: o.docType === "Bill" ? "#0369a1" : "#6D28D9",
                          border: o.docType === "Bill" ? "1px solid #bae6fd" : "1px solid #e9d5ff",
                          fontSize: "10px",
                          padding: "2px 6px",
                          fontWeight: 600
                        }}>
                          {o.docType === "Bill" ? "🧾 Bill" : "📄 Order Copy"}
                        </span>
                      )}
                    </span>
                  </div>
                  <div><Pill status={o.status} /></div>
                </div>

                <div className="data-card-body">
                  <div className="data-row"><span className="data-label">Product</span><span className="data-value">{o.productName}{brandStr} (x{o.qty})</span></div>
                  <div className="data-row"><span className="data-label">Unit Price</span><span className="data-value">₹{orderUnitPrice.toLocaleString()}</span></div>
                  <div className="data-row"><span className="data-label">Total</span><span className="data-value" style={{ fontWeight: 700 }}>₹{(o.total || 0).toLocaleString()}</span></div>
                </div>

                <div className="data-card-footer" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, padding: "7px 12px", fontSize: 12, fontWeight: 700, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => setActiveDoc({ order: o, type: "Bill" })}
                    >
                      🧾 Bill
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, padding: "7px 12px", fontSize: 12, fontWeight: 700, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => setActiveDoc({ order: o, type: "Order Copy" })}
                    >
                      📄 Order Copy
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", width: "100%" }}>
                    <div>
                      {o.status === "Approved" ? (
                        <button
                          className="btn btn-success btn-sm"
                          style={{ padding: "6px 14px", fontSize: 11, borderRadius: 20, background: "linear-gradient(135deg, #06B6D4 0%, #0D9488 100%)", color: "#FFFFFF", border: "none", cursor: "pointer", fontWeight: 800, boxShadow: "0 3px 10px rgba(13, 148, 136, 0.25)" }}
                          onClick={() => {
                            if (confirm("Mark this order as delivered?")) {
                              setState((s) => ({
                                ...s,
                                orders: s.orders.map((order) => order.id === o.id ? { ...order, status: "Delivered" } : order)
                              }));
                            }
                          }}
                        >
                          🚚 Mark Delivered
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700, background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "4px 12px", borderRadius: 20 }}>Completed</span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button className="btn btn-circle" onClick={() => setEditingOrder(o)} title="Edit Order">✏️</button>
                      <button className="btn btn-circle btn-circle-danger" onClick={() => handleDeleteOrder(o.id)} title="Delete Order">🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {otherOrders.length === 0 && <div className="empty">No other orders.</div>}
        </div>
      </div>

      {(showAddOrder || editingOrder !== null) && (
        <EmployeeCreateOrderModal
          initial={editingOrder || undefined}
          onClose={() => {
            setShowAddOrder(false);
            setEditingOrder(null);
          }}
        />
      )}

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

function ProductsSection() {
  const { products, setState, uid, currentUser, users, orders } = useStore();
  const navigate = useNavigate();
  const [categoryFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);

  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number | "">("");
  const [sellQty, setSellQty] = useState<number>(1);
  const [docType, setDocType] = useState<"Bill" | "Order Copy">("Bill");
  const [bookingExpiryDate, setBookingExpiryDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  const [sellError, setSellError] = useState("");
  const [sellSuccess, setSellSuccess] = useState("");

  const unitPrice = useMemo(() => {
    if (!sellingProduct) return 0;
    return sellingProduct.price;
  }, [sellingProduct]);

  const myApprovedOrders = useMemo(() => {
    return orders.filter(o => o.assignedTo === currentUser?.id && (o.status === "Approved" || o.status === "Delivered"));
  }, [orders, currentUser]);

  const productsSold = myApprovedOrders.reduce((acc, o) => acc + o.qty, 0);
  const totalIncentive = myApprovedOrders.reduce((acc, o) => {
    const p = products.find(prod => prod.id === o.productId || prod.name.toLowerCase() === o.productName.toLowerCase());
    return acc + (p?.incentive ? p.incentive * o.qty : 0);
  }, 0);

  const goTo = (tab: string) => navigate({ to: "/employee", search: { tab } });

  const handleSell = () => {
    setSellError("");
    setSellSuccess("");
    if (!sellingProduct) return;
    const qty = sellingProduct.qty ?? sellingProduct.stock ?? 0;
    if (qty <= 0) {
      setSellError("Out of stock!");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setSellError("Please fill in customer name and phone number.");
      return;
    }

    const orderId = uid("o");
    const today = new Date().toISOString().slice(0, 10);

    setState((s: any) => {
      let customerId = s.customers.find((c: any) => c.phone.trim() === customerPhone.trim())?.id;
      let nextCustomers = s.customers;
      if (!customerId) {
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

      const discountPct = Number(discountAmount) || 0;
      const baseTotal = unitPrice * sellQty;
      const discountValue = Math.round((discountPct / 100) * baseTotal);
      const finalTotal = Math.max(0, baseTotal - discountValue);

      const newOrder = {
        id: orderId,
        customerId,
        customerName: customerName.trim(),
        productId: sellingProduct.id,
        productName: sellingProduct.name,
        qty: sellQty,
        total: finalTotal,
        discount: discountPct,
        createdBy: currentUser?.name || "employee",
        status: "Pending" as const,
        date: today,
        assignedTo: currentUser?.id,
        assignedToName: currentUser?.name,
        sentToEmployee: true,
        docType,
        bookingExpiryDate: docType === "Order Copy" ? bookingExpiryDate : undefined
      };

      const notifId = uid("n");
      const docLabel = docType === "Bill" ? "Bill" : "Order Copy";
      const expiryStr = docType === "Order Copy" && bookingExpiryDate ? ` (Valid Until: ${bookingExpiryDate})` : "";
      const notifMsg = `New ${docLabel} order pending for ${customerName.trim()} (Order #${orderId})${expiryStr}`;

      return {
        ...s,
        customers: nextCustomers,
        orders: [...s.orders, newOrder],
        notifications: [
          {
            id: notifId,
            to: "superadmin",
            from: currentUser?.name || "Employee",
            message: notifMsg,
            date: today,
            read: false
          },
          ...s.notifications
        ]
      };
    });

    setSellSuccess(`Sale request #${orderId} submitted for Admin approval successfully!`);
    setTimeout(() => {
      setSellingProduct(null);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setDiscountAmount("");
      setSellQty(1);
      setDocType("Bill");
      setSellSuccess("");
      setSellError("");
    }, 1200);
  };

  // Filter products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryFilter === "All" || p.category === categoryFilter;
      return matchCat;
    });
  }, [products, categoryFilter]);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h2 className="page-title">Products</h2>
        <p className="page-sub">View active and available products.</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="🛍️" label="Products Sold" value={productsSold} onClick={() => goTo("orders")} />
        <StatCard icon="💰" label="Incentive Earned" value={`₹${totalIncentive.toLocaleString()}`} onClick={() => goTo("incentive")} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">Catalog ({filteredProducts.length})</h3>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "9999px",
              padding: "8px 20px",
              fontWeight: 700,
              fontSize: "13px",
              boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(236, 72, 153, 0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(139, 92, 246, 0.35)";
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Product</span>
          </button>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Brand</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell-flex">
                      <img
                        src={getAutoProductImage(p.name, p.brand, p.category, p.image)}
                        className="product-image-cell"
                        alt={p.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getAutoProductImage(p.name, p.brand, p.category);
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "var(--brown)", marginTop: 2 }}>
                          {p.sku && <span>SKU: {p.sku}</span>}
                          {p.warranty && <span>{p.sku && " · "}Size: {p.warranty}</span>}
                          {p.model && <span> · Model: {p.model}</span>}
                          {p.assignedEmployeeId && (p.assignedEmployeeId === "all" || p.assignedEmployeeId === currentUser?.id) && (
                            <>
                              <span> · </span>
                              <span style={{ color: "var(--success)", fontWeight: 600 }}>
                                👤 Assigned: {p.assignedEmployeeId === "all" ? "All Employees" : "Me"}
                              </span>
                            </>
                          )}
                          {p.incentive > 0 && (p.assignedEmployeeId === "all" || p.assignedEmployeeId === currentUser?.id) && (
                            <>
                              <span> · </span>
                              <span style={{ color: "#d97706", fontWeight: 700, background: "#fef3c7", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" }}>
                                💰 Incentive: {p.price > 0 ? parseFloat(((p.incentive / p.price) * 100).toFixed(1)) : 0}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>₹{(p.price || 0).toLocaleString()}</td>
                  <td>{p.qty ?? p.stock}</td>
                  <td><Pill status={p.status} /></td>
                  <td><span style={{ fontWeight: 600, color: "var(--brown-dark)" }}>{p.brand || "—"}</span></td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedProductForOrder(p)}
                      style={{
                        background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
                        fontWeight: 800,
                        borderRadius: "20px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        border: "none",
                        color: "#FFFFFF",
                        cursor: "pointer",
                        boxShadow: "0 3px 10px rgba(124, 58, 237, 0.25)",
                        whiteSpace: "nowrap"
                      }}
                    >
                      🛒 Add to Sell
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">No products available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <ProductForm title="Add Product" onClose={() => setShowAdd(false)} onSave={(d) => { const nextId = uid("p"); setState((s) => ({ ...s, products: [...s.products, { id: nextId, ...d }] })); setShowAdd(false); }} />}

      {selectedProductForOrder && (
        <EmployeeCreateOrderModal
          selectedProductId={selectedProductForOrder.id}
          onClose={() => setSelectedProductForOrder(null)}
        />
      )}

      {sellingProduct && (
        <Modal title={`🏷️ Sell Product`} onClose={() => setSellingProduct(null)} className="sell-modal">
          <style>{`
            .sell-modal {
              max-width: 540px !important;
              padding: 24px 28px !important;
              border-radius: 24px !important;
              box-shadow: 0 24px 60px rgba(124, 58, 237, 0.18) !important;
              border: 1px solid #EDE4FF !important;
            }
            .sell-modal .modal-head {
              margin-bottom: 18px !important;
              padding-bottom: 12px !important;
              border-bottom: 1.5px solid #EDE4FF !important;
            }
            .sell-modal .modal-title {
              font-size: 20px !important;
              font-weight: 800 !important;
              color: #1E293B !important;
              letter-spacing: -0.3px !important;
            }
          `}</style>
          {sellError && (
            <div style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>
              ⚠️ {sellError}
            </div>
          )}
          {sellSuccess && (
            <div style={{ background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>
              ✅ {sellSuccess}
            </div>
          )}
          <div style={{
            background: "linear-gradient(135deg, #F8FAFC 0%, #F3EEFF 100%)",
            padding: "14px 18px",
            borderRadius: "16px",
            border: "1.5px solid #EDE4FF",
            marginBottom: "18px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1E293B" }}>{sellingProduct.name}</h4>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#D97706", background: "#FEF3C7", border: "1px solid #FDE047", padding: "3px 10px", borderRadius: "20px" }}>
                💰 Incentive: {sellingProduct.price > 0 ? Math.round((sellingProduct.incentive / sellingProduct.price) * 100) : 0}%
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "12px", color: "#64748B" }}>
              <span>Brand: <strong style={{ color: "#1E293B" }}>{sellingProduct.brand || "—"}</strong> · SKU: <code style={{ color: "#7C3AED", background: "#F5F3FF", padding: "2px 6px", borderRadius: "6px" }}>{sellingProduct.sku}</code></span>
              <span style={{ fontWeight: 800, color: "#1E293B", fontSize: "13px" }}>Price (1 Unit): ₹{unitPrice.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#7C3AED", letterSpacing: "1.2px" }}>
              Customer Name *
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "42px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, borderRadius: "14px", border: "1.5px solid #EDE4FF", background: "#F8FAFC", color: "#1E293B", width: "100%", boxSizing: "border-box" }}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#7C3AED", letterSpacing: "1.2px" }}>
              Phone Number *
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "42px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, borderRadius: "14px", border: "1.5px solid #EDE4FF", background: "#F8FAFC", color: "#1E293B", width: "100%", boxSizing: "border-box" }}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#7C3AED", letterSpacing: "1.2px" }}>
              Address
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "42px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, borderRadius: "14px", border: "1.5px solid #EDE4FF", background: "#F8FAFC", color: "#1E293B", width: "100%", boxSizing: "border-box" }}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Enter address (optional)"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#7C3AED", letterSpacing: "1.2px" }}>
              Document Type *
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <label onClick={() => setDocType("Bill")} style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "30px",
                border: docType === "Bill" ? "none" : "1px solid #CBD5E1",
                background: docType === "Bill" ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px",
                color: docType === "Bill" ? "#FFFFFF" : "#475569",
                boxShadow: docType === "Bill" ? "0 4px 14px rgba(124, 58, 237, 0.35)" : "none",
                transition: "all 0.2s ease"
              }}>
                <input
                  type="radio"
                  name="docTypeSelectProd"
                  value="Bill"
                  checked={docType === "Bill"}
                  onChange={() => setDocType("Bill")}
                  style={{ display: "none" }}
                />
                🧾 Bill
              </label>
              <label onClick={() => setDocType("Order Copy")} style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "30px",
                border: docType === "Order Copy" ? "none" : "1px solid #CBD5E1",
                background: docType === "Order Copy" ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px",
                color: docType === "Order Copy" ? "#FFFFFF" : "#475569",
                boxShadow: docType === "Order Copy" ? "0 4px 14px rgba(124, 58, 237, 0.35)" : "none",
                transition: "all 0.2s ease"
              }}>
                <input
                  type="radio"
                  name="docTypeSelectProd"
                  value="Order Copy"
                  checked={docType === "Order Copy"}
                  onChange={() => setDocType("Order Copy")}
                  style={{ display: "none" }}
                />
                📄 Order Copy
              </label>
            </div>
          </div>

          {docType === "Order Copy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px", background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", padding: "16px", borderRadius: "16px", border: "1.5px solid #DDD6FE" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#6D28D9", letterSpacing: "1px" }}>
                  ⏳ Booking Expiry Date *
                </label>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#7C3AED", background: "rgba(124, 58, 237, 0.1)", padding: "4px 10px", borderRadius: "8px" }}>
                  📅 {bookingExpiryDate ? new Date(bookingExpiryDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Select Date"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "2px 0" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#6D28D9", alignSelf: "center", letterSpacing: "0.5px" }}>Quick Set:</span>
                {[
                  { label: "+7 Days", days: 7 },
                  { label: "+15 Days", days: 15 },
                  { label: "+30 Days", days: 30 },
                  { label: "+60 Days", days: 60 },
                ].map((preset) => {
                  const targetDate = new Date();
                  targetDate.setDate(targetDate.getDate() + preset.days);
                  const iso = targetDate.toISOString().slice(0, 10);
                  const isSelected = bookingExpiryDate === iso;

                  return (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setBookingExpiryDate(iso)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "10px",
                        border: isSelected ? "none" : "1px solid #C4B5FD",
                        background: isSelected ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
                        color: isSelected ? "#FFFFFF" : "#6D28D9",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: isSelected ? "0 3px 8px rgba(124, 58, 237, 0.3)" : "none"
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <input
                type="date"
                className="form-input"
                style={{ height: "42px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, borderRadius: "14px", border: "1.5px solid #C4B5FD", width: "100%", boxSizing: "border-box", background: "#FFFFFF", color: "#1E293B" }}
                value={bookingExpiryDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setBookingExpiryDate(e.target.value)}
              />

              <span style={{ fontSize: "11px", color: "#7C3AED", fontWeight: 500 }}>
                💡 If booking is not fulfilled by this date, an expiration alert will be sent to Admin.
              </span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#7C3AED", letterSpacing: "1.2px" }}>
              Quantity
            </label>
            <input
              type="number"
              className="form-input"
              style={{ height: "42px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, borderRadius: "14px", border: "1.5px solid #EDE4FF", background: "#F8FAFC", color: "#1E293B", width: "100%", boxSizing: "border-box" }}
              value={sellQty}
              onChange={(e) => setSellQty(Math.max(1, Number(e.target.value)))}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              min={1}
            />
          </div>

          <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)", borderRadius: "16px", border: "1.5px solid #DDD6FE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#6D28D9" }}>Final Total:</span>
            <span style={{ fontSize: "20px", fontWeight: 900, color: "#2E1065" }}>₹{(unitPrice * sellQty).toLocaleString()}</span>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
            <button
              className="btn btn-ghost"
              onClick={() => setSellingProduct(null)}
              style={{ padding: "10px 22px", fontSize: "13.5px", fontWeight: 800, borderRadius: "30px", background: "#FFFFFF", border: "1px solid #CBD5E1", color: "#64748B", height: "42px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSell}
              disabled={!customerName.trim() || !customerPhone.trim()}
              style={{
                padding: "10px 26px",
                fontSize: "13.5px",
                fontWeight: 800,
                borderRadius: "30px",
                background: (!customerName.trim() || !customerPhone.trim()) ? "#CBD5E1" : "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
                border: "none",
                color: "#FFFFFF",
                cursor: (!customerName.trim() || !customerPhone.trim()) ? "not-allowed" : "pointer",
                boxShadow: (!customerName.trim() || !customerPhone.trim()) ? "none" : "0 6px 18px rgba(124, 58, 237, 0.35)",
                height: "42px"
              }}
            >
              Submit Sale
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function EmployeeIncentiveSection() {
  const { currentUser, products, users, setState, uid } = useStore();

  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [docType, setDocType] = useState<"Bill" | "Order Copy">("Bill");
  const [bookingExpiryDate, setBookingExpiryDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  const [incSellError, setIncSellError] = useState("");
  const [incSellSuccess, setIncSellSuccess] = useState("");

  const isEmployee = currentUser?.role === "employee";

  const incentiveProducts = products.filter(p => {
    if (isEmployee) {
      return p.incentive > 0 && (p.assignedEmployeeId === "all" || p.assignedEmployeeId === currentUser?.id);
    }
    return p.incentive > 0;
  });

  const unitPrice = useMemo(() => {
    if (!sellingProduct) return 0;
    const qty = sellingProduct.qty ?? sellingProduct.stock ?? 1;
    return qty > 0 ? Math.round(sellingProduct.price / qty) : sellingProduct.price;
  }, [sellingProduct]);

  const handleSell = () => {
    setIncSellError("");
    setIncSellSuccess("");
    if (!sellingProduct) return;
    const qty = sellingProduct.qty ?? sellingProduct.stock ?? 0;
    if (qty <= 0) {
      setIncSellError("Out of stock!");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setIncSellError("Please fill in customer name and phone number.");
      return;
    }

    const orderId = uid("o");
    const today = new Date().toISOString().slice(0, 10);

    setState((s: any) => {
      // 1. Check if customer already exists, otherwise create a new customer
      let customerId = s.customers.find((c: any) => c.phone.trim() === customerPhone.trim())?.id;
      let nextCustomers = s.customers;
      if (!customerId) {
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

      // 2. Create a new pending order assigned to this employee for Admin approval
      const newOrder = {
        id: orderId,
        customerId,
        customerName: customerName.trim(),
        productId: sellingProduct.id,
        productName: sellingProduct.name,
        qty: 1,
        total: unitPrice,
        createdBy: currentUser?.name || "employee",
        status: "Pending" as const,
        date: today,
        assignedTo: currentUser?.id,
        assignedToName: currentUser?.name,
        sentToEmployee: true,
        docType,
        bookingExpiryDate: docType === "Order Copy" ? bookingExpiryDate : undefined
      };

      const notifId = uid("n");
      const docLabel = docType === "Bill" ? "Bill" : "Order Copy";
      const expiryStr = docType === "Order Copy" && bookingExpiryDate ? ` (Valid Until: ${bookingExpiryDate})` : "";
      const notifMsg = `New ${docLabel} order pending for ${customerName.trim()} (Order #${orderId})${expiryStr}`;

      return {
        ...s,
        customers: nextCustomers,
        orders: [...s.orders, newOrder],
        notifications: [
          {
            id: notifId,
            to: "superadmin",
            from: currentUser?.name || "Employee",
            message: notifMsg,
            date: today,
            read: false
          },
          ...s.notifications
        ]
      };
    });

    setIncSellSuccess(`Sale request #${orderId} submitted for Admin approval successfully!`);
    setTimeout(() => {
      setSellingProduct(null);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setDocType("Bill");
      setIncSellSuccess("");
      setIncSellError("");
    }, 1200);
  };

  return (
    <div className="animated fadeIn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 className="page-title">Incentive Management</h2>
          <p className="page-sub">View products eligible for incentive.</p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <div className="panel-head">
          <h3 className="panel-title">💰 Incentive Products</h3>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>IMAGE</th>
                <th>PRODUCT</th>
                <th>SKU</th>
                <th>INCENTIVE</th>
                <th>LOCATION</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {incentiveProducts.map((p) => {
                const canSell = isEmployee && p.incentive > 0 && (p.assignedEmployeeId === "all" || p.assignedEmployeeId === currentUser?.id);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
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
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--brown)", marginTop: 2 }}>
                        <span>Brand: {p.brand || "—"}</span>
                        {p.warranty && <span> · Size: {p.warranty}</span>}
                        {p.model && <span> · Model: {p.model}</span>}
                      </div>
                      {p.assignedEmployeeId && (
                        <div style={{ fontSize: 11, color: "var(--brown)", marginTop: 2 }}>
                          👤 Assigned: {p.assignedEmployeeId === "all" ? "All Employees" : (users.find(u => u.id === p.assignedEmployeeId)?.name || p.assignedEmployeeId)}
                        </div>
                      )}
                    </td>
                    <td>{p.sku}</td>
                    <td>
                      <span style={{ color: "#d97706", fontWeight: 700, background: "#fef3c7", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>
                        💰 {p.price > 0 ? Math.round((p.incentive / p.price) * 100) : 0}%
                      </span>
                    </td>
                    <td><span style={{ padding: "4px 8px", background: "var(--biscuit)", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{p.location || "Unassigned"}</span></td>
                    <td>
                      {canSell ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => setSellingProduct(p)}
                          style={{ padding: "6px 12px", fontSize: "11px", fontWeight: 600 }}
                        >
                          🏷️ Sell
                        </button>
                      ) : (
                        <span style={{ color: "var(--brown)", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {incentiveProducts.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {sellingProduct && (
        <Modal title={`🏷️ Sell Product`} onClose={() => setSellingProduct(null)} className="sell-modal">
          <style>{`
            .sell-modal {
              max-width: 540px !important;
              padding: 24px 28px !important;
              border-radius: 24px !important;
              box-shadow: 0 24px 60px rgba(124, 58, 237, 0.18) !important;
              border: 1px solid #EDE4FF !important;
            }
            .sell-modal .modal-head {
              margin-bottom: 18px !important;
              padding-bottom: 12px !important;
              border-bottom: 1.5px solid #EDE4FF !important;
            }
            .sell-modal .modal-title {
              font-size: 20px !important;
              font-weight: 800 !important;
              color: #1E293B !important;
              letter-spacing: -0.3px !important;
            }
          `}</style>
          {incSellError && (
            <div style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>
              ⚠️ {incSellError}
            </div>
          )}
          {incSellSuccess && (
            <div style={{ background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>
              ✅ {incSellSuccess}
            </div>
          )}
          <div style={{
            background: "linear-gradient(135deg, #F8FAFC 0%, #F3EEFF 100%)",
            padding: "14px 18px",
            borderRadius: "16px",
            border: "1.5px solid #EDE4FF",
            marginBottom: "18px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1E293B" }}>{sellingProduct.name}</h4>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#D97706", background: "#FEF3C7", border: "1px solid #FDE047", padding: "3px 10px", borderRadius: "20px" }}>
                💰 Incentive: {sellingProduct.price > 0 ? Math.round((sellingProduct.incentive / sellingProduct.price) * 100) : 0}%
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "12px", color: "#64748B" }}>
              <span>Brand: <strong style={{ color: "#1E293B" }}>{sellingProduct.brand || "—"}</strong> · SKU: <code style={{ color: "#7C3AED", background: "#F5F3FF", padding: "2px 6px", borderRadius: "6px" }}>{sellingProduct.sku}</code></span>
              <span style={{ fontWeight: 800, color: "#1E293B", fontSize: "13px" }}>Price (1 Unit): ₹{unitPrice.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#7C3AED", letterSpacing: "1.2px" }}>
              Customer Name *
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "42px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, borderRadius: "14px", border: "1.5px solid #EDE4FF", background: "#F8FAFC", color: "#1E293B", width: "100%", boxSizing: "border-box" }}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#7C3AED", letterSpacing: "1.2px" }}>
              Phone Number *
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "42px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, borderRadius: "14px", border: "1.5px solid #EDE4FF", background: "#F8FAFC", color: "#1E293B", width: "100%", boxSizing: "border-box" }}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#7C3AED", letterSpacing: "1.2px" }}>
              Address
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "42px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, borderRadius: "14px", border: "1.5px solid #EDE4FF", background: "#F8FAFC", color: "#1E293B", width: "100%", boxSizing: "border-box" }}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Enter address (optional)"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#7C3AED", letterSpacing: "1.2px" }}>
              Document Type *
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <label onClick={() => setDocType("Bill")} style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "30px",
                border: docType === "Bill" ? "none" : "1px solid #CBD5E1",
                background: docType === "Bill" ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px",
                color: docType === "Bill" ? "#FFFFFF" : "#475569",
                boxShadow: docType === "Bill" ? "0 4px 14px rgba(124, 58, 237, 0.35)" : "none",
                transition: "all 0.2s ease"
              }}>
                <input
                  type="radio"
                  name="docTypeSelectInc"
                  value="Bill"
                  checked={docType === "Bill"}
                  onChange={() => setDocType("Bill")}
                  style={{ display: "none" }}
                />
                🧾 Bill
              </label>
              <label onClick={() => setDocType("Order Copy")} style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "30px",
                border: docType === "Order Copy" ? "none" : "1px solid #CBD5E1",
                background: docType === "Order Copy" ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px",
                color: docType === "Order Copy" ? "#FFFFFF" : "#475569",
                boxShadow: docType === "Order Copy" ? "0 4px 14px rgba(124, 58, 237, 0.35)" : "none",
                transition: "all 0.2s ease"
              }}>
                <input
                  type="radio"
                  name="docTypeSelectInc"
                  value="Order Copy"
                  checked={docType === "Order Copy"}
                  onChange={() => setDocType("Order Copy")}
                  style={{ display: "none" }}
                />
                📄 Order Copy
              </label>
            </div>
          </div>

          {docType === "Order Copy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px", background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", padding: "16px", borderRadius: "16px", border: "1.5px solid #DDD6FE" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#6D28D9", letterSpacing: "1px" }}>
                  ⏳ Booking Expiry Date *
                </label>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#7C3AED", background: "rgba(124, 58, 237, 0.1)", padding: "4px 10px", borderRadius: "8px" }}>
                  📅 {bookingExpiryDate ? new Date(bookingExpiryDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Select Date"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "2px 0" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#6D28D9", alignSelf: "center", letterSpacing: "0.5px" }}>Quick Set:</span>
                {[
                  { label: "+7 Days", days: 7 },
                  { label: "+15 Days", days: 15 },
                  { label: "+30 Days", days: 30 },
                  { label: "+60 Days", days: 60 },
                ].map((preset) => {
                  const targetDate = new Date();
                  targetDate.setDate(targetDate.getDate() + preset.days);
                  const iso = targetDate.toISOString().slice(0, 10);
                  const isSelected = bookingExpiryDate === iso;

                  return (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setBookingExpiryDate(iso)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "10px",
                        border: isSelected ? "none" : "1px solid #C4B5FD",
                        background: isSelected ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
                        color: isSelected ? "#FFFFFF" : "#6D28D9",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: isSelected ? "0 3px 8px rgba(124, 58, 237, 0.3)" : "none"
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <input
                type="date"
                className="form-input"
                style={{ height: "42px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, borderRadius: "14px", border: "1.5px solid #C4B5FD", width: "100%", boxSizing: "border-box", background: "#FFFFFF", color: "#1E293B" }}
                value={bookingExpiryDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setBookingExpiryDate(e.target.value)}
              />

              <span style={{ fontSize: "11px", color: "#7C3AED", fontWeight: 500 }}>
                💡 If booking is not fulfilled by this date, an expiration alert will be sent to Admin.
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
            <button
              className="btn btn-ghost"
              onClick={() => setSellingProduct(null)}
              style={{ padding: "10px 22px", fontSize: "13.5px", fontWeight: 800, borderRadius: "30px", background: "#FFFFFF", border: "1px solid #CBD5E1", color: "#64748B", height: "42px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSell}
              disabled={!customerName.trim() || !customerPhone.trim()}
              style={{
                padding: "10px 26px",
                fontSize: "13.5px",
                fontWeight: 800,
                borderRadius: "30px",
                background: (!customerName.trim() || !customerPhone.trim()) ? "#CBD5E1" : "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
                border: "none",
                color: "#FFFFFF",
                cursor: (!customerName.trim() || !customerPhone.trim()) ? "not-allowed" : "pointer",
                boxShadow: (!customerName.trim() || !customerPhone.trim()) ? "none" : "0 6px 18px rgba(124, 58, 237, 0.35)",
                height: "42px"
              }}
            >
              Submit Sale
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function OrderDocumentModal({
  order,
  type,
  onClose,
}: {
  order: Order;
  type: "Bill" | "Order Copy";
  onClose: () => void;
}) {
  const { products, customers, setState, currentUser, uid } = useStore();
  const [sentSuccess, setSentSuccess] = useState(false);
  const isAdmin = currentUser?.role === "superadmin";

  const product = products.find(
    (p) => p.id === order.productId || p.name.toLowerCase() === order.productName.toLowerCase()
  );
  const customer = customers.find((c) => c.id === order.customerId || c.name.toLowerCase() === order.customerName.toLowerCase());

  const isIncentiveOrder = order.isIncentive || order.customerId === "c_incentive" || order.customerName === "Incentive Sell Request";
  const isCustomerDiscount = !isIncentiveOrder && !!(order.discount && order.discount > 0);

  const orderBasePrice = isCustomerDiscount ? Math.round(order.total / (1 - ((order.discount || 0) / 100))) : order.total;
  const unitPrice = Math.round(orderBasePrice / (order.qty || 1));
  const discountVal = isCustomerDiscount ? (orderBasePrice - order.total) : 0;
  const isBill = type === "Bill";

  const handlePrint = () => {
    window.print();
  };

  const handleSendToAdmin = () => {
    const notifId = uid("n");
    const docTypeName = type === "Bill" ? "Bill / Invoice" : "Order Copy";
    const empName = currentUser?.name || "Employee";
    const msg = `${empName} sent ${docTypeName} for Order #${order.id} (${order.customerName})`;

    setState((s) => ({
      ...s,
      notifications: [
        {
          id: notifId,
          to: "superadmin",
          from: empName,
          message: msg,
          date: new Date().toISOString().slice(0, 10),
          read: false
        },
        ...s.notifications
      ]
    }));
    setSentSuccess(true);
  };

  return (
    <Modal title={isBill ? "🧾 Tax Invoice / Bill" : "📄 Order Copy"} onClose={onClose}>
      {sentSuccess && (
        <div style={{
          background: "#dcfce7",
          color: "#15803d",
          border: "1px solid #86efac",
          padding: "12px 16px",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 700,
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 2px 6px rgba(22, 163, 74, 0.1)"
        }}>
          <span style={{ fontSize: "16px" }}>✅</span>
          <span>{type === "Bill" ? "Bill / Invoice" : "Order Copy"} for Order #{order.id} sent to Admin successfully!</span>
        </div>
      )}

      <div id="printable-order-document" style={{
        padding: "16px",
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
        fontFamily: "'Inter', sans-serif",
        color: "#1e293b",
        maxWidth: "600px",
        width: "100%",
        boxSizing: "border-box",
        margin: "0 auto"
      }}>
        {/* Document Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid #334155",
          paddingBottom: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <img src="/logo.png" alt="Star Home Logo" style={{ width: "48px", height: "48px", objectFit: "contain" }} />
            <div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: "18px", fontWeight: 800 }}>STAR HOME APPLIANCES</h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Sales & Services · Home & Electrical Appliances
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "12px",
              letterSpacing: "0.5px",
              background: isBill ? "#e0f2fe" : "#f3e8ff",
              color: isBill ? "#0369a1" : "#6D28D9",
              border: isBill ? "1px solid #bae6fd" : "1px solid #e9d5ff"
            }}>
              {isBill ? "TAX INVOICE / BILL" : "ORDER COPY"}
            </span>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginTop: "6px" }}>
              #{order.id.toUpperCase()}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Date: {order.date}</div>
          </div>
        </div>

        {/* Customer & Order Details */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
          background: "#f8fafc",
          padding: "12px 16px",
          borderRadius: "8px"
        }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Customer Info</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginTop: "2px" }}>{order.customerName}</div>
            {customer?.phone && <div style={{ fontSize: "12px", color: "#334155" }}>📞 {customer.phone}</div>}
            {customer?.address && <div style={{ fontSize: "12px", color: "#334155" }}>📍 {customer.address}</div>}
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Order Info</div>
            <div style={{ fontSize: "12px", color: "#334155", marginTop: "2px" }}>
              <strong>Status:</strong> <span style={{ color: order.status === "Approved" || order.status === "Delivered" ? "#16a34a" : "#ca8a04", fontWeight: 700 }}>{order.status}</span>
            </div>
            <div style={{ fontSize: "12px", color: "#334155" }}>
              <strong>Assigned To:</strong> {order.assignedToName || order.createdBy || "—"}
            </div>
            {order.bookingExpiryDate && (
              <div style={{ fontSize: "12px", color: order.bookingExpiryDate < new Date().toISOString().slice(0, 10) ? "#dc2626" : "#6D28D9", marginTop: "4px", fontWeight: 700 }}>
                {order.bookingExpiryDate < new Date().toISOString().slice(0, 10) ? (
                  <span>⚠️ Booking Expired: {order.bookingExpiryDate}</span>
                ) : (
                  <span>⏳ Booking Valid Until: {order.bookingExpiryDate}</span>
                )}
              </div>
            )}
            {order.customerBargain && (
              <div style={{ fontSize: "12px", color: "#dc2626" }}>
                <strong>Remarks:</strong> {order.customerBargain}
              </div>
            )}
          </div>
        </div>

        {/* Items Table with horizontal overflow wrapper */}
        <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: "20px" }}>
          <table style={{ width: "100%", minWidth: "440px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <th style={{ padding: "8px 12px", fontSize: "12px", color: "#475569", borderBottom: "1px solid #cbd5e1", whiteSpace: "nowrap" }}>Item Description</th>
                <th style={{ padding: "8px 12px", fontSize: "12px", color: "#475569", borderBottom: "1px solid #cbd5e1", textAlign: "center", whiteSpace: "nowrap" }}>Qty</th>
                <th style={{ padding: "8px 12px", fontSize: "12px", color: "#475569", borderBottom: "1px solid #cbd5e1", textAlign: "right", whiteSpace: "nowrap" }}>Unit Price</th>
                <th style={{ padding: "8px 12px", fontSize: "12px", color: "#475569", borderBottom: "1px solid #cbd5e1", textAlign: "right", whiteSpace: "nowrap" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>{order.productName}</div>
                  {product?.brand && <div style={{ fontSize: "11px", color: "#64748b" }}>Brand: {product.brand}</div>}
                  {product?.sku && <div style={{ fontSize: "11px", color: "#64748b" }}>SKU: {product.sku}</div>}
                </td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center", fontWeight: 600 }}>{order.qty}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", whiteSpace: "nowrap" }}>₹{unitPrice.toLocaleString()}</td>
                <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>₹{orderBasePrice.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation Summary */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px", width: "100%" }}>
          <div style={{ width: "100%", maxWidth: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
              <span>Subtotal:</span>
              <span>₹{orderBasePrice.toLocaleString()}</span>
            </div>
            {isCustomerDiscount && discountVal > 0 ? (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#dc2626" }}>
                <span>Discount ({order.discount}%):</span>
                <span>- ₹{discountVal.toLocaleString()}</span>
              </div>
            ) : null}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "15px",
              fontWeight: 800,
              color: "#0f172a",
              borderTop: "2px dashed #cbd5e1",
              paddingTop: "8px",
              marginTop: "4px"
            }}>
              <span>Total Payable:</span>
              <span>₹{(order.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
          Thank you for your business! · Smart Home Systems
        </div>
      </div>

      {/* Modal Actions */}
      <div className="modal-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap", width: "100%" }}>
        <button className="btn btn-ghost" onClick={onClose} style={{ flex: "1 1 auto" }}>
          Close
        </button>
        <button
          className="btn btn-primary"
          onClick={handlePrint}
          style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)", border: "none", color: "#fff", flex: "1 1 auto" }}
        >
          🖨️ Print / Save PDF
        </button>
        {!isAdmin && (
          sentSuccess ? (
            <button
              className="btn btn-success"
              disabled
              style={{ background: "#16a34a", border: "none", color: "#fff", fontWeight: 700, cursor: "default", flex: "1 1 auto" }}
            >
              ✅ Sent to Admin
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSendToAdmin}
              style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", color: "#fff", fontWeight: 700, flex: "1 1 auto" }}
            >
              📤 Send to Admin
            </button>
          )
        )}
      </div>
    </Modal>
  );
}

export function EmployeeCreateOrderModal({ onClose, initial, selectedProductId }: { onClose: () => void; initial?: Order; selectedProductId?: string }) {
  const { customers, products, setState, uid, currentUser } = useStore();
  const activeProducts = products.filter(p => p.status === "Active" || p.status === "Verified");
  const initialCust = initial ? customers.find(c => c.id === initial.customerId || c.name === initial.customerName) : undefined;
  const [customerName, setCustomerName] = useState(initial?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(initialCust?.phone ?? "");
  const [customerAddress, setCustomerAddress] = useState(initialCust?.address ?? "");
  const [productId, setProductId] = useState(initial?.productId ?? selectedProductId ?? activeProducts[0]?.id ?? "");
  const [qty, setQty] = useState(initial?.qty ?? 1);
  const [discountPct, setDiscountPct] = useState<number | "">(initial?.discount ?? "");
  const [docType, setDocType] = useState<"Bill" | "Order Copy">(initial?.docType ?? "Bill");
  const [bookingExpiryDate, setBookingExpiryDate] = useState(() => initial?.bookingExpiryDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [customerBargain, setCustomerBargain] = useState(initial?.customerBargain ?? "");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [selectedSerial, setSelectedSerial] = useState(initial?.serialNumber ?? "");

  const selectedProduct = activeProducts.find(p => p.id === productId);
  const unitPrice = selectedProduct ? selectedProduct.price : 0;
  const baseTotal = unitPrice * qty;
  const discountVal = discountPct ? Math.round(((Number(discountPct) || 0) / 100) * baseTotal) : 0;
  const finalTotal = Math.max(0, baseTotal - discountVal);

  const availableSerials: string[] = useMemo(() => {
    if (!selectedProduct) return [];
    
    // 1. Check direct product property
    if (selectedProduct.serialNumbers && Array.isArray(selectedProduct.serialNumbers)) {
      const filled = selectedProduct.serialNumbers.filter(s => s && s.trim());
      if (filled.length > 0) return filled;
    }

    // Keys to search in localStorage
    const searchKeys = [
      `sham_serials_${selectedProduct.id}`,
      `sham_serials_${(selectedProduct.name || "").toLowerCase().trim()}`,
      selectedProduct.sku ? `sham_serials_${selectedProduct.sku}` : null,
    ].filter(Boolean) as string[];

    for (const key of searchKeys) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const filled = parsed.filter((s: string) => s && typeof s === "string" && s.trim());
            if (filled.length > 0) return filled;
          }
        }
      } catch (_) {}
    }
    return [];
  }, [selectedProduct]);

  const handleSubmit = () => {
    setErrorMsg("");
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg("Please fill in customer name and phone number.");
      return;
    }
    if (!selectedProduct) {
      setErrorMsg("Please select a product.");
      return;
    }

    if (initial) {
      setState((s: any) => ({
        ...s,
        orders: s.orders.map((or: Order) =>
          or.id === initial.id
            ? {
              ...or,
              customerName: customerName.trim(),
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              qty,
              total: finalTotal,
              discount: Number(discountPct) || 0,
              customerBargain: customerBargain.trim() || undefined,
              docType,
              bookingExpiryDate: docType === "Order Copy" ? bookingExpiryDate : undefined
            }
            : or
        )
      }));
      setSuccessMsg(`Order #${initial.id} updated successfully!`);
      setTimeout(() => {
        onClose();
      }, 1000);
      return;
    }

    const orderId = uid("o");
    const today = new Date().toISOString().slice(0, 10);

    setState((s: any) => {
      let customerId = s.customers.find((c: any) => c.phone.trim() === customerPhone.trim())?.id;
      let nextCustomers = s.customers;
      if (!customerId) {
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

      const docLabel = docType === "Bill" ? "Bill" : "Order Copy";
      const expiryStr = docType === "Order Copy" && bookingExpiryDate ? ` (Valid Until: ${bookingExpiryDate})` : "";
      const notifMsg = `New ${docLabel} order pending for ${customerName.trim()} (Order #${orderId})${expiryStr}`;
      const notifId = uid("n");

      const newOrder: Order = {
        id: orderId,
        customerId,
        customerName: customerName.trim(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        qty,
        total: finalTotal,
        discount: Number(discountPct) || 0,
        createdBy: currentUser?.name || "Employee",
        status: "Pending",
        date: today,
        assignedTo: currentUser?.id,
        assignedToName: currentUser?.name,
        sentToEmployee: true,
        customerBargain: customerBargain.trim() || undefined,
        docType,
        bookingExpiryDate: docType === "Order Copy" ? bookingExpiryDate : undefined
      };

      return {
        ...s,
        customers: nextCustomers,
        orders: [...s.orders, newOrder],
        notifications: [
          {
            id: notifId,
            to: "superadmin",
            from: currentUser?.name || "Employee",
            message: notifMsg,
            date: today,
            read: false
          },
          ...s.notifications
        ]
      };
    });

    setSuccessMsg(`Order #${orderId} submitted for Admin approval successfully!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  /* ── Styling Tokens (Matches ManagerPage CreateOrderModal) ── */
  const sectionLabel: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.2px",
    textTransform: "uppercase" as const,
    color: "#7C3AED",
    marginBottom: "6px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 18px",
    borderRadius: "50px",
    border: "1.5px solid #E2E8F0",
    background: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 500,
    color: "#1E293B",
    outline: "none",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    transition: "border-color .2s, box-shadow .2s",
    boxSizing: "border-box" as const
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%237C3AED' viewBox='0 0 16 16'%3E%3Cpath d='M1.5 5.5l6.5 6 6.5-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 18px center"
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 999999, padding: "16px"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: "28px",
          width: "100%", maxWidth: "520px",
          maxHeight: "calc(100vh - 32px)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 72px rgba(168, 85, 247, 0.25)",
          border: "1px solid #EDE4FF"
        }}
      >
        {/* ── Gradient Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
          padding: "18px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.22)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.4)"
            }}>{initial ? "✏️" : "🛒"}</div>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.3px" }}>
                {initial ? `Edit Order #${initial.id}` : "Add New Order"}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}>
                {initial ? "Update order details below" : "Fill the details below to create a new order"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.22)", backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "14px", color: "#fff", fontWeight: 800
          }}>✕</button>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "20px 24px 10px" }}>
          {errorMsg && (
            <div style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>
              ✅ {successMsg}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Customer Name */}
            <div>
              <div style={sectionLabel}>👤 Customer Name *</div>
              <input
                type="text"
                style={inputStyle}
                list="employee-customers-datalist"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Type customer name"
              />
              <datalist id="employee-customers-datalist">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* Phone Number */}
            <div>
              <div style={sectionLabel}>📱 Phone Number *</div>
              <input
                type="text"
                style={inputStyle}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter customer phone number"
              />
            </div>

            {/* Address */}
            <div>
              <div style={sectionLabel}>📍 Address</div>
              <input
                type="text"
                style={inputStyle}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter address (optional)"
              />
            </div>

            {/* Select Product */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ ...sectionLabel, marginBottom: 0 }}>📦 Select Product *</div>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "14px",
                    padding: "4px 12px",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    boxShadow: "0 2px 6px rgba(124, 58, 237, 0.25)"
                  }}
                >
                  📷 Scan Barcode
                </button>
              </div>
              <select style={selectStyle} value={productId} onChange={(e) => setProductId(e.target.value)}>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.brand ? `(${p.brand})` : ""}
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: "#F3EEFF", padding: "6px 16px",
                    borderRadius: "30px", fontSize: "13px", fontWeight: 800, color: "#7C3AED",
                    boxShadow: "0 2px 6px rgba(124, 58, 237, 0.12)"
                  }}>
                    💰 ₹{(selectedProduct.price || 0).toLocaleString()}
                  </div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: "#E0F2FE", padding: "6px 16px",
                    borderRadius: "30px", fontSize: "13px", fontWeight: 800, color: "#0369A1",
                    border: "1px solid #BAE6FD",
                    boxShadow: "0 2px 6px rgba(3, 105, 161, 0.12)"
                  }}>
                    📦 Stock: {selectedProduct.qty ?? selectedProduct.stock ?? 0}
                  </div>
                  {selectedSerial ? (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "#FEF3C7", padding: "6px 16px",
                      borderRadius: "30px", fontSize: "13px", fontWeight: 800, color: "#B45309",
                      border: "1px solid #FDE68A",
                      boxShadow: "0 2px 6px rgba(180, 83, 9, 0.12)"
                    }}>
                      🏷️ Barcode: {selectedSerial}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Quantity & Document Type (Side-by-Side) */}
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ width: "130px", flexShrink: 0 }}>
                <div style={sectionLabel}>🔢 Quantity *</div>
                <input
                  type="number"
                  style={{ ...inputStyle, width: "100%" }}
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <div style={{ flex: 1, minWidth: "220px" }}>
                <div style={sectionLabel}>📋 Document Type *</div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <label onClick={() => setDocType("Bill")} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "10px 14px", borderRadius: "30px", cursor: "pointer",
                    fontWeight: 700, fontSize: "13px", transition: "all .2s",
                    background: docType === "Bill" ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
                    color: docType === "Bill" ? "#fff" : "#475569",
                    border: docType === "Bill" ? "none" : "1px solid #CBD5E1",
                    boxShadow: docType === "Bill" ? "0 4px 14px rgba(124, 58, 237, 0.35)" : "none"
                  }}>
                    <input
                      type="radio"
                      name="empModalDocType"
                      value="Bill"
                      checked={docType === "Bill"}
                      onChange={() => setDocType("Bill")}
                      style={{ display: "none" }}
                    />
                    🧾 Bill
                  </label>
                  <label onClick={() => setDocType("Order Copy")} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "10px 14px", borderRadius: "30px", cursor: "pointer",
                    fontWeight: 700, fontSize: "13px", transition: "all .2s",
                    background: docType === "Order Copy" ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
                    color: docType === "Order Copy" ? "#fff" : "#475569",
                    border: docType === "Order Copy" ? "none" : "1px solid #CBD5E1",
                    boxShadow: docType === "Order Copy" ? "0 4px 14px rgba(124, 58, 237, 0.35)" : "none"
                  }}>
                    <input
                      type="radio"
                      name="empModalDocType"
                      value="Order Copy"
                      checked={docType === "Order Copy"}
                      onChange={() => setDocType("Order Copy")}
                      style={{ display: "none" }}
                    />
                    📄 Order Copy
                  </label>
                </div>
              </div>
            </div>

            {/* Booking Expiry Date */}
            {docType === "Order Copy" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", padding: "16px", borderRadius: "16px", border: "1.5px solid #DDD6FE" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#6D28D9", letterSpacing: "1px" }}>
                    ⏳ Booking Expiry Date *
                  </label>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#7C3AED", background: "rgba(124, 58, 237, 0.1)", padding: "4px 10px", borderRadius: "8px" }}>
                    📅 {bookingExpiryDate ? new Date(bookingExpiryDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Select Date"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "2px 0" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#6D28D9", alignSelf: "center", letterSpacing: "0.5px" }}>Quick Set:</span>
                  {[
                    { label: "+7 Days", days: 7 },
                    { label: "+15 Days", days: 15 },
                    { label: "+30 Days", days: 30 },
                    { label: "+60 Days", days: 60 },
                  ].map((preset) => {
                    const targetDate = new Date();
                    targetDate.setDate(targetDate.getDate() + preset.days);
                    const iso = targetDate.toISOString().slice(0, 10);
                    const isSelected = bookingExpiryDate === iso;

                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => setBookingExpiryDate(iso)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "10px",
                          border: isSelected ? "none" : "1px solid #C4B5FD",
                          background: isSelected ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#FFFFFF",
                          color: isSelected ? "#FFFFFF" : "#6D28D9",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: isSelected ? "0 3px 8px rgba(124, 58, 237, 0.3)" : "none"
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="date"
                  className="form-input"
                  style={{ height: "42px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, borderRadius: "14px", border: "1.5px solid #C4B5FD", width: "100%", boxSizing: "border-box", background: "#FFFFFF", color: "#1E293B" }}
                  value={bookingExpiryDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setBookingExpiryDate(e.target.value)}
                />

                <span style={{ fontSize: "11px", color: "#7C3AED", fontWeight: 500 }}>
                  💡 If booking is not fulfilled by this date, an expiration alert will be sent to Admin.
                </span>
              </div>
            )}

            {/* Bargaining / Remarks */}
            <div>
              <div style={sectionLabel}>✍️ Bargaining / Remarks</div>
              <input
                type="text"
                style={inputStyle}
                value={customerBargain}
                onChange={(e) => setCustomerBargain(e.target.value)}
                placeholder="E.g. Customer requested ₹500 discount"
              />
            </div>

            {/* Price Summary Breakdown Card */}
            <div style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)", padding: "14px 16px", borderRadius: "16px", border: "1px solid #DDD6FE" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
                <span>Subtotal ({qty}x):</span>
                <span>₹{baseTotal.toLocaleString()}</span>
              </div>
              {discountVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#EF4444", marginTop: "4px", fontWeight: 600 }}>
                  <span>Discount ({discountPct}%):</span>
                  <span>- ₹{discountVal.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 900, color: "#2E1065", marginTop: "8px", borderTop: "1px dashed #C4B5FD", paddingTop: "8px" }}>
                <span>Total Payable:</span>
                <span>₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Buttons ── */}
        <div style={{
          padding: "16px 24px 20px",
          borderTop: "1px solid #EDE4FF",
          display: "flex", justifyContent: "flex-end", gap: "12px",
          flexShrink: 0, background: "#FAFBFF"
        }}>
          <button type="button" onClick={onClose} style={{
            padding: "10px 22px", borderRadius: "30px",
            background: "#FFFFFF", border: "1px solid #CBD5E1",
            fontWeight: 800, fontSize: "13.5px", color: "#64748B",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
          }}>✕ Cancel</button>
          <button type="button" onClick={handleSubmit} style={{
            padding: "10px 26px", borderRadius: "30px",
            background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
            border: "none",
            fontWeight: 800, fontSize: "13.5px", color: "#fff",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            boxShadow: "0 6px 18px rgba(124, 58, 237, 0.35)",
            transition: "transform .15s, box-shadow .15s"
          }}>🚀 Submit Order for Approval</button>
        </div>

        {showScanner && (
          <BarcodeScannerModal
            itemLabel="Product Barcode / SKU"
            onClose={() => setShowScanner(false)}
            onDetected={(code) => {
              setShowScanner(false);
              const cleanCode = code.toLowerCase().trim();
              const match = activeProducts.find(
                (p) =>
                  (p.sku && p.sku.toLowerCase().trim() === cleanCode) ||
                  p.id.toLowerCase().trim() === cleanCode ||
                  p.name.toLowerCase().includes(cleanCode) ||
                  (Array.isArray(p.serialNumbers) && p.serialNumbers.some((sn: any) => sn && typeof sn === "string" && sn.toLowerCase().trim() === cleanCode)) ||
                  (() => {
                    try {
                      const keys = [`sham_serials_${p.id}`, `sham_serials_${(p.name || "").toLowerCase().trim()}`, p.sku ? `sham_serials_${p.sku}` : null].filter(Boolean) as string[];
                      for (const k of keys) {
                        const raw = localStorage.getItem(k);
                        if (raw) {
                          const parsed = JSON.parse(raw);
                          if (Array.isArray(parsed) && parsed.some((sn: string) => sn && typeof sn === "string" && sn.toLowerCase().trim() === cleanCode)) return true;
                        }
                      }
                    } catch (_) {}
                    return false;
                  })()
              );
              if (match) {
                setProductId(match.id);
              } else {
                alert(`Scanned barcode: "${code}". No matching product found.`);
              }
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
