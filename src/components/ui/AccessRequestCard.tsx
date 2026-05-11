import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accessRequestsApi } from '../../api/accessRequests.api';
import type { AccessRequestDto, RespondAccessRequestDto } from '../../api/accessRequests.api';
import { formatDateTimeVN, formatRelativeTime } from '../../lib/formatters';
import { toast } from '../feedback';
import ConfirmModal from '../feedback/ConfirmModal';

interface Props {
  request: AccessRequestDto;
}

function ReasonBadge({ reason }: { reason: string }) {
  if (reason === 'internet_paused') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-500 dark:text-red-400">
        ⏸ Tạm dừng Internet
      </span>
    );
  }

  if (reason === 'time_limit_exceeded') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-500 dark:text-amber-400">
        ⏱ Hết giờ sử dụng
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-500 dark:text-blue-400">
      🌐 Web mới
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved_temp') {
    return <span className="text-[11px] font-medium text-amber-500">✓ Cho phép tạm thời</span>;
  }
  if (status === 'approved_permanent') {
    return <span className="text-[11px] font-medium text-green-500">✓ Đã thêm vào DS</span>;
  }
  if (status === 'rejected') {
    return <span className="text-[11px] font-medium text-red-500">✕ Đã từ chối</span>;
  }
  return null;
}

export function AccessRequestCard({ request }: Props) {
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<RespondAccessRequestDto | null>(null);
  const [useDuration, setUseDuration] = useState(false);
  const [useTimeWindow, setUseTimeWindow] = useState(false);
  const [configDuration, setConfigDuration] = useState<number | null>(60);
  const [configStart, setConfigStart] = useState('07:00');
  const [configEnd, setConfigEnd] = useState('21:00');

  const mutation = useMutation({
    mutationFn: (dto: RespondAccessRequestDto) => accessRequestsApi.respond(request.id, dto),
    onSuccess: (_, dto) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (dto.action === 'reject') toast.delete('Đã từ chối yêu cầu');
      else if (dto.action === 'approve_temp') toast.success(`Đã cho phép truy cập ${dto.durationMinutes ?? 30} phút`);
      else if (dto.action === 'approve_internet') toast.success('Đã bật lại Internet');
      else if (dto.action === 'extend_time') toast.success(`Đã gia hạn thêm ${dto.durationMinutes ?? 30} phút`);
      else toast.success('Đã thêm vào danh sách cho phép');
    },
    onError: () => toast.error('Có lỗi xảy ra, thử lại sau'),
  });

  const isPending = request.status === 'pending';
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${request.domain}&sz=32`;

  const contextText = () => {
    if (request.reason === 'internet_paused') return 'muốn bạn bật lại Internet';
    if (request.reason === 'time_limit_exceeded') {
      const extra = request.requestedDurationMinutes ? ` — xin thêm ${request.requestedDurationMinutes} phút` : '';
      return `đã hết thời gian sử dụng${extra}`;
    }
    return 'muốn truy cập trang này';
  };

  const renderActions = () => {
    if (!isPending) return <StatusBadge status={request.status} />;

    if (request.reason === 'internet_paused') {
      return (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setConfirmAction({ action: 'approve_internet' })}
            disabled={mutation.isPending}
            className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 transition-colors hover:bg-green-500/20 disabled:opacity-50 dark:text-green-400"
          >
            ▶ Bật lại Internet
          </button>
          <button
            onClick={() => setConfirmAction({ action: 'reject' })}
            disabled={mutation.isPending}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
          >
            ✕ Từ chối
          </button>
        </div>
      );
    }

    if (request.reason === 'time_limit_exceeded') {
      return (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setConfirmAction({
                  action: 'extend_time',
                  durationMinutes: useDuration ? configDuration ?? 30 : request.requestedDurationMinutes ?? 30,
                })
              }
              disabled={mutation.isPending}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
            >
              ⏱ Gia hạn
            </button>
            <button
              onClick={() => setConfirmAction({ action: 'reject' })}
              disabled={mutation.isPending}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
            >
              ✕ Từ chối
            </button>
          </div>

          <div className="rounded-xl border border-border-base bg-bg-elevated/70 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-tx-primary">Gia hạn nhanh</p>
                <p className="text-[11px] text-tx-secondary">Chọn số phút muốn cộng thêm</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={useDuration}
                  onChange={(e) => setUseDuration(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="after:content-[''] relative h-5 w-9 rounded-full bg-bg-muted after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-DEFAULT peer-checked:after:translate-x-full" />
              </label>
            </div>
            {useDuration && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  value={configDuration ?? 30}
                  onChange={(e) => setConfigDuration(Number(e.target.value))}
                  min={5}
                  max={720}
                  className="w-20 rounded-md border border-border-base bg-bg-surface px-2 py-1 text-center text-sm text-tx-primary focus:border-brand-DEFAULT focus:outline-none"
                />
                <span className="text-xs text-tx-secondary">phút</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setConfirmAction({ action: 'approve_temp', durationMinutes: 30 })}
            disabled={mutation.isPending}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
          >
            ⏱ 30 phút
          </button>
          <button
            onClick={() => setConfirmAction({ action: 'reject' })}
            disabled={mutation.isPending}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
          >
            ✕ Từ chối
          </button>
        </div>

        <div className="space-y-3 rounded-xl border border-border-base bg-bg-elevated/70 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-tx-primary">Thêm vào danh sách cho phép</p>
              <p className="text-[11px] text-tx-secondary">Có thể cấu hình thời lượng hoặc khung giờ</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={useDuration}
                  onChange={(e) => setUseDuration(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="after:content-[''] relative h-5 w-9 rounded-full bg-bg-muted after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-DEFAULT peer-checked:after:translate-x-full" />
              </label>
              <span className="text-[11px] font-medium text-tx-secondary">Theo phút</span>
            </div>
          </div>

          {useDuration && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={configDuration ?? 60}
                onChange={(e) => setConfigDuration(Number(e.target.value))}
                min={5}
                max={720}
                className="w-20 rounded-md border border-border-base bg-bg-surface px-2 py-1 text-center text-sm text-tx-primary focus:border-brand-DEFAULT focus:outline-none"
              />
              <span className="text-xs text-tx-secondary">phút mỗi ngày</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-tx-primary">Khung giờ cho phép</p>
              <p className="text-[11px] text-tx-secondary">Giới hạn truy cập theo thời gian</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={useTimeWindow}
                onChange={(e) => setUseTimeWindow(e.target.checked)}
                className="peer sr-only"
              />
              <div className="after:content-[''] relative h-5 w-9 rounded-full bg-bg-muted after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-DEFAULT peer-checked:after:translate-x-full" />
            </label>
          </div>

          {useTimeWindow && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] text-tx-secondary">Từ lúc</label>
                <input
                  type="time"
                  value={configStart}
                  onChange={(e) => setConfigStart(e.target.value)}
                  className="w-full rounded-md border border-border-base bg-bg-surface px-2 py-1.5 text-sm text-tx-primary focus:border-brand-DEFAULT focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-tx-secondary">Đến lúc</label>
                <input
                  type="time"
                  value={configEnd}
                  onChange={(e) => setConfigEnd(e.target.value)}
                  className="w-full rounded-md border border-border-base bg-bg-surface px-2 py-1.5 text-sm text-tx-primary focus:border-brand-DEFAULT focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            onClick={() =>
              setConfirmAction({
                action: 'approve_permanent',
                durationMinutes: useDuration ? configDuration ?? 60 : undefined,
                startTime: useTimeWindow ? configStart : undefined,
                endTime: useTimeWindow ? configEnd : undefined,
              })
            }
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-brand-DEFAULT px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-DEFAULT/90 disabled:opacity-50"
          >
            ✅ Thêm vào danh sách cho phép
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`rounded-xl border p-4 transition-all ${isPending ? 'bg-bg-surface border-border-base' : 'bg-bg-subtle border-border-base/50 opacity-75'}`}>
        <div className="flex items-start gap-3">
          <img
            src={request.childAvatarUrl || '/default-avatar.png'}
            alt={request.childName}
            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-brand-DEFAULT">{request.childName}</span>
              <ReasonBadge reason={request.reason} />
            </div>
            <p className="mt-0.5 text-xs text-tx-secondary">{contextText()}</p>
          </div>
          <span
            className="flex-shrink-0 text-xs text-tx-secondary"
            title={formatDateTimeVN(request.requestedAt)}
          >
            {formatRelativeTime(request.requestedAt)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border-base/50 bg-bg-subtle p-2">
          <img src={faviconUrl} alt="" className="h-4 w-4 flex-shrink-0" />
          <span className="truncate text-sm font-medium text-tx-primary">{request.domain}</span>
          {request.fullUrl && request.fullUrl !== request.domain && (
            <span className="ml-auto truncate text-xs text-tx-secondary">{request.fullUrl.substring(0, 50)}...</span>
          )}
        </div>

        {request.reason === 'not_in_whitelist' && (request.requestedDurationMinutes || request.requestedStartTime) && (
          <div className="mt-2 rounded-lg border border-border-base/50 bg-bg-elevated px-2 py-1.5">
            <p className="text-[11px] text-tx-secondary">
              Con đề xuất:{' '}
              {request.requestedDurationMinutes ? (
                <span className="font-medium text-tx-primary">{request.requestedDurationMinutes} phút/ngày</span>
              ) : null}
              {request.requestedStartTime ? (
                <span className="ml-1 font-medium text-tx-primary">
                  khung {request.requestedStartTime}–{request.requestedEndTime}
                </span>
              ) : null}
            </p>
          </div>
        )}

        {renderActions()}
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
              : confirmAction.action === 'approve_internet'
                ? 'Bật lại Internet'
                : confirmAction.action === 'extend_time'
                  ? 'Gia hạn thời gian'
                  : confirmAction.action === 'approve_temp'
                    ? 'Cho phép tạm thời'
                    : 'Thêm vào danh sách'
          }
          message={
            confirmAction.action === 'reject'
              ? `Từ chối yêu cầu của ${request.childName}?`
              : confirmAction.action === 'approve_internet'
                ? `Bật lại Internet cho ${request.childName}? Bộ lọc web sẽ hoạt động trở lại.`
                : confirmAction.action === 'extend_time'
                  ? `Gia hạn thêm ${confirmAction.durationMinutes ?? 30} phút cho ${request.childName} dùng ${request.domain}?`
                  : confirmAction.action === 'approve_temp'
                    ? `Cho phép ${request.childName} truy cập ${request.domain} trong ${confirmAction.durationMinutes ?? 30} phút?`
                    : `Thêm ${request.domain} vào danh sách cho phép cho ${request.childName}?`
          }
          variant={confirmAction.action === 'reject' ? 'danger' : 'default'}
          confirmLabel="Xác nhận"
        />
      )}
    </>
  );
}
