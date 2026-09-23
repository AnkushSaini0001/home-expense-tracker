import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  RefreshCw,
  Share2,
  Copy,
  Check,
  Milk,
  Utensils,
  Sparkles,
  Car,
  User,
} from 'lucide-react';
import { api } from '../services/api';
import { isCandidateForCategory } from '../utils/candidateScope';

const categoryIcons = {
  Milkman: Milk,
  Cook: Utensils,
  Maid: Sparkles,
  Driver: Car,
  Other: User,
};

export default function GenerateMonthlyBillPage({
  currentMonth,
  monthName,
}) {
  const [candidates, setCandidates] = useState([]);
  const [providers, setProviders] = useState([]);
  const [candidateId, setCandidateId] = useState('');
  const [providerId, setProviderId] = useState('all');
  const [bill, setBill] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingMeta(true);
        setError(null);
        const [candRes, provRes] = await Promise.all([
          api.getCandidates('active'),
          api.getProviders('active'),
        ]);
        if (cancelled) return;
        const cands = candRes.data || [];
        const provs = provRes.data || [];
        setCandidates(cands);
        setProviders(provs);
        if (cands.length && !candidateId) {
          setCandidateId(String(cands[0]._id));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load options');
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => String(c._id) === String(candidateId)),
    [candidates, candidateId]
  );

  const providerOptions = useMemo(() => {
    if (!selectedCandidate) return providers;
    return providers.filter((p) =>
      isCandidateForCategory(selectedCandidate, p.category)
    );
  }, [providers, selectedCandidate]);

  // If selected provider is not valid for candidate, reset to All
  useEffect(() => {
    if (providerId === 'all') return;
    const stillValid = providerOptions.some(
      (p) => String(p._id) === String(providerId)
    );
    if (!stillValid) setProviderId('all');
  }, [providerOptions, providerId]);

  const generateBill = useCallback(async () => {
    if (!candidateId) {
      setError('Please select a candidate');
      return;
    }
    try {
      setGenerating(true);
      setError(null);
      setCopied(false);
      const res = await api.getCandidateMonthlyBill(
        currentMonth,
        candidateId,
        providerId || 'all'
      );
      setBill(res.data);
    } catch (err) {
      setBill(null);
      setError(err.message || 'Failed to generate bill');
    } finally {
      setGenerating(false);
    }
  }, [candidateId, providerId, currentMonth]);

  // Clear bill when filters / month change
  useEffect(() => {
    setBill(null);
    setCopied(false);
  }, [candidateId, providerId, currentMonth]);

  const handleCopy = async () => {
    if (!bill?.shareableSummary) return;
    try {
      await navigator.clipboard.writeText(bill.shareableSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const handleShareWhatsApp = () => {
    if (!bill?.shareableSummary) return;
    const url = `https://wa.me/?text=${encodeURIComponent(bill.shareableSummary)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bill-page">
      <div className="bill-page-header">
        <div>
          <h2 className="bill-page-title">
            <FileText size={22} />
            Generate Monthly Bill
          </h2>
          <p className="bill-page-subtitle">
            Build a candidate-wise statement for {monthName}. Default provider
            filter is All.
          </p>
        </div>
      </div>

      <div className="bill-filters section-card">
        <div className="bill-filters-grid">
          <label className="form-group">
            <span className="form-label">Candidate</span>
            <select
              className="form-select"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              disabled={loadingMeta || generating}
            >
              {candidates.length === 0 && (
                <option value="">No candidates</option>
              )}
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-group">
            <span className="form-label">Provider</span>
            <select
              className="form-select"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              disabled={loadingMeta || generating}
            >
              <option value="all">All Providers</option>
              {providerOptions.map((p) => (
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
              disabled={loadingMeta || generating || !candidateId}
            >
              {generating ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Generating…
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Generate Bill
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-banner">
          <span>{error}</span>
          <button className="btn btn-secondary btn-sm" onClick={generateBill}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {!bill && !generating && !error && (
        <div className="section-card bill-empty">
          <FileText size={40} className="bill-empty-icon" />
          <h3>No bill generated yet</h3>
          <p>
            Select a candidate, keep providers as All (or pick one), then click
            Generate Bill.
          </p>
        </div>
      )}

      {bill && (
        <div className="bill-result">
          <div className="bill-summary-card section-card">
            <div className="bill-summary-top">
              <div>
                <div className="bill-kicker">Candidate Statement</div>
                <h3 className="bill-candidate-name">{bill.candidate.name}</h3>
                <p className="bill-meta">
                  {bill.monthFormatted} ·{' '}
                  {bill.providerFilter === 'all'
                    ? `All providers (${bill.totals.providersCount})`
                    : bill.sections[0]?.provider?.name}
                </p>
              </div>
              <div className="bill-summary-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopy}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={handleShareWhatsApp}
                >
                  <Share2 size={15} />
                  WhatsApp
                </button>
              </div>
            </div>

            <div className="bill-totals-grid">
              <div className="bill-total-item">
                <span>Total Billed</span>
                <strong>
                  ₹{bill.totals.billed.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="bill-total-item">
                <span>Paid Credit</span>
                <strong>₹{bill.totals.paid.toLocaleString('en-IN')}</strong>
              </div>
              <div className="bill-total-item due">
                <span>Balance Due</span>
                <strong>
                  ₹{bill.totals.pending.toLocaleString('en-IN')}
                </strong>
              </div>
              {bill.totals.quantity > 0 && (
                <div className="bill-total-item qty">
                  <span>Milk Quantity</span>
                  <strong>
                    {bill.totals.quantity.toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                    })}{' '}
                    Liter
                  </strong>
                </div>
              )}
            </div>
          </div>

          {bill.sections.length === 0 ? (
            <div className="section-card bill-empty">
              <p>No share found for this candidate with the selected providers.</p>
            </div>
          ) : (
            bill.sections.map((section) => {
              const Icon =
                categoryIcons[section.provider.category] || User;
              const isDaily = section.billing.billingType === 'daily_unit';

              return (
                <div
                  className="bill-provider-section section-card"
                  key={String(section.provider._id)}
                >
                  <div className="bill-provider-head">
                    <div className="bill-provider-title">
                      <span className="bill-provider-icon">
                        <Icon size={18} />
                      </span>
                      <div>
                        <h4>{section.provider.name}</h4>
                        <p>
                          {section.provider.category} · ₹
                          {section.billing.rate.toLocaleString('en-IN')}
                          {isDaily
                            ? ` / ${section.billing.unit || 'Liter'}`
                            : ' / Month'}
                        </p>
                      </div>
                    </div>
                    <div className="bill-provider-share">
                      {isDaily && section.share.quantityShare > 0 && (
                        <div className="bill-share-row qty">
                          <span>Qty share</span>
                          <strong>
                            {section.share.quantityShare}{' '}
                            {section.share.unit || 'Liter'}
                          </strong>
                        </div>
                      )}
                      <div className="bill-share-row">
                        <span>Billed</span>
                        <strong>
                          ₹{section.share.billedShare.toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="bill-share-row">
                        <span>Paid</span>
                        <strong>
                          ₹{section.share.paidShare.toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="bill-share-row due">
                        <span>Due</span>
                        <strong>
                          ₹{section.share.pendingShare.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {!isDaily && section.billing.daysAbsent > 0 && (
                    <p className="bill-leave-note">
                      Leaves: {section.billing.daysAbsent} taken
                      {section.billing.freeLeavesAllowed > 0 &&
                        ` · ${section.billing.freeLeavesUsed} free · ${section.billing.deductibleLeaves} deducted`}
                      {section.billing.leaveDeduction > 0 &&
                        ` (−₹${section.billing.leaveDeduction.toLocaleString('en-IN')})`}
                    </p>
                  )}

                  <div className="bill-detail-block">
                    <h5>Related entries ({section.logs.length})</h5>
                    {section.logs.length === 0 ? (
                      <p className="bill-muted">No daily entries this month.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="custom-table bill-log-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              {isDaily && <th>Qty</th>}
                              <th>Status</th>
                              <th>Amount</th>
                              <th>Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {section.logs.map((log) => (
                              <tr key={log._id}>
                                <td>{log.date}</td>
                                {isDaily && (
                                  <td>
                                    {log.quantity} {section.billing.unit}
                                  </td>
                                )}
                                <td className="text-capitalize">{log.status}</td>
                                <td>
                                  ₹{Number(log.amount || 0).toLocaleString('en-IN')}
                                </td>
                                <td>{log.notes || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {section.payments?.length > 0 && (
                    <div className="bill-detail-block">
                      <h5>Advances / Payments ({section.payments.length})</h5>
                      <div className="table-responsive">
                        <table className="custom-table bill-log-table">
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
                            {section.payments.map((p) => (
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
                      <p className="bill-muted bill-paid-hint">
                        Paid credit on this bill is this candidate&apos;s equal
                        share of provider advances for the month.
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
