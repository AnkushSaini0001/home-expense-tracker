import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FileText, RefreshCw, Share2, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import { isCandidateForCategory } from '../utils/candidateScope';

function FiltersSkeleton() {
  return (
    <div className="bill-filters section-card">
      <div className="bill-filters-grid">
        <div className="form-group">
          <Skeleton width={72} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton height={42} borderRadius={8} />
        </div>
        <div className="form-group">
          <Skeleton width={64} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton height={42} borderRadius={8} />
        </div>
        <div className="bill-filters-actions">
          <Skeleton width={160} height={42} borderRadius={8} />
        </div>
      </div>
    </div>
  );
}

function BillSlipSkeleton() {
  return (
    <div className="section-card bill-slip-card" aria-busy="true" aria-label="Generating bill slip">
      <div className="bill-slip-header">
        <div className="bill-slip-skeleton-title">
          <Skeleton width={70} height={12} borderRadius={4} />
          <Skeleton width={160} height={28} borderRadius={6} style={{ marginTop: 10 }} />
          <Skeleton width={130} height={14} borderRadius={4} style={{ marginTop: 8 }} />
        </div>
        <div className="bill-summary-actions">
          <Skeleton width={100} height={34} borderRadius={8} />
          <Skeleton width={110} height={34} borderRadius={8} />
        </div>
      </div>

      <div className="receipt-box bill-slip-box bill-slip-skeleton-box">
        <Skeleton width="55%" height={16} borderRadius={4} style={{ marginBottom: 14 }} />
        <Skeleton width="70%" height={14} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton width="65%" height={14} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton width="75%" height={14} borderRadius={4} style={{ marginBottom: 18 }} />
        <Skeleton width="92%" height={14} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton width="88%" height={14} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton width="95%" height={14} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton width="90%" height={14} borderRadius={4} style={{ marginBottom: 18 }} />
        <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: 12 }} />
        <Skeleton width="50%" height={16} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton width="48%" height={16} borderRadius={4} style={{ marginBottom: 10 }} />
        <Skeleton width="52%" height={16} borderRadius={4} />
      </div>

      <div className="bill-slip-status bill-slip-status-skeleton">
        <Skeleton width={100} height={14} borderRadius={4} />
        <Skeleton width={140} height={18} borderRadius={4} />
      </div>
    </div>
  );
}

export default function GenerateMonthlyBillPage({ currentMonth, monthName }) {
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
        if (cands.length) {
          setCandidateId((prev) => prev || String(cands[0]._id));
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
      setBill(null);
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

  useEffect(() => {
    setBill(null);
    setCopied(false);
  }, [candidateId, providerId, currentMonth]);

  const handleCopy = async () => {
    if (!bill?.shareableSummary) return;
    try {
      await navigator.clipboard.writeText(bill.shareableSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const handleShareWhatsApp = () => {
    if (!bill?.shareableSummary) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      bill.shareableSummary
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const due = bill?.totals?.pending ?? 0;

  return (
    <SkeletonTheme baseColor="#1e293b" highlightColor="#334155">
      <div className="bill-page">
        <div className="bill-page-header">
          <h2 className="bill-page-title">
            <FileText size={22} />
            Generate Monthly Bill
          </h2>
          <p className="bill-page-subtitle">
            Create a shareable bill slip for {monthName}. Copy or send on
            WhatsApp.
          </p>
        </div>

        {loadingMeta ? (
          <FiltersSkeleton />
        ) : (
          <div className="bill-filters section-card">
            <div className="bill-filters-grid">
              <label className="form-group">
                <span className="form-label">Candidate</span>
                <select
                  className="form-select"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  disabled={generating}
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
                  disabled={generating}
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
                  disabled={generating || !candidateId}
                >
                  {generating ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Generate Bill Slip
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

        {generating && <BillSlipSkeleton />}

        {!bill && !generating && !error && !loadingMeta && (
          <div className="section-card bill-empty">
            <FileText size={40} className="bill-empty-icon" />
            <h3>No bill slip yet</h3>
            <p>
            Select a candidate, keep Provider as All (or pick one), then
            generate the slip to copy or share.
          </p>
          </div>
        )}

        {bill && !generating && (
          <div className="section-card bill-slip-card">
            <div className="bill-slip-header">
              <div>
                <div className="bill-kicker">Bill Slip</div>
                <h3 className="bill-candidate-name">{bill.candidate.name}</h3>
                <p className="bill-meta">{bill.monthFormatted}</p>
              </div>
              <div className="bill-summary-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopy}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied' : 'Copy Slip'}
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

            <pre className="receipt-box bill-slip-box">{bill.shareableSummary}</pre>

            <div className="bill-slip-status">
              <span>Current Status</span>
              <strong className={due > 0 ? 'is-due' : 'is-settled'}>
                {due > 0
                  ? `₹${due.toLocaleString('en-IN')} Pending`
                  : 'Settled / Fully Paid'}
              </strong>
            </div>
          </div>
        )}
      </div>
    </SkeletonTheme>
  );
}
