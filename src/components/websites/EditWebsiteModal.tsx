import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Globe, Lock, Clock, Pencil, Save, X, Timer, ArrowRightLeft } from 'lucide-react';
import type { AllowedWebsite } from '../../types/website.types';
import { websitesApi } from '../../api/websites.api';
import { ConfirmModal, toast } from '../feedback';

interface EditWebsiteModalProps {
  childId: number;
  open: boolean;
  website: AllowedWebsite;
  onClose: () => void;
}

type EditMode = 'minuteLimit' | 'timeWindow' | 'none';

export default function EditWebsiteModal({ childId, open, website, onClose }: EditWebsiteModalProps) {
  const queryClient = useQueryClient();

  // Xác định mode hiện tại từ website
  const currentMode: EditMode =
    website.timeLimitMinutes != null
      ? 'minuteLimit'
      : website.allowedStartTime != null
        ? 'timeWindow'
        : 'none';

  // State form minute limit
  const [timeLimit, setTimeLimit] = useState(
    website.timeLimitMinutes ? String(website.timeLimitMinutes) : ''
  );

  // State form time window
  const [startTime, setStartTime] = useState(
    website.allowedStartTime ? website.allowedStartTime.substring(0, 5) : '08:00'
  );
  const [endTime, setEndTime] = useState(
    website.allowedEndTime ? website.allowedEndTime.substring(0, 5) : '20:00'
  );

  // Trạng thái "đang chuyển đổi sang mode khác"
  const [switchingTo, setSwitchingTo] = useState<'minuteLimit' | 'timeWindow' | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{
    timeLimitMinutes: number | null;
    allowedStartTime?: string | null;
    allowedEndTime?: string | null;
    isActive: boolean;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setTimeLimit(website.timeLimitMinutes ? String(website.timeLimitMinutes) : '');
    setStartTime(website.allowedStartTime ? website.allowedStartTime.substring(0, 5) : '08:00');
    setEndTime(website.allowedEndTime ? website.allowedEndTime.substring(0, 5) : '20:00');
    setSwitchingTo(null);
    setShowConfirm(false);
    setPendingPayload(null);
  }, [open, website.id]);

  const updateMutation = useMutation({
    mutationFn: (payload: typeof pendingPayload) =>
      websitesApi.updateWebsite(childId, website.id, {
        timeLimitMinutes: payload!.timeLimitMinutes,
        allowedStartTime: payload!.allowedStartTime ?? undefined,
        allowedEndTime: payload!.allowedEndTime ?? undefined,
        isActive: payload!.isActive,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật website');
      queryClient.invalidateQueries({ queryKey: ['websites', childId] });
      setShowConfirm(false);
      setPendingPayload(null);
      onClose();
    },
    onError: () => toast.error('Không thể cập nhật website'),
  });

  // Xác định "active mode" = mode đang chỉnh sửa
  const activeMode: EditMode = switchingTo ?? currentMode;

  const durationMinutes = (() => {
    if (activeMode !== 'timeWindow') return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  })();

  const handleSaveClick = () => {
    if (activeMode === 'minuteLimit' || (activeMode === 'none' && !switchingTo)) {
      const parsedTimeLimit = timeLimit.trim() ? Number(timeLimit) : null;
      if (parsedTimeLimit !== null && Number.isNaN(parsedTimeLimit)) {
        return toast.error('Thời gian không hợp lệ');
      }
      if (parsedTimeLimit !== null && parsedTimeLimit < 1) {
        return toast.error('Thời gian phải lớn hơn 0');
      }
      setPendingPayload({
        timeLimitMinutes: parsedTimeLimit,
        allowedStartTime: null,
        allowedEndTime: null,
        isActive: website.isActive,
      });
    } else if (activeMode === 'timeWindow') {
      if (!startTime || !endTime) return toast.error('Vui lòng nhập giờ bắt đầu và kết thúc');
      if (durationMinutes <= 0) return toast.error('Giờ kết thúc phải sau giờ bắt đầu');
      setPendingPayload({
        timeLimitMinutes: null,
        allowedStartTime: startTime + ':00',
        allowedEndTime: endTime + ':00',
        isActive: website.isActive,
      });
    } else {
      // none → clear all
      setPendingPayload({ timeLimitMinutes: null, allowedStartTime: null, allowedEndTime: null, isActive: website.isActive });
    }
    setShowConfirm(true);
  };

  const isSwitch = switchingTo !== null && switchingTo !== currentMode;
  const confirmMessage = isSwitch
    ? switchingTo === 'minuteLimit'
      ? `Chuyển sang Giới hạn phút sẽ xóa khung giờ hiện tại của ${website.domain}. Tiếp tục?`
      : `Chuyển sang Khung giờ sẽ xóa giới hạn phút hiện tại của ${website.domain}. Tiếp tục?`
    : `Bạn có muốn lưu thay đổi cho ${website.domain} không?`;

  const headerTitle =
    activeMode === 'minuteLimit' ? 'Chỉnh sửa — Giới hạn phút'
      : activeMode === 'timeWindow' ? 'Chỉnh sửa — Khung giờ'
        : 'Chỉnh sửa website';

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="modal-container modal-animate sm:max-w-2xl overflow-hidden rounded-[2.5rem] border border-border-base bg-bg-surface p-0 shadow-2xl text-tx-primary gap-0">
          <DialogHeader className="modal-header border-b border-border-base bg-gradient-to-r from-bg-subtle to-bg-surface px-8 py-6 text-left">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20">
                {activeMode === 'timeWindow' ? <Clock className="h-6 w-6" /> : <Pencil className="h-6 w-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="title text-2xl font-black text-tx-primary">{headerTitle}</DialogTitle>
                <DialogDescription className="subtitle mt-1 text-sm font-medium text-tx-secondary">
                  Domain được giữ nguyên. Chỉ cập nhật tính năng giới hạn.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-8 py-7 space-y-6">
            {/* Website info */}
            <div className="rounded-[2rem] border border-border-base bg-bg-subtle/30 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-subtle border border-border-base shadow-sm">
                  {website.faviconUrl ? (
                    <img src={website.faviconUrl} alt={website.domain} className="h-7 w-7 rounded-lg" />
                  ) : (
                    <Globe className="h-7 w-7 text-tx-muted" />
                  )}
                </div>
                <div>
                  <p className="description text-xs font-bold uppercase tracking-[0.2em] text-tx-muted">Website hiện tại</p>
                  <p className="title mt-1 text-sm font-bold text-tx-primary">{website.displayName || website.domain}</p>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-bg-subtle px-3 py-0.5 text-[11px] font-bold text-tx-secondary shadow-sm">
                    <Lock className="h-3 w-3 text-brand" />
                    {website.domain}
                  </div>
                </div>
              </div>
            </div>

            {/* Form theo activeMode */}
            <div className="rounded-[2rem] border border-border-base bg-bg-subtle/30 p-6 space-y-5">

              {/* Giới hạn phút */}
              {activeMode === 'minuteLimit' && (
                <div className="space-y-3">
                  <label className="description text-[10px] font-bold uppercase tracking-[0.2em] text-tx-muted flex items-center gap-2">
                    <Timer className="h-3.5 w-3.5" /> Giới hạn phút/ngày
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    placeholder="Để trống = không giới hạn"
                    className="input-custom h-12 rounded-2xl border-border-base bg-bg-surface font-medium shadow-sm text-tx-primary"
                  />
                  <p className="text-xs text-tx-muted">Để trống nếu muốn website này không bị giới hạn thời gian.</p>

                  {/* Nút chuyển sang khung giờ */}
                  <div className="mt-2 border-t border-dashed border-border-base pt-4">
                    <button
                      onClick={() => setSwitchingTo(switchingTo === 'timeWindow' ? null : 'timeWindow')}
                      className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                        switchingTo === 'timeWindow'
                          ? 'bg-brand text-white'
                          : 'bg-bg-subtle text-tx-secondary hover:bg-brand-subtle hover:text-brand'
                      }`}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      {switchingTo === 'timeWindow' ? 'Đang xem Khung giờ ↓' : 'Dùng Khung giờ thay thế'}
                    </button>
                  </div>
                </div>
              )}

              {/* Khung giờ */}
              {activeMode === 'timeWindow' && (
                <div className="space-y-4">
                  <label className="description text-[10px] font-bold uppercase tracking-[0.2em] text-tx-muted flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Khung giờ cho phép
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-tx-secondary">Giờ bắt đầu</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="input-custom w-full bg-bg-surface rounded-xl border border-border-base p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-tx-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-tx-secondary">Giờ kết thúc</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="input-custom w-full bg-bg-surface rounded-xl border border-border-base p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-tx-primary"
                      />
                    </div>
                  </div>
                  {durationMinutes > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-brand-subtle border border-brand/10 px-4 py-3 text-sm font-medium text-brand">
                      <Clock className="w-4 h-4 shrink-0" />
                      Con được dùng từ {startTime} đến {endTime}
                    </div>
                  )}
                  {durationMinutes <= 0 && startTime && endTime && (
                    <p className="text-xs text-error font-medium">Giờ kết thúc phải sau giờ bắt đầu</p>
                  )}

                  {/* Nút chuyển sang giới hạn phút */}
                  <div className="mt-2 border-t border-dashed border-border-base pt-4">
                    <button
                      onClick={() => setSwitchingTo(switchingTo === 'minuteLimit' ? null : 'minuteLimit')}
                      className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                        switchingTo === 'minuteLimit'
                          ? 'bg-brand text-white'
                          : 'bg-bg-subtle text-tx-secondary hover:bg-brand-subtle hover:text-brand'
                      }`}
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      {switchingTo === 'minuteLimit' ? 'Đang xem Giới hạn phút ↓' : 'Dùng Giới hạn phút thay thế'}
                    </button>
                  </div>
                </div>
              )}

              {/* None mode */}
              {activeMode === 'none' && (
                <div className="space-y-4">
                  <p className="text-sm text-tx-secondary">Website này chưa có giới hạn nào. Chọn loại giới hạn muốn thêm:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSwitchingTo('minuteLimit')}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border-base hover:border-brand hover:bg-brand-subtle transition-all"
                    >
                      <Timer className="h-6 w-6 text-brand" />
                      <span className="text-xs font-bold text-tx-secondary">Giới hạn phút</span>
                    </button>
                    <button
                      onClick={() => setSwitchingTo('timeWindow')}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border-base hover:border-brand hover:bg-brand-subtle transition-all"
                    >
                      <Clock className="h-6 w-6 text-brand" />
                      <span className="text-xs font-bold text-tx-secondary">Khung giờ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Form chuyển đổi (hiện bên dưới nếu đang switch) */}
              {switchingTo && currentMode !== 'none' && switchingTo !== currentMode && (
                <div className="mt-4 pt-4 border-t border-border-base space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {switchingTo === 'minuteLimit' ? (
                    <>
                      <label className="description text-[10px] font-bold uppercase tracking-[0.2em] text-tx-muted">
                        Giới hạn phút/ngày (mới)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                        placeholder="Nhập số phút..."
                        className="input-custom h-12 rounded-2xl border-border-base bg-bg-surface font-medium shadow-sm text-tx-primary"
                      />
                    </>
                  ) : (
                    <>
                      <label className="description text-[10px] font-bold uppercase tracking-[0.2em] text-tx-muted">
                        Khung giờ mới
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="input-custom w-full bg-bg-surface rounded-xl border border-border-base p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 text-tx-primary"
                        />
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="input-custom w-full bg-bg-surface rounded-xl border border-border-base p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 text-tx-primary"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 rounded-2xl border-border-base px-5 font-bold text-tx-secondary hover:bg-bg-subtle"
              >
                <X className="mr-2 h-4 w-4" />
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSaveClick}
                disabled={updateMutation.isPending}
                className="h-12 rounded-2xl bg-brand px-6 font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand-hover"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={showConfirm}
        title={isSwitch ? 'Xác nhận thay đổi tính năng' : 'Xác nhận sửa website'}
        message={confirmMessage}
        confirmLabel="Có, lưu"
        cancelLabel="Không"
        variant={isSwitch ? 'warning' : 'default'}
        onConfirm={() => {
          if (!pendingPayload) return;
          updateMutation.mutate(pendingPayload);
        }}
        onCancel={() => {
          setShowConfirm(false);
          setPendingPayload(null);
        }}
      />
    </>
  );
}
