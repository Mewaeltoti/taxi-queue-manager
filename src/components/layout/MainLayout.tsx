// src/components/layout/MainLayout.tsx
import { ReactNode, useEffect } from 'react';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { Outlet, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { InstallBanner } from '@/components/InstallBanner';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout() {
    const { user, logout } = useAuth();
  const navigate = useNavigate();
const { t } = useLanguage();
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <Header associationName={t('appName')} dispatcherName={user.name} onLogout={handleLogout}   />
      </div>

      {/* Main content with top padding to avoid overlap */}
      <main className="flex-1 pt-16 pb-14 md:pb-0"> {/* pb-14 for install banner on mobile */}
        <Outlet />
      </main>

      {/* Install banner for mobile users */}
      <InstallBanner />
    </div>
  );
}