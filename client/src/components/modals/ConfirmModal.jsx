import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Delete',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm?.();
      onClose?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={loading ? undefined : onClose}>
      <div
        className="modal-content confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <div className="modal-header">
          <div className="confirm-modal-heading">
            <div className="confirm-modal-icon">
              <AlertTriangle size={20} color="#f87171" />
            </div>
            <h3 className="modal-title" id="confirm-modal-title">
              {title}
            </h3>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-modal-message" id="confirm-modal-message">
            {message}
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
