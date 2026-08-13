import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

/**
 * Props for the live pitch tuner bar component.
 */
interface PitchTunerBarProps {
  /**
   * Detected frequency in Hz (or null if no detection).
   */
  detectedHz: number | null;

  /**
   * Target frequency in Hz (the note we want to hit).
   */
  targetHz: number;

  /**
   * Pitch deviation from target in cents (-50 to +50).
   */
  centsOff: number;

  /**
   * Clarity/confidence score (0 to 1).
   */
  clarity: number;

  /**
   * Target pitch name (e.g., "C4", "E4").
   */
  targetPitchName: string;

  /**
   * Detected pitch name (e.g., "C#4").
   */
  detectedPitchName?: string;

  /**
   * Container width in pixels.
   */
  width: number;

  /**
   * Container height in pixels (default 80).
   */
  height?: number;
}

/**
 * Resolves the color based on cents deviation.
 * Green: ±15 cents, Yellow: ±15-35 cents, Red: >±35 cents.
 */
function getColorForCentsDeviation(cents: number, clarity: number): string {
  const absCents = Math.abs(cents);

  if (clarity < 0.3) {
    return '#999999'; // Gray for low confidence
  }

  if (absCents <= 15) {
    return '#4CAF50'; // Green - in tune
  }

  if (absCents <= 35) {
    return '#FFC107'; // Yellow - close
  }

  return '#F44336'; // Red - out of tune
}

/**
 * Live horizontal pitch tuner bar with needle animation and color coding.
 * Shows real-time cents deviation from the target note with dynamic color feedback.
 *
 * Features:
 * - Animated needle tracking pitch deviation
 * - Color zones: Green (±15¢), Yellow (±15-35¢), Red (>35¢)
 * - Displays target vs detected pitch names
 * - Confidence indicator (clarity score)
 * - Smooth 60 FPS animations using React Native Animated
 */
const PitchTunerBar: React.FC<PitchTunerBarProps> = ({
  detectedHz,
  targetHz,
  centsOff,
  clarity,
  targetPitchName,
  detectedPitchName = '?',
  width,
  height = 80,
}) => {
  const needlePositionRef = useRef(new Animated.Value(0)).current;

  // Map cents to needle position (-50 to +50 cents = 0 to width)
  const needlePercent = (centsOff + 50) / 100;
  const needleX = needlePercent * width;

  const tunerColor = useMemo(
    () => getColorForCentsDeviation(centsOff, clarity),
    [centsOff, clarity],
  );

  // Animate needle position
  useEffect(() => {
    Animated.spring(needlePositionRef, {
      toValue: needleX,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [needleX, needlePositionRef]);

  const clarityPercent = Math.round(clarity * 100);

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Header with pitch info */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Target: {targetPitchName}</Text>
        <Text style={[styles.headerLabel, { color: tunerColor }]}>
          Detected: {detectedPitchName}
        </Text>
        <Text style={styles.clarityLabel}>
          {clarityPercent}% Confidence
        </Text>
      </View>

      {/* Tuner background track */}
      <View style={[styles.tunerTrack, { backgroundColor: tunerColor, opacity: 0.15 }]}>
        {/* Center line (perfectly in tune) */}
        <View
          style={[
            styles.centerLine,
            {
              left: `${50}%`,
            },
          ]}
        />

        {/* ±15 cent zone markers (green zone) */}
        <View
          style={[
            styles.zoneMarker,
            { left: `${41.5}%`, backgroundColor: '#4CAF50' },
          ]}
        />
        <View
          style={[
            styles.zoneMarker,
            { left: `${58.5}%`, backgroundColor: '#4CAF50' },
          ]}
        />

        {/* ±35 cent zone markers (yellow zone) */}
        <View
          style={[
            styles.zoneMarker,
            { left: `${25}%`, backgroundColor: '#FFC107' },
          ]}
        />
        <View
          style={[
            styles.zoneMarker,
            { left: `${75}%`, backgroundColor: '#FFC107' },
          ]}
        />
      </View>

      {/* Animated needle */}
      <Animated.View
        style={[
          styles.needle,
          {
            transform: [{ translateX: needlePositionRef }],
            backgroundColor: tunerColor,
          },
        ]}
      />

      {/* Cents display */}
      <View style={styles.centsDisplay}>
        <Text style={[styles.centsText, { color: tunerColor }]}>
          {centsOff > 0 ? '+' : ''}{Math.round(centsOff)} ¢
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 4,
    width: '100%',
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  clarityLabel: {
    fontSize: 9,
    color: '#999999',
    marginLeft: 4,
  },
  tunerTrack: {
    position: 'absolute',
    bottom: 12,
    width: '100%',
    height: 24,
    borderRadius: 4,
    overflow: 'hidden',
  },
  centerLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#ffffff',
    opacity: 0.6,
  },
  zoneMarker: {
    position: 'absolute',
    width: 1,
    height: '100%',
    opacity: 0.4,
  },
  needle: {
    position: 'absolute',
    bottom: 12,
    width: 3,
    height: 28,
    borderRadius: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  centsDisplay: {
    position: 'absolute',
    bottom: 1,
    alignSelf: 'center',
  },
  centsText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PitchTunerBar;
