import React, { useState } from "react";
import { Briefcase, User as UserIcon, Key, Phone, Mail, Eye } from "lucide-react";
import { User, Task } from "../app/store";
import { EmployeeDetailsModal } from "./EmployeeDetailsModal";

export function UnifiedEmployeeCard({ 
  employee, 
  userTasks, 
  actions,
  children
}: { 
  employee: User, 
  userTasks?: Task[], 
  actions?: React.ReactNode,
  children?: React.ReactNode,
}) {
  const [showModal, setShowModal] = useState(false);
  const completed = userTasks ? userTasks.filter(t => t.status === "Completed").length : 0;
  const total = userTasks ? userTasks.length : 0;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <>
      <div style={{
        background: "var(--warm-white)", borderRadius: "16px", padding: "20px",
        border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
        display: "flex", flexDirection: "column", position: "relative",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        height: "100%"
      }}>
        {/* Header - Clickable to open Employee Details Card Modal */}
        <div 
          onClick={() => setShowModal(true)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", cursor: "pointer" }}
        >
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#1E293B" }}>{employee.name}</div>
          <div style={{ 
            background: employee.status === "Inactive" ? "#fee2e2" : "#d1fae5", 
            color: employee.status === "Inactive" ? "#991b1b" : "#065f46", 
            fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" 
          }}>{employee.status || "Verified"}</div>
        </div>
        
        {/* ID Divider */}
        <div 
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B", fontSize: "12px", marginBottom: "16px", cursor: "pointer" }}
        >
          <div style={{ flex: 1, height: "1px", borderTop: "1px dashed #E2E8F0" }}></div>
          <span>• ID: {employee.employeeId || employee.id} •</span>
          <div style={{ flex: 1, height: "1px", borderTop: "1px dashed #E2E8F0" }}></div>
        </div>

        {/* Content List */}
        <div 
          onClick={() => setShowModal(true)}
          style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px", marginBottom: "20px", flex: 1, cursor: "pointer" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <Briefcase size={14} style={{ color: "#7C3AED" }} /> ROLE
            </span>
            <strong style={{ color: "#1E293B", textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>
              {employee.jobTitle || (employee.role === "manager" ? "Manager" : "Employee")}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginTop: "2px" }}>
              <UserIcon size={14} style={{ color: "#7C3AED" }} /> USERNAME
            </span>
            <strong
              style={{
                color: "#1E293B",
                textAlign: "right",
                wordBreak: "break-all",
                overflowWrap: "anywhere",
                fontSize: "12px",
                lineHeight: "1.4",
                background: "#F8FAFC",
                padding: "2px 8px",
                borderRadius: "6px",
                border: "1px solid #F1F5F9",
                maxWidth: "60%"
              }}
              title={employee.username}
            >
              {employee.username || "—"}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <Key size={14} style={{ color: "#7C3AED" }} /> PASSWORD
            </span>
            <strong
              style={{
                color: "#1E293B",
                textAlign: "right",
                wordBreak: "break-all",
                overflowWrap: "anywhere",
                fontSize: "12px",
                background: "#F8FAFC",
                padding: "2px 8px",
                borderRadius: "6px",
                border: "1px solid #F1F5F9",
                maxWidth: "60%"
              }}
              title={employee.password}
            >
              {employee.password || "—"}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <Phone size={14} style={{ color: "#7C3AED" }} /> PHONE
            </span>
            <strong style={{ color: "#1E293B", textAlign: "right" }}>{employee.phone || "—"}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginTop: "2px" }}>
              <Mail size={14} style={{ color: "#7C3AED" }} /> EMAIL
            </span>
            <strong
              style={{
                color: "#1E293B",
                textAlign: "right",
                wordBreak: "break-all",
                overflowWrap: "anywhere",
                fontSize: "12px",
                lineHeight: "1.4",
                background: "#F8FAFC",
                padding: "2px 8px",
                borderRadius: "6px",
                border: "1px solid #F1F5F9",
                maxWidth: "60%"
              }}
              title={employee.email}
            >
              {employee.email || "—"}
            </strong>
          </div>
        </div>

        {/* Children */}
        {children}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
          <button 
            className="btn btn-circle" 
            onClick={() => setShowModal(true)} 
            title="View Employee Full Details"
            style={{ background: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE" }}
          >
            👁️
          </button>
          {actions}
        </div>
      </div>

      {/* Employee Details Modal Popup */}
      {showModal && (
        <EmployeeDetailsModal
          employee={employee}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
