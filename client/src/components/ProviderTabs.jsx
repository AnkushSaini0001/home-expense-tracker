import React from 'react';
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
}) {
  const isAdmin = userRole === 'admin';

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
