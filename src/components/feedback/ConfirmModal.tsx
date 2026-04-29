import { ShieldAlert, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '../../lib/utils';
import { FEEDBACK_CONFIRM_THEME, type FeedbackConfirmVariant } from './config';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: FeedbackConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent
        className={cn(
          'modal-container modal-animate z-[120] overflow-hidden rounded-[2rem] border border-border-base bg-bg-surface p-0 text-tx-primary shadow-2xl sm:max-w-sm gap-0'
        )}
      >
        <DialogHeader className="modal-header border-b border-border-base bg-gradient-to-r from-bg-subtle to-bg-surface px-8 py-6 text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-subtle text-tx-muted">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <DialogTitle className="title text-xl font-black text-tx-primary">
                {title}
              </DialogTitle>
              <DialogDescription className="subtitle mt-2 text-sm leading-relaxed text-tx-secondary">
                {message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-bg-surface px-8 py-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 rounded-2xl border-border-strong px-5 font-bold text-tx-secondary hover:bg-bg-subtle"
            >
              <X className="mr-2 h-4 w-4" />
              {cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              className={cn(
                'h-11 rounded-2xl px-5 font-bold shadow-lg',
                FEEDBACK_CONFIRM_THEME[variant]
              )}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
