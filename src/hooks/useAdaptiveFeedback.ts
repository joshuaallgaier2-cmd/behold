/**
 * Adaptive Feedback Hook
 * Provides platform-appropriate haptic and interaction feedback.
 * iOS: Uses expo-haptics for tactile responses per Apple HIG.
 * Android: No haptic by default — relies on visual ripple feedback.
 */
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

type FeedbackType = "light" | "medium" | "heavy" | "selection";

/**
 * Returns a `triggerFeedback` function that fires platform-appropriate
 * haptic or visual feedback.
 *
 * On iOS: Triggers haptic impact/selection feedback via expo-haptics.
 * On Android/Web: No-op (visual ripple is the primary feedback).
 */
export function useAdaptiveFeedback() {
  const triggerFeedback = (type: FeedbackType = "light") => {
    if (Platform.OS !== "ios") return;

    try {
      let feedback: Promise<void>;
      switch (type) {
        case "light":
          feedback = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          feedback = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          feedback = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "selection":
          feedback = Haptics.selectionAsync();
          break;
      }
      void feedback.catch(() => {});
    } catch {
      // Silently handle unavailable haptics
    }
  };

  return { triggerFeedback };
}
