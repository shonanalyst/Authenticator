import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ColorScheme } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface AppTheme {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  isDark: boolean;
}

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';

  return {
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    isDark,
  };
}
