import type { AllowedWebsite } from '../../types/website.types';
import { formatDuration, formatUsagePercent } from '../../lib/formatters';
import { Globe, Clock, Shield, ShieldAlert, Trash2, RefreshCw, BarChart3 } from 'lucide-react';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import { websitesApi } from '../../api/websites.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface WebsiteCardProps {
  childId: number;
  website: AllowedWebsite;
}

export default function WebsiteCard({ childId, website }: WebsiteCardProps) {
  const queryClient = useQueryClient();
  const usagePercent = formatUsagePercent(website.todaySeconds, website.timeLimitMinutes);

  const toggleMutation = useMutation({
    mutationFn: () => websitesApi.toggleWebsite(childId, website.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['websites', childId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => websitesApi.deleteWebsite(childId, website.id),
    onSuccess: () => {
      toast.success('Đã xóa website!');
      queryClient.invalidateQueries({ queryKey: ['websites', childId] });
    },
  });

  const recheckMutation = useMutation({
    mutationFn: () => websitesApi.recheckWebsite(childId, website.id),
    onSuccess: () => {
      toast.success('Đang thực hiện kiểm tra lại...');
      queryClient.invalidateQueries({ queryKey: ['websites', childId] });
    },
  });

  return (
    <Card className="group bg-white border-gray-100 rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden border-l-4 border-l-transparent hover:border-l-violet-500">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner group-hover:bg-violet-50 transition-colors">
            {website.faviconUrl ? (
              <img src={website.faviconUrl} alt={website.domain} className="w-8 h-8 rounded-lg" />
            ) : (
              <Globe className="w-8 h-8 text-gray-400 group-hover:text-violet-500" />
            )}
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 leading-tight truncate max-w-[150px]">
              {website.displayName || website.domain}
            </h4>
            <p className="text-xs text-gray-400 font-medium mt-1">{website.domain}</p>
          </div>
        </div>
        <Switch 
          checked={website.isActive} 
          onCheckedChange={() => toggleMutation.mutate()}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Sử dụng
            </span>
            <span className={cn(
              "font-mono",
              website.limitExceeded ? "text-red-600" : "text-gray-700"
            )}>
              {formatDuration(website.todaySeconds)}
              {website.timeLimitMinutes && (
                <span className="text-gray-300 font-normal"> / {formatDuration(website.timeLimitMinutes * 60)}</span>
              )}
            </span>
          </div>
          
          {website.timeLimitMinutes && (
            <div className="space-y-2">
              <Progress 
                value={usagePercent || 0} 
                className="h-2 rounded-full bg-gray-100" 
                indicatorClassName={cn(
                  "transition-all duration-500",
                  website.limitExceeded ? "bg-red-500" : "bg-violet-600"
                )}
              />
              <div className="flex justify-end">
                <span className={cn(
                  "text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter",
                  website.limitExceeded ? "bg-red-100 text-red-600" : "bg-violet-50 text-violet-600"
                )}>
                  {usagePercent}% đã dùng
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-[10px] font-semibold flex items-center gap-1.5 text-gray-500 bg-gray-50/50 p-2 rounded-xl">
             <BarChart3 className="w-3 h-3 text-violet-400" />
             {website.todayRequests} lần truy cập
          </div>
          <div className={cn(
            "text-[10px] font-bold flex items-center gap-1.5 p-2 rounded-xl uppercase tracking-wider",
            website.isSafe ? "text-green-600 bg-green-50/50" : "text-red-500 bg-red-50/50"
          )}>
             {website.isSafe ? <Shield className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
             {website.isSafe ? 'An toàn' : 'Cảnh báo'}
          </div>
        </div>

        {website.allowedStartTime && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-gray-50/50 p-2 rounded-xl uppercase tracking-wider border border-gray-100/50">
             <Clock className="w-3 h-3 text-violet-400" />
             Khung giờ: {website.allowedStartTime.substring(0,5)} - {website.allowedEndTime?.substring(0,5)}
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-around">
        <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50" title="Kiểm tra lại">
          <RefreshCw className={cn("w-4 h-4", recheckMutation.isPending && "animate-spin")} onClick={() => recheckMutation.mutate()} />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50"
          onClick={() => {
            if(confirm('Bạn có chắc muốn xóa website này?')) deleteMutation.mutate();
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
