import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmModal, toast } from '../feedback';

interface FilterToggleProps {
  childId: number;
  initialEnabled: boolean;
  onToggle?: (enabled: boolean) => void;
}

export function FilterToggle({ childId, initialEnabled, onToggle }: FilterToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleToggleRequest = (newValue: boolean) => {
    setPendingEnabled(newValue);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (pendingEnabled === null) return;

    setShowConfirm(false);
    setIsLoading(true);

    try {
      await api.patch(`/children/${childId}/filter`, {
        filterEnabled: pendingEnabled,
      });

      setEnabled(pendingEnabled);
      onToggle?.(pendingEnabled);
      toast.success('Đã cập nhật bộ lọc');

      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['child', childId] });
    } catch (error) {
      console.error('Failed to toggle filter:', error);
      toast.error('Không thể cập nhật bộ lọc');
    } finally {
      setIsLoading(false);
      setPendingEnabled(null);
    }
  };

  return (
    <>
      <div className="filter-card flex items-center gap-5 rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)] dark:hover:border-slate-700 dark:hover:shadow-[0_22px_50px_rgba(0,0,0,0.45)]">
        <div className="toggle-wrapper flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-100 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800">
          <span className="text-xl">🛡️</span>
        </div>

        <div className="flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-slate-100">Bộ lọc web</span>
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 dark:text-sky-300" />}
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-gray-500 dark:text-slate-400">
            Bảo vệ trẻ em bằng cách chỉ truy cập các website an toàn
          </p>
        </div>

        <div className="flex flex-col items-center gap-1.5 px-2">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggleRequest}
            disabled={isLoading}
          />
          <span
            className={cn(
              'text-[9px] font-black uppercase tracking-widest',
              enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'
            )}
          >
            {enabled ? 'Bật' : 'Tắt'}
          </span>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Xác nhận thay đổi bộ lọc"
        message={
          pendingEnabled
            ? 'Bạn có muốn bật bộ lọc web không?'
            : 'Bạn có muốn tắt bộ lọc web không?'
        }
        confirmLabel="Có"
        cancelLabel="Không"
        variant="warning"
        onConfirm={handleConfirm}
        onCancel={() => {
          setShowConfirm(false);
          setPendingEnabled(null);
        }}
      />
    </>
  );
}
