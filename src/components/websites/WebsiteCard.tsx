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
      <Card className="card-hover group relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-violet-200 hover:shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 shadow-inner transition-colors group-hover:bg-violet-50">
              {website.faviconUrl ? (
                <img src={website.faviconUrl} alt={website.domain} className="h-8 w-8 rounded-lg" />
              ) : (
                <Globe className="h-8 w-8 text-gray-400 group-hover:text-violet-500" />
              )}
            </div>
            <div>
              <h4 className="max-w-[170px] truncate text-lg font-bold text-gray-900">
                {website.displayName || website.domain}
              </h4>
              <p className="mt-1 truncate text-xs font-medium text-gray-400">{website.domain}</p>
            </div>
          </div>

          <Switch checked={website.isActive} onCheckedChange={() => toggleMutation.mutate()} />
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-gray-400">
                <Clock className="h-3 w-3" />
                Sử dụng
              </span>
              <span className={cn('font-mono', website.limitExceeded ? 'text-red-600' : 'text-gray-700')}>
                {formatDuration(website.todaySeconds)}
                {website.timeLimitMinutes && (
                  <span className="font-normal text-gray-300">
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
                  className="h-2 rounded-full bg-gray-100"
                  indicatorClassName={cn(
                    'transition-all duration-500 shadow-[0_0_12px_rgba(124,58,237,0.8)]',
                    website.limitExceeded ? 'bg-red-500 shadow-red-500/50' : 'bg-violet-600'
                  )}
                />
                <div className="flex justify-end">
                  <span
                    className={cn(
                      'rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter',
                      website.limitExceeded ? 'bg-red-100 text-red-600' : 'bg-violet-50 text-violet-600'
                    )}
                  >
                    {usagePercent}% đã dùng
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-gray-50/50 p-2 text-[10px] font-semibold text-gray-500">
              <BarChart3 className="h-3 w-3 text-violet-400" />
              {website.todayRequests} lần truy cập
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-xl p-2 text-[10px] font-bold uppercase tracking-wider',
                website.isSafe ? 'bg-green-50/60 text-green-600' : 'bg-red-50/60 text-red-500'
              )}
            >
              {website.isSafe ? <Shield className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
              {website.isSafe ? 'An toàn' : 'Cảnh báo'}
            </div>
          </div>

          {website.allowedStartTime && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-100/70 bg-gray-50/60 p-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <Clock className="h-3 w-3 text-violet-400" />
              Khung giờ: {website.allowedStartTime.substring(0, 5)} - {website.allowedEndTime?.substring(0, 5)}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-around border-t border-gray-50 pt-6">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl text-gray-400 hover:bg-violet-50 hover:text-violet-600"
            title="Kiểm tra lại"
            onClick={() => recheckMutation.mutate()}
          >
            <RefreshCw className={cn('h-4 w-4', recheckMutation.isPending && 'animate-spin')} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl text-gray-400 hover:bg-amber-50 hover:text-amber-600"
            title="Chỉnh sửa"
            onClick={openEditModal}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600"
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
