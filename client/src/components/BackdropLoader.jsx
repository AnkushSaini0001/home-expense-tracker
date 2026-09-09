import React from 'react';

export default function BackdropLoader({ isOpen, label = 'Please wait...' }) {
  if (!isOpen) return null;

  return (
    <div className="backdrop-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="backdrop-loader-grid" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="backdrop-loader-dot" style={{ '--dot-i': i }} />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
