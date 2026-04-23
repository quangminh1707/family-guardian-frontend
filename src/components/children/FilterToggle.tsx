import { useState, useEffect } from 'react'; // ✅ thêm useEffect
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';


interface FilterToggleProps {
  childId: number;
  initialEnabled: boolean;
  onToggle?: (enabled: boolean) => void;
}

export function FilterToggle({ childId, initialEnabled, onToggle }: FilterToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
   useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

 const handleToggle = async (newValue: boolean) => {
  setIsLoading(true);
  try {
    await api.patch(`/children/${childId}/filter`, {
      filterEnabled: newValue,
    });

    setEnabled(newValue);
    onToggle?.(newValue);

    // ✅ Invalidate cả 2 để dashboard + trang detail đều cập nhật
    queryClient.invalidateQueries({ queryKey: ['children'] });
    queryClient.invalidateQueries({ queryKey: ['child', childId] });
  } catch (error) {
    console.error('Failed to toggle filter:', error);
    setEnabled(!newValue); // Revert on error
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="flex items-center gap-5 p-5 bg-gradient-to-br from-white to-blue-50/50 rounded-[2rem] border border-blue-100 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
        <span className="text-xl">🛡️</span>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-black text-gray-900 uppercase tracking-tight">Bộ lọc web</span>
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
        </div>
        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
          Bảo vệ trẻ em bằng cách chỉ truy cập các website an toàn
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-1.5 px-2">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest",
          enabled ? "text-green-600" : "text-gray-400"
        )}>
          {enabled ? 'Bật' : 'Tắt'}
        </span>
      </div>
    </div>
  );
}
