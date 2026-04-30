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
    className: `
      border border-slate-200 
      bg-white text-slate-700 
      shadow-sm 
      transition-all duration-200

      hover:bg-slate-100 
      hover:text-slate-900 
      hover:shadow-md 
      hover:-translate-y-[1px]
      shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]
      dark:border-slate-700 
      dark:bg-slate-900 
      dark:text-slate-100 
      dark:hover:bg-slate-800
    `,
    iconClassName: 'text-amber-500 dark:text-amber-300',
  },

  dark: {
    label: 'Tối',
    icon: Moon,
    className: `
      border border-slate-700 
      bg-slate-900 text-slate-100 

      shadow-[0_0_12px_rgba(56,189,248,0.25)]  /* glow nhẹ luôn */

      transition-all duration-200

      hover:bg-slate-800 
      hover:shadow-[0_0_18px_rgba(56,189,248,0.35)]
    `,
    iconClassName: 'text-sky-500 dark:text-sky-300',
  },
};