import React from 'react';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  HandCoins,
  LogOut,
  ShieldCheck,
  Eye,
} from 'lucide-react';

export default function Navbar({
  currentMonth,
  setCurrentMonth,
  monthName,
  user,
  onLogout,
  onOpenAddProvider,
  onOpenAddPayment,
}) {
  const isAdmin = user?.role === 'admin';

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">
          <Home size={24} />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">HomeLedger</h1>
          <p className="brand-subtitle">Household Billing & Advance Tracker</p>
        </div>
      </div>

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

      <div className="nav-actions">
        <div className="user-chip">
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
