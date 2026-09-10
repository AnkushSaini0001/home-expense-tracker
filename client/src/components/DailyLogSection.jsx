import React, { useState } from "react";
import Skeleton from "react-loading-skeleton";
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
} from "lucide-react";

function DailyLogSectionSkeleton({ isAdmin }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title-group">
          <Skeleton width={18} height={18} borderRadius={4} />
          <Skeleton width={140} height={20} borderRadius={4} />
          <Skeleton width={72} height={22} borderRadius={999} />
        </div>
      </div>

      {isAdmin ? (
        <div className="quick-entry-bar">
          <Skeleton
            height={38}
            borderRadius={8}
            style={{ flex: "1 1 120px" }}
          />
          <Skeleton
            height={38}
            borderRadius={8}
            style={{ flex: "1 1 120px" }}
          />
          <Skeleton
            height={38}
            borderRadius={8}
            style={{ flex: "2 1 130px" }}
          />
          <Skeleton width={80} height={34} borderRadius={8} />
        </div>
      ) : (
        <Skeleton
          height={40}
          borderRadius={8}
          style={{ marginBottom: "1rem" }}
        />
      )}

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>
                <Skeleton width={40} height={12} />
              </th>
              <th>
                <Skeleton width={50} height={12} />
              </th>
              <th>
                <Skeleton width={45} height={12} />
              </th>
              {isAdmin && <th style={{ width: "40px" }} />}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((i) => (
              <tr key={i}>
                <td>
                  <Skeleton
                    width={70}
                    height={14}
                    style={{ marginBottom: 4 }}
                  />
                  <Skeleton width={90} height={11} />
                </td>
                <td>
                  <Skeleton width={80} height={22} borderRadius={999} />
                </td>
                <td>
                  <Skeleton width="70%" height={12} />
                </td>
                {isAdmin && (
                  <td>
                    <Skeleton width={28} height={28} borderRadius={6} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DailyLogSection({
  logs = [],
  provider,
  currentMonth,
  userRole,
  onSaveLog,
  onDeleteLog,
  loading = false,
}) {
  const isAdmin = userRole === "admin";

  // Inline quick-log state
  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = today.startsWith(currentMonth)
    ? today
    : `${currentMonth}-01`;

  const [date, setDate] = useState(defaultDate);
  const [quantity, setQuantity] = useState(
    provider?.billingType === "monthly_fixed" ? 1 : 1.5
  );
  const [status, setStatus] = useState("delivered");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDailyUnit = provider?.billingType === "daily_unit";
  const unitLabel = provider?.unit || (isDailyUnit ? "L" : "Day");

  if (loading) {
    return <DailyLogSectionSkeleton isAdmin={isAdmin} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) return;
    setIsSubmitting(true);
    try {
      await onSaveLog({
        providerId: provider._id,
        date,
        quantity: Number(quantity),
        rate: provider.defaultRate,
        status,
        notes,
      });
      setNotes("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (logStatus) => {
    switch (logStatus) {
      case "delivered":
        return (
          <span className="tag tag-emerald">
            <CheckCircle2 size={12} /> {isDailyUnit ? "Delivered" : "Present"}
          </span>
        );
      case "extra":
        return (
          <span className="tag tag-indigo">
            <AlertCircle size={12} /> Extra
          </span>
        );
      case "absent":
        return (
          <span className="tag tag-amber" style={{ color: "#f87171" }}>
            <XCircle size={12} /> {isDailyUnit ? "Skipped" : "Absent"}
          </span>
        );
      case "holiday":
        return (
          <span className="tag tag-indigo">
            <Calendar size={12} /> Leave / Holiday
          </span>
        );
      default:
        return <span className="tag tag-indigo">{logStatus}</span>;
    }
  };

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title-group">
          <Calendar size={18} color="#818cf8" />
          <h3 className="section-title">
            {isDailyUnit ? "Daily Deliveries" : "Daily Attendance"}
          </h3>
          <span className="section-badge">{logs.length} logged</span>
        </div>
      </div>

      {/* Quick Add Form for Admin, or View-Only notice for User */}
      {isAdmin ? (
        <form className="quick-entry-bar" onSubmit={handleSubmit}>
          <div style={{ flex: "1 1 120px" }}>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {isDailyUnit && (
            <div style={{ flex: "1 1 90px" }}>
              <input
                type="number"
                step="0.1"
                min="0"
                className="form-input"
                placeholder={`Qty (${unitLabel})`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ flex: "1 1 120px" }}>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {isDailyUnit ? (
                <>
                  <option value="delivered">Delivered</option>
                  <option value="extra">Extra</option>
                  <option value="absent">Skipped / Absent</option>
                </>
              ) : (
                <>
                  <option value="delivered">Present</option>
                  <option value="absent">Absent / Leave</option>
                </>
              )}
            </select>
          </div>

          <div style={{ flex: "2 1 130px" }}>
            <input
              type="text"
              className="form-input"
              placeholder={
                isDailyUnit ? "Note (optional)" : "Reason / Note (optional)"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isSubmitting}
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </form>
      ) : (
        <div
          style={{
            padding: "0.6rem 0.85rem",
            marginBottom: "1rem",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Eye size={14} color="#34d399" />
          <span>
            Read-only Mode: Daily entries can only be added or modified by an
            Admin.
          </span>
        </div>
      )}

      {/* Daily Logs Table */}
      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>No entries recorded for this month yet.</p>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {isDailyUnit
              ? "Use the bar above to log daily deliveries."
              : "Mark attendance or leaves using the bar above."}
          </span>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table log-table">
            <thead>
              <tr>
                <th className="col-date">Date</th>
                {isDailyUnit && <th className="col-qty">Quantity</th>}
                {isDailyUnit && <th className="col-rate">Rate</th>}
                {isDailyUnit && <th className="col-total">Total</th>}
                <th className="col-status">Status</th>
                <th className="col-notes">Notes</th>
                {isAdmin && <th className="col-actions" aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dayNum = log.date.split("-")[2];
                const hasNote = Boolean(log.notes?.trim());
                return (
                  <tr key={log._id}>
                    <td className="col-date">
                      <div className="date-badge">
                        <span className="date-day">Day {dayNum}</span>
                        <span className="date-full">{log.date}</span>
                      </div>
                    </td>
                    {isDailyUnit && (
                      <td className="col-qty" style={{ fontWeight: 600 }}>
                        {log.quantity} {unitLabel}
                      </td>
                    )}
                    {isDailyUnit && <td className="col-rate">₹{log.rate}</td>}
                    {isDailyUnit && (
                      <td
                        className="col-total"
                        style={{ fontWeight: 700, color: "#34d399" }}
                      >
                        ₹{log.amount}
                      </td>
                    )}
                    <td className="col-status">{getStatusBadge(log.status)}</td>
                    <td className={`col-notes${hasNote ? " has-note" : ""}`}>
                      {hasNote ? log.notes : "—"}
                    </td>
                    {isAdmin && (
                      <td className="col-actions">
                        <button
                          className="btn-danger-ghost"
                          onClick={() => onDeleteLog(log._id)}
                          title="Delete entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
