import { useEffect, useState } from "react";
import { useStore } from "../app/store";
import { ProductForm } from "./SuperAdminPage";
import { getAutoProductImage } from "../utils/autoProductImage";
import { useIsMobile } from "../hooks/use-mobile";
import { doc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

interface Batch {
  id?: string;
  date?: string;
  qty?: number;
  stock?: number;
  cost?: number;
  incentive?: number;
  supplier?: string;
  status?: string;
  location?: string;
  _index?: number;
}

interface ProductData extends Batch {
  name: string;
  sku?: string;
  brand?: string;
  category?: string;
  warranty?: string;
  image?: string;
  price?: number;
  batches?: Batch[];
}

export function ProductDetailPage() {
  const isMobile = useIsMobile();
  const [data, setData] = useState<ProductData | null>(null);
  const [role, setRole] = useState<string>("superadmin");
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductSku, setEditProductSku] = useState("");
  const [editProductBrand, setEditProductBrand] = useState("");
  const [editProductCategory, setEditProductCategory] = useState("");
  const [editProductWarranty, setEditProductWarranty] = useState("");
  const { setState } = useStore();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("product_detail_preview");
      if (raw) setData(JSON.parse(raw));

      const r = localStorage.getItem("product_detail_role");
      if (r) {
        setRole(r);
      } else {
        const userRaw = sessionStorage.getItem("sham_current_user_v2") || localStorage.getItem("sham_current_user_v2");
        if (userRaw) {
          const u = JSON.parse(userRaw);
          setRole(u.role || "superadmin");
        }
      }
    } catch { /* ignore */ }
  }, []);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = (role === "manager") ? "/manager?tab=products" : "/super-admin?tab=products";
    }
  };

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Work Sans', sans-serif", background: "#F1F5F9" }}>
        <div style={{ textAlign: "center", color: "#64748B" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>No product data found.</p>
          <button
            onClick={handleBack}
            style={{ marginTop: 16, background: "#7C3AED", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}
          >
            ← Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = role === "superadmin" || role === "admin";
  const batchList: Batch[] = (data.batches && data.batches.length > 0) ? data.batches : [data];
  const totalStock = data.qty ?? data.stock ?? 0;
  const defaultImg = "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600";

  // Pricing / Cost Analysis calculations
  const costs = batchList.map(b => b.cost || 0).filter(c => c > 0);
  const minCost = costs.length > 0 ? Math.min(...costs) : 0;
  const maxCost = costs.length > 0 ? Math.max(...costs) : 0;
  const costDifference = maxCost - minCost;
  const averageCost = costs.length > 0 ? costs.reduce((sum, val) => sum + val, 0) / costs.length : 0;

  const startEditingBatch = (b: Batch, idx: number) => {
    setEditingBatch({ ...b, _index: idx });
    setEditProductName(data?.name || "");
    setEditProductSku(data?.sku || "");
    setEditProductBrand(data?.brand || "");
    setEditProductCategory(data?.category || "Electronics");
    setEditProductWarranty(data?.warranty || "");
  };

  const handleDeleteEntireProduct = async () => {
    if (!confirm(`Are you sure you want to permanently delete product "${data.name}" and all its batches?`)) return;

    const idsToDelete = new Set<string>();
    if (data.id) idsToDelete.add(data.id);
    if (Array.isArray(data.batches)) {
      data.batches.forEach(b => {
        if (b.id) idsToDelete.add(b.id);
      });
    }

    try {
      for (const id of idsToDelete) {
        await deleteDoc(doc(db, "products", id));
      }
    } catch (err) {
      console.error("Error deleting product from Firestore:", err);
    }

    setState((s) => ({
      ...s,
      products: s.products.filter(
        (p) =>
          !idsToDelete.has(p.id) &&
          !(data.sku && p.sku && p.sku.toLowerCase() === data.sku.toLowerCase()) &&
          !(data.name && p.name && p.name.toLowerCase().trim() === data.name.toLowerCase().trim())
      )
    }));

    localStorage.removeItem("product_detail_preview");
    alert("Product deleted successfully.");
    handleBack();
  };

  const handleDeleteBatch = async (idx: number) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;

    const targetBatch = batchList[idx];
    const targetBatchId = targetBatch?.id;
    const updatedBatches = [...batchList];
    updatedBatches.splice(idx, 1);

    if (updatedBatches.length === 0) {
      const idsToDelete = new Set<string>();
      if (data.id) idsToDelete.add(data.id);
      if (targetBatchId) idsToDelete.add(targetBatchId);
      if (Array.isArray(data.batches)) {
        data.batches.forEach((b) => {
          if (b.id) idsToDelete.add(b.id);
        });
      }

      try {
        for (const id of idsToDelete) {
          await deleteDoc(doc(db, "products", id));
        }
      } catch (err) {
        console.error("Error deleting batch from Firestore:", err);
      }

      setState((s) => ({
        ...s,
        products: s.products.filter(
          (p) =>
            !idsToDelete.has(p.id) &&
            !(data.sku && p.sku && p.sku.toLowerCase() === data.sku.toLowerCase()) &&
            !(data.name && p.name && p.name.toLowerCase().trim() === data.name.toLowerCase().trim())
        )
      }));

      localStorage.removeItem("product_detail_preview");
      alert("Product deleted successfully.");
      handleBack();
      return;
    }

    const newQty = updatedBatches.reduce((acc, item) => acc + (item.qty ?? item.stock ?? 0), 0);
    const updatedData = { ...data, qty: newQty, stock: newQty, batches: updatedBatches };

    if (targetBatchId && targetBatchId !== data.id) {
      try {
        await deleteDoc(doc(db, "products", targetBatchId));
      } catch (err) {
        console.error("Error deleting batch document from Firestore:", err);
      }
    }

    if (data.id) {
      try {
        const clean: any = {};
        Object.keys(updatedData).forEach((key) => {
          if ((updatedData as any)[key] !== undefined) clean[key] = (updatedData as any)[key];
        });
        await setDoc(doc(db, "products", data.id), clean, { merge: true });
      } catch (err) {
        console.error("Error updating product in Firestore:", err);
      }
    }

    setState((s) => ({
      ...s,
      products: s.products
        .filter((p) => (targetBatchId && targetBatchId !== data.id ? p.id !== targetBatchId : true))
        .map((p) => (p.id === data.id ? ({ ...p, ...updatedData } as any) : p))
    }));

    setData(updatedData);
    localStorage.setItem("product_detail_preview", JSON.stringify(updatedData));
  };

  const handleSaveBatchEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch || editingBatch._index === undefined) return;

    const idx = editingBatch._index;
    const updatedBatches = [...batchList];
    const bToSave = { ...editingBatch };
    delete bToSave._index;

    updatedBatches[idx] = bToSave;

    const newQty = updatedBatches.reduce((acc, item) => acc + (item.qty ?? item.stock ?? 0), 0);
    const updatedData = {
      ...data,
      name: editProductName,
      sku: editProductSku,
      brand: editProductBrand,
      category: editProductCategory,
      warranty: editProductWarranty,
      ...bToSave,
      qty: newQty,
      stock: newQty,
      batches: updatedBatches
    };

    if (data.id) {
      try {
        const clean: any = {};
        Object.keys(updatedData).forEach((key) => {
          if ((updatedData as any)[key] !== undefined) clean[key] = (updatedData as any)[key];
        });
        await setDoc(doc(db, "products", data.id), clean, { merge: true });
      } catch (err) {
        console.error("Error updating product in Firestore:", err);
      }
    }

    setState((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === data.id ? ({ ...p, ...updatedData } as any) : p))
    }));

    setData(updatedData);
    localStorage.setItem("product_detail_preview", JSON.stringify(updatedData));
    setEditingBatch(null);
  };

  return (
    <div style={{ height: "100vh", maxHeight: "100vh", overflowY: "auto", background: "#F1F5F9", fontFamily: "'Work Sans', system-ui, sans-serif", padding: "32px 20px 60px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.15)",
            border: "1px solid #E2E8F0"
          }}
        >
          {isMobile ? (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <button
                  onClick={handleBack}
                  style={{
                    background: "#F5F3FF",
                    border: "1px solid #E9D8FD",
                    borderRadius: "12px",
                    color: "#7C3AED",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  ← Back
                </button>
                {isAdmin && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={handleDeleteEntireProduct}
                      title="Delete Product"
                      style={{
                        background: "#FEF2F2",
                        border: "1px solid #FECACA",
                        borderRadius: "10px",
                        color: "#DC2626",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      🗑️ Delete
                    </button>
                    <span style={{ background: "#F3EEFF", color: "#7C3AED", border: "1px solid #C7D2FE", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                      👑 Admin Mode
                    </span>
                  </div>
                )}
              </div>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#5B21B6", lineHeight: 1.3 }}>
                Product & Batch Details
              </h1>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button
                  onClick={handleBack}
                  style={{
                    background: "#F5F3FF",
                    border: "1px solid #E9D8FD",
                    borderRadius: "12px",
                    color: "#7C3AED",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  ← Back
                </button>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#5B21B6" }}>
                  Product & Batch Details
                </h1>
              </div>
              {isAdmin && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={handleDeleteEntireProduct}
                    title="Delete this product and all its batches"
                    style={{
                      background: "#FEF2F2",
                      border: "1px solid #FECACA",
                      borderRadius: "10px",
                      color: "#DC2626",
                      padding: "7px 14px",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#FEE2E2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#FEF2F2";
                    }}
                  >
                    🗑️ Delete Product
                  </button>
                  <span style={{ background: "#F3EEFF", color: "#7C3AED", border: "1px solid #C7D2FE", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 700 }}>
                    👑 Admin Mode
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Top Product Summary Card (Light Blue) */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #F3EEFF",
              borderRadius: "16px",
              padding: isMobile ? "18px 16px" : "24px",
              marginBottom: "24px",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              gap: isMobile ? "16px" : "24px"
            }}
          >
            {isMobile ? (
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "70px", height: "70px", borderRadius: "14px", stroke: "#E9D8FD", flexShrink: 0, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={getAutoProductImage(data.name, data.brand, data.category, data.image)}
                    alt={data.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getAutoProductImage(data.name, data.brand, data.category);
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#5B21B6", textTransform: "capitalize" }}>
                  {data.name}
                </h2>
              </div>
            ) : (
              <div style={{ width: "90px", height: "90px", borderRadius: "16px", stroke: "#E9D8FD", flexShrink: 0, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={getAutoProductImage(data.name, data.brand, data.category, data.image)}
                  alt={data.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getAutoProductImage(data.name, data.brand, data.category);
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
            )}

            <div style={{ flex: 1, width: "100%" }}>
              {!isMobile && (
                <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", fontWeight: 900, color: "#5B21B6", textTransform: "capitalize" }}>
                  {data.name}
                </h2>
              )}

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(130px, 1fr))", gap: isMobile ? "10px 14px" : "12px 20px", fontSize: "14px" }}>
                <div>
                  <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>SKU</span>
                  <strong style={{ color: "#5B21B6" }}>{data.sku || "—"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Brand</span>
                  <strong style={{ color: "#5B21B6" }}>{data.brand || "—"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Category</span>
                  <strong style={{ color: "#5B21B6" }}>{data.category || "Electronics"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Size</span>
                  <strong style={{ color: "#5B21B6" }}>{data.warranty || "—"}</strong>
                </div>
                {data.model && (
                  <div>
                    <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Model</span>
                    <strong style={{ color: "#5B21B6" }}>{data.model}</strong>
                  </div>
                )}
                <div>
                  <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Location</span>
                  <strong style={{ color: "#5B21B6" }}>{data.location || "Shop"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Total Stock</span>
                  <strong style={{ fontSize: isMobile ? "22px" : "26px", color: "#7C3AED", fontWeight: 900 }}>{totalStock}</strong>
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 800, color: "#5B21B6" }}>
            Batch History
          </h3>

          <div style={{ overflowX: "auto", borderRadius: "14px", border: "1px solid #E2E8F0", marginBottom: "24px", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", minWidth: "550px", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#F0F5FF", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "14px 18px", textAlign: "left", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>DATE ADDED</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>QUANTITY</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>UNIT COST</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>SUPPLIER</th>
                  <th style={{ padding: "14px 18px", textAlign: "left", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>STATUS</th>
                  {isAdmin && (
                    <th style={{ padding: "14px 18px", textAlign: "right", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>ACTIONS</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {batchList.map((b, idx) => (
                  <tr key={b.id || idx} style={{ borderBottom: idx === batchList.length - 1 ? "none" : "1px solid #F1F5F9", background: idx % 2 === 0 ? "#FFFFFF" : "#FAFCFF" }}>
                    <td style={{ padding: "16px 18px" }}>
                      <div style={{ fontWeight: 600, color: "#1E293B" }}>
                        {b.date ? new Date(b.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </div>
                      {idx === batchList.length - 1 && (
                        <div style={{ fontSize: "10px", color: "#7C3AED", marginTop: "2px", fontWeight: 700 }}>Latest Batch</div>
                      )}
                    </td>
                    <td style={{ padding: "16px 18px", fontWeight: 700, fontSize: "16px", color: "#1E293B" }}>{b.qty ?? b.stock ?? 0}</td>
                    <td style={{ padding: "16px 18px", color: "#1E293B" }}>₹{(b.cost || 0).toLocaleString()}</td>
                    <td style={{ padding: "16px 18px", color: "#475569" }}>{b.supplier || "—"}</td>
                    <td style={{ padding: "16px 18px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#F5F3FF",
                          color: "#7C3AED",
                          border: "1px solid #E9D8FD",
                          borderRadius: "999px",
                          fontSize: "12px",
                          padding: "4px 12px",
                          fontWeight: 700
                        }}
                      >
                        🛡 {b.status || "Verified"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: "16px 18px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => startEditingBatch(b, idx)}
                            title="Edit Batch"
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              border: "1px solid #E9D8FD",
                              background: "#FFFFFF",
                              color: "#7C3AED",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px"
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(idx)}
                            title="Delete Batch"
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              border: "1px solid #FECACA",
                              background: "#FFFFFF",
                              color: "#EF4444",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px"
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing & Difference Analytics Section */}
          <div
            style={{
              marginTop: "20px",
              background: "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)",
              border: "1px solid #BBF7D0",
              borderRadius: "16px",
              padding: isMobile ? "14px 16px" : "20px",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              justifyContent: "space-between",
              gap: "14px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>📊</span>
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#166534" }}>Pricing & Cost Analysis</h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#15803D", fontWeight: 500 }}>
                  Calculated across {costs.length} active batch{costs.length > 1 ? "es" : ""}.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", width: isMobile ? "100%" : "auto" }}>
              <div style={{ background: "#FFFFFF", padding: "10px 14px", borderRadius: "12px", border: "1px solid #DCFCE7", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "10px", color: "#15803D", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>Average Cost</span>
                <div style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 900, color: "#166534", marginTop: "2px" }}>
                  ₹{averageCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
              </div>

              {costs.length > 1 && (
                <div style={{ background: "#FFFFFF", padding: "10px 14px", borderRadius: "12px", border: "1px solid #DCFCE7", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10px", color: "#B91C1C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block" }}>Price Difference</span>
                  <div style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 900, color: "#B91C1C", marginTop: "2px" }}>
                    ₹{costDifference.toLocaleString()}
                  </div>
                  <span style={{ fontSize: "10px", color: "#991B1B", fontWeight: 600, display: "block", marginTop: "1px" }}>
                    ({minCost.toLocaleString()} - {maxCost.toLocaleString()})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingBatch && (
        <ProductForm
          title="Edit Stock Entry"
          initial={{
            ...editingBatch,
            name: editProductName || data.name,
            sku: editProductSku || data.sku,
            brand: editProductBrand || data.brand,
            category: editProductCategory || data.category,
            warranty: editProductWarranty || data.warranty
          } as any}
          onClose={() => setEditingBatch(null)}
          onSave={(formData) => {
            if (!editingBatch || editingBatch._index === undefined) return;

            const idx = editingBatch._index;
            const updatedBatches = [...batchList];
            const bToSave = {
              ...editingBatch,
              ...formData
            };
            delete bToSave._index;

            updatedBatches[idx] = bToSave;

            const newQty = updatedBatches.reduce((acc, item) => acc + (item.qty ?? item.stock ?? 0), 0);
            const updatedData = {
              ...data,
              ...bToSave,
              name: formData.name,
              sku: formData.sku,
              brand: formData.brand,
              category: formData.category,
              warranty: formData.warranty,
              qty: newQty,
              stock: newQty,
              batches: updatedBatches
            };

            setState((s) => ({
              ...s,
              products: s.products.map((p) => (p.id === data.id ? ({ ...p, ...updatedData } as any) : p))
            }));

            setData(updatedData as any);
            localStorage.setItem("product_detail_preview", JSON.stringify(updatedData));
            setEditingBatch(null);
          }}
        />
      )}
    </div>
  );
}
