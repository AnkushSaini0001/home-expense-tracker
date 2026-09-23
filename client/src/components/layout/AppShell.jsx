import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell({
  children,
  providers,
  selectedProviderId,
  onSelectProvider,
  user,
  currentMonth,
  setCurrentMonth,
  monthName,
  onLogout,
  onOpenAddProvider,
  onOpenAddPayment,
  providersLoading = false,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock page scroll while mobile drawer is open
  useEffect(() => {
    if (!sidebarOpen || window.innerWidth >= 992) {
      document.body.classList.remove('sidebar-drawer-open');
      return undefined;
    }

    const scrollY = window.scrollY;
    document.body.classList.add('sidebar-drawer-open');
    document.body.style.top = `-${scrollY}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      document.body.classList.remove('sidebar-drawer-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [sidebarOpen]);

  return (
    <div className={`app-shell${sidebarOpen ? ' sidebar-is-open' : ''}`}>
      <Sidebar
        providers={providers}
        selectedProviderId={selectedProviderId}
        onSelectProvider={onSelectProvider}
        userRole={user?.role}
        onAddProvider={onOpenAddProvider}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        loading={providersLoading}
      />

      <div className="app-main">
        <TopBar
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          monthName={monthName}
          user={user}
          onLogout={onLogout}
          onOpenAddProvider={onOpenAddProvider}
          onOpenAddPayment={onOpenAddPayment}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
