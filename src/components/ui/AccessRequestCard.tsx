import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { accessRequestsApi } from '../../api/accessRequests.api';
import type {
  AccessRequestDto,
  RespondAccessRequestDto,
} from '../../api/accessRequests.api';
import { toast } from '../feedback';
import { ConfirmModal } from '../feedback';

interface Props {
  request: AccessRequestDto;
}

// Timezone fix — dùng đúng logic đang có trong formatters.ts
function normalizeDate(dateStr: string): Date {
  const normalized =
    dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)
      ? dateStr
      : dateStr + 'Z';
  return new Date(normalized);
}

export function AccessRequestCard({ request }: Props) {
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<RespondAccessRequestDto | null>(null);

  const mutation = useMutation({
    mutationFn: (dto: RespondAccessRequestDto) =>
      accessRequestsApi.respond(request.id, dto),
    onSuccess: (_, dto) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (dto.action === 'reject') toast.delete('Đã từ chối yêu cầu');
      else if (dto.action === 'approve_temp')
        toast.success(`Đã cho phép truy cập ${dto.durationMinutes} phút`);
      else toast.success('Đã thêm vào danh sách cho phép');
    },
    onError: () => toast.error('Có lỗi xảy ra, thử lại sau'),
  });

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${request.domain}&sz=32`;
  const timeStr = normalizeDate(request.requestedAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-subtle border border-border-base">
        {/* Avatar con */}
        <img
          src={request.childAvatarUrl || '/default-avatar.png'}
          alt={request.childName}
          className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-tx-primary">
            <span className="text-brand-DEFAULT">{request.childName}</span>
            {' '}muốn truy cập
          </p>

          <div className="flex items-center gap-1.5 mt-0.5">
            <img src={faviconUrl} alt="" className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm text-tx-secondary truncate">{request.domain}</span>
          </div>

          <p className="text-xs text-tx-secondary mt-1">{timeStr}</p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => setConfirmAction({ action: 'approve_temp', durationMinutes: 30 })}
              disabled={mutation.isPending}
              className="px-2.5 py-1 text-xs rounded-md font-medium
                         bg-amber-500/10 text-amber-600 dark:text-amber-400
                         border border-amber-500/30 hover:bg-amber-500/20
                         transition-colors disabled:opacity-50"
            >
              ⏱ 30 phút
            </button>
            <button
              onClick={() => setConfirmAction({ action: 'approve_permanent' })}
              disabled={mutation.isPending}
              className="px-2.5 py-1 text-xs rounded-md font-medium
                         bg-green-500/10 text-green-600 dark:text-green-400
                         border border-green-500/30 hover:bg-green-500/20
                         transition-colors disabled:opacity-50"
            >
              ✅ Thêm vào DS
            </button>
            <button
              onClick={() => setConfirmAction({ action: 'reject' })}
              disabled={mutation.isPending}
              className="px-2.5 py-1 text-xs rounded-md font-medium
                         bg-red-500/10 text-red-600 dark:text-red-400
                         border border-red-500/30 hover:bg-red-500/20
                         transition-colors disabled:opacity-50"
            >
              ✕ Từ chối
            </button>
          </div>
        </div>
      </div>

      {confirmAction && (
        <ConfirmModal
          open={true}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            mutation.mutate(confirmAction);
            setConfirmAction(null);
          }}
          title={
            confirmAction.action === 'reject'
              ? 'Từ chối yêu cầu'
              : confirmAction.action === 'approve_temp'
              ? 'Cho phép tạm thời'
              : 'Thêm vào danh sách'
          }
          message={
            confirmAction.action === 'reject'
              ? `Từ chối cho ${request.childName} truy cập ${request.domain}?`
              : confirmAction.action === 'approve_temp'
              ? `Cho phép ${request.childName} truy cập ${request.domain} trong ${confirmAction.durationMinutes} phút?`
              : `Thêm ${request.domain} vào danh sách cho phép vĩnh viễn cho ${request.childName}?`
          }
          variant={confirmAction.action === 'reject' ? 'danger' : 'default'}
          confirmLabel="Xác nhận"
        />
      )}
    </>
  );
}
