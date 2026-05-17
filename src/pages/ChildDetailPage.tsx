import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import WarningConfigModal from '../components/WarningConfigModal';
import { useQuery } from '@tanstack/react-query';
import { childrenApi } from '../api/children.api';
import { websitesApi } from '../api/websites.api';
import { logsApi } from '../api/logs.api';
import { 
  ArrowLeft, 
  Globe, 
  History, 
  BarChart3, 
  Bell, 
  ShieldCheck, 
  Activity, 
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatRelativeTime } from '../lib/formatters';
import WebsiteCard from '../components/websites/WebsiteCard';
import AddWebsiteModal from '../components/websites/AddWebsiteModal';
import AccessLogTable from '../components/logs/AccessLogTable';
import { Skeleton } from '../components/ui/skeleton';
import { SessionHistoryTab } from '../components/logs/SessionHistoryTab';
import { UsageSummaryTab } from '../components/logs/UsageSummaryTab';
import { FilterToggle } from '../components/children/FilterToggle';
import { InternetPauseToggle } from '../components/children/InternetPauseToggle';

export default function ChildDetailPage() {
  const { childId } = useParams();
  const id = Number(childId);

  const [logPage, setLogPage] = useState(1);
  const pageSize = 10;
  const [editingWebsiteId, setEditingWebsiteId] = useState<number | null>(null);
  
  const [showWarningConfig, setShowWarningConfig] = useState(false);
  
  // Date range for logs/stats
  const [fromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Queries
  const { data: child, isLoading: isChildLoading } = useQuery({
    queryKey: ['child', id],
    queryFn: () => childrenApi.getChildDetail(id).then(res => res.data),
  });

  const { data: websites, isLoading: isWebsitesLoading } = useQuery({
    queryKey: ['websites', id],
    queryFn: () => websitesApi.getWebsites(id).then(res => res.data),
    refetchInterval: 30_000, // Cập nhật mỗi phút để thấy usage mới
  });
  const websitesWithBonus = websites?.map((website) => {
    const bonusSeconds = website.bonusSeconds ?? website.todayBonusSeconds ?? 0;
    return {
      ...website,
      bonusSeconds,
      effectiveSeconds:
        website.effectiveSeconds ?? Math.max(0, website.todaySeconds - bonusSeconds),
    };
  });

  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ['logs', id, logPage],
    queryFn: () => logsApi.getAccessLogs(id, { fromDate, toDate, page: logPage, pageSize }).then(res => res.data),
  });

  if (isChildLoading) return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-32 rounded-xl" />
      <Skeleton className="h-24 w-full rounded-[2rem]" />
      <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
    </div>
  );

  if (!child) return (
    <div className="flex flex-col items-center justify-center p-20 text-center bg-bg-surface rounded-[3rem] border border-border-base shadow-sm">
      <AlertCircle className="w-16 h-16 text-error/40 mb-6" />
      <h2 className="text-2xl font-bold text-tx-primary">Không tìm thấy tài khoản</h2>
      <p className="text-tx-secondary mt-2 mb-8">Tài khoản này có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
      <Link to="/dashboard">
        <Button className="rounded-2xl h-12 px-8 bg-brand font-bold uppercase tracking-wider">Quay lại Dashboard</Button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border-base">
        <div className="flex items-start gap-6">
          <div className="relative shrink-0">
            {child.avatarUrl ? (
              <img
                src={child.avatarUrl}
                alt={child.fullName}
                className="w-24 h-24 rounded-3xl object-cover ring-8 ring-bg-surface shadow-xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-brand-subtle flex items-center justify-center text-brand text-4xl font-black shadow-xl">
                {child.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-bg-surface ${child.isOnline ? 'bg-green-500' : 'bg-bg-muted'}`} />
          </div>
          <div className="space-y-2">
            <Link to="/dashboard" className="flex items-center gap-2 text-[10px] font-bold text-tx-muted uppercase tracking-[0.2em] hover:text-brand transition-colors">
              <ArrowLeft className="w-3 h-3" />
              Quay lại danh sách
            </Link>
            <h2 className="text-4xl font-black text-tx-primary tracking-tight uppercase">{child.fullName}</h2>
            <div className="flex flex-wrap items-center gap-3">
               <Badge variant="secondary" className="rounded-full bg-bg-subtle text-tx-secondary px-3 py-1 text-[10px] font-bold uppercase border-none">
                 {child.email}
               </Badge>
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-tx-muted uppercase tracking-widest pl-2">
                 <Activity className={`w-3 h-3 ${child.isOnline ? 'text-green-500' : 'text-tx-muted/30'}`} />
                 {child.isOnline ? 'Đang hoạt động' : `Ngoại tuyến: ${formatRelativeTime(child.lastSeenAt || '')}`}
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowWarningConfig(true)}
            className="rounded-2xl h-11 px-5 border-border-base bg-bg-surface hover:bg-warning-bg hover:border-warning/30 hover:text-warning transition-all font-bold text-xs uppercase tracking-wider gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Cấu hình cảnh báo
          </Button>
          <Button variant="outline" className="rounded-2xl h-11 px-5 border-border-base bg-bg-surface hover:bg-brand-subtle hover:border-brand/30 hover:text-brand transition-all font-bold text-xs uppercase tracking-wider gap-2">
            <Bell className="w-4 h-4" />
            Gửi thông báo
          </Button>
        </div>
      </div>

      {/* Controls: Filter & Kill Switch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={child.internetPaused ? 'opacity-40 pointer-events-none select-none' : ''}>
          <FilterToggle
            childId={id}
            initialEnabled={child.filterEnabled ?? false}
          />
        </div>
        <InternetPauseToggle
          childId={id}
          initialPaused={child.internetPaused ?? false}
          childName={child.fullName}
        />
      </div>

      {child.internetPaused && (
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-600 dark:text-red-300">
          Internet của Tài khoản này đang bị tạm dừng. Các phần quản lý bên dưới đang được làm mờ cho đến khi bật lại.
        </div>
      )}

      {/* Tabs */}
      <div className={child.internetPaused ? 'opacity-40 pointer-events-none select-none' : ''}>
      <Tabs defaultValue="websites" className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-bg-surface p-1 rounded-2xl border border-border-base shadow-sm inline-flex">
            <TabsTrigger value="websites" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-brand/20 transition-all">
              <Globe className="w-4 h-4 mr-2" />
              Websites
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-brand/20 transition-all">
              <History className="w-4 h-4 mr-2" />
              Lịch sử
            </TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-brand/20 transition-all">
              <Clock className="w-4 h-4 mr-2" />
              Phiên truy cập
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-brand/20 transition-all">
              <BarChart3 className="w-4 h-4 mr-2" />
              Thống kê
            </TabsTrigger>
          </TabsList>

          <TabsContent value="websites" className="m-0">
             <AddWebsiteModal childId={id} />
          </TabsContent>
        </div>

        {/* Tab 1: Websites */}
        <TabsContent value="websites" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
           {isWebsitesLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 w-full rounded-[2rem]" />)}
             </div>
           ) : websitesWithBonus && websitesWithBonus.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {websitesWithBonus.map((web) => (
                 <WebsiteCard
                   key={web.id}
                   childId={id}
                   website={web}
                   isEditing={editingWebsiteId === web.id}
                   onEditStart={() => setEditingWebsiteId(web.id)}
                   onEditCancel={() => setEditingWebsiteId(null)}
                 />
               ))}
             </div>
           ) : (
             <div className="bg-bg-surface rounded-[3rem] p-20 text-center border border-dashed border-border-subtle max-w-2xl mx-auto">
               <div className="w-20 h-20 bg-bg-subtle rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck className="w-10 h-10 text-tx-muted" />
               </div>
               <h3 className="text-xl font-bold text-tx-primary">Danh sách trống</h3>
               <p className="text-tx-secondary mt-2 mb-8 leading-relaxed">
                 Tất cả các website hiện đang bị chặn. Hãy thêm các website đầu tiên để con có thể học tập và giải trí an toàn.
               </p>
               <AddWebsiteModal childId={id} />
             </div>
           )}
        </TabsContent>

        {/* Tab 2: History */}
        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
           <div className="space-y-6">
              <div className="bg-bg-surface p-6 rounded-[2.5rem] border border-border-base shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 bg-bg-subtle px-4 py-2 rounded-xl border border-border-base">
                  <Calendar className="w-4 h-4 text-tx-muted" />
                  <span className="text-xs font-bold text-tx-primary uppercase tracking-widest">{fromDate} đến {toDate}</span>
                </div>
              </div>
              
              {isLogsLoading ? (
                 <Skeleton className="h-[600px] w-full rounded-[2.5rem]" />
              ) : (
                <AccessLogTable 
                  logs={logsData?.items || []} 
                  total={logsData?.total || 0}
                  page={logPage}
                  onPageChange={setLogPage}
                  pageSize={pageSize}
                />
              )}
           </div>
        </TabsContent>

        {/* Tab 3: Sessions */}
        <TabsContent value="sessions" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
           <SessionHistoryTab childId={id} />
        </TabsContent>

        {/* Tab 4: Stats */}
        <TabsContent value="stats" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
           <UsageSummaryTab childId={id} />
        </TabsContent>
      </Tabs>
      </div>

      {showWarningConfig && child && (
        <WarningConfigModal
          childId={id}
          childName={child.fullName}
          defaultTab="warning"
          websites={websitesWithBonus ?? []}
          onClose={() => setShowWarningConfig(false)}
        />
      )}
    </div>
  );
}
