import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ColorScheme } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useThemeMode } from '../contexts/ThemeContext';

interface AppTheme {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  isDark: boolean;
}

export function useAppTheme(): AppTheme {
  const systemScheme = useColorScheme();
  const { themeMode } = useThemeMode();

  const isDark =
    themeMode === 'dark' ? true :
    themeMode === 'light' ? false :
    systemScheme !== 'light';

  return {
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    isDark,
  };
}
