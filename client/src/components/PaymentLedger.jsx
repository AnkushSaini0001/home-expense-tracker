import React from 'react';
import { HandCoins, Plus, Trash2, Wallet, Smartphone, Landmark } from 'lucide-react';

const methodIcons = {
  Cash: Wallet,
  UPI: Smartphone,
  'Bank Transfer': Landmark,
};

export default function PaymentLedger({
  payments = [],
  providerName,
  totalPaid = 0,
  userRole,
  onOpenAddPayment,
  onDeletePayment,
}) {
  const isAdmin = userRole === 'admin';

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
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Notes / Reason</th>
                  {isAdmin && <th style={{ width: '40px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const MethodIcon = methodIcons[p.paymentMethod] || Wallet;
                  return (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 500 }}>{p.date}</td>
                      <td style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className="tag tag-amber">{p.paymentType}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <MethodIcon size={13} /> {p.paymentMethod}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {p.notes || '—'}
                      </td>
                      {isAdmin && (
                        <td>
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

          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Total Advances Given This Month:
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
              ₹{totalPaid.toLocaleString('en-IN')}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
