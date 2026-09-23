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

  return (
    <div className="app-shell">
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
