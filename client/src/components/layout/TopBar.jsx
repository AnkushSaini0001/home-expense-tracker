import React from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  HandCoins,
  LogOut,
  ShieldCheck,
  Eye,
} from 'lucide-react';

export default function TopBar({
  currentMonth,
  setCurrentMonth,
  monthName,
  user,
  onLogout,
  onOpenAddProvider,
  onOpenAddPayment,
  onToggleSidebar,
}) {
  const isAdmin = user?.role === 'admin';

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    setCurrentMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    setCurrentMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    );
  };

  const initials = (user?.username || 'U')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="month-controller">
          <button
            className="month-nav-btn"
            onClick={handlePrevMonth}
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <span
            className="current-month-display"
            onClick={handleCurrentMonth}
            title="Click to jump to current month"
          >
            {monthName}
          </span>
          <button
            className="month-nav-btn"
            onClick={handleNextMonth}
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="topbar-actions">
        {isAdmin && (
          <>
            <button className="btn btn-warning btn-sm" onClick={onOpenAddPayment}>
              <HandCoins size={15} />
              <span className="btn-text">Record Advance</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={onOpenAddProvider}>
              <PlusCircle size={15} />
              <span className="btn-text">Add Staff</span>
            </button>
          </>
        )}

        <div className="user-chip">
          <span className="user-avatar" title={user?.username}>
            {initials}
          </span>
          {isAdmin ? (
            <span className="user-chip-role admin">
              <ShieldCheck size={14} />
              <span className="btn-text">Admin</span>
            </span>
          ) : (
            <span className="user-chip-role viewer">
              <Eye size={14} />
              <span className="btn-text">View-Only</span>
            </span>
          )}
          <span className="user-chip-divider">|</span>
          <span className="user-chip-name">{user?.username}</span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onLogout}
          title="Sign out of HomeLedger"
        >
          <LogOut size={15} />
          <span className="btn-text">Logout</span>
        </button>
      </div>
    </header>
  );
}
