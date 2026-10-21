import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useTheme } from '../theme/useTheme';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { resolved, setPref } = useTheme();
  const isDark = resolved === 'dark';
  return (
    <Button
      variant="ghost"
      iconOnly
      onClick={() => setPref(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={18} />
    </Button>
  );
}
