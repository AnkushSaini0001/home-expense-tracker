import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { Milk, Utensils, Sparkles, Car, User, Plus } from 'lucide-react';

const categoryIcons = {
  Milkman: Milk,
  Cook: Utensils,
  Maid: Sparkles,
  Driver: Car,
  Other: User,
};

export default function ProviderTabs({
  providers,
  selectedProviderId,
  userRole,
  onSelectProvider,
  onAddNew,
  loading = false,
}) {
  const isAdmin = userRole === 'admin';

  if (loading) {
    return (
      <div className="tabs-container">
        <div className="provider-pills">
          <Skeleton width={130} height={36} borderRadius={999} style={{ margin: '0.1rem' }} />
          <Skeleton width={150} height={36} borderRadius={999} style={{ margin: '0.1rem' }} />
        </div>
        {isAdmin && <Skeleton width={128} height={34} borderRadius={8} />}
      </div>
    );
  }

  return (
    <div className="tabs-container">
      <div className="provider-pills">
        {providers.map((p) => {
          const Icon = categoryIcons[p.category] || User;
          const isSelected = selectedProviderId === p._id;

          return (
            <button
              key={p._id}
              className={`provider-pill ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectProvider(p._id)}
            >
              <Icon size={16} />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {isAdmin && (
        <button className="btn btn-secondary btn-sm" onClick={onAddNew}>
          <Plus size={14} />
          <span>New Provider</span>
        </button>
      )}
    </div>
  );
}
