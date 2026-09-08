import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatCard from './components/StatCard';
import ProviderTabs from './components/ProviderTabs';
import ProviderBanner from './components/ProviderBanner';
import DailyLogSection from './components/DailyLogSection';
import PaymentLedger from './components/PaymentLedger';
import LoginPage from './components/LoginPage';

import RecordPaymentModal from './components/modals/RecordPaymentModal';
import ProviderModal from './components/modals/ProviderModal';
import DailyLogModal from './components/modals/DailyLogModal';
import ShareBillModal from './components/modals/ShareBillModal';

import { api } from './services/api';
import { Receipt, HandCoins, AlertCircle, Users, RefreshCw } from 'lucide-react';

export default function App() {
  // Auth State
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Current Month State (YYYY-MM)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [overview, setOverview] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [providerSummary, setProviderSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal States
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isEditProviderOpen, setIsEditProviderOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isShareBillOpen, setIsShareBillOpen] = useState(false);

  // Logout handler
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
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
        api.getProviders('active'),
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
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load household billing data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, token]);

  // Fetch individual provider summary whenever selectedProviderId or currentMonth changes
  const fetchProviderSummary = useCallback(async () => {
    if (!token || !selectedProviderId) {
      setProviderSummary(null);
      return;
    }

    try {
      const summaryRes = await api.getProviderMonthlySummary(selectedProviderId, currentMonth);
      setProviderSummary(summaryRes.data);
    } catch (err) {
      console.error('Provider summary error:', err);
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

  const isAdmin = user.role === 'admin';

  // Handlers
  const handleSaveLog = async (logData) => {
    if (!isAdmin) return;
    await api.upsertDailyLog(logData);
    await Promise.all([fetchData(), fetchProviderSummary()]);
  };

  const handleDeleteLog = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Delete this daily log entry?')) {
      await api.deleteDailyLog(id);
      await Promise.all([fetchData(), fetchProviderSummary()]);
    }
  };

  const handleRecordPayment = async (paymentData) => {
    if (!isAdmin) return;
    await api.recordPayment(paymentData);
    await Promise.all([fetchData(), fetchProviderSummary()]);
  };

  const handleDeletePayment = async (id) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      await api.deletePayment(id);
      await Promise.all([fetchData(), fetchProviderSummary()]);
    }
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
    await Promise.all([fetchData(), fetchProviderSummary()]);
  };

  const handleDeleteProvider = async () => {
    if (!isAdmin || !selectedProviderId) return;
    if (
      window.confirm(
        'Are you sure you want to delete this provider? All their daily records and payment history will also be removed.'
      )
    ) {
      await api.deleteProvider(selectedProviderId);
      setSelectedProviderId(null);
      await fetchData();
    }
  };

  const totals = overview?.totals || {
    totalBilled: 0,
    totalAdvance: 0,
    totalPaid: 0,
    totalPending: 0,
    providersCount: 0,
  };

  const monthName = overview?.monthFormatted || currentMonth;

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
        <div
          style={{
            padding: '1rem',
            background: 'var(--color-danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Global Overview Stat Cards */}
      <section className="stats-grid">
        <StatCard
          title="Total Household Bill"
          value={`₹${totals.totalBilled.toLocaleString('en-IN')}`}
          subtext={`Earned across ${totals.providersCount} providers in ${monthName}`}
          icon={Receipt}
          colorTheme="blue"
        />

        <StatCard
          title="Total Advances Given"
          value={`₹${totals.totalPaid.toLocaleString('en-IN')}`}
          subtext="Mid-month payments & cash advances paid out"
          icon={HandCoins}
          colorTheme="amber"
        />

        <StatCard
          title="Net Pending Balance"
          value={`₹${totals.totalPending.toLocaleString('en-IN')}`}
          subtext={totals.totalPending > 0 ? 'Outstanding amount due to pay' : 'All balances settled!'}
          icon={AlertCircle}
          colorTheme={totals.totalPending > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Active Providers"
          value={totals.providersCount}
          subtext="Milkman, Cook, Maid, Helpers"
          icon={Users}
          colorTheme="emerald"
        />
      </section>

      {/* Provider Selector Tabs */}
      {providers.length > 0 ? (
        <>
          <ProviderTabs
            providers={providers}
            selectedProviderId={selectedProviderId}
            userRole={user.role}
            onSelectProvider={setSelectedProviderId}
            onAddNew={() => setIsAddProviderOpen(true)}
          />

          {/* Active Provider Detail & Math Banner */}
          {providerSummary && (
            <ProviderBanner
              summaryData={providerSummary}
              userRole={user.role}
              onOpenQuickLog={() => setIsQuickLogOpen(true)}
              onOpenAddPayment={() => setIsRecordPaymentOpen(true)}
              onOpenShareBill={() => setIsShareBillOpen(true)}
              onOpenEditProvider={() => setIsEditProviderOpen(true)}
              onDeleteProvider={handleDeleteProvider}
            />
          )}

          {/* Two-Column Work Area: Daily Log / Attendance on Left, Advance Payments on Right */}
          {providerSummary && (
            <div className="content-grid">
              <DailyLogSection
                logs={providerSummary.logs || []}
                provider={providerSummary.provider}
                currentMonth={currentMonth}
                userRole={user.role}
                onSaveLog={handleSaveLog}
                onDeleteLog={handleDeleteLog}
              />

              <PaymentLedger
                payments={providerSummary.payments || []}
                providerName={providerSummary.provider?.name}
                totalPaid={providerSummary.billing?.totalPaid || 0}
                userRole={user.role}
                onOpenAddPayment={() => setIsRecordPaymentOpen(true)}
                onDeletePayment={handleDeletePayment}
              />
            </div>
          )}
        </>
      ) : (
        <div className="section-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏡</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No Household Service Providers Yet
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {isAdmin
              ? 'Add your daily milkman, cook, or home helper to start tracking daily records, advance payments, and pending dues.'
              : 'No providers have been registered yet by an Admin.'}
          </p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setIsAddProviderOpen(true)}>
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
    </div>
  );
}
