import React, { useState } from 'react';
import { X, HandCoins } from 'lucide-react';

export default function RecordPaymentModal({
  isOpen,
  onClose,
  providers = [],
  selectedProviderId,
  currentMonth,
  onSubmit,
}) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = today.startsWith(currentMonth) ? today : `${currentMonth}-01`;

  const [providerId, setProviderId] = useState(selectedProviderId || providers[0]?._id || '');
  const [date, setDate] = useState(defaultDate);
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Advance');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync providerId if modal opened with a specific provider
  React.useEffect(() => {
    if (selectedProviderId) {
      setProviderId(selectedProviderId);
    } else if (providers.length > 0 && !providerId) {
      setProviderId(providers[0]._id);
    }
  }, [selectedProviderId, providers]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!providerId || !amount || !date) return;

    setLoading(true);
    try {
      await onSubmit({
        providerId,
        date,
        amount: Number(amount),
        paymentType,
        paymentMethod,
        notes,
      });
      setAmount('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HandCoins size={20} color="#fbbf24" />
            <h3 className="modal-title">Record Advance or Payment</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Service Provider / Staff</label>
              <select
                className="form-select"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                required
              >
                {providers.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment Type</label>
                <select
                  className="form-select"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <option value="Advance">Advance (Mid-month)</option>
                  <option value="Mid-month">Mid-month Withdrawal</option>
                  <option value="Settlement">Final Month Settlement</option>
                  <option value="Bonus">Bonus / Tip</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason / Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Taken for medical or festival expenses"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning" disabled={loading}>
              {loading ? 'Saving...' : 'Save Advance Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
