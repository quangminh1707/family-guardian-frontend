import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AllowedWebsite } from '../../types/website.types';
import { formatDuration, formatUsagePercent } from '../../lib/formatters';
import {
  Globe,
  Clock,
  Shield,
  ShieldAlert,
  Trash2,
  RefreshCw,
  BarChart3,
  Pencil,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import { websitesApi } from '../../api/websites.api';
import { ConfirmModal, toast } from '../feedback';
import EditWebsiteModal from './EditWebsiteModal';

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
  const usagePercent = formatUsagePercent(website.todaySeconds, website.timeLimitMinutes);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [lastRequestedEdit, setLastRequestedEdit] = useState(false);

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
              {website.faviconUrl ? (
                <img src={website.faviconUrl} alt={website.domain} className="h-8 w-8 rounded-lg" />
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
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-tx-muted">
                <Clock className="h-3 w-3" />
                Sử dụng
              </span>
              <span className={cn('font-mono', website.limitExceeded ? 'text-error' : 'text-tx-secondary')}>
                {formatDuration(website.todaySeconds)}
                {website.timeLimitMinutes && (
                  <span className="font-normal text-tx-muted/30">
                    {' '}
                    / {formatDuration(website.timeLimitMinutes * 60)}
                  </span>
                )}
              </span>
            </div>

            {website.timeLimitMinutes && (
              <div className="space-y-2">
                <Progress
                  value={usagePercent || 0}
                  className="h-2 rounded-full bg-bg-muted"
                  indicatorClassName={cn(
                    'transition-all duration-500 shadow-[0_0_12px_rgba(124,58,237,0.8)]',
                    website.limitExceeded ? 'bg-error shadow-error/50' : 'bg-brand'
                  )}
                />
                <div className="flex justify-end">
                  <span
                    className={cn(
                      'rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter',
                      website.limitExceeded ? 'bg-error/10 text-error' : 'bg-brand-subtle text-brand'
                    )}
                  >
                    {usagePercent}% đã dùng
                  </span>
                </div>
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

          {website.allowedStartTime && (
            <div className="flex items-center gap-2 rounded-xl border border-border-base/70 bg-bg-subtle/60 p-2 text-[10px] font-bold uppercase tracking-wider text-tx-muted">
              <Clock className="h-3 w-3 text-brand/60" />
              Khung giờ: {website.allowedStartTime.substring(0, 5)} - {website.allowedEndTime?.substring(0, 5)}
            </div>
          )}
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
            className="h-9 w-9 rounded-xl text-tx-muted hover:bg-error/10 hover:text-error"
            title="Xóa"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>

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
