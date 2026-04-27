import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToastStore } from './toastStore';
import { FEEDBACK_TOAST_MAX_VISIBLE, FEEDBACK_TOAST_THEME } from './config';

export default function Toast() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed right-5 top-5 z-[90] flex w-[calc(100vw-2rem)] max-w-[380px] flex-col gap-3 pointer-events-none">
      {toasts.slice(0, FEEDBACK_TOAST_MAX_VISIBLE).map((item) => {
        const theme = FEEDBACK_TOAST_THEME[item.type];
        const Icon = theme.icon;

        return (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto overflow-hidden rounded-[18px] border border-border border-l-4 bg-background shadow-[0_18px_50px_rgba(0,0,0,0.35)]',
              theme.accentClassName,
              item.closing
                ? 'animate-out fade-out slide-out-to-right-5 duration-200'
                : 'animate-in fade-in slide-in-from-right-5 duration-300'
            )}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1',
                  theme.iconWrapperClassName
                )}
              >
                <Icon className={cn('h-5 w-5', theme.iconClassName)} />
              </div>

              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-bold leading-snug', theme.titleClassName)}>
                  {item.message}
                </p>
                {item.description && (
                  <p className={cn('mt-1 text-xs leading-relaxed', theme.descriptionClassName)}>
                    {item.description}
                  </p>
                )}

                {item.action && (
                  <button
                    type="button"
                    onClick={item.action.onClick}
                    className="mt-3 inline-flex h-8 items-center rounded-full border border-border bg-muted px-3 text-xs font-bold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {item.action.label}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                className={cn(
                  'rounded-full p-1.5 transition-colors',
                  theme.closeClassName
                )}
                aria-label="Đóng thông báo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
