/**
 * AdaptiveButton
 * iOS: Rounded rect (10px), opacity press feedback, haptic, SF-style label
 * Android: MD3 filled button (12px), ripple, Roboto uppercase label
 */
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { useAdaptiveFeedback } from '../../hooks/useAdaptiveFeedback';
import { getElevation, heights, interaction, radius, typography } from '../../theme/platformDesign';

const isIOS = Platform.OS === 'ios';

export interface AdaptiveButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  disabled?: boolean;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
}

export default function AdaptiveButton({
  label,
  onPress,
  variant = 'filled',
  size = 'medium',
  icon,
  disabled = false,
  color = '#0284C7',
  textColor,
  style,
  labelStyle,
  accessibilityLabel,
}: AdaptiveButtonProps) {
  const { triggerFeedback } = useAdaptiveFeedback();

  const handlePress = () => {
    if (disabled) return;
    triggerFeedback('light');
    onPress();
  };

  const resolvedTextColor = textColor ?? (variant === 'filled' ? '#FFFFFF' : color);

  const sizeStyles = SIZE_MAP[size];
  const variantStyles = getVariantStyles(variant, color, disabled);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      android_ripple={
        interaction.useRipple && variant === 'filled'
          ? { color: 'rgba(255,255,255,0.2)', borderless: false }
          : interaction.useRipple
          ? { color: `${color}20`, borderless: false }
          : undefined
      }
      style={({ pressed }) => [
        styles.base,
        sizeStyles.container,
        variantStyles.container,
        disabled && styles.disabled,
        // iOS: opacity feedback on press
        isIOS && pressed && { opacity: interaction.pressOpacity },
        style,
      ]}
    >
      {icon && <>{icon}</>}
      <Text
        style={[
          typography.labelButton,
          sizeStyles.label,
          { color: disabled ? '#94A3B8' : resolvedTextColor },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const SIZE_MAP = {
  small: {
    container: {
      height: isIOS ? 34 : 32,
      paddingHorizontal: isIOS ? 14 : 12,
      borderRadius: radius.small,
      gap: 4,
    } as ViewStyle,
    label: {
      fontSize: isIOS ? 14 : 12,
    } as TextStyle,
  },
  medium: {
    container: {
      height: heights.button,
      paddingHorizontal: isIOS ? 20 : 24,
      borderRadius: radius.small,
      gap: 6,
    } as ViewStyle,
    label: {} as TextStyle,
  },
  large: {
    container: {
      height: isIOS ? 50 : 48,
      paddingHorizontal: isIOS ? 28 : 32,
      borderRadius: radius.medium,
      gap: 8,
    } as ViewStyle,
    label: {
      fontSize: isIOS ? 18 : 16,
    } as TextStyle,
  },
};

function getVariantStyles(variant: string, color: string, disabled: boolean) {
  const disabledBg = isIOS ? '#E2E8F0' : '#E2E8F020';
  switch (variant) {
    case 'filled':
      return {
        container: {
          backgroundColor: disabled ? disabledBg : color,
          ...getElevation(disabled ? 0 : 1),
        } as ViewStyle,
      };
    case 'outlined':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: isIOS ? 1 : 1,
          borderColor: disabled ? '#CBD5E1' : color,
        } as ViewStyle,
      };
    case 'text':
      return {
        container: {
          backgroundColor: 'transparent',
        } as ViewStyle,
      };
    default:
      return { container: {} as ViewStyle };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  disabled: {
    opacity: isIOS ? 0.45 : 0.38,
  },
});
