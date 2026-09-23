import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Milk,
  Utensils,
  Sparkles,
  Car,
  User,
  Plus,
  ChevronRight,
  LayoutDashboard,
  FileText,
  ClipboardList,
  X,
} from 'lucide-react';

const categoryIcons = {
  Milkman: Milk,
  Cook: Utensils,
  Maid: Sparkles,
  Driver: Car,
  Other: User,
};

const CATEGORY_ORDER = ['Milkman', 'Cook', 'Maid', 'Driver', 'Other'];

export default function Sidebar({
  providers = [],
  selectedProviderId,
  onSelectProvider,
  userRole,
  onAddProvider,
  open,
  onClose,
  loading = false,
}) {
  const isAdmin = userRole === 'admin';
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [openMenus, setOpenMenus] = useState({});

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = providers.filter((p) => {
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    });

    const map = {};
    filtered.forEach((p) => {
      const cat = p.category || 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });

    return CATEGORY_ORDER.filter((c) => map[c]?.length).map((c) => ({
      category: c,
      items: map[c],
    }));
  }, [providers, query]);

  useEffect(() => {
    if (!selectedProviderId || !providers.length) return;
    const selected = providers.find((p) => p._id === selectedProviderId);
    if (!selected?.category) return;
    setOpenMenus((prev) => ({ ...prev, [selected.category]: true }));
  }, [selectedProviderId, providers]);

  useEffect(() => {
    if (!query.trim()) return;
    setOpenMenus((prev) => {
      const next = { ...prev };
      grouped.forEach(({ category }) => {
        next[category] = true;
      });
      return next;
    });
  }, [query, grouped]);

  const toggleMenu = (category) => {
    setOpenMenus((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleSelectProvider = (id) => {
    onSelectProvider(id);
    if (location.pathname !== '/') navigate('/');
    onClose?.();
  };

  return (
    <>
      <div
        className={`sidebar-backdrop${open ? ' is-visible' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`app-sidebar${open ? ' is-open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Home size={22} />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">HomeLedger</h1>
            <p className="brand-subtitle">Household Billing</p>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-search">
          <Search size={15} className="sidebar-search-icon" />
          <input
            type="search"
            placeholder="Search providers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search providers"
          />
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Menu</div>
          <ul className="sidebar-menu sidebar-top-menu">
            <li className="sidebar-menu-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `sidebar-nav-link${isActive ? ' is-active' : ''}`
                }
                onClick={() => onClose?.()}
              >
                <span className="sidebar-menu-icon">
                  <LayoutDashboard size={16} />
                </span>
                <span className="sidebar-menu-title">Dashboard</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/generate-bill"
                className={({ isActive }) =>
                  `sidebar-nav-link${isActive ? ' is-active' : ''}`
                }
                onClick={() => onClose?.()}
              >
                <span className="sidebar-menu-icon">
                  <FileText size={16} />
                </span>
                <span className="sidebar-menu-title">Generate Monthly Bill</span>
              </NavLink>
            </li>
            <li className="sidebar-menu-item">
              <NavLink
                to="/provider-bill"
                className={({ isActive }) =>
                  `sidebar-nav-link${isActive ? ' is-active' : ''}`
                }
                onClick={() => onClose?.()}
              >
                <span className="sidebar-menu-icon">
                  <ClipboardList size={16} />
                </span>
                <span className="sidebar-menu-title">Provider Monthly Details</span>
              </NavLink>
            </li>
          </ul>

          <div className="sidebar-nav-label sidebar-nav-label-spaced">
            Providers
          </div>

          {loading && providers.length === 0 ? (
            <div className="sidebar-loading">Loading…</div>
          ) : grouped.length === 0 ? (
            <div className="sidebar-empty">
              {query ? 'No matches' : 'No providers yet'}
            </div>
          ) : (
            <ul className="sidebar-menu">
              {grouped.map(({ category, items }) => {
                const Icon = categoryIcons[category] || User;
                const isOpen = !!openMenus[category];
                const hasActiveChild =
                  location.pathname === '/' &&
                  items.some((p) => p._id === selectedProviderId);

                return (
                  <li
                    key={category}
                    className={`sidebar-menu-item${isOpen ? ' is-open' : ''}${
                      hasActiveChild ? ' has-active' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="sidebar-menu-link"
                      onClick={() => toggleMenu(category)}
                      aria-expanded={isOpen}
                    >
                      <span className="sidebar-menu-link-main">
                        <span className="sidebar-menu-icon">
                          <Icon size={16} />
                        </span>
                        <span className="sidebar-menu-title">{category}</span>
                        <span className="sidebar-menu-badge">{items.length}</span>
                      </span>
                      <ChevronRight
                        size={15}
                        className={`sidebar-menu-chevron${isOpen ? ' is-open' : ''}`}
                      />
                    </button>

                    <ul
                      className={`sidebar-submenu${isOpen ? ' is-open' : ''}`}
                      hidden={!isOpen}
                    >
                      {items.map((p) => {
                        const active =
                          location.pathname === '/' &&
                          selectedProviderId === p._id;
                        return (
                          <li key={p._id} className="sidebar-submenu-item">
                            <button
                              type="button"
                              className={`sidebar-submenu-link${
                                active ? ' is-active' : ''
                              }`}
                              onClick={() => handleSelectProvider(p._id)}
                            >
                              <span className="sidebar-submenu-bullet" />
                              <span className="sidebar-submenu-title">
                                {p.name}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {isAdmin && (
          <div className="sidebar-footer">
            <button
              type="button"
              className="btn btn-primary btn-sm sidebar-add-btn"
              onClick={() => {
                onAddProvider?.();
                onClose?.();
              }}
            >
              <Plus size={15} />
              Add Provider
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
