import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { THEME_TOGGLE_THEME } from './config';
import { useThemeStore } from './themeStore';

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const current = THEME_TOGGLE_THEME[theme];
  const Icon = current.icon;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggleTheme}
      aria-label={`Chuyển sang chế độ ${theme === 'dark' ? 'sáng' : 'tối'}`}
      className={cn(
        'h-9 rounded-full px-3 gap-2 font-semibold transition-all',
        current.className
      )}
    >
      <Icon className={cn('h-4 w-4', current.iconClassName)} />
      <span className="hidden sm:inline">{current.label}</span>
    </Button>
  );
}
