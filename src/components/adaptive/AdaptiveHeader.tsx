/**
 * AdaptiveHeader
 * iOS: Standard iOS navigation bar (44px), back chevron, thin bottom hairline, centered title
 * Android: MD3 top app bar (64px), arrow-back, no border (uses elevation), left-aligned title
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAdaptiveFeedback } from '../../hooks/useAdaptiveFeedback';
import { getElevation, heights, interaction, navigation, radius, spacing, typography } from '../../theme/platformDesign';

const isIOS = Platform.OS === 'ios';

export interface AdaptiveHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  centerElement?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  style?: ViewStyle;
}

export default function AdaptiveHeader({
  title,
  subtitle,
  onBack,
  rightElement,
  centerElement,
  backgroundColor,
  textColor = '#FFFFFF',
  borderColor = '#334155',
  style,
}: AdaptiveHeaderProps) {
  const { triggerFeedback } = useAdaptiveFeedback();

  const headerBg = backgroundColor ?? (isIOS ? '#000000' : '#1E293B');

  const handleBack = () => {
    triggerFeedback('light');
    onBack?.();
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: headerBg,
          height: heights.navBar,
          borderBottomWidth: navigation.headerBorderWidth,
          borderBottomColor: borderColor,
          ...getElevation(navigation.headerElevation as 0 | 1 | 2 | 3),
        },
        style,
      ]}
    >
      {/* Left: Back Button */}
      <View style={styles.leftSlot}>
        {onBack && (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            android_ripple={
              interaction.useRipple
                ? { color: 'rgba(255,255,255,0.15)', borderless: true, radius: 20 }
                : undefined
            }
            style={({ pressed }) => [
              styles.backButton,
              isIOS && pressed && { opacity: interaction.pressOpacity },
            ]}
            hitSlop={8}
          >
            <Ionicons
              name={navigation.backIcon as any}
              size={isIOS ? 28 : 24}
              color={textColor}
            />
            {/* iOS: Optional "Back" text label next to chevron */}
            {isIOS && (
              <Text style={[styles.iosBackLabel, { color: textColor }]}>
                Back
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Center: Title or custom element */}
      <View style={[styles.centerSlot, !isIOS && styles.centerSlotAndroid]}>
        {centerElement ?? (
          <View style={isIOS ? styles.centerTextGroup : styles.leftTextGroup}>
            <Text
              style={[
                isIOS ? styles.iosTitleText : styles.androidTitleText,
                { color: textColor },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[typography.caption, { color: textColor, opacity: 0.7 }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Right: Action elements */}
      <View style={styles.rightSlot}>
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isIOS ? 8 : 4,
    zIndex: 20,
  },
  leftSlot: {
    minWidth: isIOS ? 70 : 48,
    alignItems: isIOS ? 'flex-start' : 'center',
    justifyContent: 'center',
  },
  centerSlot: {
    flex: 1,
    alignItems: isIOS ? 'center' : 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  centerSlotAndroid: {
    // MD3: title starts after the nav icon
    paddingLeft: 4,
  },
  rightSlot: {
    minWidth: isIOS ? 70 : 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isIOS ? 8 : 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  iosBackLabel: {
    fontSize: 17,
    fontWeight: '400',
    marginLeft: -2,
  },
  centerTextGroup: {
    alignItems: 'center',
  },
  leftTextGroup: {
    alignItems: 'flex-start',
  },
  iosTitleText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
  androidTitleText: {
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0,
  },
});
