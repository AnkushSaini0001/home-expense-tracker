import React, { useState } from 'react';
import { X, Copy, Check, MessageSquareShare, Printer } from 'lucide-react';

export default function ShareBillModal({
  isOpen,
  onClose,
  summaryData,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !summaryData) return null;

  const { shareableSummary, provider, billing, monthFormatted } = summaryData;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppSend = () => {
    const encoded = encodeURIComponent(shareableSummary);
    const phone = provider.phone ? provider.phone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquareShare size={20} color="#10b981" />
            <h3 className="modal-title">Monthly Bill Statement</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Share this detailed monthly breakdown with {provider.name} or keep it for your household records:
          </p>

          <pre className="receipt-box">{shareableSummary}</pre>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.88rem',
            }}
          >
            <span>Current Status:</span>
            <span
              style={{
                fontWeight: 700,
                color: billing.pendingBalance > 0 ? '#fb7185' : '#34d399',
              }}
            >
              {billing.pendingBalance > 0
                ? `₹${billing.pendingBalance.toLocaleString('en-IN')} Pending`
                : 'Settled / Fully Paid'}
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print</span>
          </button>
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
          <button className="btn btn-success" onClick={handleWhatsAppSend}>
            <MessageSquareShare size={15} />
            <span>Send to WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
