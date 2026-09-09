import React, { useState, useEffect, useCallback } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import Navbar from "./components/Navbar";
import StatCard from "./components/StatCard";
import ProviderTabs from "./components/ProviderTabs";
import ProviderBanner from "./components/ProviderBanner";
import DailyLogSection from "./components/DailyLogSection";
import PaymentLedger from "./components/PaymentLedger";
import LoginPage from "./components/LoginPage";

import RecordPaymentModal from "./components/modals/RecordPaymentModal";
import ProviderModal from "./components/modals/ProviderModal";
import DailyLogModal from "./components/modals/DailyLogModal";
import ShareBillModal from "./components/modals/ShareBillModal";
import ConfirmModal from "./components/modals/ConfirmModal";
import BackdropLoader from "./components/BackdropLoader";

import { api } from "./services/api";
import {
  Receipt,
  HandCoins,
  AlertCircle,
  Users,
  RefreshCw,
} from "lucide-react";

export default function App() {
  // Auth State
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Current Month State (YYYY-MM)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  const [overview, setOverview] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [providerSummary, setProviderSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [providerSummaryLoading, setProviderSummaryLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal States
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isEditProviderOpen, setIsEditProviderOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isShareBillOpen, setIsShareBillOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Logout handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setOverview(null);
    setProviders([]);
    setProviderSummary(null);
  }, []);

  // Listen to unauthorized event
  useEffect(() => {
    const onUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [handleLogout]);

  // Handle successful login
  const handleLoginSuccess = (loggedInUser, userToken) => {
    setUser(loggedInUser);
    setToken(userToken);
  };

  // Fetch all dashboard & provider data
  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      setLoading(true);
      const [overviewRes, providersRes] = await Promise.all([
        api.getDashboardOverview(currentMonth),
        api.getProviders("active"),
      ]);

      setOverview(overviewRes.data);
      const fetchedProviders = providersRes.data || [];
      setProviders(fetchedProviders);

      // Select first provider if none selected or if selected was deleted
      setSelectedProviderId((prev) => {
        if (prev && fetchedProviders.some((p) => p._id === prev)) {
          return prev;
        }
        return fetchedProviders[0]?._id || null;
      });
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load household billing data");
    } finally {
      setLoading(false);
    }
  }, [currentMonth, token]);

  // Fetch individual provider summary whenever selectedProviderId or currentMonth changes
  const fetchProviderSummary = useCallback(async () => {
    if (!token || !selectedProviderId) {
      setProviderSummary(null);
      setProviderSummaryLoading(false);
      return;
    }

    try {
      setProviderSummaryLoading(true);
      const summaryRes = await api.getProviderMonthlySummary(
        selectedProviderId,
        currentMonth
      );
      setProviderSummary(summaryRes.data);
    } catch (err) {
      console.error("Provider summary error:", err);
    } finally {
      setProviderSummaryLoading(false);
    }
  }, [selectedProviderId, currentMonth, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchProviderSummary();
  }, [fetchProviderSummary]);

  // If not authenticated, render Login Page
  if (!token || !user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user.role === "admin";

  /** Backdrop loader only while add/delete mutate API is pending */
  const withActionLoading = async (mutateFn) => {
    setActionLoading(true);
    try {
      return await mutateFn();
    } finally {
      setActionLoading(false);
    }
  };

  const refreshDashboard = () =>
    Promise.all([fetchData(), fetchProviderSummary()]);

  // Handlers
  const handleSaveLog = async (logData) => {
    if (!isAdmin) return;
    await withActionLoading(() => api.upsertDailyLog(logData));
    await refreshDashboard();
  };

  const handleDeleteLog = (id) => {
    if (!isAdmin) return;
    setConfirmDialog({
      title: "Delete Daily Entry",
      message:
        "Are you sure you want to delete this daily log entry? This action cannot be undone.",
      confirmLabel: "Delete Entry",
      onConfirm: async () => {
        await withActionLoading(() => api.deleteDailyLog(id));
        await refreshDashboard();
      },
    });
  };

  const handleRecordPayment = async (paymentData) => {
    if (!isAdmin) return;
    await api.recordPayment(paymentData);
    await refreshDashboard();
  };

  const handleDeletePayment = (id) => {
    if (!isAdmin) return;
    setConfirmDialog({
      title: "Delete Payment Record",
      message:
        "Are you sure you want to delete this payment record? This action cannot be undone.",
      confirmLabel: "Delete Payment",
      onConfirm: async () => {
        await withActionLoading(() => api.deletePayment(id));
        await refreshDashboard();
      },
    });
  };

  const handleCreateProvider = async (providerData) => {
    if (!isAdmin) return;
    const res = await api.createProvider(providerData);
    await fetchData();
    if (res.data?._id) {
      setSelectedProviderId(res.data._id);
    }
  };

  const handleUpdateProvider = async (providerData) => {
    if (!isAdmin || !selectedProviderId) return;
    await api.updateProvider(selectedProviderId, providerData);
    await refreshDashboard();
  };

  const handleDeleteProvider = () => {
    if (!isAdmin || !selectedProviderId) return;
    setConfirmDialog({
      title: "Delete Provider",
      message:
        "Are you sure you want to delete this provider? All their daily records and payment history will also be removed.",
      confirmLabel: "Delete Provider",
      onConfirm: async () => {
        await withActionLoading(() => api.deleteProvider(selectedProviderId));
        setSelectedProviderId(null);
        setProviderSummary(null);
        await fetchData();
      },
    });
  };

  const totals = overview?.totals || {
    totalBilled: 0,
    totalAdvance: 0,
    totalPaid: 0,
    totalPending: 0,
    providersCount: 0,
  };

  const monthName = overview?.monthFormatted || currentMonth;
  const statsLoading = loading || (!overview && !error);

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        monthName={monthName}
        user={user}
        onLogout={handleLogout}
        onOpenAddProvider={() => setIsAddProviderOpen(true)}
        onOpenAddPayment={() => setIsRecordPaymentOpen(true)}
      />

      {error && (
        <div className="alert-banner">
          <span>{error}</span>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Global Overview Stat Cards */}
      <SkeletonTheme baseColor="#1e293b" highlightColor="#334155">
        <section className="stats-grid">
          <StatCard
            title="Total Household Bill"
            value={`₹${totals.totalBilled.toLocaleString("en-IN")}`}
            subtext={`Earned across ${totals.providersCount} providers in ${monthName}`}
            icon={Receipt}
            colorTheme="blue"
            loading={statsLoading}
          />

          <StatCard
            title="Total Advances Given"
            value={`₹${totals.totalPaid.toLocaleString("en-IN")}`}
            subtext="Mid-month payments & cash advances paid out"
            icon={HandCoins}
            colorTheme="amber"
            loading={statsLoading}
          />

          <StatCard
            title="Net Pending Balance"
            value={`₹${totals.totalPending.toLocaleString("en-IN")}`}
            subtext={
              totals.totalPending > 0
                ? "Outstanding amount due to pay"
                : "All balances settled!"
            }
            icon={AlertCircle}
            colorTheme={totals.totalPending > 0 ? "rose" : "emerald"}
            loading={statsLoading}
          />

          <StatCard
            title="Active Providers"
            value={totals.providersCount}
            subtext="Milkman, Cook, Maid, Helpers"
            icon={Users}
            colorTheme="emerald"
            loading={statsLoading}
          />
        </section>
      </SkeletonTheme>

      {/* Provider Selector Tabs */}
      {loading || providers.length > 0 ? (
        <SkeletonTheme baseColor="#1e293b" highlightColor="#334155">
          <>
            <ProviderTabs
              providers={providers}
              selectedProviderId={selectedProviderId}
              userRole={user.role}
              onSelectProvider={setSelectedProviderId}
              onAddNew={() => setIsAddProviderOpen(true)}
              loading={loading && providers.length === 0}
            />

            {/* Active Provider Detail & Math Banner */}
            {providerSummaryLoading || (loading && !providerSummary) ? (
              <ProviderBanner loading userRole={user.role} />
            ) : (
              providerSummary && (
                <ProviderBanner
                  summaryData={providerSummary}
                  userRole={user.role}
                  onOpenQuickLog={() => setIsQuickLogOpen(true)}
                  onOpenAddPayment={() => setIsRecordPaymentOpen(true)}
                  onOpenShareBill={() => setIsShareBillOpen(true)}
                  onOpenEditProvider={() => setIsEditProviderOpen(true)}
                  onDeleteProvider={handleDeleteProvider}
                />
              )
            )}

            {/* Two-Column Work Area: Daily Log / Attendance on Left, Advance Payments on Right */}
            {(providerSummaryLoading ||
              providerSummary ||
              (loading && providers.length > 0)) && (
              <div className="content-grid">
                <DailyLogSection
                  logs={providerSummary?.logs || []}
                  provider={providerSummary?.provider}
                  currentMonth={currentMonth}
                  userRole={user.role}
                  onSaveLog={handleSaveLog}
                  onDeleteLog={handleDeleteLog}
                  loading={
                    providerSummaryLoading || (loading && !providerSummary)
                  }
                />

                <PaymentLedger
                  payments={providerSummary?.payments || []}
                  providerName={providerSummary?.provider?.name}
                  totalPaid={providerSummary?.billing?.totalPaid || 0}
                  userRole={user.role}
                  onOpenAddPayment={() => setIsRecordPaymentOpen(true)}
                  onDeletePayment={handleDeletePayment}
                  loading={
                    providerSummaryLoading || (loading && !providerSummary)
                  }
                />
              </div>
            )}
          </>
        </SkeletonTheme>
      ) : (
        <div className="section-card empty-providers-card">
          <div className="empty-icon" style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            🏡
          </div>
          <h2 className="empty-providers-title">No Household Service Providers Yet</h2>
          <p className="empty-providers-text">
            {isAdmin
              ? "Add your daily milkman, cook, or home helper to start tracking daily records, advance payments, and pending dues."
              : "No providers have been registered yet by an Admin."}
          </p>
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => setIsAddProviderOpen(true)}
            >
              + Add First Provider
            </button>
          )}
        </div>
      )}

      {/* Modals (Only Admin can trigger adding/editing) */}
      {isAdmin && (
        <>
          <RecordPaymentModal
            isOpen={isRecordPaymentOpen}
            onClose={() => setIsRecordPaymentOpen(false)}
            providers={providers}
            selectedProviderId={selectedProviderId}
            currentMonth={currentMonth}
            onSubmit={handleRecordPayment}
          />

          <ProviderModal
            isOpen={isAddProviderOpen}
            onClose={() => setIsAddProviderOpen(false)}
            provider={null}
            onSubmit={handleCreateProvider}
          />

          <ProviderModal
            isOpen={isEditProviderOpen}
            onClose={() => setIsEditProviderOpen(false)}
            provider={providerSummary?.provider || null}
            onSubmit={handleUpdateProvider}
          />

          <DailyLogModal
            isOpen={isQuickLogOpen}
            onClose={() => setIsQuickLogOpen(false)}
            provider={providerSummary?.provider || null}
            currentMonth={currentMonth}
            onSubmit={handleSaveLog}
          />
        </>
      )}

      {/* Share Bill Modal is accessible to both Admin and User */}
      <ShareBillModal
        isOpen={isShareBillOpen}
        onClose={() => setIsShareBillOpen(false)}
        summaryData={providerSummary}
      />

      <ConfirmModal
        isOpen={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        onConfirm={confirmDialog?.onConfirm}
        onClose={() => setConfirmDialog(null)}
      />

      <BackdropLoader isOpen={actionLoading} label="Processing..." />
    </div>
  );
}
