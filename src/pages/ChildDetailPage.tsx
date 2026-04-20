import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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

export default function ChildDetailPage() {
  const { childId } = useParams();
  const id = Number(childId);

  const [logPage, setLogPage] = useState(1);
  const pageSize = 10;
  
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
    <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
      <AlertCircle className="w-16 h-16 text-red-300 mb-6" />
      <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy tài khoản</h2>
      <p className="text-gray-500 mt-2 mb-8">Tài khoản này có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
      <Link to="/dashboard">
        <Button className="rounded-2xl h-12 px-8 bg-violet-600 font-bold uppercase tracking-wider">Quay lại Dashboard</Button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="flex items-start gap-6">
          <div className="relative shrink-0">
            {child.avatarUrl ? (
              <img
                src={child.avatarUrl}
                alt={child.fullName}
                className="w-24 h-24 rounded-3xl object-cover ring-8 ring-white shadow-xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-violet-100 flex items-center justify-center text-violet-600 text-4xl font-black shadow-xl">
                {child.fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-white ${child.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>
          <div className="space-y-2">
            <Link to="/dashboard" className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] hover:text-violet-600 transition-colors">
              <ArrowLeft className="w-3 h-3" />
              Quay lại danh sách
            </Link>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase">{child.fullName}</h2>
            <div className="flex flex-wrap items-center gap-3">
               <Badge variant="secondary" className="rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-[10px] font-bold uppercase border-none">
                 {child.email}
               </Badge>
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">
                 <Activity className={`w-3 h-3 ${child.isOnline ? 'text-green-500' : 'text-gray-300'}`} />
                 {child.isOnline ? 'Đang hoạt động' : `Ngoại tuyến: ${formatRelativeTime(child.lastSeenAt || '')}`}
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl h-11 px-5 border-gray-100 bg-white hover:bg-violet-50 hover:border-violet-100 hover:text-violet-600 transition-all font-bold text-xs uppercase tracking-wider gap-2">
            <Bell className="w-4 h-4" />
            Gửi thông báo
          </Button>
        </div>
      </div>

      {/* Filter Toggle */}
      <FilterToggle 
        childId={id} 
        initialEnabled={child.filterEnabled ?? false}
      />
      

      {/* Tabs */}
      <Tabs defaultValue="websites" className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm inline-flex">
            <TabsTrigger value="websites" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-200 transition-all">
              <Globe className="w-4 h-4 mr-2" />
              Websites
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-200 transition-all">
              <History className="w-4 h-4 mr-2" />
              Lịch sử
            </TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-200 transition-all">
              <Clock className="w-4 h-4 mr-2" />
              Phiên truy cập
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-200 transition-all">
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
           ) : websites && websites.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {websites.map(web => {
    const usedPercent = web.timeLimitMinutes
      ? Math.min(100, (web.todaySeconds / (web.timeLimitMinutes * 60)) * 100)
      : 0;
    const remainingMinutes = web.timeLimitMinutes
      ? Math.max(0, web.timeLimitMinutes - Math.floor(web.todaySeconds / 60))
      : null;
    const usedMinutes = Math.floor(web.todaySeconds / 60);

    return (
      <div key={web.id} className="space-y-3">
        <WebsiteCard childId={id} website={web} />

        {/* Thanh thời gian — chỉ hiện khi có giới hạn */}
        {web.timeLimitMinutes && (
          <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>⏱ Thời gian hôm nay</span>
              <span className={web.limitExceeded ? "text-red-500" : "text-gray-700"}>
                {usedMinutes}m / {web.timeLimitMinutes}m
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  web.limitExceeded
                    ? "bg-red-500"
                    : usedPercent > 75
                    ? "bg-orange-400"
                    : "bg-violet-500"
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>

            <div className="text-[11px] text-gray-400 font-medium">
              {web.limitExceeded
                ? "⛔ Đã hết thời gian"
                : `Còn lại ${remainingMinutes} phút`}
            </div>
          </div>
        )}
      </div>
    );
  })}
</div>
           ) : (
             <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-gray-200 max-w-2xl mx-auto">
               <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck className="w-10 h-10 text-gray-300" />
               </div>
               <h3 className="text-xl font-bold text-gray-900">Danh sách trống</h3>
               <p className="text-gray-500 mt-2 mb-8 leading-relaxed">
                 Tất cả các website hiện đang bị chặn. Hãy thêm các website đầu tiên để con có thể học tập và giải trí an toàn.
               </p>
               <AddWebsiteModal childId={id} />
             </div>
           )}
        </TabsContent>

        {/* Tab 2: History */}
        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
           <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">{fromDate} đến {toDate}</span>
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
  );
}
