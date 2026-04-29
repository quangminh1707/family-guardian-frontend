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
      className="group relative bg-bg-surface border-border-base rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-brand/10 transition-all duration-300 cursor-pointer border-t-4 border-t-brand/0 hover:border-t-brand"
      onClick={() => navigate(`/children/${child.id}`)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="relative">
            {child.avatarUrl ? (
              <img
                src={child.avatarUrl}
                alt={child.fullName}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-bg-subtle group-hover:ring-brand/10 transition-all"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-subtle flex items-center justify-center text-brand text-2xl font-bold">
                {child.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-bg-surface",
              child.isOnline ? "bg-green-500 animate-pulse" : "bg-bg-muted"
            )} />
          </div>
          <Badge variant="secondary" className={cn(
            "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
            child.isOnline ? "bg-success/10 text-success" : "bg-bg-muted text-tx-muted"
          )}>
            {child.isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
          </Badge>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-tx-primary group-hover:text-brand transition-colors uppercase tracking-tight">{child.fullName}</h3>
          <p className="text-sm text-tx-secondary mt-1">{child.email}</p>
          <p className="text-[10px] text-tx-muted mt-2 font-medium">Hoạt động cuối: {formatRelativeTime(child.lastSeenAt || '')}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-bg-subtle rounded-2xl p-3 border border-border-base/50">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-3 h-3 text-brand" />
              <span className="text-[10px] font-bold text-tx-muted uppercase tracking-wider">Websites</span>
            </div>
            <p className="text-lg font-bold text-tx-primary">{child.activeWebsitesCount || 0}</p>
          </div>
          <div className="bg-bg-subtle rounded-2xl p-3 border border-border-base/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-brand" />
              <span className="text-[10px] font-bold text-tx-muted uppercase tracking-wider">Hôm nay</span>
            </div>
            <p className="text-sm font-bold text-tx-primary truncate">{formatDuration(child.todayTotalSeconds || 0)}</p>
          </div>
        </div>

        {/* Filter Status Badge */}
        <div className="mb-6">
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold",
            child.filterEnabled 
              ? "bg-success/10 text-success" 
              : "bg-bg-muted text-tx-muted"
          )}>
            <span>🛡️ Bộ lọc:</span>
            <span>{child.filterEnabled ? '✅ BẬT' : '❌ TẮT'}</span>
          </div>
        </div>

        <div className="flex items-center justify-center w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand/20 group-hover:shadow-brand/30">
          <span>Quản lý tài khoản</span>
          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Card>
  );
}
