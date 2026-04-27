import { THEME_STORAGE_KEY, type AppTheme } from './config';

function isTheme(value: unknown): value is AppTheme {
  return value === 'light' || value === 'dark';
}

export function readStoredTheme(): AppTheme | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      state?: { theme?: unknown };
    };

    const theme = parsed?.state?.theme;
    return isTheme(theme) ? theme : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function bootstrapTheme() {
  const theme = readStoredTheme() ?? 'light';
  applyTheme(theme);
}
