import React from 'react';
import {
  Milk,
  Utensils,
  Sparkles,
  Car,
  User,
  Phone,
  CalendarPlus,
  HandCoins,
  Share2,
  Edit3,
  Trash2,
} from 'lucide-react';

const categoryIcons = {
  Milkman: Milk,
  Cook: Utensils,
  Maid: Sparkles,
  Driver: Car,
  Other: User,
};

export default function ProviderBanner({
  summaryData,
  userRole,
  onOpenQuickLog,
  onOpenAddPayment,
  onOpenShareBill,
  onOpenEditProvider,
  onDeleteProvider,
}) {
  if (!summaryData || !summaryData.provider) return null;

  const { provider, billing, monthFormatted } = summaryData;
  const CategoryIcon = categoryIcons[provider.category] || User;
  const isAdmin = userRole === 'admin';

  const isDailyUnit = provider.billingType === 'daily_unit';
  const rateLabel = isDailyUnit
    ? `₹${provider.defaultRate} per ${provider.unit || 'Unit'}`
    : `₹${provider.defaultRate.toLocaleString('en-IN')} / Month (Fixed)`;

  return (
    <div className="provider-banner">
      <div className="banner-header">
        <div className="banner-title-area">
          <div className="category-avatar">
            <CategoryIcon size={26} color="#818cf8" />
          </div>
          <div>
            <h2 className="provider-name">{provider.name}</h2>
            <div className="provider-meta">
              <span className="tag tag-indigo">{provider.category}</span>
              <span className="tag tag-emerald">{rateLabel}</span>
              {provider.phone && (
                <span className="tag tag-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> {provider.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="banner-actions">
          {isAdmin && (
            <>
              <button className="btn btn-primary btn-sm" onClick={onOpenQuickLog}>
                <CalendarPlus size={15} />
                <span>{isDailyUnit ? 'Log Milk / Entry' : 'Log Attendance'}</span>
              </button>
              <button className="btn btn-warning btn-sm" onClick={onOpenAddPayment}>
                <HandCoins size={15} />
                <span>Give Advance</span>
              </button>
            </>
          )}

          <button className="btn btn-secondary btn-sm" onClick={onOpenShareBill}>
            <Share2 size={15} />
            <span>Bill Statement</span>
          </button>

          {isAdmin && (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={onOpenEditProvider}
                title="Edit Provider Settings"
              >
                <Edit3 size={15} />
              </button>
              <button
                className="btn btn-danger-ghost btn-sm"
                onClick={onDeleteProvider}
                title="Delete Provider"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Math Breakdown formula */}
      <div className="math-breakdown">
        <div className="math-item">
          <span className="math-label">
            {isDailyUnit ? `Total Delivered (${billing.totalUnits} ${provider.unit || 'L'})` : 'Gross Monthly Salary'}
          </span>
          <span className="math-value">₹{billing.totalBilled.toLocaleString('en-IN')}</span>
        </div>

        <div className="math-item">
          <span className="math-label">Advances Given ({summaryData.payments.length} times)</span>
          <span className="math-value highlight-amber">
            - ₹{billing.totalPaid.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="math-item">
          <span className="math-label">Net Pending Balance ({monthFormatted})</span>
          <span
            className={`math-value ${
              billing.pendingBalance > 0 ? 'highlight-rose' : 'highlight-emerald'
            }`}
          >
            {billing.pendingBalance >= 0 ? `₹${billing.pendingBalance.toLocaleString('en-IN')}` : `+₹${Math.abs(billing.pendingBalance).toLocaleString('en-IN')} (Credit)`}
          </span>
        </div>
      </div>
    </div>
  );
}
