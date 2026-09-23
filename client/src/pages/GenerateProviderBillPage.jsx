import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  ClipboardList,
  RefreshCw,
  Share2,
  Download,
  Phone,
} from 'lucide-react';
import { api } from '../services/api';
import {
  buildProviderMonthlyExcel,
  downloadWorkbook,
} from '../utils/excelExport';

function FiltersSkeleton() {
  return (
    <div className="bill-filters section-card">
      <div className="bill-filters-grid bill-filters-grid-single">
        <div className="form-group">
          <Skeleton width={64} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton height={42} borderRadius={8} />
        </div>
        <div className="bill-filters-actions">
          <Skeleton width={180} height={42} borderRadius={8} />
        </div>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="provider-month-details" aria-busy="true">
      <div className="section-card">
        <Skeleton width={180} height={24} borderRadius={6} style={{ marginBottom: 16 }} />
        <div className="bill-totals-grid">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={78} borderRadius={10} />
          ))}
        </div>
      </div>
      <div className="section-card">
        <Skeleton width={140} height={18} borderRadius={4} style={{ marginBottom: 14 }} />
        <Skeleton count={6} height={28} borderRadius={4} style={{ marginBottom: 8 }} />
      </div>
    </div>
  );
}

/** Plain monthly summary for copy / WhatsApp (provider-facing, no candidate shares) */
function buildProviderShareText(bill) {
  const { provider, billing, monthFormatted, logs = [], payments = [] } = bill;
  const isDaily = billing.billingType === 'daily_unit';
  const lines = [
    `HomeLedger — Monthly Details`,
    `Month: ${monthFormatted}`,
    `Provider: ${provider.name} (${provider.category})`,
    provider.phone ? `Phone: ${provider.phone}` : null,
    ``,
  ].filter((l) => l !== null);

  if (isDaily) {
    lines.push(
      `Rate: ₹${billing.rate}/${billing.unit || 'Liter'}`,
      `Days delivered: ${billing.daysDelivered}`,
      `Days absent: ${billing.daysAbsent}`,
      `Total quantity: ${billing.totalUnits} ${billing.unit || 'Liter'}`
    );
  } else {
    lines.push(
      `Monthly salary: ₹${Number(billing.rate).toLocaleString('en-IN')}`,
      `Days present: ${billing.daysDelivered}`,
      `Leaves taken: ${billing.daysAbsent}`
    );
    if (billing.freeLeavesAllowed > 0) {
      lines.push(
        `Free leaves used: ${billing.freeLeavesUsed}/${billing.freeLeavesAllowed}`,
        `Deductible leaves: ${billing.deductibleLeaves}`,
        billing.leaveDeduction > 0
          ? `Leave deduction: ₹${billing.leaveDeduction.toLocaleString('en-IN')}`
          : null
      );
    }
  }

  lines.push(
    ``,
    `Total billed: ₹${Number(billing.totalBilled).toLocaleString('en-IN')}`,
    `Advances / paid: ₹${Number(billing.totalPaid).toLocaleString('en-IN')} (${payments.length} payment(s))`,
    `Balance pending: ₹${Number(billing.pendingBalance).toLocaleString('en-IN')}`,
    ``,
    `--- Daily records (${logs.length}) ---`
  );

  logs.forEach((log) => {
    const qty =
      isDaily && log.quantity != null
        ? ` | ${log.quantity} ${billing.unit || 'L'}`
        : '';
    const note = log.notes ? ` | ${log.notes}` : '';
    lines.push(
      `${log.date}: ${log.status}${qty} | ₹${Number(log.amount || 0).toLocaleString('en-IN')}${note}`
    );
  });

  if (payments.length) {
    lines.push(``, `--- Payments (${payments.length}) ---`);
    payments.forEach((p) => {
      const note = p.notes ? ` | ${p.notes}` : '';
      lines.push(
        `${p.date}: ${p.paymentType} ₹${Number(p.amount).toLocaleString('en-IN')}${
          p.paymentMethod ? ` (${p.paymentMethod})` : ''
        }${note}`
      );
    });
  }

  lines.push(``, `Generated via HomeLedger`);
  return lines.filter((l) => l !== null).join('\n');
}

export default function GenerateProviderBillPage({ currentMonth, monthName }) {
  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState('');
  const [bill, setBill] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingMeta(true);
        setError(null);
        const res = await api.getProviders('active');
        if (cancelled) return;
        const list = res.data || [];
        setProviders(list);
        if (list.length) {
          setProviderId((prev) => prev || String(list[0]._id));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load providers');
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const generateBill = useCallback(async () => {
    if (!providerId) {
      setError('Please select a provider');
      return;
    }
    try {
      setGenerating(true);
      setError(null);
      setBill(null);
      const res = await api.getProviderMonthlySummary(providerId, currentMonth);
      setBill(res.data);
    } catch (err) {
      setBill(null);
      setError(err.message || 'Failed to load monthly details');
    } finally {
      setGenerating(false);
    }
  }, [providerId, currentMonth]);

  useEffect(() => {
    setBill(null);
  }, [providerId, currentMonth]);

  const shareText = useMemo(
    () => (bill ? buildProviderShareText(bill) : ''),
    [bill]
  );

  const handleDownloadExcel = () => {
    if (!bill) return;
    try {
      const { fileName, sheets } = buildProviderMonthlyExcel(bill);
      downloadWorkbook(sheets, fileName);
    } catch (err) {
      setError(err.message || 'Failed to download Excel file');
    }
  };

  const handleShareWhatsApp = () => {
    if (!shareText) return;
    const encoded = encodeURIComponent(shareText);
    const phone = bill.provider?.phone
      ? bill.provider.phone.replace(/[^0-9]/g, '')
      : '';
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const selectedProvider = providers.find(
    (p) => String(p._id) === String(providerId)
  );

  const billing = bill?.billing;
  const isDaily = billing?.billingType === 'daily_unit';
  const due = billing?.pendingBalance ?? 0;
  const logs = bill?.logs || [];
  const payments = bill?.payments || [];

  return (
    <SkeletonTheme baseColor="#1e293b" highlightColor="#334155">
      <div className="bill-page">
        <div className="bill-page-header">
          <h2 className="bill-page-title">
            <ClipboardList size={22} />
            Provider Monthly Details
          </h2>
          <p className="bill-page-subtitle">
            View full monthly records for one provider for {monthName}. Download
            Excel or send details
            {selectedProvider?.phone ? ` to ${selectedProvider.phone}` : ''}.
          </p>
        </div>

        {loadingMeta ? (
          <FiltersSkeleton />
        ) : (
          <div className="bill-filters section-card">
            <div className="bill-filters-grid bill-filters-grid-single">
              <label className="form-group">
                <span className="form-label">Provider</span>
                <select
                  className="form-select"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  disabled={generating}
                >
                  {providers.length === 0 && (
                    <option value="">No providers</option>
                  )}
                  {providers.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </label>

              <div className="bill-filters-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={generateBill}
                  disabled={generating || !providerId}
                >
                  {generating ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <ClipboardList size={16} />
                      Load Monthly Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert-banner">
            <span>{error}</span>
            <button className="btn btn-secondary btn-sm" onClick={generateBill}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {generating && <DetailsSkeleton />}

        {!bill && !generating && !error && !loadingMeta && (
          <div className="section-card bill-empty">
            <ClipboardList size={40} className="bill-empty-icon" />
            <h3>No details loaded</h3>
            <p>
              Select a provider and load monthly details — attendance/deliveries,
              payments, and totals.
            </p>
          </div>
        )}

        {bill && !generating && billing && (
          <div className="provider-month-details">
            <div className="section-card">
              <div className="bill-slip-header">
                <div>
                  <div className="bill-kicker">Monthly Summary</div>
                  <h3 className="bill-candidate-name">{bill.provider.name}</h3>
                  <p className="bill-meta">
                    {bill.provider.category} · {bill.monthFormatted}
                    {bill.provider.phone ? ` · ${bill.provider.phone}` : ''}
                  </p>
                </div>
                <div className="bill-summary-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleDownloadExcel}
                  >
                    <Download size={15} />
                    Download Excel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={handleShareWhatsApp}
                  >
                    {bill.provider.phone ? (
                      <Phone size={15} />
                    ) : (
                      <Share2 size={15} />
                    )}
                    {bill.provider.phone ? 'Send to Number' : 'WhatsApp'}
                  </button>
                </div>
              </div>

              <div className="bill-totals-grid">
                <div className="bill-total-item">
                  <span>{isDaily ? 'Rate' : 'Monthly Salary'}</span>
                  <strong>
                    ₹{Number(billing.rate).toLocaleString('en-IN')}
                    {isDaily ? ` / ${billing.unit || 'Liter'}` : ''}
                  </strong>
                </div>
                {isDaily ? (
                  <div className="bill-total-item qty">
                    <span>Total Quantity</span>
                    <strong>
                      {Number(billing.totalUnits).toLocaleString('en-IN', {
                        maximumFractionDigits: 2,
                      })}{' '}
                      {billing.unit || 'Liter'}
                    </strong>
                  </div>
                ) : (
                  <div className="bill-total-item">
                    <span>Days Present</span>
                    <strong>{billing.daysDelivered}</strong>
                  </div>
                )}
                <div className="bill-total-item">
                  <span>{isDaily ? 'Days Delivered' : 'Leaves Taken'}</span>
                  <strong>
                    {isDaily ? billing.daysDelivered : billing.daysAbsent}
                  </strong>
                </div>
                <div className="bill-total-item">
                  <span>Total Billed</span>
                  <strong>
                    ₹{Number(billing.totalBilled).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="bill-total-item">
                  <span>Paid / Advances</span>
                  <strong>
                    ₹{Number(billing.totalPaid).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className={`bill-total-item ${due > 0 ? 'due' : ''}`}>
                  <span>Balance Pending</span>
                  <strong>
                    ₹{Number(Math.abs(due)).toLocaleString('en-IN')}
                    {due <= 0 ? ' (settled)' : ''}
                  </strong>
                </div>
              </div>

              {!isDaily && billing.freeLeavesAllowed > 0 && (
                <p className="bill-leave-note">
                  Leaves: {billing.daysAbsent} taken · {billing.freeLeavesUsed}/
                  {billing.freeLeavesAllowed} free · {billing.deductibleLeaves}{' '}
                  deducted
                  {billing.leaveDeduction > 0
                    ? ` (−₹${billing.leaveDeduction.toLocaleString('en-IN')})`
                    : ''}
                </p>
              )}
            </div>

            <div className="section-card">
              <div className="section-header">
                <h4 className="provider-detail-heading">
                  {isDaily ? 'Daily Deliveries' : 'Daily Attendance'} ({logs.length})
                </h4>
              </div>
              {logs.length === 0 ? (
                <p className="bill-muted">No entries for this month.</p>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        {isDaily && <th>Quantity</th>}
                        {isDaily && <th>Rate</th>}
                        <th>Status</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td>{log.date}</td>
                          {isDaily && (
                            <td>
                              {log.quantity} {billing.unit || 'Liter'}
                            </td>
                          )}
                          {isDaily && (
                            <td>
                              ₹
                              {Number(log.rate || billing.rate).toLocaleString(
                                'en-IN'
                              )}
                            </td>
                          )}
                          <td className="text-capitalize">{log.status}</td>
                          <td>{log.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="section-card">
              <div className="section-header">
                <h4 className="provider-detail-heading">
                  Advances & Payments ({payments.length})
                </h4>
              </div>
              {payments.length === 0 ? (
                <p className="bill-muted">No payments recorded this month.</p>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p._id}>
                          <td>{p.date}</td>
                          <td>{p.paymentType}</td>
                          <td>
                            ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td>{p.paymentMethod || '—'}</td>
                          <td>{p.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SkeletonTheme>
  );
}
