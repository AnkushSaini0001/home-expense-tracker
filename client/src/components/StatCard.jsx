import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function StatCard({ title, value, subtext, icon: Icon, colorTheme, loading = false }) {
  return (
    <div className={`stat-card ${colorTheme || ''}`}>
      <div className="stat-header">
        {loading ? (
          <Skeleton width={120} height={14} borderRadius={4} />
        ) : (
          <span className="stat-title">{title}</span>
        )}
        <div className="stat-icon-wrapper">
          {loading ? (
            <Skeleton circle width={18} height={18} />
          ) : (
            Icon && <Icon size={18} />
          )}
        </div>
      </div>
      <div className="stat-value">
        {loading ? <Skeleton width="55%" height={28} borderRadius={6} /> : value}
      </div>
      <div className="stat-subtext">
        {loading ? <Skeleton width="80%" height={12} borderRadius={4} /> : subtext}
      </div>
    </div>
  );
}
