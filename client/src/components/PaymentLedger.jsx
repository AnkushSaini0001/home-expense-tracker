import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { HandCoins, Plus, Trash2, Wallet, Smartphone, Landmark } from 'lucide-react';

const methodIcons = {
  Cash: Wallet,
  UPI: Smartphone,
  'Bank Transfer': Landmark,
};

function PaymentLedgerSkeleton({ isAdmin }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title-group">
          <Skeleton width={18} height={18} borderRadius={4} />
          <Skeleton width={190} height={20} borderRadius={4} />
          <Skeleton width={80} height={22} borderRadius={999} />
        </div>
        {isAdmin && <Skeleton width={140} height={34} borderRadius={8} />}
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th><Skeleton width={36} height={12} /></th>
              <th><Skeleton width={52} height={12} /></th>
              <th><Skeleton width={40} height={12} /></th>
              <th><Skeleton width={55} height={12} /></th>
              <th><Skeleton width={90} height={12} /></th>
              {isAdmin && <th style={{ width: '40px' }} />}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((i) => (
              <tr key={i}>
                <td><Skeleton width={90} height={14} /></td>
                <td><Skeleton width={55} height={16} /></td>
                <td><Skeleton width={72} height={22} borderRadius={999} /></td>
                <td><Skeleton width={60} height={14} /></td>
                <td><Skeleton width="75%" height={12} /></td>
                {isAdmin && (
                  <td><Skeleton width={28} height={28} borderRadius={6} /></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ledger-total">
        <Skeleton width={200} height={14} />
        <Skeleton width={70} height={22} />
      </div>
    </div>
  );
}

export default function PaymentLedger({
  payments = [],
  providerName,
  totalPaid = 0,
  userRole,
  onOpenAddPayment,
  onDeletePayment,
  loading = false,
}) {
  const isAdmin = userRole === 'admin';

  if (loading) {
    return <PaymentLedgerSkeleton isAdmin={isAdmin} />;
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="section-title-group">
          <HandCoins size={18} color="#fbbf24" />
          <h3 className="section-title">Advance & Payments Taken</h3>
          <span className="section-badge">{payments.length} payments</span>
        </div>

        {isAdmin && (
          <button className="btn btn-warning btn-sm" onClick={onOpenAddPayment}>
            <Plus size={14} />
            <span>Record Advance</span>
          </button>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💸</div>
          <p>No advances or payments recorded this month.</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            If {providerName || 'the provider'} took any advance during the month, record it here.
          </span>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="custom-table payment-table">
              <thead>
                <tr>
                  <th className="col-date">Date</th>
                  <th className="col-amount">Amount</th>
                  <th className="col-type">Type</th>
                  <th className="col-method">Method</th>
                  <th className="col-notes">Notes / Reason</th>
                  {isAdmin && <th className="col-actions" aria-label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const MethodIcon = methodIcons[p.paymentMethod] || Wallet;
                  const hasNote = Boolean(p.notes?.trim());
                  return (
                    <tr key={p._id}>
                      <td className="col-date" style={{ fontWeight: 500 }}>{p.date}</td>
                      <td className="col-amount" style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="col-type">
                        <span className="tag tag-amber">{p.paymentType}</span>
                      </td>
                      <td className="col-method">
                        <span className="method-cell">
                          <MethodIcon size={13} /> {p.paymentMethod}
                        </span>
                      </td>
                      <td className={`col-notes${hasNote ? ' has-note' : ''}`}>
                        {hasNote ? p.notes : '—'}
                      </td>
                      {isAdmin && (
                        <td className="col-actions">
                          <button
                            className="btn-danger-ghost"
                            onClick={() => onDeletePayment(p._id)}
                            title="Delete payment"
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

          <div className="ledger-total">
            <span className="ledger-total-label">
              Total Advances Given This Month:
            </span>
            <span className="ledger-total-value">
              ₹{totalPaid.toLocaleString('en-IN')}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
