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
          'modal-container modal-animate z-[120] overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-0 text-foreground shadow-2xl sm:max-w-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_30px_80px_rgba(0,0,0,0.55)] gap-0'
        )}
      >
        <DialogHeader className="modal-header border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-8 py-6 text-left dark:border-slate-800 dark:bg-slate-900 dark:bg-none">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-300">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <DialogTitle className="title text-xl font-black text-gray-900 dark:text-slate-100">
                {title}
              </DialogTitle>
              <DialogDescription className="subtitle mt-2 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                {message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-white px-8 py-6 dark:bg-slate-950">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 rounded-2xl border-gray-200 px-5 font-bold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
