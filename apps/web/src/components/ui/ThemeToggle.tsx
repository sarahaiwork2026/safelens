import { Moon, Sun } from 'lucide-react';
import { Button } from './index';
import { useTheme, toggleTheme } from '../../lib/theme';
import { copy } from '../../copy';

export function ThemeToggle() {
  const dark = useTheme() === 'dark';
  const label = dark ? copy.theme.light : copy.theme.dark;
  return (
    <Button
      variant="icon"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </Button>
  );
}
