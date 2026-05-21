import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, X, Download } from 'lucide-react';
import { childrenApi, type ScreenshotDto } from '../../api/children.api';
import { Button } from '../ui/button';
import { toast } from '../feedback';
import ScreenshotItem from './ScreenshotItem';

interface ScreenshotModalProps {
  childId: number;
  domain: string;
  websiteName: string;
  onClose: () => void;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';

function resolveImageUrl(url: string) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
  return `${apiBase}${url}`;
}

export default function ScreenshotModal({
  childId,
  domain,
  websiteName,
  onClose,
}: ScreenshotModalProps) {
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<ScreenshotDto | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const { data: screenshots = [], isLoading, refetch } = useQuery({
    queryKey: ['screenshots', childId, domain, 'modal'],
    queryFn: () => childrenApi.getScreenshots(childId, domain, 50).then(res => res.data),
    refetchInterval: 5000,
  });

  const requestMutation = useMutation({
    mutationFn: () => childrenApi.requestScreenshot(childId, domain),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu chụp ảnh');
      queryClient.invalidateQueries({ queryKey: ['screenshots', childId, domain] });
      queryClient.invalidateQueries({ queryKey: ['screenshots', childId, domain, 'modal'] });
      window.setTimeout(() => {
        void refetch();
      }, 6000);
    },
    onError: () => toast.error('Không thể gửi yêu cầu'),
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selectedImage) {
        setSelectedImage(null);
        return;
      }
      onClose();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedImage, onClose]);

  const filteredScreenshots = screenshots.filter((screenshot) => {
    if (timeFilter === 'all') return true;
    const capturedAt = new Date(screenshot.capturedAt);
    const now = new Date();

    if (timeFilter === 'today') {
      return capturedAt.toDateString() === now.toDateString();
    }

    if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return capturedAt >= weekAgo;
    }

    if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return capturedAt >= monthAgo;
    }

    return true;
  });

  const capturedList = filteredScreenshots.filter(screenshot => screenshot.status === 'captured');
  const pendingList = filteredScreenshots.filter(screenshot => screenshot.status === 'pending');
  const failedList = filteredScreenshots.filter(
    screenshot => screenshot.status !== 'captured' && screenshot.status !== 'pending'
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border-base bg-bg-surface shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border-base px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-tx-primary">Ảnh chụp màn hình</h2>
              <p className="mt-0.5 text-xs text-tx-secondary">{websiteName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => requestMutation.mutate()}
                disabled={requestMutation.isPending}
                size="sm"
                variant="outline"
                className="gap-2 text-xs"
              >
                
                {requestMutation.isPending ? 'Đang gửi...' : 'Chụp ngay'}
             
              </Button>
              <Button
                onClick={onClose}
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-lg text-tx-secondary hover:bg-bg-subtle hover:text-tx-primary"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-border-base px-6 py-3">
            <Camera className="h-4 w-4 shrink-0 text-tx-secondary" />
            <span className="text-xs text-tx-secondary">Lọc:</span>
            {(['all', 'today', 'week', 'month'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTimeFilter(filter)}
                className={
                  `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    timeFilter === filter
                      ? 'bg-brand-DEFAULT text-white'
                      : 'bg-bg-subtle text-tx-secondary hover:bg-bg-muted hover:text-tx-primary'
                  }`
                }
              >
                {{ all: 'Tất cả', today: 'Hôm nay', week: '7 ngày', month: '30 ngày' }[filter]}
              </button>
            ))}
            <span className="ml-auto text-xs text-tx-secondary">
              {capturedList.length} ảnh
              {pendingList.length > 0 && (
                <span className="ml-1 text-yellow-500">• {pendingList.length} đang chụp</span>
              )}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-DEFAULT border-t-transparent" />
              </div>
            )}

            {!isLoading && filteredScreenshots.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-tx-secondary">  Chưa có ảnh nào trong khoảng thời gian này</p>
                <p className="mt-1 text-xs text-tx-secondary"> Nhấn "Yêu cầu chụp ngay" để chụp ảnh màn hình của con</p>
              </div>
            )}

            {pendingList.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-tx-secondary">Đang xử lý</p>
                <div className="space-y-2">
                  {pendingList.map((screenshot) => (
                    <ScreenshotItem key={screenshot.id} screenshot={screenshot} onViewFull={() => {}} />
                  ))}
                </div>
              </div>
            )}

            {failedList.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-tx-secondary">Không thành công</p>
                <div className="space-y-2">
                  {failedList.map((screenshot) => (
                    <ScreenshotItem key={screenshot.id} screenshot={screenshot} onViewFull={() => {}} />
                  ))}
                </div>
              </div>
            )}

            {capturedList.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-tx-secondary">
                  Ảnh đã chụp ({capturedList.length})
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {capturedList.map((screenshot) => (
                    <ScreenshotItem
                      key={screenshot.id}
                      screenshot={screenshot}
                      onViewFull={(url) => setSelectedImage({ ...screenshot, imageUrl: url })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedImage?.imageUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-h-[95vh] max-w-5xl overflow-hidden rounded-2xl shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={resolveImageUrl(selectedImage.imageUrl)}
              alt="Screenshot"
              className="max-h-[95vh] max-w-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
              <p className="text-sm font-medium text-white"> 📅 {new Date(selectedImage.capturedAt).toLocaleString('vi-VN')}</p>
              <a
                href={resolveImageUrl(selectedImage.imageUrl)}
                download={`screenshot_${selectedImage.id}.jpg`}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
              >
                <Download className="h-3.5 w-3.5" />
                Tải xuống
              </a>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
