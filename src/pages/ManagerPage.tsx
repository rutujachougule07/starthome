import { EmployeeIncentiveSection } from "./EmployeePage";
import { Navigate, useNavigate } from "@tanstack/react-router";
import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStore, loadCurrentUser, User, Customer, Order, Product } from "../app/store";
import { DashboardLayout, StatCard, Pill, Modal, NavItem, BarChart } from "../app/DashboardLayout";
import { NotificationsSection, ProfileSection, EmployeeForm, EmployeeWorkDetailsModal, LeadsSection, DashboardLeadPipelineOverview, UpcomingFollowUps, TasksAssignSection, TaskAssignmentSection, ProductForm, SuperAdminIncentiveSection, DownloadDropdown, openPDFPreview, QuotationsSection, OrderApprovalSection } from "./SuperAdminPage";
import { UnifiedEmployeeCard } from "../components/UnifiedEmployeeCard";
import { Search, Download, Plus, SlidersHorizontal } from "lucide-react";

const NAV: NavItem[] = [
  { key: "overview", label: "Live Dashboard", icon: "📡" },
  { key: "products", label: "Stocking Inventory", icon: "📦" },
  { key: "leads", label: "Lead Generation", icon: "🧲" },
  { key: "quotations", label: "Quotations", icon: "📑" },
  { key: "assign", label: "Add Employee", icon: "📋" },
  { key: "task-assign", label: "Task Assign", icon: "📝" },
  { key: "orders", label: "Order Approval", icon: "🧾" },
  { key: "incentive", label: "Incentive", icon: "💰" },
  { key: "profile", label: "Profile", icon: "⚙" },
];

interface ManagerPageProps {
  tab?: string;
}

export function ManagerPage({ tab = "overview" }: ManagerPageProps) {
  const store = useStore();
  const [showNotification, setShowNotification] = useState(true);
  const active = tab || "overview";
  const navigate = useNavigate();
  const setActive = (tab: string) => {
    navigate({ to: "/manager", search: { tab } });
  };

  const user = store.currentUser || loadCurrentUser();
  if (!user || user.role !== "manager") return <Navigate to="/login" />;

  const pendingApprovals = store.orders.filter(
    (o) => o.status === "Pending" && !o.isIncentive && o.customerId !== "c_incentive" && o.customerName !== "Incentive Sell Request"
  ).length;

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
        .admin-notif-banner {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #ff416c, #ff4b2b);
          color: white;
          padding: 12px 18px 12px 24px;
          border-radius: 100px;
          z-index: 9999;
          box-shadow: 0 12px 30px rgba(255, 65, 108, 0.4), inset 0 2px 0 rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          gap: 14px;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.25);
          animation: popupSlideDown 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          max-width: 90vw;
          box-sizing: border-box;
        }
        @media (max-width: 640px) {
          .admin-notif-banner {
            top: 10px;
            width: calc(100vw - 20px);
            max-width: 480px;
            padding: 10px 12px 10px 16px;
            border-radius: 50px;
            gap: 10px;
          }
          .admin-notif-text-full {
            display: none !important;
          }
          .admin-notif-text-short {
            display: inline-block !important;
          }
        }
        @media (min-width: 641px) {
          .admin-notif-text-full {
            display: inline-block !important;
          }
          .admin-notif-text-short {
            display: none !important;
          }
        }
        .btn-review-now:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.2) !important;
        }
        .btn-dismiss-pop:hover {
          background: rgba(255,255,255,0.3) !important;
        }
      `}</style>

      {pendingApprovals > 0 && showNotification && (
        <div className="admin-notif-banner">
          <span style={{ fontSize: "22px", display: "inline-block", animation: "bellRing 1.5s ease-in-out infinite", transformOrigin: "top center", flexShrink: 0 }}>🔔</span>

          <span className="admin-notif-text-full" style={{ fontSize: "15px", letterSpacing: "0.2px", fontWeight: 600, whiteSpace: "nowrap" }}>
            You have <strong style={{ fontSize: "16px", background: "rgba(255,255,255,0.25)", padding: "3px 10px", borderRadius: "10px", margin: "0 2px" }}>{pendingApprovals}</strong> pending request(s) for approval!
          </span>

          <span className="admin-notif-text-short" style={{ fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <strong style={{ fontSize: "14px", background: "rgba(255,255,255,0.25)", padding: "2px 7px", borderRadius: "8px", marginRight: "4px" }}>{pendingApprovals}</strong>
            Pending Approval(s)
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: "auto" }}>
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
                padding: "8px 16px",
                borderRadius: "100px",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease"
              }}
            >
              Review Now
            </button>
            <button
              className="btn-dismiss-pop"
              onClick={() => setShowNotification(false)}
              title="Dismiss"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "#ffffff",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                transition: "all 0.2s ease"
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <DashboardLayout role="manager" title="Manager" nav={NAV} active={active} onNav={setActive}>
        {active === "overview" && <Overview onNav={setActive} />}
        {active === "assign" && <TasksAssignSection />}
        {active === "task-assign" && <TaskAssignmentSection />}
        {active === "customers" && <CustomersMgmt />}
        {active === "leads" && <LeadsSection />}
        {active === "quotations" && <QuotationsSection />}
        {active === "orders" && <OrderApprovalSection />}
        {active === "products" && <ProductsAvail />}
        {active === "incentive" && <SuperAdminIncentiveSection />}
        {active === "notifications" && <NotificationsSection role="manager" />}
        {active === "profile" && <ProfileSection />}
      </DashboardLayout>
    </>
  );
}

function Overview({ onNav }: { onNav: (tab: string) => void }) {
  const { users, customers, orders, tasks, products } = useStore();
  const emp = users.filter((u) => u.role === "employee").length;
  const pending = orders.filter((o) => o.status === "Pending").length;

  const incentive90Days = useMemo(() => {
    return products.filter(p => {
      if (!p.date || !p.incentive || p.incentive <= 0) return false;
      const diffTime = new Date().getTime() - new Date(p.date).getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays > 90;
    }).length;
  }, [products]);

  return (
    <>
      <h2 className="page-title">Manager Dashboard</h2>
      <p className="page-sub">Coordinate employees, customers, and orders.</p>
      <DashboardLeadPipelineOverview />
      <UpcomingFollowUps />
      <div className="stat-grid">
        <StatCard icon="👥" label="Employees" value={emp} onClick={() => onNav("assign")} />
        <StatCard icon="🧑‍💼" label="Customers" value={customers.length} onClick={() => onNav("leads")} />
        <StatCard icon="🧾" label="Orders" value={orders.length} onClick={() => onNav("orders")} />
        <StatCard icon="⏳" label="Pending Approvals" value={pending} onClick={() => onNav("orders")} />
        <StatCard icon="✅" label="Tasks Completed" value={tasks.filter((t) => t.status === "Completed").length} onClick={() => onNav("task-assign")} />
        <StatCard icon="💰" label="INCENTIVE (> 90 DAYS)" value={incentive90Days} onClick={() => onNav("incentive")} />
      </div>

    </>
  );
}

function EmployeesMgmt() {
  const { users, tasks, setState, uid } = useStore();
  const employees = users.filter((u) => u.role === "employee");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [assignTo, setAssignTo] = useState<User | null>(null);
  const [viewingWork, setViewingWork] = useState<User | null>(null);

  const remove = (id: string) => {
    if (!confirm("Delete this employee?")) return;
    setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));
  };

  return (
    <>
      <h2 className="page-title">Employees</h2>
      <p className="page-sub">Manage employees and assign work.</p>
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">Team ({employees.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Employee</button>
        </div>
        <div className={employees.length > 0 ? "card-grid" : ""}>
          {employees.map((e) => {
            return (
              <UnifiedEmployeeCard
                key={e.id}
                employee={e}
                userTasks={tasks.filter((t) => t.assignedTo === e.id)}
                actions={
                  <>
                    <button className="btn btn-circle" onClick={() => setViewingWork(e)} title="View Work Details" style={{ background: "var(--biscuit-light)" }}>📊</button>
                    <button className="btn btn-circle" onClick={() => setAssignTo(e)} title="Assign Work" style={{ background: "var(--biscuit-light)" }}>📋</button>
                    <button className="btn btn-circle" onClick={() => setEditing(e)} title="Edit Employee">✏️</button>
                    <button className="btn btn-circle btn-circle-danger" onClick={() => remove(e.id)} title="Delete Employee">🗑️</button>
                  </>
                }
              />
            );
          })}
          {employees.length === 0 && <div className="empty">No employees yet.</div>}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3 className="panel-title">All Tasks</h3></div>
        <div className={tasks.length > 0 ? "card-grid" : ""}>
          {tasks.map((t) => (
            <div key={t.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <h4 className="data-card-title">{t.title}</h4>
                  <span className="data-card-subtitle">{t.date}</span>
                </div>
                <div><Pill status={t.status} /></div>
              </div>
              <div className="data-card-body">
                <div className="data-row"><span className="data-label">Assignee</span><span className="data-value">{t.assignedToName}</span></div>
              </div>
              <div className="data-card-footer" style={{ justifyContent: "flex-end" }}>
                <button
                  className="btn btn-circle btn-circle-danger"
                  onClick={() => {
                    if (confirm("Delete this task?")) {
                      setState((s) => ({ ...s, tasks: s.tasks.filter((task) => task.id !== t.id) }));
                    }
                  }}
                  title="Delete Task"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <div className="empty">No tasks yet.</div>}
        </div>
      </div>

      {showAdd && (
        <EmployeeForm
          title="Register New Employee"
          onClose={() => setShowAdd(false)}
          onSave={(d) => {
            const nextId = uid("u");
            setState((s) => ({ ...s, users: [...s.users, { id: nextId, role: "employee", ...d }] }));
            setShowAdd(false);
          }}
        />
      )}
      {editing && (
        <EmployeeForm
          title="Edit Employee"
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(d) => {
            setState((s) => ({ ...s, users: s.users.map((u) => u.id === editing.id ? { ...u, ...d } : u) }));
            setEditing(null);
          }}
        />
      )}
      {assignTo && (
        <AssignForm
          employee={assignTo}
          onClose={() => setAssignTo(null)}
          onSave={(title) => {
            const taskId = uid("t");
            const notifId = uid("n");
            setState((s) => ({
              ...s,
              tasks: [...s.tasks, { id: taskId, title, assignedTo: assignTo.id, assignedToName: assignTo.name, status: "Pending", date: new Date().toISOString().slice(0, 10) }],
              notifications: [{ id: notifId, to: "employee", from: "Manager", message: `New task: ${title}`, date: new Date().toISOString().slice(0, 10), read: false }, ...s.notifications],
            }));
            setAssignTo(null);
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

function AssignForm({ employee, onSave, onClose }: { employee: User; onSave: (title: string) => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  return (
    <Modal title={`Assign Work — ${employee.name}`} onClose={onClose}>
      <div className="form-group"><label className="form-label">Task description</label>
        <textarea className="form-textarea" rows={3} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => title && onSave(title)}>Assign</button>
      </div>
    </Modal>
  );
}

function CustomersMgmt() {
  const { customers, setState, uid } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const remove = (id: string) => {
    if (!confirm("Delete this customer?")) return;
    setState((s) => ({ ...s, customers: s.customers.filter((c) => c.id !== id) }));
  };

  return (
    <>
      <h2 className="page-title">Customers</h2>
      <p className="page-sub">Add and update customer records.</p>
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">All Customers ({customers.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Customer</button>
        </div>
        <div className={customers.length > 0 ? "card-grid" : ""}>
          {customers.map((c) => (
            <div key={c.id} className="data-card">
              <div className="data-card-header">
                <div>
                  <h4 className="data-card-title">{c.name}</h4>
                  <span className="data-card-subtitle">{c.email}</span>
                </div>
                <Pill status={c.status} />
              </div>
              <div className="data-card-body">
                <div className="data-row"><span className="data-label">Phone</span><span className="data-value">{c.phone}</span></div>
                <div className="data-row"><span className="data-label">Address</span><span className="data-value" style={{ textAlign: "right", maxWidth: "60%" }}>{c.address}</span></div>
              </div>
              <div className="data-card-footer">
                <button className="btn btn-circle" onClick={() => setEditing(c)} title="Update Customer">✏️</button>
                <button className="btn btn-circle btn-circle-danger" onClick={() => remove(c.id)} title="Delete Customer">🗑️</button>
              </div>
            </div>
          ))}
          {customers.length === 0 && <div className="empty">No customers yet.</div>}
        </div>
      </div>

      {showAdd && <CustomerForm onClose={() => setShowAdd(false)} onSave={(d) => { const nextId = uid("c"); setState((s) => ({ ...s, customers: [...s.customers, { id: nextId, ...d }] })); setShowAdd(false); }} />}
      {editing && <CustomerForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => { setState((s) => ({ ...s, customers: s.customers.map((c) => c.id === editing.id ? { ...c, ...d } : c) })); setEditing(null); }} />}
    </>
  );
}

function CustomerForm({ initial, onSave, onClose }: { initial?: Customer; onSave: (d: Omit<Customer, "id">) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [status, setStatus] = useState(initial?.status ?? "Active");
  return (
    <Modal title={initial ? "Update Customer" : "Add Customer"} onClose={onClose}>
      <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
      <div className="form-group"><label className="form-label">Status</label>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Active</option><option>Contacted</option><option>Inactive</option>
        </select>
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => name && onSave({ name, email, phone, address, status })}>Save</button>
      </div>
    </Modal>
  );
}

function OrdersMgmt() {
  const { orders, customers, products, setState, uid } = useStore();
  const [show, setShow] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const remove = (id: string) => {
    if (!confirm("Delete this order?")) return;
    setState((s) => {
      const order = s.orders.find((o) => o.id === id);
      let updatedProducts = s.products;
      if (order && order.status === "Approved") {
        updatedProducts = s.products.map((p) => {
          if (p.id === order.productId || p.name.toLowerCase() === order.productName.toLowerCase()) {
            return {
              ...p,
              qty: (p.qty ?? p.stock ?? 0) + order.qty,
              stock: (p.stock ?? p.qty ?? 0) + order.qty
            };
          }
          return p;
        });
      }
      return {
        ...s,
        products: updatedProducts,
        orders: s.orders.filter((o) => o.id !== id)
      };
    });
  };

  return (
    <>
      <h2 className="page-title">Orders</h2>
      <p className="page-sub">Create new orders and send them to Super Admin for approval.</p>
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">My Orders ({orders.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShow(true)}>+ Create Order</button>
        </div>
        <div className={orders.length > 0 ? "card-grid" : ""}>
          {orders.map((o) => {
            const product = products.find(p => p.id === o.productId || p.name.toLowerCase() === o.productName.toLowerCase());
            const brandStr = product?.brand ? ` (${product.brand})` : "";
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const isProdIncentive = !!(product && (product.incentive ?? 0) > 0 && product.date && new Date(product.date) < ninetyDaysAgo);
            const isIncentiveOrder = o.isIncentive ?? isProdIncentive;

            const orderBasePrice = Math.round(o.total / (1 - ((o.discount || 0) / 100)));
            const orderUnitPrice = Math.round(orderBasePrice / o.qty);

            return (
              <div key={o.id} className="data-card">
                <div className="data-card-header">
                  <div>
                    <h4 className="data-card-title">Order #{o.id}</h4>
                    <span className="data-card-subtitle" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                      <span>{o.date}</span>
                      {isIncentiveOrder ? (
                        <span className="pill" style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde047", fontSize: "10px", padding: "2px 6px" }}>
                          ✨ Incentive {o.discount ? `(${o.discount}%)` : ""}
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
                  <div className="data-row"><span className="data-label">Customer</span><span className="data-value">{o.customerName}</span></div>
                  <div className="data-row"><span className="data-label">Product</span><span className="data-value">{o.productName}{brandStr} (x{o.qty})</span></div>
                  <div className="data-row"><span className="data-label">Unit Price</span><span className="data-value">₹{orderUnitPrice.toLocaleString()}</span></div>
                  <div className="data-row"><span className="data-label">Assigned</span><span className="data-value">{o.assignedToName ?? "—"}</span></div>
                </div>
                <div className="data-card-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "var(--brown-dark)", fontSize: 16 }}>₹{(o.total || 0).toLocaleString()}</span>
                  <div className="actions-row">
                    {o.status === "Approved" && (
                      o.sentToEmployee ? (
                        <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 600, marginRight: 8, alignSelf: "center" }}>Sent ✅</span>
                      ) : (
                        <button
                          className="btn btn-success btn-sm"
                          style={{ padding: "4px 8px", fontSize: 11, marginRight: 8 }}
                          onClick={() => {
                            setState((s) => ({
                              ...s,
                              orders: s.orders.map((order) => order.id === o.id ? { ...order, sentToEmployee: true } : order),
                              notifications: [
                                {
                                  id: uid("n"),
                                  to: "employee",
                                  from: "Manager",
                                  message: `New approved order #${o.id} sent to your updates`,
                                  date: new Date().toISOString().slice(0, 10),
                                  read: false
                                },
                                ...s.notifications
                              ]
                            }));
                          }}
                        >
                          ✉️ Send
                        </button>
                      )
                    )}
                    <button className="btn btn-circle" onClick={() => setEditingOrder(o)} title="Edit Order">✏️</button>
                    <button className="btn btn-circle btn-circle-danger" onClick={() => remove(o.id)} title="Delete Order">🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
          {orders.length === 0 && <div className="empty">No orders yet.</div>}
        </div>
      </div>

      {show && (
        <CreateOrderModal
          onClose={() => setShow(false)}
          onSave={(customerName, customerPhone, customerAddress, productId, qty, discountPct, assignedTo, assignedToName, customerBargain, docType, bookingExpiryDate) => {
            const p = products.find((p) => p.id === productId)!;
            const orderId = uid("o");
            const notifId = uid("n");
            const rawTotal = qty * p.price;
            const finalDiscount = Number(discountPct) || 0;
            const calculatedTotal = Math.round(rawTotal * (1 - finalDiscount / 100));

            setState((s) => {
              let existingCust = s.customers.find(
                (c) => c.name.trim().toLowerCase() === customerName.trim().toLowerCase()
              );
              let targetCustomerId = existingCust?.id;
              let nextCustomers = s.customers;
              if (!targetCustomerId) {
                targetCustomerId = uid("c");
                const newCust = {
                  id: targetCustomerId,
                  name: customerName.trim(),
                  phone: customerPhone.trim(),
                  address: customerAddress.trim(),
                  email: "",
                  status: "Active"
                };
                nextCustomers = [...s.customers, newCust];
              } else {
                nextCustomers = s.customers.map(c => c.id === targetCustomerId ? {
                  ...c,
                  phone: customerPhone.trim() || c.phone,
                  address: customerAddress.trim() || c.address
                } : c);
              }
              const finalCustomerName = existingCust ? existingCust.name : customerName.trim();
              const docLabel = docType === "Bill" ? "Bill" : "Order Copy";
              const expiryStr = docType === "Order Copy" && bookingExpiryDate ? ` (Valid Until: ${bookingExpiryDate})` : "";
              return {
                ...s,
                customers: nextCustomers,
                orders: [
                  ...s.orders,
                  {
                    id: orderId,
                    customerId: targetCustomerId,
                    customerName: finalCustomerName,
                    productId,
                    productName: p.name,
                    qty,
                    discount: finalDiscount,
                    total: calculatedTotal,
                    createdBy: "manager",
                    status: "Pending",
                    date: new Date().toISOString().slice(0, 10),
                    assignedTo,
                    assignedToName,
                    customerBargain,
                    docType,
                    bookingExpiryDate
                  }
                ],
                notifications: [
                  {
                    id: notifId,
                    to: "superadmin",
                    from: "Manager",
                    message: `New ${docLabel} order pending for ${finalCustomerName}${expiryStr}`,
                    date: new Date().toISOString().slice(0, 10),
                    read: false
                  },
                  ...s.notifications
                ]
              };
            });
            setShow(false);
          }}
        />
      )}

      {editingOrder && (
        <CreateOrderModal
          initial={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={(customerName, customerPhone, customerAddress, productId, qty, discountPct, assignedTo, assignedToName, customerBargain, docType, bookingExpiryDate) => {
            const p = products.find((p) => p.id === productId)!;
            const rawTotal = qty * p.price;
            const finalDiscount = Number(discountPct) || 0;
            const calculatedTotal = Math.round(rawTotal * (1 - finalDiscount / 100));

            setState((s) => {
              let existingCust = s.customers.find(
                (c) => c.name.trim().toLowerCase() === customerName.trim().toLowerCase()
              );
              let targetCustomerId = existingCust?.id;
              let nextCustomers = s.customers;
              if (!targetCustomerId) {
                targetCustomerId = uid("c");
                const newCust = {
                  id: targetCustomerId,
                  name: customerName.trim(),
                  phone: customerPhone.trim(),
                  address: customerAddress.trim(),
                  email: "",
                  status: "Active"
                };
                nextCustomers = [...s.customers, newCust];
              } else {
                nextCustomers = s.customers.map(c => c.id === targetCustomerId ? {
                  ...c,
                  phone: customerPhone.trim() || c.phone,
                  address: customerAddress.trim() || c.address
                } : c);
              }
              const finalCustomerName = existingCust ? existingCust.name : customerName.trim();
              const oldOrder = s.orders.find((o) => o.id === editingOrder.id);
              let updatedProducts = s.products;
              if (oldOrder && oldOrder.status === "Approved") {
                updatedProducts = s.products.map((p) => {
                  if (p.id === oldOrder.productId || p.name.toLowerCase() === oldOrder.productName.toLowerCase()) {
                    return {
                      ...p,
                      qty: (p.qty ?? p.stock ?? 0) + oldOrder.qty,
                      stock: (p.stock ?? p.qty ?? 0) + oldOrder.qty
                    };
                  }
                  return p;
                });
              }
              return {
                ...s,
                products: updatedProducts,
                customers: nextCustomers,
                orders: s.orders.map((o) => o.id === editingOrder.id ? {
                  ...o,
                  customerId: targetCustomerId,
                  customerName: finalCustomerName,
                  productId,
                  productName: p.name,
                  qty,
                  discount: finalDiscount,
                  total: calculatedTotal,
                  assignedTo,
                  assignedToName,
                  customerBargain,
                  docType,
                  bookingExpiryDate,
                  status: "Pending" // Reset to Pending on edit so Super Admin approves/rejects again
                } : o),
              };
            });
            setEditingOrder(null);
          }}
        />
      )}
    </>
  );
}

function CreateOrderModal({ initial, onSave, onClose }: { initial?: Order; onSave: (customerName: string, customerPhone: string, customerAddress: string, productId: string, qty: number, discountPct: number, assignedTo: string, assignedToName: string, customerBargain?: string, docType?: "Bill" | "Order Copy" | "Estimate", bookingExpiryDate?: string) => void; onClose: () => void }) {
  const { customers, products, users } = useStore();
  const active = useMemo(() => {
    if (!products || products.length === 0) return [];
    const filtered = products.filter((p) => !p.status || p.status === "Active" || p.status === "Verified" || p.status === "In Stock" || p.status.toLowerCase() !== "inactive");
    return filtered.length > 0 ? filtered : products;
  }, [products]);
  const employees = users.filter((u) => u.role === "employee");

  const initialCust = customers.find(c => c.id === initial?.customerId || c.name.toLowerCase() === initial?.customerName?.toLowerCase());

  const [customerName, setCustomerName] = useState(initial?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(initialCust?.phone ?? "");
  const [customerAddress, setCustomerAddress] = useState(initialCust?.address ?? "");
  const [productId, setProductId] = useState(initial?.productId ?? active[0]?.id ?? "");

  useEffect(() => {
    if (!productId && active.length > 0) {
      setProductId(active[0].id);
    }
  }, [active, productId]);
  const [qty, setQty] = useState(initial?.qty ?? 1);
  const [discountPct, setDiscountPct] = useState<number | string>(initial?.discount ?? 0);
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? employees[0]?.id ?? "");
  const [customerBargain, setCustomerBargain] = useState(initial?.customerBargain ?? "");
  const [docType, setDocType] = useState<"Bill" | "Order Copy" | "Estimate">(initial?.docType ?? "Bill");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Online" | "Financial">(initial?.paymentMode ?? initial?.estimateType ?? "Cash");
  const [estimateType, setEstimateType] = useState<"Cash" | "Online" | "Financial">(initial?.estimateType ?? initial?.paymentMode ?? "Cash");
  const [bookingExpiryDate, setBookingExpiryDate] = useState(
    initial?.bookingExpiryDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const selectedProduct = active.find((p) => p.id === productId);

  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    const existing = customers.find((c) => c.name.trim().toLowerCase() === val.trim().toLowerCase());
    if (existing) {
      if (existing.phone) setCustomerPhone(existing.phone);
      if (existing.address) setCustomerAddress(existing.address);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }
    if (!customerPhone.trim()) {
      alert("Please enter customer phone number");
      return;
    }
    if (!productId) {
      alert("Please select a product");
      return;
    }
    const emp = employees.find((u) => u.id === assignedTo);
    onSave(
      customerName.trim(),
      customerPhone.trim(),
      customerAddress.trim(),
      productId,
      qty,
      Number(discountPct) || 0,
      assignedTo,
      emp?.name ?? "",
      customerBargain.trim(),
      docType,
      docType === "Order Copy" ? bookingExpiryDate : undefined
    );
  };

  /* ── Styles matching screenshot exactly ── */
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
    transition: "border-color .2s, box-shadow .2s"
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
            }}>🛒</div>
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
        <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "22px 26px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* CUSTOMER NAME */}
          <div>
            <div style={sectionLabel}>👤 CUSTOMER NAME *</div>
            <input
              type="text"
              list="mgr-cust-datalist"
              placeholder="Type customer name"
              value={customerName}
              onChange={(e) => handleCustomerNameChange(e.target.value)}
              style={inputStyle}
            />
            <datalist id="mgr-cust-datalist">
              {customers.map((c) => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>

          {/* PHONE NUMBER */}
          <div>
            <div style={sectionLabel}>📱 PHONE NUMBER *</div>
            <input
              type="text"
              placeholder="Enter customer phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* ADDRESS */}
          <div>
            <div style={sectionLabel}>📍 ADDRESS</div>
            <input
              type="text"
              placeholder="Enter address (optional)"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* SELECT PRODUCT */}
          <div>
            <div style={sectionLabel}>📦 SELECT PRODUCT *</div>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} style={selectStyle}>
              {active.map((p) => (
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
              </div>
            )}
          </div>

          {/* QUANTITY & DISCOUNT GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <div style={sectionLabel}>🔢 QUANTITY *</div>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={sectionLabel}>💰 DISCOUNT (%)</div>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0%"
                style={inputStyle}
              />
            </div>
          </div>

          {/* ASSIGN EMPLOYEE */}
          <div>
            <div style={sectionLabel}>👨‍💼 ASSIGN EMPLOYEE</div>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={selectStyle}>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>

          {/* DOCUMENT TYPE */}
          <div>
              <div style={sectionLabel}>📋 Document Type & Payment Mode *</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {/* Bill Dropdown */}
                <div style={{ flex: "1 1 110px" }}>
                  <select
                    value={docType === "Bill" ? paymentMode : ""}
                    onChange={(e) => {
                      setDocType("Bill");
                      const mode = e.target.value as any;
                      setPaymentMode(mode);
                      setEstimateType(mode);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "50px",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: "13px",
                      transition: "all .2s",
                      background: docType === "Bill" ? "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" : "#FFFFFF",
                      color: docType === "Bill" ? "#FFFFFF" : "#475569",
                      border: docType === "Bill" ? "none" : "1.5px solid #E2E8F0",
                      boxShadow: docType === "Bill" ? "0 6px 18px rgba(168, 85, 247, 0.35)" : "none",
                      outline: "none",
                      appearance: "none",
                      backgroundImage: docType === "Bill"
                        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%23FFFFFF' viewBox='0 0 16 16'%3E%3Cpath d='M1.5 5.5l6.5 6 6.5-6'/%3E%3C/svg%3E")`
                        : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%23475569' viewBox='0 0 16 16'%3E%3Cpath d='M1.5 5.5l6.5 6 6.5-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "28px",
                      textAlign: "center"
                    }}
                  >
                    {docType !== "Bill" && <option value="" disabled hidden>🧾 Bill ▾</option>}
                    <option value="Cash" style={{ background: "#FFF", color: "#1E293B", fontWeight: 600 }}>💵 Bill (Cash)</option>
                    <option value="Online" style={{ background: "#FFF", color: "#1E293B", fontWeight: 600 }}>💳 Bill (Online)</option>
                    <option value="Financial" style={{ background: "#FFF", color: "#1E293B", fontWeight: 600 }}>🏦 Bill (Financial)</option>
                  </select>
                </div>

                {/* Order Copy Dropdown */}
                <div style={{ flex: "1 1 125px" }}>
                  <select
                    value={docType === "Order Copy" ? paymentMode : ""}
                    onChange={(e) => {
                      setDocType("Order Copy");
                      const mode = e.target.value as any;
                      setPaymentMode(mode);
                      setEstimateType(mode);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "50px",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: "13px",
                      transition: "all .2s",
                      background: docType === "Order Copy" ? "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" : "#FFFFFF",
                      color: docType === "Order Copy" ? "#FFFFFF" : "#475569",
                      border: docType === "Order Copy" ? "none" : "1.5px solid #E2E8F0",
                      boxShadow: docType === "Order Copy" ? "0 6px 18px rgba(168, 85, 247, 0.35)" : "none",
                      outline: "none",
                      appearance: "none",
                      backgroundImage: docType === "Order Copy"
                        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%23FFFFFF' viewBox='0 0 16 16'%3E%3Cpath d='M1.5 5.5l6.5 6 6.5-6'/%3E%3C/svg%3E")`
                        : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%23475569' viewBox='0 0 16 16'%3E%3Cpath d='M1.5 5.5l6.5 6 6.5-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "28px",
                      textAlign: "center"
                    }}
                  >
                    {docType !== "Order Copy" && <option value="" disabled hidden>📄 Order Copy ▾</option>}
                    <option value="Cash" style={{ background: "#FFF", color: "#1E293B", fontWeight: 600 }}>💵 Order Copy (Cash)</option>
                    <option value="Online" style={{ background: "#FFF", color: "#1E293B", fontWeight: 600 }}>💳 Order Copy (Online)</option>
                    <option value="Financial" style={{ background: "#FFF", color: "#1E293B", fontWeight: 600 }}>🏦 Order Copy (Financial)</option>
                  </select>
                </div>

                {/* Estimate Dropdown */}
                <div style={{ flex: "1 1 120px" }}>
                  <select
                    value={docType === "Estimate" ? paymentMode : ""}
                    onChange={(e) => {
                      setDocType("Estimate");
                      const mode = e.target.value as any;
                      setPaymentMode(mode);
                      setEstimateType(mode);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "50px",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: "13px",
                      transition: "all .2s",
                      background: docType === "Estimate" ? "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" : "#FFFFFF",
                      color: docType === "Estimate" ? "#FFFFFF" : "#475569",
                      border: docType === "Estimate" ? "none" : "1.5px solid #E2E8F0",
                      boxShadow: docType === "Estimate" ? "0 6px 18px rgba(168, 85, 247, 0.35)" : "none",
                      outline: "none",
                      appearance: "none",
                      backgroundImage: docType === "Estimate"
                        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%23FFFFFF' viewBox='0 0 16 16'%3E%3Cpath d='M1.5 5.5l6.5 6 6.5-6'/%3E%3C/svg%3E")`
                        : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%23475569' viewBox='0 0 16 16'%3E%3Cpath d='M1.5 5.5l6.5 6 6.5-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "28px",
                      textAlign: "center"
                    }}
                  >
                    {docType !== "Estimate" && <option value="" disabled hidden>🏷️ Estimate ▾</option>}
                    <option value="Cash" style={{ background: "#FFF", color: "#1E293B", fontWeight: 600 }}>💵 Estimate (Cash)</option>
                    <option value="Online" style={{ background: "#FFF", color: "#1E293B", fontWeight: 600 }}>💳 Estimate (Online)</option>
                    <option value="Financial" style={{ background: "#FFF", color: "#1E293B", fontWeight: 600 }}>🏦 Estimate (Financial)</option>
                  </select>
                </div>
              </div>
            </div>

          {/* BOOKING EXPIRY DATE IF ORDER COPY */}
          {docType === "Order Copy" && (
            <div style={{
              background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", padding: "16px",
              borderRadius: "20px", border: "1.5px solid #DDD6FE",
              display: "flex", flexDirection: "column", gap: "10px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: "#6D28D9" }}>⏳ Booking Expiry Date *</span>
                <span style={{
                  fontSize: "12px", fontWeight: 700, color: "#7C3AED",
                  background: "rgba(124, 58, 237, 0.1)", padding: "4px 10px", borderRadius: "8px"
                }}>
                  📅 {bookingExpiryDate ? new Date(bookingExpiryDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Select Date"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
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
                    <button key={preset.days} type="button" onClick={() => setBookingExpiryDate(iso)} style={{
                      padding: "5px 12px", borderRadius: "10px",
                      border: isSelected ? "none" : "1px solid #C4B5FD",
                      background: isSelected ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)" : "#fff",
                      color: isSelected ? "#fff" : "#6D28D9",
                      fontSize: "11px", fontWeight: 700, cursor: "pointer",
                      boxShadow: isSelected ? "0 3px 8px rgba(124, 58, 237, 0.3)" : "none",
                      transition: "all .2s"
                    }}>{preset.label}</button>
                  );
                })}
              </div>

              <input
                type="date" value={bookingExpiryDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setBookingExpiryDate(e.target.value)}
                style={{ ...inputStyle, background: "#fff", border: "1.5px solid #C4B5FD" }}
              />
              <span style={{ fontSize: "11px", color: "#7C3AED", fontWeight: 500 }}>
                Expiration alert will be sent to Admin if not fulfilled by this date.
              </span>
            </div>
          )}

          {/* BARGAINING / REMARKS */}
          <div>
            <div style={sectionLabel}>✍️ BARGAINING / REMARKS</div>
            <input
              type="text"
              placeholder="E.g. Wants 10% discount or ₹80 off..."
              value={customerBargain}
              onChange={(e) => setCustomerBargain(e.target.value)}
              style={inputStyle}
            />
          </div>

        </div>

        {/* ── Footer Buttons ── */}
        <div style={{
          padding: "16px 26px 20px",
          borderTop: "1px solid #F1F5F9",
          display: "flex", justifyContent: "flex-end", gap: "12px",
          flexShrink: 0, background: "#FAFAFA"
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "12px 24px",
              borderRadius: "50px",
              border: "1.5px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#475569",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            ✕ Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: "12px 24px",
              borderRadius: "50px",
              border: "none",
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "14px",
              boxShadow: "0 8px 24px rgba(168, 85, 247, 0.4)",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            🚀 {initial ? "Save Changes" : "Submit Order for Approval"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ProductsAvail() {
  const { products, setState, uid } = useStore();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [viewingBatches, setViewingBatches] = useState<Product & { batches: Product[] } | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Products");
  const [stockFilter, setStockFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

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

      <div className="panel" style={{ margin: 0 }}>
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
                        {p.warranty && <span> · Size: {p.warranty}</span>}
                        {p.model && <span> · Model: {p.model}</span>}
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
                    <td>₹{(p.cost || 0).toLocaleString()}</td>
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
                          localStorage.setItem("product_detail_role", "manager");
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

      {editing && (
        <ProductForm
          title="Edit Product"
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(d) => {
            setState((s) => ({
              ...s,
              products: s.products.map((p) => (p.id === editing.id ? { ...p, ...d } : p))
            }));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
