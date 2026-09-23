import React from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import StatCard from '../components/StatCard';
import ProviderBanner from '../components/ProviderBanner';
import DailyLogSection from '../components/DailyLogSection';
import PaymentLedger from '../components/PaymentLedger';
import {
  Receipt,
  HandCoins,
  AlertCircle,
  Users,
  RefreshCw,
} from 'lucide-react';

/**
 * Main dashboard body — overview stats + selected provider detail.
 * Provider list lives in the Sidebar (AppShell).
 */
export default function DashboardPage({
  error,
  onRetry,
  totals,
  monthName,
  statsLoading,
  loading,
  providers,
  isAdmin,
  onOpenAddProvider,
  providerSummary,
  providerSummaryLoading,
  userRole,
  currentMonth,
  candidates,
  onOpenQuickLog,
  onOpenAddPayment,
  onOpenShareBill,
  onOpenEditProvider,
  onDeleteProvider,
  onSaveLog,
  onDeleteLog,
  onDeletePayment,
}) {
  const showProviderArea = loading || providers.length > 0;
  const detailLoading =
    providerSummaryLoading || (loading && !providerSummary);

  return (
    <>
      {error && (
        <div className="alert-banner">
          <span>{error}</span>
          <button className="btn btn-secondary btn-sm" onClick={onRetry}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <SkeletonTheme baseColor="#1e293b" highlightColor="#334155">
        <section className="stats-grid">
          <StatCard
            title="Total Household Bill"
            value={`₹${totals.totalBilled.toLocaleString('en-IN')}`}
            subtext={`Earned across ${totals.providersCount} providers in ${monthName}`}
            icon={Receipt}
            colorTheme="blue"
            loading={statsLoading}
          />

          <StatCard
            title="Total Advances Given"
            value={`₹${totals.totalPaid.toLocaleString('en-IN')}`}
            subtext="Mid-month payments & cash advances paid out"
            icon={HandCoins}
            colorTheme="amber"
            loading={statsLoading}
          />

          <StatCard
            title="Net Pending Balance"
            value={`₹${totals.totalPending.toLocaleString('en-IN')}`}
            subtext={
              totals.totalPending > 0
                ? 'Outstanding amount due to pay'
                : 'All balances settled!'
            }
            icon={AlertCircle}
            colorTheme={totals.totalPending > 0 ? 'rose' : 'emerald'}
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

      {showProviderArea ? (
        <SkeletonTheme baseColor="#1e293b" highlightColor="#334155">
          <>
            {detailLoading ? (
              <ProviderBanner loading userRole={userRole} />
            ) : (
              providerSummary && (
                <ProviderBanner
                  summaryData={providerSummary}
                  userRole={userRole}
                  onOpenQuickLog={onOpenQuickLog}
                  onOpenAddPayment={onOpenAddPayment}
                  onOpenShareBill={onOpenShareBill}
                  onOpenEditProvider={onOpenEditProvider}
                  onDeleteProvider={onDeleteProvider}
                />
              )
            )}

            {(detailLoading || providerSummary) && (
              <div className="content-grid">
                <DailyLogSection
                  logs={providerSummary?.logs || []}
                  provider={providerSummary?.provider}
                  currentMonth={currentMonth}
                  userRole={userRole}
                  candidates={candidates}
                  onSaveLog={onSaveLog}
                  onDeleteLog={onDeleteLog}
                  loading={detailLoading}
                />

                <PaymentLedger
                  payments={providerSummary?.payments || []}
                  providerName={providerSummary?.provider?.name}
                  totalPaid={providerSummary?.billing?.totalPaid || 0}
                  userRole={userRole}
                  onOpenAddPayment={onOpenAddPayment}
                  onDeletePayment={onDeletePayment}
                  loading={detailLoading}
                />
              </div>
            )}
          </>
        </SkeletonTheme>
      ) : (
        <div className="section-card empty-providers-card">
          <div className="empty-icon empty-providers-emoji">🏡</div>
          <h2 className="empty-providers-title">
            No Household Service Providers Yet
          </h2>
          <p className="empty-providers-text">
            {isAdmin
              ? 'Add your daily milkman, cook, or home helper to start tracking daily records, advance payments, and pending dues.'
              : 'No providers have been registered yet by an Admin.'}
          </p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={onOpenAddProvider}>
              + Add First Provider
            </button>
          )}
        </div>
      )}
    </>
  );
}
