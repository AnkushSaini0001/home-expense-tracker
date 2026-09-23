import React, { useState, useEffect, useCallback } from 'react';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './components/LoginPage';

import RecordPaymentModal from './components/modals/RecordPaymentModal';
import ProviderModal from './components/modals/ProviderModal';
import DailyLogModal from './components/modals/DailyLogModal';
import ShareBillModal from './components/modals/ShareBillModal';
import ConfirmModal from './components/modals/ConfirmModal';
import BackdropLoader from './components/BackdropLoader';

import { api } from './services/api';

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem('token') || null
  );
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [overview, setOverview] = useState(null);
  const [providers, setProviders] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [providerSummary, setProviderSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [providerSummaryLoading, setProviderSummaryLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [isEditProviderOpen, setIsEditProviderOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isShareBillOpen, setIsShareBillOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setOverview(null);
    setProviders([]);
    setCandidates([]);
    setProviderSummary(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => handleLogout();
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () =>
      window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [handleLogout]);

  const handleLoginSuccess = (loggedInUser, userToken) => {
    setUser(loggedInUser);
    setToken(userToken);
  };

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

      setSelectedProviderId((prev) => {
        if (prev && fetchedProviders.some((p) => p._id === prev)) {
          return prev;
        }
        return fetchedProviders[0]?._id || null;
      });

      try {
        const candidatesRes = await api.getCandidates('active');
        setCandidates(candidatesRes.data || []);
      } catch (candErr) {
        console.warn('Candidates fetch skipped:', candErr.message);
        setCandidates([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load household billing data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, token]);

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

      const category = summaryRes.data?.provider?.category;
      try {
        const candidatesRes = await api.getCandidates('active', category);
        setCandidates(candidatesRes.data || []);
      } catch (candErr) {
        console.warn('Candidates fetch skipped:', candErr.message);
      }
    } catch (err) {
      console.error('Provider summary error:', err);
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

  if (!token || !user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user.role === 'admin';

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

  const handleSaveLog = async (logData) => {
    if (!isAdmin) return;
    await withActionLoading(() => api.upsertDailyLog(logData));
    await refreshDashboard();
  };

  const handleDeleteLog = (id) => {
    if (!isAdmin) return;
    setConfirmDialog({
      title: 'Delete Daily Entry',
      message:
        'Are you sure you want to delete this daily log entry? This action cannot be undone.',
      confirmLabel: 'Delete Entry',
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
      title: 'Delete Payment Record',
      message:
        'Are you sure you want to delete this payment record? This action cannot be undone.',
      confirmLabel: 'Delete Payment',
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
      title: 'Delete Provider',
      message:
        'Are you sure you want to delete this provider? All their daily records and payment history will also be removed.',
      confirmLabel: 'Delete Provider',
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
    <AppShell
      providers={providers}
      selectedProviderId={selectedProviderId}
      onSelectProvider={setSelectedProviderId}
      user={user}
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
      monthName={monthName}
      onLogout={handleLogout}
      onOpenAddProvider={() => setIsAddProviderOpen(true)}
      onOpenAddPayment={() => setIsRecordPaymentOpen(true)}
      providersLoading={loading && providers.length === 0}
    >
      <DashboardPage
        error={error}
        onRetry={fetchData}
        totals={totals}
        monthName={monthName}
        statsLoading={statsLoading}
        loading={loading}
        providers={providers}
        isAdmin={isAdmin}
        onOpenAddProvider={() => setIsAddProviderOpen(true)}
        providerSummary={providerSummary}
        providerSummaryLoading={providerSummaryLoading}
        userRole={user.role}
        currentMonth={currentMonth}
        candidates={candidates}
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
        onOpenAddPayment={() => setIsRecordPaymentOpen(true)}
        onOpenShareBill={() => setIsShareBillOpen(true)}
        onOpenEditProvider={() => setIsEditProviderOpen(true)}
        onDeleteProvider={handleDeleteProvider}
        onSaveLog={handleSaveLog}
        onDeleteLog={handleDeleteLog}
        onDeletePayment={handleDeletePayment}
      />

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
            candidates={candidates}
            onSubmit={handleSaveLog}
          />
        </>
      )}

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
    </AppShell>
  );
}
