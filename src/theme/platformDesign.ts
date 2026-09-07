/**
 * Platform Design Token System
 * Provides platform-aware constants for Material Design 3 (Android/Web)
 * and Apple Human Interface Guidelines (iOS).
 */
import { Platform, TextStyle } from 'react-native';

const isIOS = Platform.OS === 'ios';

// ── Corner Radii ─────────────────────────────────────────────────────────────
export const radius = {
  /** Buttons, chips, small interactive elements */
  small: isIOS ? 10 : 12,
  /** Cards, dialogs, sheets */
  medium: isIOS ? 16 : 16,
  /** Large containers, bottom sheets */
  large: isIOS ? 22 : 28,
  /** Pills, FABs, fully rounded */
  pill: 9999,
} as const;

// ── Spacing ──────────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: isIOS ? 16 : 16,
  lg: isIOS ? 20 : 24,
  xl: isIOS ? 28 : 32,
} as const;

// ── Component Heights ────────────────────────────────────────────────────────
export const heights = {
  /** Minimum tappable area */
  minTap: isIOS ? 44 : 48,
  /** Standard button height */
  button: isIOS ? 44 : 40,
  /** Navigation / app bar height */
  navBar: isIOS ? 44 : 64,
  /** Bottom tab bar height (before safe area inset) */
  bottomNav: isIOS ? 49 : 80,
  /** Search bar */
  searchBar: isIOS ? 36 : 48,
  /** Chip height */
  chip: isIOS ? 32 : 32,
} as const;

// ── Elevation / Shadow ───────────────────────────────────────────────────────
export type ElevationLevel = 0 | 1 | 2 | 3;

interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/**
 * iOS: Subtle, diffused shadows per Apple HIG
 * Android: MD3 elevation levels (0–3)
 */
export function getElevation(level: ElevationLevel): ShadowStyle {
  if (isIOS) {
    const shadows: Record<ElevationLevel, ShadowStyle> = {
      0: { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
      1: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 0 },
      2: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 0 },
      3: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 0 },
    };
    return shadows[level];
  }
  // Android: MD3 elevation values
  const elevationMap: Record<ElevationLevel, number> = { 0: 0, 1: 1, 2: 3, 3: 6 };
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: elevationMap[level],
  };
}

// ── Typography ───────────────────────────────────────────────────────────────

/**
 * Typography presets following platform conventions.
 * iOS: SF Pro (system default), semibold/regular weights
 * Android: Roboto (system default), medium/regular weights, uppercase labels
 */
export const typography = {
  /** Large title (iOS large nav title / MD3 headline large) */
  titleLarge: {
    fontSize: isIOS ? 34 : 28,
    fontWeight: isIOS ? '700' : '400',
    letterSpacing: isIOS ? 0.37 : 0,
    lineHeight: isIOS ? 41 : 36,
  } as TextStyle,

  /** Screen/section title */
  titleMedium: {
    fontSize: isIOS ? 22 : 24,
    fontWeight: isIOS ? '700' : '400',
    letterSpacing: isIOS ? 0.35 : 0,
    lineHeight: isIOS ? 28 : 32,
  } as TextStyle,

  /** Card/list item title */
  titleSmall: {
    fontSize: isIOS ? 17 : 16,
    fontWeight: isIOS ? '600' : '500',
    letterSpacing: isIOS ? -0.41 : 0.15,
    lineHeight: isIOS ? 22 : 24,
  } as TextStyle,

  /** Body text */
  body: {
    fontSize: isIOS ? 17 : 14,
    fontWeight: '400',
    letterSpacing: isIOS ? -0.41 : 0.25,
    lineHeight: isIOS ? 22 : 20,
  } as TextStyle,

  /** Secondary/caption text */
  caption: {
    fontSize: isIOS ? 13 : 12,
    fontWeight: '400',
    letterSpacing: isIOS ? -0.08 : 0.4,
    lineHeight: isIOS ? 18 : 16,
  } as TextStyle,

  /** Button label */
  labelButton: {
    fontSize: isIOS ? 17 : 14,
    fontWeight: isIOS ? '600' : '500',
    letterSpacing: isIOS ? -0.41 : 0.1,
    textTransform: isIOS ? ('none' as const) : ('uppercase' as const),
  } as TextStyle,

  /** Chip/badge label */
  labelChip: {
    fontSize: isIOS ? 13 : 11,
    fontWeight: isIOS ? '600' : '500',
    letterSpacing: isIOS ? -0.08 : 0.5,
    textTransform: isIOS ? ('none' as const) : ('uppercase' as const),
  } as TextStyle,

  /** Overline / section header */
  overline: {
    fontSize: isIOS ? 12 : 11,
    fontWeight: isIOS ? '600' : '500',
    letterSpacing: isIOS ? 0.5 : 1,
    textTransform: 'uppercase' as const,
  } as TextStyle,
} as const;

// ── Icons ────────────────────────────────────────────────────────────────────
/**
 * Icon name mapping per platform.
 * iOS: outline variants (Apple SF Symbols style)
 * Android: sharp/filled variants (Material Icons style)
 */
export function getIconVariant(baseName: string): string {
  if (isIOS) {
    // Ionicons outline suffix for iOS
    return `${baseName}-outline`;
  }
  // Ionicons sharp suffix for Android / MD3
  return `${baseName}-sharp`;
}

// ── Interaction ──────────────────────────────────────────────────────────────
export const interaction = {
  /** Press opacity for iOS Touchable elements */
  pressOpacity: isIOS ? 0.7 : 0.85,
  /** Whether to use android_ripple prop on Pressable */
  useRipple: !isIOS,
  /** Active opacity for highlighted state */
  activeOpacity: isIOS ? 0.6 : 0.8,
} as const;

// ── Navigation ───────────────────────────────────────────────────────────────
export const navigation = {
  /** Back button icon name */
  backIcon: isIOS ? 'chevron-back' : 'arrow-back',
  /** Header border */
  headerBorderWidth: isIOS ? 0.5 : 0,
  /** Header uses elevation on Android */
  headerElevation: isIOS ? 0 : 2,
} as const;
