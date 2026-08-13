import React, { useMemo, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView, TapGestureHandler } from 'react-native-gesture-handler';
import { EvaluationMap, TargetNote } from '../types/music';

interface NoteSheetOverlayProps {
  notes: TargetNote[];
  activeNoteId: string | null;
  evaluationMap: EvaluationMap;
  containerWidth: number;
  containerHeight: number;
  /**
   * Optional callback when user taps on the sheet to seek playback.
   * Returns the timestamp (in ms) the user tapped on.
   */
  onSheetTap?: (timestampMs: number) => void;
  /**
   * Optional total song duration to calculate tap position.
   */
  totalDurationMs?: number;
}

type EvaluationState = 'correct' | 'incorrect' | 'pending';

interface NoteMarkerVisualStyle {
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
}

const NOTE_MARKER_SIZE = 28;
const HALF_MARKER_SIZE = NOTE_MARKER_SIZE / 2;

/**
 * Resolves the visual style for a note marker based on its evaluation state.
 * Kept as a pure function outside the component body so it isn't
 * re-created on every render.
 */
function resolveEvaluationStyle(evaluation: EvaluationState | undefined): NoteMarkerVisualStyle {
  switch (evaluation) {
    case 'correct':
      return {
        fillColor: '#4CAF50',
        borderColor: '#A5F5B0',
        borderWidth: 2,
        shadowColor: '#4CAF50',
        shadowOpacity: 0.9,
        shadowRadius: 8,
      };
    case 'incorrect':
      return {
        fillColor: '#F44336',
        borderColor: '#FFCDD2',
        borderWidth: 2,
        shadowColor: '#F44336',
        shadowOpacity: 0.9,
        shadowRadius: 6,
      };
    case 'pending':
    default:
      return {
        fillColor: '#FFD700',
        borderColor: '#FFFFFF',
        borderWidth: 1.5,
        shadowColor: '#FFD700',
        shadowOpacity: 0.4,
        shadowRadius: 4,
      };
  }
}

interface NoteMarkerProps {
  note: TargetNote;
  isActive: boolean;
  evaluation: EvaluationState | undefined;
  left: number;
  top: number;
}

/**
 * Individual note marker with enhanced glow effects.
 * Memoized so that during 60 FPS playback, only markers whose props
 * actually changed re-render — avoiding layout thrashing.
 */
const NoteMarker = React.memo(
  ({ note, isActive, evaluation, left, top }: NoteMarkerProps) => {
    const visualStyle = useMemo(() => resolveEvaluationStyle(evaluation), [evaluation]);
    const scaleValue = useMemo(() => new Animated.Value(isActive ? 1.35 : 1), []);
    const glowOpacityValue = useMemo(() => new Animated.Value(0), []);

    React.useEffect(() => {
      Animated.spring(scaleValue, {
        toValue: isActive ? 1.35 : 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }, [isActive, scaleValue]);

    // Trigger glow animation when note becomes correct
    React.useEffect(() => {
      if (evaluation === 'correct') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowOpacityValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacityValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      } else {
        glowOpacityValue.setValue(0);
      }
    }, [evaluation, glowOpacityValue]);

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.markerBase,
          {
            left: left - HALF_MARKER_SIZE,
            top: top - HALF_MARKER_SIZE,
            backgroundColor: visualStyle.fillColor,
            borderColor: isActive ? '#00E5FF' : visualStyle.borderColor,
            borderWidth: isActive ? 3 : visualStyle.borderWidth,
            shadowColor: isActive ? '#00E5FF' : visualStyle.shadowColor,
            shadowOpacity: isActive ? 1 : visualStyle.shadowOpacity,
            shadowRadius: isActive ? 10 : visualStyle.shadowRadius,
            elevation: isActive ? 10 : 4,
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        {/* Glow pulse effect for correct notes */}
        {evaluation === 'correct' && (
          <Animated.View
            style={[
              styles.glowPulse,
              {
                opacity: glowOpacityValue,
              },
            ]}
          />
        )}

        {note.label ? (
          <Text style={styles.markerLabel} numberOfLines={1}>
            {note.label}
          </Text>
        ) : null}
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.left === nextProps.left &&
      prevProps.top === nextProps.top &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.evaluation === nextProps.evaluation &&
      prevProps.note.id === nextProps.note.id &&
      prevProps.note.label === nextProps.note.label
    );
  }
);

NoteMarker.displayName = 'NoteMarker';

interface ComputedNote {
  note: TargetNote;
  left: number;
  top: number;
  isActive: boolean;
  evaluation: EvaluationState | undefined;
}

const NoteSheetOverlay: React.FC<NoteSheetOverlayProps> = ({
  notes,
  activeNoteId,
  evaluationMap,
  containerWidth,
  containerHeight,
  onSheetTap,
  totalDurationMs = 0,
}) => {
  const [layoutDimensions, setLayoutDimensions] = useState({
    width: containerWidth,
    height: containerHeight,
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    // Update dimensions when container layout changes (e.g., on orientation change)
    if (width !== layoutDimensions.width || height !== layoutDimensions.height) {
      setLayoutDimensions({ width, height });
    }
  };

  const handleSheetTap = (event: any) => {
    if (!onSheetTap || totalDurationMs <= 0) {
      return;
    }

    // Calculate tap position as percentage of width
    const tapX = event.nativeEvent.x ?? 0;
    const tapProgress = Math.max(0, Math.min(1, tapX / containerWidth));
    const seekTimeMs = tapProgress * totalDurationMs;

    onSheetTap(seekTimeMs);
  };

  const computedNotes: ComputedNote[] = useMemo(() => {
    const safeNotes = notes ?? [];
    const safeEvaluationMap = evaluationMap ?? {};

    if (!containerWidth || !containerHeight) {
      return [];
    }

    return safeNotes.map((note) => {
      const left = (note.xPosition / 100) * containerWidth;
      const top = (note.yPosition / 100) * containerHeight;
      const evaluation = safeEvaluationMap[note.id] as EvaluationState | undefined;
      const isActive = note.id === activeNoteId;

      return {
        note,
        left,
        top,
        isActive,
        evaluation,
      };
    });
  }, [notes, evaluationMap, activeNoteId, containerWidth, containerHeight]);

  if (!containerWidth || !containerHeight) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={[
        styles.overlayContainer,
        { width: containerWidth, height: containerHeight },
      ]}
      onLayout={handleLayout}
    >
      <TapGestureHandler onHandlerStateChange={handleSheetTap}>
        <Animated.View
          pointerEvents={onSheetTap ? 'auto' : 'none'}
          style={[
            styles.overlayContainer,
            { width: containerWidth, height: containerHeight },
          ]}
        >
          {computedNotes.map(({ note, left, top, isActive, evaluation }) => (
            <NoteMarker
              key={note.id}
              note={note}
              left={left}
              top={top}
              isActive={isActive}
              evaluation={evaluation}
            />
          ))}
        </Animated.View>
      </TapGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  markerBase: {
    position: 'absolute',
    width: NOTE_MARKER_SIZE,
    height: NOTE_MARKER_SIZE,
    borderRadius: NOTE_MARKER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  glowPulse: {
    position: 'absolute',
    width: NOTE_MARKER_SIZE + 12,
    height: NOTE_MARKER_SIZE + 12,
    borderRadius: (NOTE_MARKER_SIZE + 12) / 2,
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
    top: -6,
    left: -6,
  },
});

export default React.memo(NoteSheetOverlay);