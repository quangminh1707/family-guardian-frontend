import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import { useNotificationStore } from '../store/notificationStore';
import { 
  AlertTriangle, 
  Info, 
  Clock, 
  Trash2,
  Inbox,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { formatRelativeTime } from '../lib/formatters';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/ui/skeleton';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { setNotifications, markAsRead: markInStore } = useNotificationStore();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications().then(res => {
      setNotifications(res.data);
      return res.data;
    }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onMutate: (id) => markInStore(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const hasUnread = notifications?.some(n => !n.isRead);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-violet-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-red-500';
      case 'info': return 'border-l-blue-500';
      default: return 'border-l-violet-500';
    }
  };
  

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Thông báo</h2>
            <p className="text-gray-500 font-medium">Theo dõi các hoạt động và cảnh báo quan trọng từ hệ thống.</p>
         </div>
         <Button 
            variant="outline" 
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={!hasUnread || markAllAsReadMutation.isPending}
            className="rounded-2xl h-12 border-gray-100 font-bold uppercase tracking-widest text-[10px] gap-2 disabled:opacity-40"
          >
            <CheckCircle2 className="w-4 h-4" />
            Đánh dấu tất cả đã đọc
         </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-[2rem]" />)}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={cn(
                "group relative bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border-l-4",
                getBorderColor(n.type),
                !n.isRead && "bg-violet-50/10 border-violet-100"
              )}
            >
               <div className="flex gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                    n.type === 'warning' ? 'bg-red-50' : n.type === 'info' ? 'bg-blue-50' : 'bg-violet-50'
                  )}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between mb-1">
                       <h3 className={cn("text-lg font-bold tracking-tight", n.isRead ? "text-gray-700" : "text-gray-900")}>
                         {n.title}
                       </h3>
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                         <Clock className="w-3 h-3" />
                         {formatRelativeTime(n.createdAt)}
                         
                       </span>
                    </div>
                    <p className={cn("text-sm leading-relaxed", n.isRead ? "text-gray-400" : "text-gray-500")}>
                      {n.message}
                    </p>
                    
                    <div className="pt-4 flex items-center gap-3">
                       {!n.isRead && (
                         <Button 
                           size="sm" 
                           onClick={() => markAsReadMutation.mutate(n.id)}
                           className="rounded-xl h-8 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] uppercase tracking-wider"
                         >
                            Đánh dấu đã đọc
                         </Button>
                       )}
                       <Button variant="ghost" size="sm" className="rounded-xl h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                  
                  {!n.isRead && (
                    <div className="absolute top-6 right-8 w-2 h-2 bg-violet-600 rounded-full animate-pulse" />
                  )}
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-24 text-center border border-dashed border-gray-200">
           <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Inbox className="w-10 h-10 text-gray-300" />
           </div>
           <h3 className="text-xl font-bold text-gray-900">Hộp thư trống</h3>
           <p className="text-gray-500 mt-3 max-w-xs mx-auto text-sm leading-relaxed">
             Bạn không có thông báo nào vào lúc này. Mọi thứ đều đang diễn ra tốt đẹp!
           </p>
        </div>
      )}
    </div>
  );
}
