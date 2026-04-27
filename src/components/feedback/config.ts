import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type FeedbackToastType = 'success' | 'error' | 'delete' | 'warning' | 'info';
export type FeedbackConfirmVariant = 'danger' | 'warning' | 'default';

export interface FeedbackToastTheme {
  icon: LucideIcon;
  accentClassName: string;
  iconWrapperClassName: string;
  titleClassName: string;
  descriptionClassName: string;
  closeClassName: string;
  iconClassName: string;
}

export const FEEDBACK_TOAST_DEFAULT_DURATION = 3500;
export const FEEDBACK_TOAST_MAX_VISIBLE = 5;
export const FEEDBACK_TOAST_EXIT_DURATION = 220;

export const FEEDBACK_TOAST_THEME: Record<FeedbackToastType, FeedbackToastTheme> = {
  success: {
    icon: CheckCircle2,
    accentClassName: 'border-l-emerald-500',
    iconWrapperClassName: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-emerald-500/20',
    titleClassName: 'text-emerald-800 dark:text-emerald-200',
    descriptionClassName: 'text-slate-600 dark:text-slate-400',
    closeClassName: 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
    iconClassName: 'text-emerald-600 dark:text-emerald-300',
  },
  error: {
    icon: XCircle,
    accentClassName: 'border-l-rose-500',
    iconWrapperClassName: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/20',
    titleClassName: 'text-rose-800 dark:text-rose-200',
    descriptionClassName: 'text-slate-600 dark:text-slate-400',
    closeClassName: 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
    iconClassName: 'text-rose-600 dark:text-rose-300',
  },
  delete: {
    icon: Trash2,
    accentClassName: 'border-l-amber-500',
    iconWrapperClassName: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/20',
    titleClassName: 'text-amber-800 dark:text-amber-200',
    descriptionClassName: 'text-slate-600 dark:text-slate-400',
    closeClassName: 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
    iconClassName: 'text-amber-600 dark:text-amber-300',
  },
  warning: {
    icon: AlertTriangle,
    accentClassName: 'border-l-orange-500',
    iconWrapperClassName: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 ring-orange-500/20',
    titleClassName: 'text-orange-800 dark:text-orange-200',
    descriptionClassName: 'text-slate-600 dark:text-slate-400',
    closeClassName: 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
    iconClassName: 'text-orange-600 dark:text-orange-300',
  },
  info: {
    icon: Info,
    accentClassName: 'border-l-sky-500',
    iconWrapperClassName: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-sky-500/20',
    titleClassName: 'text-sky-800 dark:text-sky-200',
    descriptionClassName: 'text-slate-600 dark:text-slate-400',
    closeClassName: 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200',
    iconClassName: 'text-sky-600 dark:text-sky-300',
  },
};

export const FEEDBACK_CONFIRM_THEME: Record<FeedbackConfirmVariant, string> = {
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-[0_12px_30px_rgba(239,68,68,0.35)]',
  warning: 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_12px_30px_rgba(249,115,22,0.3)]',
  default: 'bg-violet-600 hover:bg-violet-700 text-white shadow-[0_12px_30px_rgba(139,92,246,0.35)]',
};
