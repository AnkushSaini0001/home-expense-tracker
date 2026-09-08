import React, { useState } from 'react';
import { X, CalendarPlus } from 'lucide-react';

export default function DailyLogModal({
  isOpen,
  onClose,
  provider,
  currentMonth,
  onSubmit,
}) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = today.startsWith(currentMonth) ? today : `${currentMonth}-01`;

  const [date, setDate] = useState(defaultDate);
  const [quantity, setQuantity] = useState(provider?.billingType === 'monthly_fixed' ? '1' : '1.5');
  const [rate, setRate] = useState(provider?.defaultRate || 0);
  const [status, setStatus] = useState('delivered');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (provider) {
      setRate(provider.defaultRate);
      setQuantity(provider.billingType === 'monthly_fixed' ? '1' : '1.5');
    }
  }, [provider]);

  if (!isOpen || !provider) return null;

  const isDailyUnit = provider.billingType === 'daily_unit';
  const unitLabel = provider.unit || (isDailyUnit ? 'Liters' : 'Days');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) return;

    setLoading(true);
    try {
      await onSubmit({
        providerId: provider._id,
        date,
        quantity: Number(quantity),
        rate: Number(rate),
        status,
        notes,
      });
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
            <CalendarPlus size={20} color="#818cf8" />
            <h3 className="modal-title">
              {isDailyUnit ? `Log ${provider.name} Delivery` : `Log ${provider.name} Attendance`}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {isDailyUnit ? (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity ({unitLabel})</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="form-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="delivered">Delivered</option>
                    <option value="extra">Extra Delivery</option>
                    <option value="absent">Skipped / Absent</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Attendance Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="delivered">Present</option>
                  <option value="absent">Absent / Unpaid Leave</option>
                  <option value="holiday">Holiday / Paid Leave</option>
                </select>
              </div>
            )}

            {isDailyUnit && (
              <div className="form-group">
                <label className="form-label">Unit Rate (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Festival extra, or guest meal"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
