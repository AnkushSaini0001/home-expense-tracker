import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';

export default function ProviderModal({
  isOpen,
  onClose,
  provider = null, // if null, add new, else edit
  onSubmit,
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Milkman');
  const [billingType, setBillingType] = useState('daily_unit');
  const [defaultRate, setDefaultRate] = useState('');
  const [unit, setUnit] = useState('Liter');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider) {
      setName(provider.name || '');
      setCategory(provider.category || 'Milkman');
      setBillingType(provider.billingType || 'daily_unit');
      setDefaultRate(provider.defaultRate || '');
      setUnit(provider.unit || (provider.billingType === 'monthly_fixed' ? 'Month' : 'Liter'));
      setPhone(provider.phone || '');
      setNotes(provider.notes || '');
    } else {
      setName('');
      setCategory('Milkman');
      setBillingType('daily_unit');
      setDefaultRate('66');
      setUnit('Liter');
      setPhone('');
      setNotes('');
    }
  }, [provider, isOpen]);

  if (!isOpen) return null;

  // Auto-switch unit helper on category change
  const handleCategoryChange = (val) => {
    setCategory(val);
    if (val === 'Milkman') {
      setBillingType('daily_unit');
      setUnit('Liter');
      if (!provider) setDefaultRate('66');
    } else if (val === 'Cook' || val === 'Maid' || val === 'Driver') {
      setBillingType('monthly_fixed');
      setUnit('Month');
      if (!provider) setDefaultRate('3500');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || defaultRate === '') return;

    setLoading(true);
    try {
      await onSubmit({
        name,
        category,
        billingType,
        defaultRate: Number(defaultRate),
        unit,
        phone,
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
            <UserPlus size={20} color="#818cf8" />
            <h3 className="modal-title">
              {provider ? 'Edit Staff / Provider' : 'Add New Provider'}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Name / Label</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ramesh (Milkman) or Sunita (Cook)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="Milkman">Milkman (Milk deliveries)</option>
                  <option value="Cook">Cook (Meal preparation)</option>
                  <option value="Maid">Maid / House help</option>
                  <option value="Driver">Driver</option>
                  <option value="Gardener">Gardener</option>
                  <option value="Newspaper">Newspaper</option>
                  <option value="Other">Other Helper</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Billing Model</label>
                <select
                  className="form-select"
                  value={billingType}
                  onChange={(e) => {
                    setBillingType(e.target.value);
                    if (e.target.value === 'monthly_fixed') setUnit('Month');
                    else if (unit === 'Month') setUnit('Liter');
                  }}
                >
                  <option value="daily_unit">Per Unit / Daily Quantity</option>
                  <option value="monthly_fixed">Fixed Monthly Salary</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  {billingType === 'monthly_fixed' ? 'Monthly Wage (₹)' : 'Rate Per Unit (₹)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-input"
                  placeholder={billingType === 'monthly_fixed' ? 'e.g. 3500' : 'e.g. 66'}
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Liter, Packet, Day, Month"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone / WhatsApp Number (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Schedule, delivery time, etc.)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Delivers every morning at 6:30 AM"
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
              <Save size={14} />
              <span>{loading ? 'Saving...' : provider ? 'Update Provider' : 'Create Provider'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
