import { useEffect } from 'react';
import { applyTheme } from './themeDom';
import { useThemeStore } from './themeStore';

export default function ThemeProvider() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}
