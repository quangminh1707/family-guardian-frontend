import { useNavigate } from 'react-router-dom';
import type { ChildUser } from '../../types/user.types';
import { formatDuration, formatRelativeTime } from '../../lib/formatters';
import { Globe, Clock, ChevronRight } from 'lucide-react';
import { Card, Badge } from '../ui';
import { cn } from '../../lib/utils';

interface ChildCardProps {
  child: ChildUser;
}

export default function ChildCard({ child }: ChildCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="group relative bg-white border-gray-100 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-violet-200/50 transition-all duration-300 cursor-pointer border-t-4 border-t-violet-500/0 hover:border-t-violet-500"
      onClick={() => navigate(`/children/${child.id}`)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="relative">
            {child.avatarUrl ? (
              <img
                src={child.avatarUrl}
                alt={child.fullName}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-gray-50 group-hover:ring-violet-50 transition-all"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 text-2xl font-bold">
                {child.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white",
              child.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-300"
            )} />
          </div>
          <Badge variant="secondary" className={cn(
            "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
            child.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          )}>
            {child.isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
          </Badge>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-violet-600 transition-colors uppercase tracking-tight">{child.fullName}</h3>
          <p className="text-sm text-gray-500 mt-1">{child.email}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">Hoạt động cuối: {formatRelativeTime(child.lastSeenAt || '')}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100/50">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-3 h-3 text-violet-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Websites</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{child.activeWebsitesCount || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-violet-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hôm nay</span>
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">{formatDuration(child.todayTotalSeconds || 0)}</p>
          </div>
        </div>

        {/* Filter Status Badge */}
        <div className="mb-6">
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold",
            child.filterEnabled 
              ? "bg-green-100 text-green-700" 
              : "bg-gray-100 text-gray-500"
          )}>
            <span>🛡️ Bộ lọc:</span>
            <span>{child.filterEnabled ? '✅ BẬT' : '❌ TẮT'}</span>
          </div>
        </div>

        <div className="flex items-center justify-center w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-200 group-hover:shadow-violet-300">
          <span>Quản lý tài khoản</span>
          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Card>
  );
}
