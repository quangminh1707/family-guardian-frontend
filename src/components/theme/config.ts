import type { LucideIcon } from 'lucide-react';
import { Moon, Sun } from 'lucide-react';

export type AppTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'fg-theme';

export interface ThemeToggleTheme {
  label: string;
  icon: LucideIcon;
  className: string;
  iconClassName: string;
}

export const THEME_TOGGLE_THEME: Record<AppTheme, ThemeToggleTheme> = {
  light: {
    label: 'Sáng',
    icon: Sun,
    className:
      'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
    iconClassName: 'text-amber-500 dark:text-amber-300',
  },
  dark: {
    label: 'Tối',
    icon: Moon,
    className:
      'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
    iconClassName: 'text-sky-500 dark:text-sky-300',
  },
};
