export function ProductBatchDetailsModal({
  product,
  isAdmin = true,
  onClose,
  onEditBatch,
  onDeleteBatch,
}: {
  product: any;
  isAdmin?: boolean;
  onClose: () => void;
  onEditBatch?: (batch: any) => void;
  onDeleteBatch?: (batchId: any) => void;
}) {
  if (!product) return null;

  const batchList = (product.batches && product.batches.length > 0) ? product.batches : [product];
  const totalStock = product.qty ?? product.stock ?? 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "24px",
          maxWidth: "850px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px 32px",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          border: "1px solid #E2E8F0",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#5B21B6" }}>
            Product & Batch Details
          </h2>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              color: "#64748B",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            ✕
          </button>
        </div>

        {/* Top Product Summary Card (Light Blue) */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #F3EEFF",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "24px"
          }}
        >
          {/* Info Grid */}
          <div>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "20px", fontWeight: 800, color: "#5B21B6", textTransform: "capitalize" }}>
              {product.name}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px 16px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>SKU</span>
                <strong style={{ color: "#5B21B6" }}>{product.sku || "—"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Brand</span>
                <strong style={{ color: "#5B21B6" }}>{product.brand || "—"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Category</span>
                <strong style={{ color: "#5B21B6" }}>{product.category || "Electronics"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Warranty</span>
                <strong style={{ color: "#5B21B6" }}>{product.warranty || "—"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Location</span>
                <strong style={{ color: "#5B21B6" }}>{product.location || "Shop"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748B", fontWeight: 500, marginRight: 6 }}>Total Stock</span>
                <strong style={{ fontSize: "24px", color: "#7C3AED", fontWeight: 800 }}>{totalStock}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Scanned Barcodes / Serial Numbers Section */}
        {(() => {
          const serialList: string[] = Array.isArray(product.serialNumbers) && product.serialNumbers.length > 0
            ? product.serialNumbers
            : (product.id ? (() => { try { return JSON.parse(localStorage.getItem(`sham_serials_${product.id}`) || "[]"); } catch { return []; } })() : []);
          
          const validSerials = serialList.filter(s => s && s.trim());
          if (validSerials.length === 0) return null;

          return (
            <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: "16px", padding: "16px 20px", marginBottom: "24px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 800, color: "#6D28D9", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🏷️ Scanned Barcodes / Serial Numbers ({validSerials.length} Items)
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {serialList.map((sn, idx) => (
                  sn && sn.trim() ? (
                    <div key={idx} style={{ background: "#FFFFFF", border: "1.5px solid #C4B5FD", padding: "5px 14px", borderRadius: "20px", fontSize: "12.5px", fontWeight: 700, color: "#7C3AED", boxShadow: "0 2px 4px rgba(124, 58, 237, 0.08)" }}>
                      Item #{idx + 1}: <span style={{ color: "#1E293B" }}>{sn}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          );
        })()}

        {/* Batch History Section */}
        <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 800, color: "#5B21B6" }}>
          Batch History
        </h4>

        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #E2E8F0", marginBottom: "24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#F0F5FF", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>DATE ADDED</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>QUANTITY</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>UNIT COST</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>SUPPLIER</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>STATUS</th>
                {isAdmin && (
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "#5B21B6", fontWeight: 700, fontSize: "11px", letterSpacing: "0.5px" }}>ACTIONS</th>
                )}
              </tr>
            </thead>
            <tbody>
              {batchList.map((b: any, idx: number) => (
                <tr key={b.id || idx} style={{ borderBottom: idx === batchList.length - 1 ? "none" : "1px solid #F1F5F9", background: idx % 2 === 0 ? "#FFFFFF" : "#FAFCFF" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#1E293B" }}>
                      {b.date ? new Date(b.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </div>
                    {idx === batchList.length - 1 && (
                      <div style={{ fontSize: "10px", color: "#7C3AED", marginTop: "2px", fontWeight: 700 }}>Latest Batch</div>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "15px", color: "#1E293B" }}>{b.qty ?? b.stock ?? 0}</td>
                  <td style={{ padding: "14px 16px", color: "#1E293B" }}>₹{(b.cost || 0).toLocaleString()}</td>
                  <td style={{ padding: "14px 16px", color: "#475569" }}>{b.supplier || "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
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
                        padding: "4px 10px",
                        fontWeight: 700
                      }}
                    >
                      🛡 {b.status || "Verified"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => onEditBatch?.(b)}
                          title="Edit Batch"
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            border: "1px solid #E9D8FD",
                            background: "#FFFFFF",
                            color: "#7C3AED",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            transition: "all 0.2s"
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDeleteBatch?.(b.id || idx)}
                          title="Delete Batch"
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            border: "1px solid #FECACA",
                            background: "#FFFFFF",
                            color: "#EF4444",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            transition: "all 0.2s"
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

        {/* Bottom Card (Price Increased / Difference) */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #F3EEFF",
            borderRadius: "16px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#F3EEFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px"
              }}
            >
              📈
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#6D28D9", letterSpacing: "0.3px" }}>
                PRICE INCREASED
              </div>
              <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
                ₹{(product.cost || 0).toLocaleString()} → ₹{(product.cost || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED", letterSpacing: "0.5px" }}>
              DIFFERENCE
            </div>
            <div style={{ fontSize: "26px", fontWeight: 900, color: "#7C3AED" }}>
              +₹0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
