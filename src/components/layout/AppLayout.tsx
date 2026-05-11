import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useExtensionMonitor } from '../../hooks/useExtensionMonitor';
import { Toast } from '../feedback';
import { ThemeToggle } from '../theme';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useExtensionMonitor();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base font-sans antialiased text-tx-primary transition-colors duration-200">
      <Toast />

      <aside className="hidden lg:flex flex-shrink-0 flex-col">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-16 items-center justify-between border-b border-border-base bg-bg-surface px-4 lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-xl p-2 text-tx-secondary transition-colors hover:bg-bg-subtle hover:text-tx-primary"
            aria-label="Mở menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-bold text-violet-600">Family Guardian</span>
          </div>

          <ThemeToggle />
        </div>

        <div className="hidden lg:block">
          <Topbar />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10">
          <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-full w-64 overflow-y-auto border-r border-border-base bg-[#0f0f13] shadow-2xl lg:hidden">
            <Sidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
