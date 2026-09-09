import React from 'react';
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
  if (!isOpen) return null;

  const handleConfirm = () => {
    const confirmFn = onConfirm;
    onClose?.();
    // Run after close so backdrop loader can take over
    Promise.resolve().then(() => confirmFn?.());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
