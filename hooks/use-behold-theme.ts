import { useThemeColor } from './use-theme-color';

export function useBeholdTheme() {
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const icon = useThemeColor({}, 'icon');

  return {
    colors: {
      background,
      text,
      primary: tint,
      accent: tint,
      border: icon,
      muted: icon,
    },
  };
}
