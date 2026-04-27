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
        <DialogContent className="modal-container modal-animate sm:max-w-2xl overflow-hidden rounded-[2.5rem] border border-gray-100 p-0 shadow-2xl dark:border-slate-800 dark:shadow-[0_35px_90px_rgba(0,0,0,0.6)]">
          <DialogHeader className="modal-header border-b border-gray-100 bg-gradient-to-r from-violet-50 via-white to-white px-8 py-6 text-left dark:border-slate-800 dark:bg-slate-900 dark:bg-none">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200 dark:bg-violet-500 dark:shadow-none">
                <Pencil className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="title text-2xl font-black text-gray-900 dark:text-slate-100">
                  Chỉnh sửa website
                </DialogTitle>
                <DialogDescription className="subtitle mt-1 text-sm font-medium text-gray-500 dark:text-slate-400">
                  Chỉ cập nhật thời gian cho phép, domain được giữ nguyên.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-8 py-7">
            <div className="rounded-[2rem] border border-gray-100 bg-gray-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 shadow-sm dark:bg-slate-800 dark:shadow-none dark:ring-1 dark:ring-slate-700">
                  {website.faviconUrl ? (
                    <img src={website.faviconUrl} alt={website.domain} className="h-7 w-7 rounded-lg" />
                  ) : (
                    <Globe className="h-7 w-7 text-gray-400 dark:text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="description text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">Website hiện tại</p>
                  <p className="title mt-1 text-sm font-bold text-gray-900 dark:text-slate-100">{website.displayName || website.domain}</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600 shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:shadow-none dark:ring-1 dark:ring-slate-700">
                    <Lock className="h-3.5 w-3.5 text-violet-500 dark:text-violet-300" />
                    {website.domain}
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                  <div className="space-y-2">
                    <label className="description text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                      Giới hạn phút
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      placeholder="Không giới hạn"
                      className="input-custom h-12 rounded-2xl border-gray-100 font-medium shadow-sm dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div className="flex items-end rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 p-4 text-sm leading-relaxed text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200">
                    Để trống nếu bạn muốn website này không bị giới hạn thời gian.
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500 shadow-sm dark:bg-slate-950/60 dark:text-slate-400 dark:shadow-none dark:ring-1 dark:ring-slate-800">
                Khi bấm lưu, hệ thống sẽ hiện một hộp xác nhận nữa để tránh cập nhật nhầm.
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 rounded-2xl border-gray-200 px-5 font-bold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <X className="mr-2 h-4 w-4" />
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSaveClick}
                disabled={isSaving}
                className="btn-primary-custom h-12 rounded-2xl bg-violet-600 px-6 font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
