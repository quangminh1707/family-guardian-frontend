import { useAuthStore } from '../../store/authStore';
import { 
  Bell, 
  Search,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useNotificationStore } from '../../store/notificationStore';

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  return (
    <header className="h-16 border-b border-gray-100 bg-white px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="w-full bg-gray-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-gray-900 rounded-xl">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        <div className="w-[1px] h-6 bg-gray-200" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-3 py-1 hover:bg-gray-50 rounded-xl transition-colors h-auto">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-100"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-900 leading-none">{user?.fullName}</span>
                <span className="text-[10px] text-gray-500 mt-1">Guardian</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
            <DropdownMenuLabel className="px-3 py-2 text-xs text-gray-500 truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer">Thông tin cá nhân</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer">Cài đặt</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="rounded-xl px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
              onClick={logout}
            >
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
