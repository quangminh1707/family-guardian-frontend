import { useState, useEffect } from 'react';
import { Switch } from '../ui/switch';
import { useQueryClient } from '@tanstack/react-query';
import { childrenApi } from '../../api/children.api';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ConfirmModal, toast } from '../feedback';

interface InternetPauseToggleProps {
  childId: number;
  initialPaused: boolean;
  childName: string;
}

export function InternetPauseToggle({ childId, initialPaused, childName }: InternetPauseToggleProps) {
  const [paused, setPaused] = useState(initialPaused);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPaused, setPendingPaused] = useState<boolean | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPaused(initialPaused);
  }, [initialPaused]);

  const handleToggleRequest = (newValue: boolean) => {
    setPendingPaused(newValue);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (pendingPaused === null) return;

    setShowConfirm(false);
    setIsLoading(true);

    try {
      const res = await childrenApi.pauseInternet(childId);
      setPaused(res.data.internetPaused);
      
      if (res.data.internetPaused) {
        toast.warning(res.data.message);
      } else {
        toast.success(res.data.message);
      }

      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['child', childId] });
    } catch (error) {
      console.error('Failed to toggle internet access:', error);
      toast.error('Không thể cập nhật trạng thái truy cập');
    } finally {
      setIsLoading(false);
      setPendingPaused(null);
    }
  };

  return (
    <>
      <div className={cn(
        "filter-card flex items-center gap-5 rounded-[2rem] border border-border-base bg-bg-surface p-5 shadow-sm transition-all duration-300 hover:shadow-md transition-colors",
        paused && "ring-1 ring-red-500/10"
      )}>
        <div className={cn(
          "toggle-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1",
          paused 
            ? "bg-red-500/10 text-red-500 ring-red-500/20" 
            : "bg-bg-subtle text-tx-secondary ring-border-base"
        )}>
          {paused ? <WifiOff className="h-6 w-6" /> : <Wifi className="h-6 w-6" />}
        </div>

        <div className="flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span className={cn(
              "text-sm font-black uppercase tracking-tight",
              paused ? "text-red-500 dark:text-red-400" : "text-tx-primary"
            )}>
              {paused ? 'Đã tạm dừng Internet' : 'Kết nối Internet'}
            </span>
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />}
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-tx-secondary">
            {paused 
              ? 'Tất cả kết nối web hiện đang bị chặn hoàn toàn.' 
              : 'Trẻ có thể truy cập các trang web được phép.'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1.5 px-2">
          {/* Note: Switch is checked when internet is PAUSED */}
          <Switch
            checked={paused}
            onCheckedChange={handleToggleRequest}
            disabled={isLoading}
            className={paused ? 'data-[state=checked]:bg-red-500 data-[state=checked]:shadow-[inset_0_0_0_2px_rgba(239,68,68,0.45)]' : ''}
          />
          <span
            className={cn(
              'text-[9px] font-black uppercase tracking-widest',
              paused ? 'text-red-500 dark:text-red-400' : 'text-success'
            )}
          >
            {paused ? 'PAUSED' : 'ACTIVE'}
          </span>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Xác nhận Kill Switch"
        message={
          pendingPaused
            ? `Bạn có chắc chắn muốn TẠM DỪNG toàn bộ truy cập internet của ${childName} không?`
            : `Bạn có muốn MỞ LẠI truy cập internet cho ${childName} không?`
        }
        confirmLabel={pendingPaused ? "Tạm dừng ngay" : "Mở lại"}
        cancelLabel="Hủy"
        variant={pendingPaused ? "danger" : "default"}
        onConfirm={handleConfirm}
        onCancel={() => {
          setShowConfirm(false);
          setPendingPaused(null);
        }}
      />
    </>
  );
}
