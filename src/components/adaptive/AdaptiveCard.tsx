/**
 * AdaptiveCard
 * iOS: White card with subtle diffused shadow, 16px radius, thin border
 * Android: MD3 filled card with elevation, 12px radius, surface tint layer
 */
import React from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { getElevation, interaction, radius, spacing, type ElevationLevel } from '../../theme/platformDesign';

const isIOS = Platform.OS === 'ios';

export interface AdaptiveCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevation?: ElevationLevel;
  style?: ViewStyle;
  backgroundColor?: string;
  borderColor?: string;
  accessibilityLabel?: string;
}

export default function AdaptiveCard({
  children,
  onPress,
  elevation = 1,
  style,
  backgroundColor,
  borderColor,
  accessibilityLabel,
}: AdaptiveCardProps) {
  const cardBg = backgroundColor ?? (isIOS ? '#FFFFFF' : '#1E293B');
  const cardBorder = borderColor ?? (isIOS ? '#F1F5F9' : 'transparent');

  const cardStyle: ViewStyle = {
    backgroundColor: cardBg,
    borderRadius: isIOS ? radius.medium : radius.small,
    borderWidth: isIOS ? 1 : 0,
    borderColor: cardBorder,
    padding: spacing.md,
    ...getElevation(elevation),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        android_ripple={
          interaction.useRipple
            ? { color: 'rgba(255,255,255,0.08)', borderless: false }
            : undefined
        }
        style={({ pressed }) => [
          styles.base,
          cardStyle,
          isIOS && pressed && { opacity: interaction.pressOpacity },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[styles.base, cardStyle, style]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
