import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AllowedWebsite } from '../../types/website.types';
import { formatDuration, getFaviconUrl } from '../../lib/formatters';
import {
  Globe,
  Clock,
  Shield,
  ShieldAlert,
  Trash2,
  RefreshCw,
  BarChart3,
  Pencil,
  Camera,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import { websitesApi } from '../../api/websites.api';
import { ConfirmModal, toast } from '../feedback';
import EditWebsiteModal from './EditWebsiteModal';
import ScreenshotModal from './ScreenshotModal';

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

function calcTimeWindowProgress(
  startTime: string,
  endTime: string,
  todaySeconds: number,
) {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  const windowTotalMinutes = Math.max(0, endMinutes - startMinutes);
  const windowTotalSeconds = windowTotalMinutes * 60;
  const usedSeconds = Math.min(todaySeconds, windowTotalSeconds);
  const usedPercent = windowTotalSeconds > 0 ? Math.round((usedSeconds / windowTotalSeconds) * 100) : 0;
  const usedMinutes = Math.floor(usedSeconds / 60);
  const remainingMinutes = Math.max(0, windowTotalMinutes - usedMinutes);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isWithinWindow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  return {
    usedPercent,
    windowTotalMinutes,
    usedMinutes,
    remainingMinutes,
    isWithinWindow,
  };
}

interface WebsiteCardProps {
  childId: number;
  website: AllowedWebsite;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditCancel?: () => void;
}

export default function WebsiteCard({
  childId,
  website,
  isEditing = false,
  onEditStart,
  onEditCancel,
}: WebsiteCardProps) {
  const queryClient = useQueryClient();
  const bonusSeconds = website.bonusSeconds ?? website.todayBonusSeconds ?? 0;
  const effectiveSeconds =
    website.effectiveSeconds ?? Math.max(0, website.todaySeconds - bonusSeconds);
  const timeLimitMinutes = website.timeLimitMinutes ?? null;
  const windowStartTime = website.allowedStartTime ?? '';
  const windowEndTime = website.allowedEndTime ?? '';
  const isTimeLimitMode = timeLimitMinutes != null && timeLimitMinutes > 0;
  const isTimeWindowMode = Boolean(windowStartTime && windowEndTime);
  const hasTimeLimitBonus = isTimeLimitMode && bonusSeconds > 0;
  const hasTimeWindowBonus = isTimeWindowMode && bonusSeconds > 0;
  const limitSeconds = (timeLimitMinutes ?? 0) * 60;
  const totalGrantedSeconds = limitSeconds + bonusSeconds;
  const usagePercent = limitSeconds > 0
    ? Math.min(100, Math.round((effectiveSeconds / limitSeconds) * 100))
    : null;
  const remainingSeconds = Math.max(0, totalGrantedSeconds - website.todaySeconds);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const progressColor =
    usagePercent != null && usagePercent >= 100
      ? 'bg-red-500'
      : usagePercent != null && usagePercent >= 80
        ? 'bg-amber-500'
        : 'bg-brand';
  const timeWindowProgress =
    isTimeWindowMode
      ? calcTimeWindowProgress(windowStartTime, windowEndTime, website.todaySeconds)
      : null;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [lastRequestedEdit, setLastRequestedEdit] = useState(false);
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: () => websitesApi.toggleWebsite(childId, website.id),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái website');
      queryClient.invalidateQueries({ queryKey: ['websites', childId] });
    },
    onError: () => toast.error('Không thể cập nhật website'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => websitesApi.deleteWebsite(childId, website.id),
    onSuccess: () => {
      toast.delete('Đã xóa website');
      queryClient.invalidateQueries({ queryKey: ['websites', childId] });
    },
    onError: () => toast.error('Không thể xóa website'),
  });

  const recheckMutation = useMutation({
    mutationFn: () => websitesApi.recheckWebsite(childId, website.id),
    onSuccess: () => {
      toast.success('Đã kiểm tra lại website');
      queryClient.invalidateQueries({ queryKey: ['websites', childId] });
    },
    onError: () => toast.error('Không thể kiểm tra lại website'),
  });

  const openEditModal = () => {
    setEditOpen(true);
    setLastRequestedEdit(true);
    onEditStart?.();
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setLastRequestedEdit(false);
    onEditCancel?.();
  };

  const showEditModal = isEditing || editOpen || lastRequestedEdit;

  return (
    <>
      <Card className="card-hover group relative overflow-hidden rounded-[2rem] border border-border-base bg-bg-surface p-6 transition-all duration-300 hover:border-brand/40 hover:shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border-base bg-bg-subtle shadow-inner transition-colors group-hover:bg-brand-subtle">
              {website.domain ? (
                <img
                  src={getFaviconUrl(website.domain)}
                  alt={website.domain}
                  className="h-8 w-8 rounded-lg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${website.domain}&sz=32`;
                  }}
                />
              ) : (
                <Globe className="h-8 w-8 text-tx-muted group-hover:text-brand" />
              )}
            </div>
            <div>
              <h4 className="max-w-[170px] truncate text-lg font-bold text-tx-primary">
                {website.displayName || website.domain}
              </h4>
              <p className="mt-1 truncate text-xs font-medium text-tx-muted">{website.domain}</p>
            </div>
          </div>

          <Switch checked={website.isActive} onCheckedChange={() => toggleMutation.mutate()} />
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            {/* Time Window mode */}
            {isTimeWindowMode ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-tx-muted">
                    <Clock className="h-3 w-3" />
                    Khung giờ
                  </span>
                  <span className="font-mono text-tx-secondary">
                    {windowStartTime.substring(0, 5)} → {windowEndTime.substring(0, 5)}
                  </span>
                </div>
                {timeWindowProgress?.isWithinWindow ? (
                  <>
                    <div className="relative h-2 overflow-hidden rounded-full bg-bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          timeWindowProgress.usedPercent >= 100
                            ? 'bg-red-500'
                            : timeWindowProgress.usedPercent >= 80
                              ? 'bg-orange-400'
                              : 'bg-brand',
                        )}
                        style={{ width: `${Math.min(timeWindowProgress.usedPercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={cn(
                          'font-bold',
                          timeWindowProgress.usedPercent >= 100
                            ? 'text-red-500'
                            : 'text-brand dark:text-brand',
                        )}
                      >
                        {timeWindowProgress.usedPercent}% ĐÃ DÙNG
                      </span>
                      {timeWindowProgress.usedPercent < 100 ? (
                        <span className="text-tx-muted">
                          Còn {timeWindowProgress.remainingMinutes} phút
                        </span>
                      ) : (
                        <span className="font-bold text-red-500">⛔ Đã hết khung giờ</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-border-base bg-bg-subtle px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-tx-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-brand" />
                      Ngoài khung giờ
                    </span>
                    <span>
                      {timeWindowProgress?.usedMinutes ?? 0} / {timeWindowProgress?.windowTotalMinutes ?? 0} phút
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Minute Limit mode */
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-tx-muted">
                    <Clock className="h-3 w-3" />
                    Sử dụng
                  </span>
                  <span className={cn('font-mono', website.limitExceeded ? 'text-error' : 'text-tx-secondary')}>
                    {formatDuration(effectiveSeconds)}
                    {isTimeLimitMode && (
                      <span className="font-normal text-tx-muted/30">
                        {' '}
                        / {formatDuration(limitSeconds)}
                      </span>
                    )}
                  </span>
                </div>
                {isTimeLimitMode && (
                  <div className="space-y-2">
                    <Progress
                      value={usagePercent || 0}
                      className="h-2 rounded-full bg-bg-muted"
                      indicatorClassName={cn(
                        'transition-all duration-500',
                        website.limitExceeded ? 'bg-error' : progressColor
                      )}
                    />
                    <div className="flex justify-between text-xs text-tx-secondary">
                      <span>
                        {Math.floor(effectiveSeconds / 60)} / {timeLimitMinutes} phút
                        {hasTimeLimitBonus && (
                          <span className="ml-1 text-green-600 dark:text-green-400">
                            (+{Math.floor((bonusSeconds ?? 0) / 60)} gia hạn)
                          </span>
                        )}
                      </span>
                      <span>{Math.round(usagePercent ?? 0)}%</span>
                    </div>
                    {hasTimeLimitBonus && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/8 px-3 py-2">
                        <span className="text-xs text-green-600 dark:text-green-400">⏰ Gia hạn</span>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          +{Math.floor((bonusSeconds ?? 0) / 60)} phút
                        </span>
                        <span className="ml-auto text-xs text-tx-secondary">
                          Còn lại:{' '}
                          <span className="font-semibold text-tx-primary">
                            {remainingMinutes} phút
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {hasTimeWindowBonus && windowStartTime && windowEndTime && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/8 px-3 py-2">
                <span className="text-xs text-green-600 dark:text-green-400">⏰ Gia hạn</span>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  +{Math.floor((bonusSeconds ?? 0) / 60)} phút
                </span>
                <span className="ml-auto text-xs text-tx-secondary">
                  Kết thúc mới:{' '}
                  <span className="font-semibold text-tx-primary">
                    {(() => {
                      const [hoursStr = '0', minutesStr = '0'] = windowEndTime.split(':');
                      const hours = Number(hoursStr);
                      const minutes = Number(minutesStr);
                      if (Number.isNaN(hours) || Number.isNaN(minutes) || bonusSeconds <= 0) {
                        return windowEndTime.substring(0, 5);
                      }

                      const totalMinutes = hours * 60 + minutes + Math.floor(bonusSeconds / 60);
                      const newHours = Math.floor(totalMinutes / 60) % 24;
                      const newMinutes = totalMinutes % 60;
                      return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
                    })()}
                  </span>
                </span>
              </div>
            )}
          </div>


          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-bg-subtle/50 p-2 text-[10px] font-semibold text-tx-secondary">
              <BarChart3 className="h-3 w-3 text-brand/60" />
              {website.todayRequests} lần truy cập
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-xl p-2 text-[10px] font-bold uppercase tracking-wider',
                website.isSafe ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              )}
            >
              {website.isSafe ? <Shield className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
              {website.isSafe ? 'An toàn' : 'Cảnh báo'}
            </div>
          </div>

        </div>


        <div className="mt-6 flex items-center justify-around border-t border-border-subtle pt-6">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl text-tx-muted hover:bg-brand-subtle hover:text-brand"
            title="Kiểm tra lại"
            onClick={() => recheckMutation.mutate()}
          >
            <RefreshCw className={cn('h-4 w-4', recheckMutation.isPending && 'animate-spin')} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl text-tx-muted hover:bg-warning/10 hover:text-warning"
            title="Chỉnh sửa"
            onClick={openEditModal}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-9 w-9 rounded-xl text-tx-muted hover:bg-brand-subtle hover:text-brand", screenshotModalOpen && "bg-brand-subtle text-brand")}
            title="Ảnh chụp"
            onClick={() => setScreenshotModalOpen(!screenshotModalOpen)}
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl text-tx-muted hover:bg-error/10 hover:text-error"
            title="Xóa"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>


      </Card>

      {screenshotModalOpen && (
        <ScreenshotModal
          childId={childId}
          domain={website.domain}
          websiteName={website.displayName || website.domain}
          onClose={() => setScreenshotModalOpen(false)}
        />
      )}

      <EditWebsiteModal
        childId={childId}
        open={showEditModal}
        website={website}
        onClose={closeEditModal}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Xóa website"
        message={`Xóa ${website.domain} khỏi danh sách cho phép?`}
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          deleteMutation.mutate();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}


