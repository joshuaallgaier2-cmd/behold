/**
 * SpeedSlider
 * A slider component for tempo/speed control with notches at discrete values
 * but allowing continuous selection between notches.
 * iOS: UISlider with custom thumb and track
 * Android: Material Design 3 slider with discrete tick marks
 */
import { useMemo, useRef, useState } from "react";
import {
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";
import { useAdaptiveFeedback } from "../../hooks/useAdaptiveFeedback";
import { heights, spacing, typography } from "../../theme/platformDesign";

const isIOS = Platform.OS === "ios";

export interface SpeedSliderProps {
  /** Current speed multiplier value */
  value: number;
  /** Callback when value changes */
  onValueChange: (value: number) => void;
  /** Minimum speed value */
  minimumValue?: number;
  /** Maximum speed value */
  maximumValue?: number;
  /** Discrete notch values (e.g., [0.5, 0.75, 1.0, 1.25, 1.5]) */
  notchValues?: number[];
  /** Step size for continuous sliding */
  step?: number;
  /** Label to show on the left (e.g., "120 BPM") */
  leftLabel?: string;
  /** Style for the left label */
  leftLabelStyle?: TextStyle;
  /** Style for the left label container */
  leftLabelContainerStyle?: ViewStyle;
  /** Place the label above the track to preserve track width in compact layouts */
  compactLabel?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Track color */
  trackColor?: string;
  /** Thumb color */
  thumbColor?: string;
  /** Notch/tick color */
  notchColor?: string;
  /** Active track color */
  activeTrackColor?: string;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export const formatSpeedMultiplier = (value: number) =>
  `${Number(value.toFixed(2))}×`;

export default function SpeedSlider({
  value,
  onValueChange,
  minimumValue = 0.5,
  maximumValue = 1.5,
  notchValues = [0.5, 0.75, 1.0, 1.25, 1.5],
  step = 0.01,
  leftLabel,
  leftLabelStyle,
  leftLabelContainerStyle,
  compactLabel = false,
  style,
  trackColor,
  thumbColor,
  notchColor,
  activeTrackColor,
  disabled = false,
  accessibilityLabel = "Playback speed",
}: SpeedSliderProps) {
  const { triggerFeedback } = useAdaptiveFeedback();
  const [sliderWidth, setSliderWidth] = useState(0);
  const [sliderLeft, setSliderLeft] = useState(0);
  const sliderRef = useRef<View>(null);

  const defaultTrackColor = trackColor ?? "#334155";
  const defaultThumbColor = thumbColor ?? "#FFD700";
  const defaultNotchColor = notchColor ?? "#94A3B8";
  const defaultActiveTrackColor = activeTrackColor ?? "#FFD700";

  const valuePercent = useMemo(
    () => ((value - minimumValue) / (maximumValue - minimumValue)) * 100,
    [value, minimumValue, maximumValue],
  );

  const notchPositions = useMemo(
    () =>
      notchValues.map(
        (notch) =>
          ((notch - minimumValue) / (maximumValue - minimumValue)) * 100,
      ),
    [notchValues, minimumValue, maximumValue],
  );

  const updateFromPosition = (x: number, width: number) => {
    if (!width || disabled) return;
    const raw = (x / width) * (maximumValue - minimumValue) + minimumValue;
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.min(maximumValue, Math.max(minimumValue, stepped));
    const snapped = notchValues.reduce(
      (closest, notch) =>
        Math.abs(notch - clamped) < Math.abs(closest - clamped)
          ? notch
          : closest,
      notchValues[0] ?? clamped,
    );
    onValueChange(snapped);
    triggerFeedback("selection");
  };

  return (
    <View style={[styles.container, compactLabel && styles.compactContainer, style]}>
      {leftLabel && (
        <View
          style={[
            styles.leftLabelContainer,
            compactLabel && styles.compactLabelContainer,
            leftLabelContainerStyle,
          ]}
        >
          <Text style={[typography.caption, styles.leftLabel, leftLabelStyle]}>
            {leftLabel}
          </Text>
        </View>
      )}

      <Pressable
        ref={sliderRef}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          min: minimumValue,
          max: maximumValue,
          now: value,
          text: formatSpeedMultiplier(value),
        }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          if (disabled) return;
          const direction = event.nativeEvent.actionName === "increment" ? 1 : -1;
          if (event.nativeEvent.actionName !== "increment" && event.nativeEvent.actionName !== "decrement") return;
          const sortedNotches = [...notchValues].sort((a, b) => a - b);
          const nextValue = sortedNotches.find((notch) => direction > 0 ? notch > value : notch < value);
          if (nextValue !== undefined) {
            onValueChange(nextValue);
            triggerFeedback("selection");
          }
        }}
        disabled={disabled}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth > 0 && nextWidth !== sliderWidth) {
            setSliderWidth(nextWidth);
          }
          sliderRef.current?.measureInWindow((x) => setSliderLeft(x));
        }}
        onPress={(event) => {
          const x = event.nativeEvent.pageX - sliderLeft;
          const width = sliderWidth;
          if (width > 0 && Number.isFinite(x)) {
            updateFromPosition(x, width);
          }
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          if (sliderWidth > 0) {
            updateFromPosition(event.nativeEvent.pageX - sliderLeft, sliderWidth);
          }
        }}
        onResponderMove={(event) => {
          if (sliderWidth > 0) {
            updateFromPosition(event.nativeEvent.pageX - sliderLeft, sliderWidth);
          }
        }}
        style={[styles.sliderWrapper, compactLabel && styles.compactSliderWrapper]}
      >
        <View style={styles.notchContainer}>
          {notchPositions.map((pos, index) => (
            <View
              key={`${notchValues[index]}-${index}`}
              style={[
                styles.notch,
                {
                  left: `${pos}%`,
                  backgroundColor: defaultNotchColor,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.trackContainer}>
          <View
            style={[
              styles.activeTrack,
              {
                width: `${valuePercent}%`,
                backgroundColor: defaultActiveTrackColor,
              },
            ]}
          />
          <View
            style={[
              styles.inactiveTrack,
              {
                left: `${valuePercent}%`,
                backgroundColor: defaultTrackColor,
              },
            ]}
          />
        </View>

        <View
          style={[
            styles.thumb,
            {
              left: `${valuePercent}%`,
              marginLeft: isIOS ? -14 : -12,
              backgroundColor: defaultThumbColor,
            },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
    minHeight: heights.minTap,
  },
  compactContainer: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    gap: 0,
    minHeight: 48,
  },
  compactLabelContainer: {
    minWidth: 0,
    height: 14,
    justifyContent: "center",
  },
  compactSliderWrapper: {
    alignSelf: "stretch",
    height: 32,
    flexBasis: 32,
    marginHorizontal: 12,
  },
  leftLabelContainer: {
    minWidth: 70,
    justifyContent: "flex-end",
  },
  leftLabel: {
    color: "#94A3B8",
    fontWeight: "600",
    textAlign: "right",
  },
  sliderWrapper: {
    flex: 1,
    minWidth: 0,
    height: heights.minTap,
    marginHorizontal: isIOS ? 14 : 12,
    position: "relative",
  },
  notchContainer: {
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  notch: {
    position: "absolute",
    width: 1,
    height: "60%",
    borderRadius: 1,
    transform: [{ translateX: -0.5 }],
  },
  trackContainer: {
    pointerEvents: "none",
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    transform: [{ translateY: -2 }],
    zIndex: 2,
    overflow: "hidden",
  },
  activeTrack: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  inactiveTrack: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  thumb: {
    pointerEvents: "none",
    position: "absolute",
    top: "50%",
    width: isIOS ? 28 : 24,
    height: isIOS ? 28 : 24,
    borderRadius: isIOS ? 14 : 12,
    transform: [{ translateY: -(isIOS ? 14 : 12) }],
    zIndex: 3,
    ...Platform.select({
      ios: {
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.3)",
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
