import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Multi-select for household candidates.
 * Empty selection = "All Candidates" (shared cost).
 */
export default function CandidateMultiSelect({
  candidates = [],
  value = [],
  onChange,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selectedIds = value.map(String);
  const selectedCount = selectedIds.length;

  const label =
    selectedCount === 0
      ? 'All Candidates'
      : selectedCount === 1
        ? candidates.find((c) => String(c._id) === selectedIds[0])?.name || '1 selected'
        : `${selectedCount} selected`;

  const toggle = (id) => {
    const sid = String(id);
    if (selectedIds.includes(sid)) {
      onChange(selectedIds.filter((x) => x !== sid));
    } else {
      onChange([...selectedIds, sid]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div className={`candidate-multi ${className}`} ref={rootRef}>
      <button
        type="button"
        className="form-select candidate-multi-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="Empty = shared by all candidates"
      >
        <span className="candidate-multi-label">{label}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="candidate-multi-menu">
          <button
            type="button"
            className={`candidate-multi-option ${selectedCount === 0 ? 'active' : ''}`}
            onClick={clearAll}
          >
            <span className="candidate-multi-check">
              {selectedCount === 0 && <Check size={12} />}
            </span>
            All Candidates
          </button>
          <div className="candidate-multi-divider" />
          {candidates.map((c) => {
            const checked = selectedIds.includes(String(c._id));
            return (
              <button
                type="button"
                key={c._id}
                className={`candidate-multi-option ${checked ? 'active' : ''}`}
                onClick={() => toggle(c._id)}
              >
                <span className="candidate-multi-check">
                  {checked && <Check size={12} />}
                </span>
                {c.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
