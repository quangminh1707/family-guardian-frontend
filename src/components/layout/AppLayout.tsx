import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useExtensionMonitor } from '../../hooks/useExtensionMonitor';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    useExtensionMonitor();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans antialiased text-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 border-b border-gray-100 bg-white px-4 flex items-center justify-between">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-none">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <span className="font-bold text-violet-600">Family Guardian</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Topbar (Desktop) */}
        <div className="hidden lg:block">
          <Topbar />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
