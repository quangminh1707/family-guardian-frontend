import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Camera,
  Clock3,
  Download,
  Eye,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import {
  cancelScheduledScreenshot,
  deleteScreenshot,
  getScheduledScreenshots,
  getScreenshots,
  requestScreenshot,
  scheduleScreenshot,
  type ScreenshotDto,
  type ScheduledScreenshotDto,
} from '@/api/children.api';
import { normalizeBackendDate, toLocalISOString } from '@/lib/formatters';
import { TimeInput24h } from '../ui/TimeInput24h';
import { toast } from '../feedback';

interface ScreenshotModalProps {
  childId: number;
  domain: string;
  websiteName: string;
  onClose: () => void;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';
type FailFilter = 'all' | 'tab_not_found' | 'failed';

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  all: 'Tất cả',
  today: 'Hôm nay',
  week: '7 ngày',
  month: '30 ngày',
};

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
  const requestTimerRef = useRef<number | null>(null);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [failFilter, setFailFilter] = useState<FailFilter>('all');
  const [selectedImage, setSelectedImage] = useState<ScreenshotDto | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [isTakingShot, setIsTakingShot] = useState(false);

  const { data: screenshots = [], isLoading } = useQuery({
    queryKey: ['screenshots', childId, domain, 'modal'],
    queryFn: () => getScreenshots(childId, domain, 100),
    refetchInterval: 5000,
  });


  const { data: scheduled = [] } = useQuery({
    queryKey: ['scheduled-screenshots', childId, domain],
    queryFn: () => getScheduledScreenshots(childId, domain),
    refetchInterval: 30000,
  });

  const requestMutation = useMutation({
    mutationFn: () => requestScreenshot(childId, domain),
    onMutate: () => {
      if (requestTimerRef.current != null) {
        window.clearTimeout(requestTimerRef.current);
        requestTimerRef.current = null;
      }
      setIsTakingShot(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screenshots', childId, domain] });
      requestTimerRef.current = window.setTimeout(() => {
        setIsTakingShot(false);
        requestTimerRef.current = null;
      }, 8000);
    },
    onError: () => {
      toast.error('Không thể gửi yêu cầu chụp ảnh');
      setIsTakingShot(false);
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!scheduleDate || !scheduleTime) {
        throw new Error('Vui lòng chọn ngày và giờ');
      }

      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new Error('Thời gian hẹn không hợp lệ');
      }

      if (scheduledAt <= new Date()) {
        throw new Error('Thời gian hẹn phải trong tương lai');
      }

      return scheduleScreenshot(childId, domain, toLocalISOString(scheduledAt));
    },
    onSuccess: () => {
      toast.success('Đã hẹn giờ chụp ảnh');
      queryClient.invalidateQueries({ queryKey: ['scheduled-screenshots', childId, domain] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể hẹn giờ');
    },
  });


  const deleteMutation = useMutation({
    mutationFn: (screenshotId: number) => deleteScreenshot(childId, screenshotId),
    onSuccess: (_, screenshotId) => {
      toast.delete('Đã xóa ảnh');
      if (selectedImage?.id === screenshotId) {
        setSelectedImage(null);
      }
      queryClient.invalidateQueries({ queryKey: ['screenshots', childId, domain] });
    },
    onError: () => {
      toast.error('Xóa thất bại');
    },
  });

  const cancelScheduleMutation = useMutation({
    mutationFn: (scheduleId: number) => cancelScheduledScreenshot(childId, scheduleId),
    onSuccess: () => {
      toast.delete('Đã hủy lịch chụp');
      queryClient.invalidateQueries({ queryKey: ['scheduled-screenshots', childId, domain] });
    },
    onError: () => {
      toast.error('Không thể hủy lịch');
    },
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

  useEffect(() => {
    return () => {
      if (requestTimerRef.current != null) {
        window.clearTimeout(requestTimerRef.current);
      }
    };
  }, []);

  const filteredScreenshots = screenshots.filter((screenshot) => {
    if (timeFilter === 'all') return true;

    const capturedAt = normalizeBackendDate(screenshot.capturedAt);
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

  const capturedList = filteredScreenshots.filter((screenshot) => screenshot.status === 'captured');
  const failedAll = filteredScreenshots.filter(
    (screenshot) => screenshot.status === 'tab_not_found' || screenshot.status === 'failed',
  );
  const failedVisible = failedAll.filter((screenshot) => {
    if (failFilter === 'all') return true;
    return screenshot.status === failFilter;
  });

  const handleScheduleToggle = () => {
    if (!showSchedule) {
      const now = new Date();
      setScheduleDate(now.toISOString().slice(0, 10));
      setScheduleTime(now.toTimeString().slice(0, 5));
    }

    setShowSchedule((value) => !value);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <div
          className="relative flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-none border-0 bg-bg-surface shadow-[0_24px_90px_rgba(0,0,0,0.45)] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-border-base"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-base px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 truncate text-sm font-semibold text-tx-primary sm:text-lg">
                <Camera className="h-4 w-4 shrink-0 text-brand-DEFAULT" />
                Ảnh chụp màn hình
              </h2>
              <p className="mt-0.5 truncate text-xs text-tx-secondary">{websiteName}</p>
              <p className="mt-0.5 truncate text-[11px] text-tx-muted">{domain}</p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">

              <button
                type="button"
                onClick={handleScheduleToggle}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  showSchedule
                    ? 'border-brand-DEFAULT/30 bg-brand-DEFAULT/15 text-brand-DEFAULT'
                    : 'border-border-base bg-bg-subtle text-tx-secondary hover:text-tx-primary'
                }`}
              >
                <Clock3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hẹn giờ</span>
              </button>

              <button
                type="button"
                onClick={() => requestMutation.mutate()}
                disabled={isTakingShot || requestMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-border-base bg-bg-subtle px-3 py-2 text-xs font-medium text-tx-primary transition-colors hover:border-brand-DEFAULT/40 hover:bg-brand-DEFAULT/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
              >
                {isTakingShot || requestMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-brand-DEFAULT" />
                    <span className="hidden sm:inline">Đang chụp...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 text-brand-DEFAULT" />
                    <span className="hidden sm:inline">Chụp ngay</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-base bg-bg-subtle text-tx-secondary transition-colors hover:border-border-strong hover:text-tx-primary"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {showSchedule && (
            <div className="shrink-0 border-b border-border-base bg-bg-subtle/40 px-4 py-3 sm:px-5">
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-tx-secondary">
                Hẹn giờ chụp tự động
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                <div className="flex flex-col gap-1 flex-1 sm:flex-none">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-tx-secondary">
                    Ngày
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setScheduleDate(event.target.value)}
                    className="h-9 w-full rounded-xl border border-border-base bg-bg-surface px-3 text-xs text-tx-primary transition-colors focus:border-brand-DEFAULT focus:outline-none dark:[color-scheme:dark] sm:w-auto"
                  />
                </div>

                <div className="flex flex-col gap-1 flex-1 sm:flex-none">
                  <TimeInput24h
                    label="Giờ chụp"
                    value={scheduleTime}
                    onChange={setScheduleTime}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => scheduleMutation.mutate()}
                  disabled={!scheduleDate || !scheduleTime || scheduleMutation.isPending}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-brand-DEFAULT/25 bg-brand-DEFAULT/10 px-4 text-xs font-bold text-brand-DEFAULT transition-colors hover:bg-brand-DEFAULT/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  {scheduleMutation.isPending ? 'Đang hẹn...' : 'Hẹn giờ'}
                </button>
              </div>

              {scheduled.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-tx-secondary">
                    Lịch đang chờ
                  </p>
                  {scheduled.map((item: ScheduledScreenshotDto) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border-base bg-bg-surface px-3 py-2.5"
                    >
                      <span className="text-xs text-tx-primary">
                        📅 {normalizeBackendDate(item.scheduledAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => cancelScheduleMutation.mutate(item.id)}
                        className="ml-3 text-[11px] text-tx-secondary transition-colors hover:text-red-400"
                      >
                        Hủy
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border-base px-4 py-2.5 sm:gap-2 sm:px-5 scrollbar-none">
            <Camera className="h-4 w-4 shrink-0 text-tx-secondary" />
            <span className="text-xs text-tx-secondary">Lọc:</span>

            {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTimeFilter(filter)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  timeFilter === filter
                    ? 'bg-brand-DEFAULT text-brand-text'
                    : 'bg-bg-subtle text-tx-secondary hover:bg-bg-muted hover:text-tx-primary'
                }`}
              >
                {TIME_FILTER_LABELS[filter]}
              </button>
            ))}

            <span className="ml-auto text-xs text-tx-secondary">
              {capturedList.length} ảnh
              {failedAll.length > 0 && <span className="ml-1 text-red-400/80">· {failedAll.length} lỗi</span>}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-brand-DEFAULT" />
              </div>
            )}

            {!isLoading && failedAll.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-tx-secondary">
                    Không thành công ({failedAll.length})
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {([
                      { key: 'all', label: 'Tất cả' },
                      { key: 'tab_not_found', label: 'Chưa mở tab' },
                      { key: 'failed', label: 'Lỗi khác' },
                    ] as { key: FailFilter; label: string }[]).map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setFailFilter(filter.key)}
                        className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                          failFilter === filter.key
                            ? 'border border-red-500/30 bg-red-500/15 text-red-400'
                            : 'bg-bg-subtle text-tx-secondary hover:bg-bg-muted hover:text-tx-primary'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {failedVisible.map((screenshot) => (
                    <div
                      key={screenshot.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs ${
                        screenshot.status === 'tab_not_found'
                          ? 'border-yellow-500/20 bg-yellow-500/6 text-yellow-500/80'
                          : 'border-red-500/20 bg-red-500/6 text-red-400/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-medium">
                            {screenshot.status === 'tab_not_found'
                              ? 'Con chưa mở website này'
                              : 'Chụp thất bại'}
                          </p>
                          <p className="text-[11px] text-tx-secondary">
                            {normalizeBackendDate(screenshot.capturedAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(screenshot.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-tx-secondary transition-colors hover:bg-white/10 hover:text-red-400"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && capturedList.length === 0 && failedAll.length === 0 && (
              <div className="py-20 text-center">
                <div className="mb-3 text-4xl">📷</div>
                <p className="text-sm text-tx-secondary">Chưa có ảnh trong khoảng thời gian này</p>
                <p className="mt-1 text-xs text-tx-muted">
                  Nhấn “Chụp ngay” hoặc hẹn giờ để chụp ảnh màn hình của con
                </p>
              </div>
            )}

            {capturedList.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-tx-secondary">
                  Ảnh đã chụp ({capturedList.length})
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {capturedList.map((screenshot) => {
                    const imageUrl = screenshot.imageUrl ? resolveImageUrl(screenshot.imageUrl) : null;

                    return (
                      <div
                        key={screenshot.id}
                        className="group relative aspect-video overflow-hidden rounded-2xl border border-border-base bg-bg-subtle shadow-sm transition-all hover:border-brand-DEFAULT/50 hover:shadow-lg"
                      >

                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Screenshot"
                            onClick={() => setSelectedImage(screenshot)}
                            className="h-full w-full cursor-pointer object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-tx-secondary">
                            Không có ảnh
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-transparent opacity-100" />
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-2.5 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-white/90">
                              {normalizeBackendDate(screenshot.capturedAt).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedImage(screenshot)}
                              className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-black/75"
                              title="Xem lớn"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteMutation.mutate(screenshot.id);
                              }}
                              className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/80"
                              title="Xóa ảnh"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedImage?.imageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-h-[95vh] max-w-6xl overflow-hidden rounded-[1.75rem] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={resolveImageUrl(selectedImage.imageUrl)}
              alt="Screenshot"
              className="max-h-[95vh] max-w-full object-contain"
            />

            <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
              <p className="text-sm font-medium text-white">
                📷 {normalizeBackendDate(selectedImage.capturedAt).toLocaleString('vi-VN')}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(selectedImage.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500/35"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </button>

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
            </div>

            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}