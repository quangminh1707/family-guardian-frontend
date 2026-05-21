import { Camera, Clock, AlertCircle, Eye } from 'lucide-react';
import type { ScreenshotDto } from '../../api/children.api';
import { cn } from '../../lib/utils';

interface ScreenshotItemProps {
  screenshot: ScreenshotDto;
  onViewFull: (url: string) => void;
}

function resolveImageUrl(url: string) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
  return `${apiBase}${url}`;
}

export default function ScreenshotItem({ screenshot, onViewFull }: ScreenshotItemProps) {
  const timeStr = new Date(screenshot.capturedAt).toLocaleString('vi-VN');

  if (screenshot.status === 'pending') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border-base bg-bg-subtle p-2">
        <Camera className="h-4 w-4 animate-pulse text-brand-DEFAULT shrink-0" />
        <span className="text-xs text-tx-secondary">Đang chụp... ({timeStr})</span>
      </div>
    );
  }

  if (screenshot.status === 'tab_not_found') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/8 p-2">
        <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
        <div>
          <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Con chưa mở website này</p>
          <p className="text-xs text-tx-secondary">{timeStr}</p>
        </div>
      </div>
    );
  }

  if (screenshot.status === 'failed') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/8 p-2">
        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
        <div>
          <p className="text-xs font-medium text-red-600 dark:text-red-400">Chụp thất bại</p>
          <p className="text-xs text-tx-secondary">{timeStr}</p>
        </div>
      </div>
    );
  }

  if (screenshot.status === 'captured' && screenshot.imageUrl) {
    const imageUrl = resolveImageUrl(screenshot.imageUrl);

    return (
      <div
        className={cn(
          'group relative overflow-hidden rounded-lg border border-border-base transition-colors',
          'cursor-pointer hover:border-brand-DEFAULT/50'
        )}
        onClick={() => onViewFull(imageUrl)}
      >
        <img
          src={imageUrl}
          alt="Screenshot"
          className="h-32 w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <Eye className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
          <span className="flex items-center gap-1 text-[10px] font-medium text-white">
            <Clock className="h-3 w-3" />
            {new Date(screenshot.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
