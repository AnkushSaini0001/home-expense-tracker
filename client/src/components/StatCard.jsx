import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, colorTheme }) {
  return (
    <div className={`stat-card ${colorTheme}`}>
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className="stat-icon-wrapper">
          {Icon && <Icon size={18} />}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
}
