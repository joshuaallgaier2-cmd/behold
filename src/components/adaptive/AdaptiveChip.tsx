/**
 * AdaptiveChip
 * iOS: Capsule pill with system colors
 * Android: MD3 assist/filter chip with 8dp radius and tonal variant
 */
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { useAdaptiveFeedback } from '../../hooks/useAdaptiveFeedback';
import { heights, interaction, radius, typography } from '../../theme/platformDesign';

const isIOS = Platform.OS === 'ios';

export interface AdaptiveChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  color?: string;
  selectedColor?: string;
  textColor?: string;
  selectedTextColor?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export default function AdaptiveChip({
  label,
  onPress,
  selected = false,
  color,
  selectedColor,
  textColor,
  selectedTextColor,
  icon,
  style,
  labelStyle,
}: AdaptiveChipProps) {
  const { triggerFeedback } = useAdaptiveFeedback();

  const handlePress = () => {
    triggerFeedback('selection');
    onPress?.();
  };

  // Default colors
  const defaultBg = color ?? (isIOS ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)');
  const defaultSelectedBg = selectedColor ?? '#0284C7';
  const defaultText = textColor ?? '#94A3B8';
  const defaultSelectedText = selectedTextColor ?? (isIOS ? '#FFFFFF' : '#0F172A');

  const chipBg = selected ? defaultSelectedBg : defaultBg;
  const chipText = selected ? defaultSelectedText : defaultText;
  const chipBorder = selected
    ? 'transparent'
    : isIOS
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(255,255,255,0.15)';

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      android_ripple={
        interaction.useRipple
          ? { color: selected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)', borderless: false }
          : undefined
      }
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: chipBg,
          borderColor: chipBorder,
          borderRadius: isIOS ? radius.pill : 8,
          height: heights.chip,
        },
        isIOS && pressed && { opacity: interaction.pressOpacity },
        style,
      ]}
    >
      {icon && <>{icon}</>}
      <Text
        style={[
          typography.labelChip,
          { color: chipText },
          selected && styles.selectedLabel,
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isIOS ? 14 : 12,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 4,
  },
  selectedLabel: {
    fontWeight: isIOS ? '700' : '600',
  },
});
