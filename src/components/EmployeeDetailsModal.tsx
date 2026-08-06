import React from "react";
import { User } from "../app/store";

export function EmployeeDetailsModal({ employee, onClose }: { employee: User; onClose: () => void }) {
  if (!employee) return null;

  const initials = (employee.name || "U")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
    >
      <div
        className="modal"
        style={{
          maxWidth: 860,
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          background: "#FFFFFF",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
          padding: "24px 28px",
          color: "#1E293B",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>Employee Details</h2>
          <button
            onClick={onClose}
            style={{
              background: "#F1F5F9",
              border: "none",
              fontSize: "18px",
              color: "#64748B",
              cursor: "pointer",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px", paddingBottom: "16px" }}>
          {/* 2-Column Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="emp-details-grid">
            {/* Left Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Top Profile Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "4px 0" }}>
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: "#EEF2FF",
                    color: "#4F46E5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    fontWeight: 800,
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.15)",
                    flexShrink: 0
                  }}
                >
                  {initials}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>{employee.name}</h3>
                  <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500 }}>
                    {employee.designation || employee.jobTitle || (employee.role === "superadmin" ? "Super Admin" : employee.role === "manager" ? "Manager" : "Sales Associate")}
                  </span>
                  {employee.department && (
                    <div>
                      <span style={{ background: "#F3EEFF", color: "#7C3AED", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", display: "inline-block", marginTop: "2px" }}>
                        {employee.department}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information Card */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "18px", padding: "18px", background: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#475569", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", border: "2px solid #64748B", display: "inline-block" }}></span>
                  PERSONAL INFORMATION
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Full Name:</span>
                    <strong style={{ color: "#0F172A", fontWeight: 700 }}>{employee.name || "N/A"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Email:</span>
                    <span style={{ color: "#2563EB", fontWeight: 600 }}>{employee.email || employee.username || "N/A"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Mobile:</span>
                    <strong style={{ color: "#0F172A", fontWeight: 700 }}>{employee.phone || "N/A"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B", fontWeight: 500 }}>Emergency Contact:</span>
                    <strong style={{ color: "#0F172A", fontWeight: 700 }}>{employee.emergencyContact || employee.phone || "N/A"}</strong>
                  </div>
                </div>

                {/* 2 Sub-Cards for Status & Location */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "16px" }}>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "14px", padding: "10px 4px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", gap: "6px", background: "#FFFFFF" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#475569", lineHeight: "1.2" }}>
                      <span style={{ display: "block", marginBottom: 2 }}>✓</span>
                      EMPLOYEE STATUS
                    </div>
                    <span style={{ background: "#DCFCE7", color: "#166534", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px" }}>
                      {employee.status || "Active"}
                    </span>
                  </div>

                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "14px", padding: "10px 4px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", gap: "6px", background: "#FFFFFF" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#475569", lineHeight: "1.2" }}>
                      <span style={{ display: "block", marginBottom: 2 }}>📍</span>
                      LOCATION TRACKING
                    </div>
                    <span style={{ background: "#DBEAFE", color: "#1E40AF", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px" }}>
                      {employee.locationTracking || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Work Information */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "18px", padding: "18px", background: "#FFFFFF" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#475569", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>💼</span> WORK INFORMATION
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748B" }}>Employee ID:</span>
                    <strong style={{ color: "#0F172A", fontWeight: 700 }}>{employee.employeeId || employee.id || "N/A"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748B" }}>Date of Joining:</span>
                    <span style={{ color: "#334155", fontWeight: 600 }}>{employee.dateOfJoining || "N/A"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748B" }}>Departments:</span>
                    <span style={{ background: employee.department ? "#F3EEFF" : "transparent", color: employee.department ? "#7C3AED" : "#64748B", fontSize: "11px", fontWeight: 700, padding: employee.department ? "2px 8px" : 0, borderRadius: "999px" }}>
                      {employee.department || "N/A"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748B" }}>Designation:</span>
                    <span style={{ color: "#334155", fontWeight: 600 }}>{employee.designation || employee.jobTitle || "N/A"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748B" }}>Role:</span>
                    <strong style={{ color: "#0F172A" }}>{employee.role ? (employee.role.charAt(0).toUpperCase() + employee.role.slice(1)) : "Employee"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748B" }}>Shift:</span>
                    <span style={{ color: "#334155", fontWeight: 600 }}>{employee.shift || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Branch Access */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "18px", padding: "16px", background: "#FFFFFF" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#475569", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🏛️</span> BRANCH ACCESS
                </div>
                <div>
                  {employee.branchAccess ? (
                    <span style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#334155", fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }}></span>
                      {employee.branchAccess}
                    </span>
                  ) : (
                    <span style={{ color: "#94A3B8", fontSize: "13px" }}>N/A</span>
                  )}
                </div>
              </div>

              {/* Access Permissions */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "18px", padding: "16px", background: "#FFFFFF" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#475569", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🔒</span> ACCESS PERMISSIONS
                </div>
                <div>
                  <span style={{ color: "#334155", fontSize: "13px", fontWeight: 600 }}>
                    {employee.role === "superadmin"
                      ? "Super Admin (Full System Access)"
                      : employee.role === "manager"
                      ? "Manager Access (Dashboard & Team Control)"
                      : "Standard Employee Access"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
