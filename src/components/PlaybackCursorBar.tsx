import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface PlaybackCursorBarProps {
  isPlaying: boolean;
  currentTimeMs: number;
  totalDurationMs: number;
  containerWidth: number;
  containerHeight: number;
  /**
   * Optional loop region start (milliseconds).
   */
  loopStartMs?: number;
  /**
   * Optional loop region end (milliseconds).
   */
  loopEndMs?: number;
}

/**
 * Production-grade vertical playback cursor with optional loop region visualization.
 * Uses native-driver Animated.timing for liquid-smooth horizontal translation.
 *
 * Features:
 * - Smooth cursor tracking at 60 FPS
 * - Visual loop region highlighting (if loopStart/loopEnd provided)
 * - Glowing pin head and cursor line
 * - Automatic instant repositioning for seeks
 */
const PlaybackCursorBar: React.FC<PlaybackCursorBarProps> = ({
  isPlaying,
  currentTimeMs,
  totalDurationMs,
  containerWidth,
  containerHeight,
  loopStartMs = 0,
  loopEndMs,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const previousTimeRef = useRef(currentTimeMs);

  // Guard against zero / NaN / negative duration
  const safeDuration =
    typeof totalDurationMs === 'number' &&
    Number.isFinite(totalDurationMs) &&
    totalDurationMs > 0
      ? totalDurationMs
      : 1;

  const safeTime =
    typeof currentTimeMs === 'number' && Number.isFinite(currentTimeMs)
      ? Math.max(0, Math.min(currentTimeMs, safeDuration))
      : 0;

  const progress = safeTime / safeDuration;
  const targetX = progress * containerWidth;

  // Calculate loop region bounds
  const loopStartX =
    typeof loopStartMs === 'number' && Number.isFinite(loopStartMs)
      ? (loopStartMs / safeDuration) * containerWidth
      : 0;

  const loopEndX =
    typeof loopEndMs === 'number' && Number.isFinite(loopEndMs)
      ? (loopEndMs / safeDuration) * containerWidth
      : containerWidth;

  const loopWidth = Math.max(0, loopEndX - loopStartX);
  const hasLoopRegion = loopWidth > 0 && loopEndMs && loopEndMs > loopStartMs;

  useEffect(() => {
    // Skip animation when the jump is large (seek) or when not playing
    const delta = Math.abs(safeTime - previousTimeRef.current);
    const isSeek = delta > 250; // >250 ms treated as seek / jump

    previousTimeRef.current = safeTime;

    if (isSeek || !isPlaying) {
      // Instant reposition for seeks / pause
      translateX.setValue(targetX);
      return;
    }

    // Smooth continuous movement while playing
    Animated.timing(translateX, {
      toValue: targetX,
      duration: 80, // short window keeps cursor tightly locked to audio clock
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [safeTime, targetX, isPlaying, translateX]);

  // Also react to container width changes (orientation / layout)
  useEffect(() => {
    translateX.setValue(targetX);
  }, [containerWidth, targetX, translateX]);

  return (
    <View
      style={[styles.container, { width: containerWidth, height: containerHeight }]}
      pointerEvents="none"
    >
      {/* Loop region background */}
      {hasLoopRegion && (
        <View
          style={[
            styles.loopRegion,
            {
              left: loopStartX,
              width: loopWidth,
              height: containerHeight,
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
            },
          ]}
        />
      )}

      {/* Loop region start marker */}
      {hasLoopRegion && (
        <View
          style={[
            styles.loopMarker,
            {
              left: loopStartX,
              borderLeftColor: '#2196F3',
            },
          ]}
        />
      )}

      {/* Loop region end marker */}
      {hasLoopRegion && loopEndX < containerWidth && (
        <View
          style={[
            styles.loopMarker,
            {
              left: loopEndX,
              borderLeftColor: '#FF9800',
            },
          ]}
        />
      )}

      {/* Cursor needle */}
      <Animated.View
        style={[
          styles.cursorWrapper,
          {
            height: containerHeight,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Glowing top-pin head */}
        <View style={styles.pinHeadOuter}>
          <View style={styles.pinHeadInner} />
        </View>

        {/* Vertical cursor line with subtle glow */}
        <View style={styles.lineGlow} />
        <View style={styles.line} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  cursorWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20, // generous hit-box for the visual elements
    alignItems: 'center',
  },
  // Outer glow ring for the pin head
  pinHeadOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 229, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    // subtle drop-shadow
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 8,
  },
  // Solid core of the pin head
  pinHeadInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5FF',
  },
  // Soft vertical glow behind the line
  lineGlow: {
    position: 'absolute',
    top: 10,
    width: 7,
    bottom: 0,
    backgroundColor: 'rgba(0, 229, 255, 0.22)',
    borderRadius: 3.5,
  },
  // Crisp 3 px cursor line
  line: {
    position: 'absolute',
    top: 10,
    width: 3,
    bottom: 0,
    backgroundColor: '#00E5FF',
    borderRadius: 1.5,
    // platform shadow for extra definition
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 4,
    elevation: 6,
  },
  // Loop region background highlight
  loopRegion: {
    position: 'absolute',
    top: 0,
    opacity: 0.8,
  },
  // Loop region boundary markers
  loopMarker: {
    position: 'absolute',
    top: 0,
    width: 2,
    bottom: 0,
    borderLeftWidth: 2,
    opacity: 0.6,
  },
});

export default PlaybackCursorBar;