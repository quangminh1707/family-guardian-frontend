import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Globe, Lock, Pencil, Save, X } from 'lucide-react';
import type { AllowedWebsite } from '../../types/website.types';
import { childrenApi } from '../../api/children.api';
import { ConfirmModal, toast } from '../feedback';

interface EditWebsiteModalProps {
  childId: number;
  open: boolean;
  website: AllowedWebsite;
  isSaving?: boolean;
  onClose: () => void;
}

export default function EditWebsiteModal({
  childId,
  open,
  website,
  isSaving = false,
  onClose,
}: EditWebsiteModalProps) {
  const queryClient = useQueryClient();
  const [timeLimit, setTimeLimit] = useState(
    website.timeLimitMinutes ? String(website.timeLimitMinutes) : ''
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{ timeLimitMinutes: number | null } | null>(null);

  useEffect(() => {
    if (!open) return;
    setTimeLimit(website.timeLimitMinutes ? String(website.timeLimitMinutes) : '');
    setShowConfirm(false);
    setPendingPayload(null);
  }, [open, website.domain, website.timeLimitMinutes]);

  const updateMutation = useMutation({
    mutationFn: (payload: { timeLimitMinutes: number | null }) =>
      childrenApi.updateWebsite(childId, website.id, {
        domain: website.domain,
        timeLimitMinutes: payload.timeLimitMinutes,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật website');
      queryClient.invalidateQueries({ queryKey: ['websites', childId] });
      setShowConfirm(false);
      setPendingPayload(null);
      onClose();
    },
    onError: () => {
      toast.error('Không thể cập nhật website');
    },
  });

  const handleSaveClick = () => {
    const parsedTimeLimit = timeLimit.trim() ? Number(timeLimit) : null;
    if (parsedTimeLimit !== null && Number.isNaN(parsedTimeLimit)) {
      toast.error('Thời gian không hợp lệ');
      return;
    }
    if (parsedTimeLimit !== null && parsedTimeLimit < 1) {
      toast.error('Thời gian phải lớn hơn 0');
      return;
    }

    setPendingPayload({ timeLimitMinutes: parsedTimeLimit });
    setShowConfirm(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="modal-container modal-animate sm:max-w-2xl overflow-hidden rounded-[2.5rem] border border-border-base bg-bg-surface p-0 shadow-2xl text-tx-primary gap-0">
          <DialogHeader className="modal-header border-b border-border-base bg-gradient-to-r from-bg-subtle to-bg-surface px-8 py-6 text-left">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20">
                <Pencil className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="title text-2xl font-black text-tx-primary">
                  Chỉnh sửa website
                </DialogTitle>
                <DialogDescription className="subtitle mt-1 text-sm font-medium text-tx-secondary">
                  Chỉ cập nhật thời gian cho phép, domain được giữ nguyên.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-8 py-7">
            <div className="rounded-[2rem] border border-border-base bg-bg-subtle/30 p-6">
              <div className="mb-6 flex items-center gap-3">
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
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-bg-subtle px-3 py-1 text-[11px] font-bold text-tx-secondary shadow-sm">
                    <Lock className="h-3.5 w-3.5 text-brand" />
                    {website.domain}
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                  <div className="space-y-2">
                    <label className="description text-[10px] font-bold uppercase tracking-[0.2em] text-tx-muted">
                      Giới hạn phút
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      placeholder="Không giới hạn"
                      className="input-custom h-12 rounded-2xl border-border-base bg-bg-surface font-medium shadow-sm text-tx-primary"
                    />
                  </div>

                  <div className="flex items-end rounded-2xl border border-dashed border-brand/20 bg-brand-subtle p-4 text-sm leading-relaxed text-brand">
                    Để trống nếu bạn muốn website này không bị giới hạn thời gian.
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-bg-subtle p-4 text-xs leading-relaxed text-tx-secondary shadow-sm">
                Khi bấm lưu, hệ thống sẽ hiện một hộp xác nhận nữa để tránh cập nhật nhầm.
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
        title="Xác nhận sửa website"
        message={`Bạn có muốn lưu thay đổi cho ${website.domain} không?`}
        confirmLabel="Có, lưu"
        cancelLabel="Không"
        variant="default"
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
