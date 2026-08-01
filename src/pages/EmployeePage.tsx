
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore, Customer, Product, Order, Task } from "../app/store";
import { DashboardLayout, StatCard, Pill, NavItem, Modal, BarChart } from "../app/DashboardLayout";
import { NotificationsSection, ProfileSection, LeadsSection, DashboardLeadPipelineOverview, UpcomingFollowUps, ProductForm } from "./SuperAdminPage";

const NAV: NavItem[] = [
  { key: "overview", label: "Live Dashboard", icon: "📡" },
  { key: "products", label: "Products", icon: "📦" },
  { key: "leads", label: "Lead Generation", icon: "🧲" },
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

  if (!store.currentUser || store.currentUser.role !== "employee") {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout role="employee" title="Employee" nav={NAV} active={active} onNav={setActive}>
      {active === "overview" && <Overview />}
      {active === "tasks" && <TasksSection />}
      {active === "leads" && <LeadsSection />}
      {active === "orders" && <OrderUpdates />}
      {active === "products" && <ProductsSection />}
      {active === "incentive" && <EmployeeIncentiveSection />}
      {active === "profile" && <ProfileSection />}
    </DashboardLayout>
  );
}

function Overview() {
  const { currentUser, tasks, orders } = useStore();
  const navigate = useNavigate();
  const mine = tasks.filter((t) => t.assignedTo === currentUser!.id);
  const goTo = (tab: string) => navigate({ to: "/employee", search: { tab } });

  const pendingCount = mine.filter((t) => t.status === "Pending").length;
  const inProgressCount = mine.filter((t) => t.status === "In Progress").length;
  const completedCount = mine.filter((t) => t.status === "Completed").length;
  const totalTasks = mine.length || 1;

  const chartData = [
    { label: "Total", value: mine.length },
    { label: "Pending", value: pendingCount },
    { label: "In Prog", value: inProgressCount },
    { label: "Done", value: completedCount },
  ];

  // Pie Chart calculations
  const pendingPct = Math.round((pendingCount / totalTasks) * 100);
  const inProgressPct = Math.round((inProgressCount / totalTasks) * 100);
  const completedPct = Math.round((completedCount / totalTasks) * 100);

  return (
    <>
      <h2 className="page-title">Welcome, {currentUser?.name?.split(" ")[0]}</h2>
      <p className="page-sub">Here's your work overview for today.</p>
      <DashboardLeadPipelineOverview />
      <UpcomingFollowUps />
      <div className="stat-grid">
        <StatCard icon="📝" label="Total Tasks" value={mine.length} onClick={() => goTo("tasks")} />
        <StatCard icon="⏳" label="Pending" value={pendingCount} onClick={() => goTo("tasks")} />
        <StatCard icon="⚙" label="In Progress" value={inProgressCount} onClick={() => goTo("tasks")} />
        <StatCard icon="✅" label="Completed" value={completedCount} onClick={() => goTo("tasks")} />
        <StatCard icon="🧾" label="Active Orders" value={orders.filter((o) => o.status === "Approved").length} onClick={() => goTo("orders")} />
      </div>

      {/* Bar Chart & Pie Chart Row */}
      <div className="row-2" style={{ marginBottom: "24px" }}>
        <div className="panel" style={{ background: "rgba(255, 255, 255, 0.72)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", borderRadius: "24px", border: "1px solid rgba(255, 255, 255, 0.5)", padding: "22px", boxShadow: "0 15px 40px rgba(0, 0, 0, 0.06)" }}>
          <div className="panel-head" style={{ marginBottom: "16px" }}>
            <h3 className="panel-title" style={{ fontSize: "16px", fontWeight: 800, color: "#1F1F1F", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📊 Task Performance Bar Chart</span>
            </h3>
          </div>
          <BarChart data={chartData} />
        </div>

        {/* Task Status Breakdown Pie Chart */}
        <div className="panel" style={{ background: "rgba(255, 255, 255, 0.72)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", borderRadius: "24px", border: "1px solid rgba(255, 255, 255, 0.5)", padding: "22px", boxShadow: "0 15px 40px rgba(0, 0, 0, 0.06)" }}>
          <div className="panel-head" style={{ marginBottom: "16px" }}>
            <h3 className="panel-title" style={{ fontSize: "16px", fontWeight: 800, color: "#1F1F1F", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🥧 Task Status Pie Chart</span>
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "16px", padding: "10px 0" }}>
            {/* SVG Donut / Pie Chart */}
            <div style={{ position: "relative", width: "130px", height: "130px" }}>
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                {/* Background Ring */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(148, 163, 184, 0.22)" strokeWidth="4" />
                {/* Completed Slice (Primary Green #1E293B) */}
                <circle
                  cx="18" cy="18" r="15.915" fill="none"
                  stroke="#7C3AED" strokeWidth="4.5"
                  strokeDasharray={`${completedPct} ${100 - completedPct}`}
                  strokeDashoffset="0"
                />
                {/* In Progress Slice (Soft Orange #F59E0B) */}
                <circle
                  cx="18" cy="18" r="15.915" fill="none"
                  stroke="#F59E0B" strokeWidth="4.5"
                  strokeDasharray={`${inProgressPct} ${100 - inProgressPct}`}
                  strokeDashoffset={`-${completedPct}`}
                />
                {/* Pending Slice (Accent Gold #C59D5F) */}
                <circle
                  cx="18" cy="18" r="15.915" fill="none"
                  stroke="#EC4899" strokeWidth="4.5"
                  strokeDasharray={`${pendingPct} ${100 - pendingPct}`}
                  strokeDashoffset={`-${completedPct + inProgressPct}`}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#1F1F1F" }}>{mine.length}</span>
                <span style={{ fontSize: "10px", color: "#6F6F6F", fontWeight: 700, textTransform: "uppercase" }}>Tasks</span>
              </div>
            </div>

            {/* Pie Chart Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#7C3AED", display: "inline-block" }} />
                <span style={{ color: "#6F6F6F", fontWeight: 600 }}>Completed:</span>
                <span style={{ fontWeight: 800, color: "#1F1F1F" }}>{completedCount} ({completedPct}%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                <span style={{ color: "#6F6F6F", fontWeight: 600 }}>In Progress:</span>
                <span style={{ fontWeight: 800, color: "#1F1F1F" }}>{inProgressCount} ({inProgressPct}%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#EC4899", display: "inline-block" }} />
                <span style={{ color: "#6F6F6F", fontWeight: 600 }}>Pending:</span>
                <span style={{ fontWeight: 800, color: "#1F1F1F" }}>{pendingCount} ({pendingPct}%)</span>
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

  const total = mine.length;
  const completed = mine.filter((t) => t.status === "Completed").length;
  const inProgress = mine.filter((t) => t.status === "In Progress").length;
  const pending = mine.filter((t) => t.status === "Pending").length;

  return (
    <>
      <h2 className="page-title">Assigned Tasks</h2>
      <p className="page-sub">Pick up tasks and mark them complete when done.</p>

      {/* Task summary cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard icon="📝" label="Total" value={total} />
        <StatCard icon="✅" label="Completed" value={completed} />
        <StatCard icon="⚙" label="In Progress" value={inProgress} />
        <StatCard icon="⏳" label="Pending" value={pending} />
      </div>

      <div className="panel">
        <div className={mine.length > 0 ? "card-grid" : ""}>
          {mine.map((t) => (
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

  const myOrders = orders.filter((o) => o.assignedTo === currentUser?.id && o.sentToEmployee && (o.status === "Approved" || o.status === "Delivered"));
  const otherOrders = orders.filter((o) => o.assignedTo !== currentUser?.id && o.sentToEmployee && (o.status === "Approved" || o.status === "Delivered"));
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h2 className="page-title">Order Updates</h2>
          <p className="page-sub">Live order statuses from Super Admin approvals.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddOrder(true)}
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-dark))", fontWeight: 700, borderRadius: 10, padding: "8px 18px", fontSize: "14px" }}
        >
          ➕ Add Order
        </button>
      </div>

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
                  <div className="data-row"><span className="data-label">Total</span><span className="data-value" style={{ fontWeight: 700 }}>₹{o.total.toLocaleString()}</span></div>
                </div>
                <div className="data-card-footer" style={{ justifyContent: "flex-end", gap: "8px" }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #E2E8F0" }} onClick={() => setActiveDoc({ order: o, type: "Bill" })}>🧾 Bill</button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #E2E8F0" }} onClick={() => setActiveDoc({ order: o, type: "Order Copy" })}>📄 Order Copy</button>

                  {o.status === "Approved" ? (
                    <button
                      className="btn btn-success btn-sm"
                      style={{ padding: "4px 8px", fontSize: 11 }}
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
                    <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 600 }}>Completed</span>
                  )}
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
                  <div className="data-row"><span className="data-label">Assigned</span><span className="data-value">{o.assignedToName ?? "—"}</span></div>
                  <div className="data-row"><span className="data-label">Total</span><span className="data-value" style={{ fontWeight: 700 }}>₹{o.total.toLocaleString()}</span></div>
                </div>
                <div className="data-card-footer" style={{ justifyContent: "flex-end", gap: "8px", borderTop: "1px solid var(--border)", padding: "12px 16px", display: "flex" }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #E2E8F0" }} onClick={() => setActiveDoc({ order: o, type: "Bill" })}>🧾 Bill</button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", fontSize: 11, border: "1px solid #E2E8F0" }} onClick={() => setActiveDoc({ order: o, type: "Order Copy" })}>📄 Order Copy</button>
                </div>
              </div>
            );
          })}
          {otherOrders.length === 0 && <div className="empty">No other orders.</div>}
        </div>
      </div>

      {showAddOrder && (
        <EmployeeCreateOrderModal onClose={() => setShowAddOrder(false)} />
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
      <h2 className="page-title">Products</h2>
      <p className="page-sub">View active and available products.</p>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="🛍️" label="Products Sold" value={productsSold} onClick={() => goTo("orders")} />
        <StatCard icon="💰" label="Incentive Earned" value={`₹${totalIncentive.toLocaleString()}`} onClick={() => goTo("incentive")} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">Catalog ({filteredProducts.length})</h3>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell-flex">
                      {p.image ? (
                        <img src={p.image} className="product-image-cell" alt={p.name} />
                      ) : (
                        <div className="product-image-cell" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--biscuit-light)", fontSize: 20 }}>📦</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "var(--brown)", marginTop: 2 }}>
                          {p.sku && <span>SKU: {p.sku}</span>}
                          {p.sku && <span> · </span>}
                          <span>Brand: {p.brand || "—"}</span>
                          {p.warranty && <span> · Warranty: {p.warranty}</span>}
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
                  <td>₹{p.price.toLocaleString()}</td>
                  <td>{p.qty ?? p.stock}</td>
                  <td><Pill status={p.status} /></td>
                  <td>
                    {p.incentive > 0 && (p.assignedEmployeeId === "all" || p.assignedEmployeeId === currentUser?.id) ? (
                      <button
                        className="btn btn-success btn-sm"
                        style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 600 }}
                        onClick={() => setSellingProduct(p)}
                      >
                        🏷️ Sell
                      </button>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">No products available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <ProductForm title="Add Product" onClose={() => setShowAdd(false)} onSave={(d) => { const nextId = uid("p"); setState((s) => ({ ...s, products: [...s.products, { id: nextId, ...d }] })); setShowAdd(false); }} />}

      {sellingProduct && (
        <Modal title={`🏷️ Sell Product`} onClose={() => setSellingProduct(null)} className="sell-modal">
          <style>{`
            .sell-modal {
              max-width: 540px !important;
              padding: 26px 30px !important;
              border-radius: 16px !important;
              box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12) !important;
            }
            .sell-modal .modal-head {
              margin-bottom: 16px !important;
              padding-bottom: 10px !important;
            }
            .sell-modal .modal-title {
              font-size: 21px !important;
            }
          `}</style>
          {sellError && (
            <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>
              ⚠️ {sellError}
            </div>
          )}
          {sellSuccess && (
            <div style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>
              ✅ {sellSuccess}
            </div>
          )}
          <div style={{
            background: "linear-gradient(135deg, var(--biscuit-light) 0%, #fff 100%)",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            marginBottom: "16px",
            boxShadow: "inset 0 0 10px rgba(122, 90, 50, 0.02)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--brown-dark)" }}>{sellingProduct.name}</h4>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }}>
                💰 Incentive: {sellingProduct.price > 0 ? Math.round((sellingProduct.incentive / sellingProduct.price) * 100) : 0}%
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12px", color: "var(--brown)" }}>
              <span>Brand: <strong>{sellingProduct.brand || "—"}</strong> · SKU: <code>{sellingProduct.sku}</code></span>
              <span style={{ fontWeight: 700, color: "var(--brown-dark)" }}>Price (1 Unit): ₹{unitPrice.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)", letterSpacing: "0.5px" }}>
              Customer Name *
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "40px", padding: "8px 12px", fontSize: "14px", borderRadius: "10px", border: "1px solid var(--border)", width: "100%", boxSizing: "border-box" }}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)", letterSpacing: "0.5px" }}>
              Phone Number *
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "40px", padding: "8px 12px", fontSize: "14px", borderRadius: "10px", border: "1px solid var(--border)", width: "100%", boxSizing: "border-box" }}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)", letterSpacing: "0.5px" }}>
              Address
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "40px", padding: "8px 12px", fontSize: "14px", borderRadius: "10px", border: "1px solid var(--border)", width: "100%", boxSizing: "border-box" }}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Enter address (optional)"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)", letterSpacing: "0.5px" }}>
              Document Type *
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <label style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: docType === "Bill" ? "2px solid #0284c7" : "1px solid var(--border)",
                background: docType === "Bill" ? "#f0f9ff" : "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
                color: docType === "Bill" ? "#0369a1" : "inherit"
              }}>
                <input
                  type="radio"
                  name="docTypeSelectProd"
                  value="Bill"
                  checked={docType === "Bill"}
                  onChange={() => setDocType("Bill")}
                />
                🧾 Bill
              </label>
              <label style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: docType === "Order Copy" ? "2px solid #9333ea" : "1px solid var(--border)",
                background: docType === "Order Copy" ? "#faf5ff" : "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
                color: docType === "Order Copy" ? "#6D28D9" : "inherit"
              }}>
                <input
                  type="radio"
                  name="docTypeSelectProd"
                  value="Order Copy"
                  checked={docType === "Order Copy"}
                  onChange={() => setDocType("Order Copy")}
                />
                📄 Order Copy
              </label>
            </div>
          </div>

          {docType === "Order Copy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", background: "#faf5ff", padding: "14px", borderRadius: "12px", border: "1px solid #e9d5ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#6D28D9", letterSpacing: "0.5px" }}>
                  ⏳ Booking Expiry Date *
                </label>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#7e22ce" }}>
                  📅 {bookingExpiryDate ? new Date(bookingExpiryDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Select Date"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "2px 0" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#6D28D9", alignSelf: "center" }}>Quick Set:</span>
                {[
                  { label: "+7 Days", days: 7 },
                  { label: "+15 Days", days: 15 },
                  { label: "+30 Days (1 Month)", days: 30 },
                  { label: "+60 Days (2 Months)", days: 60 },
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
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: isSelected ? "1.5px solid #7e22ce" : "1px solid #d8b4fe",
                        background: isSelected ? "#7e22ce" : "#fff",
                        color: isSelected ? "#fff" : "#6D28D9",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer"
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
                style={{ height: "42px", padding: "8px 12px", fontSize: "14px", borderRadius: "8px", border: "1px solid #d8b4fe", width: "100%", boxSizing: "border-box", background: "#fff" }}
                value={bookingExpiryDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setBookingExpiryDate(e.target.value)}
              />

              <span style={{ fontSize: "11px", color: "#7e22ce", lineHeight: "1.3" }}>
                💡 If booking is not fulfilled by this date, an expiration alert will be sent to Admin.
              </span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)", letterSpacing: "0.5px" }}>
              Quantity
            </label>
            <input
              type="number"
              className="form-input"
              style={{ height: "40px", padding: "8px 12px", fontSize: "14px", borderRadius: "10px", border: "1px solid var(--border)", width: "100%", boxSizing: "border-box" }}
              value={sellQty}
              onChange={(e) => setSellQty(Math.max(1, Number(e.target.value)))}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              min={1}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)", letterSpacing: "0.5px" }}>
              Discount (%)
            </label>
            <input
              type="number"
              className="form-input"
              style={{ height: "40px", padding: "8px 12px", fontSize: "14px", borderRadius: "10px", border: "1px solid var(--border)", width: "100%", boxSizing: "border-box" }}
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              placeholder="Enter discount percentage (e.g. 10)"
              min={0}
              max={100}
            />
          </div>

          <div style={{ padding: "12px", background: "var(--biscuit-light)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--brown)" }}>Final Total:</span>
            <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--brown-dark)" }}>₹{Math.max(0, (unitPrice * sellQty) - Math.round(((Number(discountAmount) || 0) / 100) * (unitPrice * sellQty))).toLocaleString()}</span>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
            <button
              className="btn btn-ghost"
              onClick={() => setSellingProduct(null)}
              style={{ padding: "8px 20px", fontSize: "14px", fontWeight: 600, borderRadius: "10px", background: "var(--biscuit-light)", height: "40px" }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSell}
              disabled={!customerName.trim() || !customerPhone.trim()}
              style={{
                padding: "8px 24px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "10px",
                background: (!customerName.trim() || !customerPhone.trim()) ? "var(--border)" : "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                border: "none",
                color: "#fff",
                cursor: (!customerName.trim() || !customerPhone.trim()) ? "not-allowed" : "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                height: "40px"
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
                      {p.image ? (
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                          <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--biscuit)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                          📦
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--brown)", marginTop: 2 }}>
                        <span>Brand: {p.brand || "—"}</span>
                        {p.warranty && <span> · Warranty: {p.warranty}</span>}
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
              padding: 26px 30px !important;
              border-radius: 16px !important;
              box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12) !important;
            }
            .sell-modal .modal-head {
              margin-bottom: 16px !important;
              padding-bottom: 10px !important;
            }
            .sell-modal .modal-title {
              font-size: 21px !important;
            }
          `}</style>
          {incSellError && (
            <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, marginBottom: "14px" }}>
              ⚠️ {incSellError}
            </div>
          )}
          {incSellSuccess && (
            <div style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, marginBottom: "14px" }}>
              ✅ {incSellSuccess}
            </div>
          )}
          <div style={{
            background: "linear-gradient(135deg, var(--biscuit-light) 0%, #fff 100%)",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            marginBottom: "16px",
            boxShadow: "inset 0 0 10px rgba(122, 90, 50, 0.02)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--brown-dark)" }}>{sellingProduct.name}</h4>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }}>
                💰 Incentive: {sellingProduct.price > 0 ? Math.round((sellingProduct.incentive / sellingProduct.price) * 100) : 0}%
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12px", color: "var(--brown)" }}>
              <span>Brand: <strong>{sellingProduct.brand || "—"}</strong> · SKU: <code>{sellingProduct.sku}</code></span>
              <span style={{ fontWeight: 700, color: "var(--brown-dark)" }}>Price (1 Unit): ₹{unitPrice.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)", letterSpacing: "0.5px" }}>
              Customer Name *
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "40px", padding: "8px 12px", fontSize: "14px", borderRadius: "10px", border: "1px solid var(--border)", width: "100%", boxSizing: "border-box" }}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)", letterSpacing: "0.5px" }}>
              Phone Number *
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "40px", padding: "8px 12px", fontSize: "14px", borderRadius: "10px", border: "1px solid var(--border)", width: "100%", boxSizing: "border-box" }}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)", letterSpacing: "0.5px" }}>
              Address
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: "40px", padding: "8px 12px", fontSize: "14px", borderRadius: "10px", border: "1px solid var(--border)", width: "100%", boxSizing: "border-box" }}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Enter address (optional)"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)", letterSpacing: "0.5px" }}>
              Document Type *
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <label style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: docType === "Bill" ? "2px solid #0284c7" : "1px solid var(--border)",
                background: docType === "Bill" ? "#f0f9ff" : "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
                color: docType === "Bill" ? "#0369a1" : "inherit"
              }}>
                <input
                  type="radio"
                  name="docTypeSelectInc"
                  value="Bill"
                  checked={docType === "Bill"}
                  onChange={() => setDocType("Bill")}
                />
                🧾 Bill
              </label>
              <label style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: docType === "Order Copy" ? "2px solid #9333ea" : "1px solid var(--border)",
                background: docType === "Order Copy" ? "#faf5ff" : "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
                color: docType === "Order Copy" ? "#6D28D9" : "inherit"
              }}>
                <input
                  type="radio"
                  name="docTypeSelectInc"
                  value="Order Copy"
                  checked={docType === "Order Copy"}
                  onChange={() => setDocType("Order Copy")}
                />
                📄 Order Copy
              </label>
            </div>
          </div>

          {docType === "Order Copy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", background: "#faf5ff", padding: "14px", borderRadius: "12px", border: "1px solid #e9d5ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#6D28D9", letterSpacing: "0.5px" }}>
                  ⏳ Booking Expiry Date *
                </label>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#7e22ce" }}>
                  📅 {bookingExpiryDate ? new Date(bookingExpiryDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Select Date"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "2px 0" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#6D28D9", alignSelf: "center" }}>Quick Set:</span>
                {[
                  { label: "+7 Days", days: 7 },
                  { label: "+15 Days", days: 15 },
                  { label: "+30 Days (1 Month)", days: 30 },
                  { label: "+60 Days (2 Months)", days: 60 },
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
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: isSelected ? "1.5px solid #7e22ce" : "1px solid #d8b4fe",
                        background: isSelected ? "#7e22ce" : "#fff",
                        color: isSelected ? "#fff" : "#6D28D9",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer"
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
                style={{ height: "42px", padding: "8px 12px", fontSize: "14px", borderRadius: "8px", border: "1px solid #d8b4fe", width: "100%", boxSizing: "border-box", background: "#fff" }}
                value={bookingExpiryDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setBookingExpiryDate(e.target.value)}
              />

              <span style={{ fontSize: "11px", color: "#7e22ce", lineHeight: "1.3" }}>
                💡 If booking is not fulfilled by this date, an expiration alert will be sent to Admin.
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
            <button
              className="btn btn-ghost"
              onClick={() => setSellingProduct(null)}
              style={{ padding: "8px 20px", fontSize: "14px", fontWeight: 600, borderRadius: "10px", background: "var(--biscuit-light)", height: "40px" }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSell}
              disabled={!customerName.trim() || !customerPhone.trim()}
              style={{
                padding: "8px 24px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "10px",
                background: (!customerName.trim() || !customerPhone.trim()) ? "var(--border)" : "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                border: "none",
                color: "#fff",
                cursor: (!customerName.trim() || !customerPhone.trim()) ? "not-allowed" : "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                height: "40px"
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

  const orderBasePrice = Math.round(order.total / (1 - ((order.discount || 0) / 100)));
  const unitPrice = Math.round(orderBasePrice / order.qty);
  const discountVal = orderBasePrice - order.total;
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
        padding: "20px",
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #E2E8F0",
        fontFamily: "'Inter', sans-serif",
        color: "#1e293b",
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        {/* Document Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid #334155",
          paddingBottom: "16px",
          marginBottom: "20px"
        }}>
          <div>
            <h2 style={{ margin: 0, color: "#0f172a", fontSize: "22px", fontWeight: 800 }}>SMART HOME</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
              Sales & Services · Smart Home Automation
            </p>
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
          gridTemplateColumns: "1fr 1fr",
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

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={{ padding: "8px 12px", fontSize: "12px", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>Item Description</th>
              <th style={{ padding: "8px 12px", fontSize: "12px", color: "#475569", borderBottom: "1px solid #cbd5e1", textAlign: "center" }}>Qty</th>
              <th style={{ padding: "8px 12px", fontSize: "12px", color: "#475569", borderBottom: "1px solid #cbd5e1", textAlign: "right" }}>Unit Price</th>
              <th style={{ padding: "8px 12px", fontSize: "12px", color: "#475569", borderBottom: "1px solid #cbd5e1", textAlign: "right" }}>Amount</th>
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
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>₹{unitPrice.toLocaleString()}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "right", fontWeight: 600 }}>₹{orderBasePrice.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {/* Calculation Summary */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
          <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
              <span>Subtotal:</span>
              <span>₹{orderBasePrice.toLocaleString()}</span>
            </div>
            {order.discount && order.discount > 0 ? (
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
              <span>₹{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
          Thank you for your business! · Smart Home Systems
        </div>
      </div>

      {/* Modal Actions */}
      <div className="modal-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
        <button className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
        <button
          className="btn btn-primary"
          onClick={handlePrint}
          style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)", border: "none", color: "#fff" }}
        >
          🖨️ Print / Save PDF
        </button>
        {!isAdmin && (
          sentSuccess ? (
            <button
              className="btn btn-success"
              disabled
              style={{ background: "#16a34a", border: "none", color: "#fff", fontWeight: 700, cursor: "default" }}
            >
              ✅ Sent to Admin
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSendToAdmin}
              style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", color: "#fff", fontWeight: 700 }}
            >
              📤 Send to Admin
            </button>
          )
        )}
      </div>
    </Modal>
  );
}

export function EmployeeCreateOrderModal({ onClose }: { onClose: () => void }) {
  const { customers, products, setState, uid, currentUser } = useStore();
  const activeProducts = products.filter(p => p.status === "Active" || p.status === "Verified");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [productId, setProductId] = useState(activeProducts[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [discountPct, setDiscountPct] = useState<number | "">("");
  const [docType, setDocType] = useState<"Bill" | "Order Copy">("Bill");
  const [bookingExpiryDate, setBookingExpiryDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [customerBargain, setCustomerBargain] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedProduct = activeProducts.find(p => p.id === productId);
  const unitPrice = selectedProduct ? selectedProduct.price : 0;
  const baseTotal = unitPrice * qty;
  const discountVal = discountPct ? Math.round(((Number(discountPct) || 0) / 100) * baseTotal) : 0;
  const finalTotal = Math.max(0, baseTotal - discountVal);

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

  return (
    <Modal title="➕ Add New Order" onClose={onClose}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
            Customer Name *
          </label>
          <input
            type="text"
            className="form-input"
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

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
            Phone Number *
          </label>
          <input
            type="text"
            className="form-input"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Enter customer phone number"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
            Address
          </label>
          <input
            type="text"
            className="form-input"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Enter address (optional)"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
            Select Product *
          </label>
          <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
            {activeProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.brand ? `(${p.brand})` : ""} - ₹{p.price.toLocaleString()} (Stock: {p.qty ?? p.stock ?? 0})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
              Quantity *
            </label>
            <input
              type="number"
              className="form-input"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
              Discount (%)
            </label>
            <input
              type="number"
              className="form-input"
              min={0}
              max={100}
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="0%"
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
            Document Type *
          </label>
          <div style={{ display: "flex", gap: "12px" }}>
            <label style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: docType === "Bill" ? "2px solid #0284c7" : "1px solid var(--border)",
              background: docType === "Bill" ? "#f0f9ff" : "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px",
              color: docType === "Bill" ? "#0369a1" : "inherit"
            }}>
              <input
                type="radio"
                name="empModalDocType"
                value="Bill"
                checked={docType === "Bill"}
                onChange={() => setDocType("Bill")}
              />
              🧾 Bill
            </label>
            <label style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: docType === "Order Copy" ? "2px solid #9333ea" : "1px solid var(--border)",
              background: docType === "Order Copy" ? "#faf5ff" : "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "13px",
              color: docType === "Order Copy" ? "#6D28D9" : "inherit"
            }}>
              <input
                type="radio"
                name="empModalDocType"
                value="Order Copy"
                checked={docType === "Order Copy"}
                onChange={() => setDocType("Order Copy")}
              />
              📄 Order Copy
            </label>
          </div>
        </div>

        {docType === "Order Copy" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#faf5ff", padding: "14px", borderRadius: "12px", border: "1px solid #e9d5ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#6D28D9", letterSpacing: "0.5px" }}>
                ⏳ Booking Expiry Date *
              </label>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#7e22ce" }}>
                📅 {bookingExpiryDate ? new Date(bookingExpiryDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Select Date"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "2px 0" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#6D28D9", alignSelf: "center" }}>Quick Set:</span>
              {[
                { label: "+7 Days", days: 7 },
                { label: "+15 Days", days: 15 },
                { label: "+30 Days (1 Month)", days: 30 },
                { label: "+60 Days (2 Months)", days: 60 },
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
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: isSelected ? "1.5px solid #7e22ce" : "1px solid #d8b4fe",
                      background: isSelected ? "#7e22ce" : "#fff",
                      color: isSelected ? "#fff" : "#6D28D9",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer"
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
              style={{ height: "42px", padding: "8px 12px", fontSize: "14px", borderRadius: "8px", border: "1px solid #d8b4fe", width: "100%", boxSizing: "border-box", background: "#fff" }}
              value={bookingExpiryDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setBookingExpiryDate(e.target.value)}
            />

            <span style={{ fontSize: "11px", color: "#7e22ce", lineHeight: "1.3" }}>
              💡 If booking is not fulfilled by this date, an expiration alert will be sent to Admin.
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--brown-dark)" }}>
            Bargaining / Remarks
          </label>
          <input
            type="text"
            className="form-input"
            value={customerBargain}
            onChange={(e) => setCustomerBargain(e.target.value)}
            placeholder="E.g. Customer requested ₹500 discount"
          />
        </div>

        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", marginTop: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
            <span>Subtotal ({qty}x):</span>
            <span>₹{baseTotal.toLocaleString()}</span>
          </div>
          {discountVal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#dc2626", marginTop: "4px" }}>
              <span>Discount ({discountPct}%):</span>
              <span>- ₹{discountVal.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "6px", borderTop: "1px dashed #cbd5e1", paddingTop: "6px" }}>
            <span>Total Payable:</span>
            <span>₹{finalTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="modal-actions" style={{ marginTop: "20px" }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-dark))" }}>
          Submit Order for Approval
        </button>
      </div>
    </Modal>
  );
}
