import { useState, useEffect } from 'react'; // ✅ thêm useEffect
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Loader2 } from 'lucide-react';


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
    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">🛡️ Bộ lọc web</span>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>
        <p className="text-xs text-gray-600">
          Khi bật, con chỉ truy cập được các web trong danh sách cho phép
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
          className="scale-125"
        />
        <span className="text-xs font-medium text-gray-700 min-w-[40px]">
          {enabled ? '✅ BẬT' : '❌ TẮT'}
        </span>
      </div>
    </div>
  );
}
