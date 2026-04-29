import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  Shield, 
  LayoutDashboard, 
  Bell, 
  Settings, 
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ConfirmModal } from '../feedback';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard' },
    { icon: Bell, label: 'Thông báo', path: '/notifications' },
    { icon: Settings, label: 'Cài đặt', path: '/settings' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f0f13] text-white w-64 border-r border-white/5 transition-colors duration-200">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-violet-600 p-2 rounded-xl">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">Family Guardian</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              location.pathname.startsWith(item.path)
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-white/50 hover:bg-white/10 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5",
              location.pathname.startsWith(item.path) ? "text-white" : "text-white/40 group-hover:text-white"
            )} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-10 h-10 rounded-full ring-2 ring-violet-500/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.fullName}</p>
              <p className="text-[10px] text-white/40 truncate uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất không?"
        confirmLabel="Đăng xuất"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
