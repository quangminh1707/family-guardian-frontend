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
  Settings,
  AlertCircle,
  Calendar,
  LayoutGrid
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatRelativeTime } from '../lib/formatters';
import WebsiteCard from '../components/websites/WebsiteCard';
import AddWebsiteModal from '../components/websites/AddWebsiteModal';
import AccessLogTable from '../components/logs/AccessLogTable';
import UsageHistoryChart from '../components/logs/UsageHistoryChart';
import { Skeleton } from '../components/ui/skeleton';

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
  });

  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ['logs', id, logPage],
    queryFn: () => logsApi.getAccessLogs(id, { fromDate, toDate, page: logPage, pageSize }).then(res => res.data),
  });

  const { data: usageHistory, isLoading: isStatsLoading } = useQuery({
    queryKey: ['usage', id, fromDate, toDate],
    queryFn: () => logsApi.getUsageHistory(id, { fromDate, toDate }).then(res => res.data),
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
          <Button variant="outline" className="rounded-2xl h-11 px-5 border-gray-100 bg-white hover:bg-violet-50 hover:border-violet-100 hover:text-violet-600 transition-all font-bold text-xs uppercase tracking-wider gap-2">
            <Settings className="w-4 h-4" />
            Cài đặt proxy
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="websites" className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm inline-flex">
            <TabsTrigger value="websites" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-200 transition-all">
              <Globe className="w-4 h-4 mr-2" />
              Websites được phép
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-200 transition-all">
              <History className="w-4 h-4 mr-2" />
              Lịch sử truy cập
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
               {websites.map(web => (
                 <WebsiteCard key={web.id} childId={id} website={web} />
               ))}
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
                {/* Advanced filters could go here */}
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

        {/* Tab 3: Stats */}
        <TabsContent value="stats" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-10">
                       <div className="bg-violet-50 p-2 rounded-xl">
                          <BarChart3 className="w-6 h-6 text-violet-600" />
                       </div>
                       <div>
                          <h4 className="text-xl font-bold text-gray-900 leading-none">Phân bổ thời gian</h4>
                          <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">7 ngày gần nhất</p>
                       </div>
                    </div>
                    {isStatsLoading ? (
                       <Skeleton className="h-[400px] w-full rounded-2xl" />
                    ) : usageHistory && usageHistory.length > 0 ? (
                       <UsageHistoryChart data={usageHistory} />
                    ) : (
                       <div className="h-[400px] flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-xs">Chưa có dữ liệu thống kê</div>
                    )}
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-6">
                       <div className="flex items-center justify-between">
                          <LayoutGrid className="w-8 h-8 text-violet-400" />
                          <Badge className="bg-violet-600 text-[10px] py-1 border-none font-black">PREMIUM</Badge>
                       </div>
                       <div>
                          <h4 className="text-2xl font-black tracking-tight leading-8 uppercase">Phân tích<br />thông minh</h4>
                          <p className="text-sm text-gray-400 mt-2 font-medium">Hệ thống đang thu thập dữ liệu để đưa ra các cảnh báo hành vi sớm cho phụ huynh.</p>
                       </div>
                       <Button className="w-full h-12 rounded-2xl bg-white text-gray-900 font-bold uppercase tracking-wider hover:bg-violet-50">Xem chi tiết</Button>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 blur-[60px] group-hover:bg-violet-600/30 transition-all" />
                 </div>

                 <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h5 className="font-bold text-gray-900 uppercase tracking-widest text-[11px] mb-6">Ghi chú gần nhất</h5>
                    <div className="space-y-4">
                       <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                          <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                          <p className="text-xs text-gray-600 leading-relaxed font-medium">Hệ thống đã tự động chặn 12 yêu cầu truy cập không an toàn hôm nay.</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
