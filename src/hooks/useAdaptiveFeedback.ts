/**
 * Adaptive Feedback Hook
 * Provides platform-appropriate haptic and interaction feedback.
 * iOS: Uses expo-haptics for tactile responses per Apple HIG.
 * Android: No haptic by default — relies on visual ripple feedback.
 */
import { Platform } from 'react-native';

type FeedbackType = 'light' | 'medium' | 'heavy' | 'selection';

let Haptics: typeof import('expo-haptics') | null = null;

// Lazy-load expo-haptics only on iOS
if (Platform.OS === 'ios') {
  try {
    Haptics = require('expo-haptics');
  } catch {
    // expo-haptics not available — silently degrade
  }
}

/**
 * Returns a `triggerFeedback` function that fires platform-appropriate
 * haptic or visual feedback.
 *
 * On iOS: Triggers haptic impact/selection feedback via expo-haptics.
 * On Android/Web: No-op (visual ripple is the primary feedback).
 */
export function useAdaptiveFeedback() {
  const triggerFeedback = (type: FeedbackType = 'light') => {
    if (Platform.OS !== 'ios' || !Haptics) return;

    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
      }
    } catch {
      // Silently handle unavailable haptics
    }
  };

  return { triggerFeedback };
}
