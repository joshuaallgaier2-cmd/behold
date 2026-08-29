import PerformanceSummaryModal from '@/src/components/PerformanceSummaryModal';
import PitchTunerBar from '@/src/components/PitchTunerBar';
import { BlurView } from 'expo-blur';
import SvgSheetCanvas from '@/src/components/SvgSheetCanvas';
import { INTERACTIVE_MUSIC_DATABASE } from '@/src/data/musicData';
import { usePracticeEngine } from '@/src/hooks/usePracticeEngine';
import { audioEngine } from '@/src/services/audioEngine';
import { evaluatePitchMatch, PitchFrame, startPitchListening, stopPitchListening } from '@/src/services/pitchDetector';
import type { EvaluationMap, Song, TargetNote } from '@/src/types/music';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const CANVAS_HEIGHT = 260;
const TUNER_HEIGHT = 65;

const buildInitialEvaluationMap = (notes: TargetNote[]): EvaluationMap =>
  Object.fromEntries(notes.map((note) => [note.id, 'pending'])) as EvaluationMap;

function getAccuracyStatus(accuracy: number): { label: string; color: string; icon: string } {
  if (accuracy >= 90) return { label: 'Mastered', color: '#FFD700', icon: '🏆' };
  if (accuracy >= 75) return { label: 'Proficient', color: '#10B981', icon: '🌟' };
  if (accuracy > 0) return { label: 'In Progress', color: '#00C2FF', icon: '🎯' };
  return { label: 'Ready to Play', color: '#94A3B8', icon: '⚡' };
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* Liquid Glass Notched Tempo Slider                                          */
/* Frosted glassmorphism slider with BlurView track, glass knob, snap notches */
/* ──────────────────────────────────────────────────────────────────────────── */

const TEMPO_STEPS = [
  { value: 0.5, label: 'Slow', short: '0.5×' },
  { value: 0.75, label: '¾ Speed', short: '0.75×' },
  { value: 1.0, label: 'Original', short: '1.0×' },
  { value: 1.25, label: 'Fast', short: '1.25×' },
  { value: 1.5, label: 'Blazing', short: '1.5×' },
];

// Responsive sizing — larger hit targets on iPad
const IS_TABLET = WINDOW_WIDTH >= 768;
const GLASS_KNOB_SIZE = IS_TABLET ? 38 : 30;
const GLASS_TRACK_HEIGHT = IS_TABLET ? 56 : 48;
const GLASS_TRACK_PAD_H = IS_TABLET ? 24 : 18;
const GLASS_NOTCH_SIZE = IS_TABLET ? 10 : 7;
const GLASS_KNOB_HIT = IS_TABLET ? 22 : 14;

interface NotchedTempoSliderProps {
  value: number;
  baseBpm: number;
  onValueChange: (multiplier: number) => void;
}

function NotchedTempoSlider({ value, baseBpm, onValueChange }: NotchedTempoSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const currentIndexRef = useRef(TEMPO_STEPS.findIndex((s) => s.value === value));
  const panX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);

  /* ── helpers ─────────────────────────────── */

  const positionForIndex = useCallback(
    (idx: number) => {
      if (trackWidth <= 0 || TEMPO_STEPS.length <= 1) return 0;
      return (idx / (TEMPO_STEPS.length - 1)) * trackWidth;
    },
    [trackWidth],
  );

  // Sync knob position when value or layout changes
  useEffect(() => {
    const idx = TEMPO_STEPS.findIndex((s) => s.value === value);
    if (idx >= 0 && trackWidth > 0) {
      currentIndexRef.current = idx;
      Animated.spring(panX, {
        toValue: positionForIndex(idx),
        useNativeDriver: false,
        friction: 7,
        tension: 160,
      }).start();
    }
  }, [value, trackWidth, panX, positionForIndex]);

  const snapToNearest = useCallback(
    (px: number) => {
      if (trackWidth <= 0) return;
      const clamped = Math.max(0, Math.min(px, trackWidth));
      const ratio = clamped / trackWidth;
      const closestIndex = Math.round(ratio * (TEMPO_STEPS.length - 1));
      const step = TEMPO_STEPS[closestIndex];
      currentIndexRef.current = closestIndex;

      Animated.spring(panX, {
        toValue: positionForIndex(closestIndex),
        useNativeDriver: false,
        friction: 7,
        tension: 160,
      }).start();

      if (step.value !== value) {
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 80, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        ]).start();
        onValueChange(step.value);
      }
    },
    [trackWidth, panX, positionForIndex, value, onValueChange, glowAnim],
  );

  /* ── PanResponder ────────────────────────── */

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsDragging(true);
          Animated.spring(scaleAnim, {
            toValue: 1.22,
            useNativeDriver: false,
            friction: 5,
          }).start();
        },
        onPanResponderMove: (_evt, gs) => {
          if (trackWidth <= 0) return;
          const startPos = positionForIndex(currentIndexRef.current);
          panX.setValue(Math.max(0, Math.min(startPos + gs.dx, trackWidth)));
        },
        onPanResponderRelease: (_evt, gs) => {
          setIsDragging(false);
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: false,
            friction: 5,
          }).start();
          snapToNearest(positionForIndex(currentIndexRef.current) + gs.dx);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: false,
            friction: 5,
          }).start();
        },
      }),
    [trackWidth, panX, positionForIndex, snapToNearest, scaleAnim],
  );

  /* ── derived values ─────────────────────── */

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const activeStep = TEMPO_STEPS.find((s) => s.value === value) ?? TEMPO_STEPS[2];
  const effectiveBpm = Math.round(baseBpm * value);

  const filledWidth = panX.interpolate({
    inputRange: [0, trackWidth || 1],
    outputRange: [0, trackWidth || 1],
    extrapolate: 'clamp',
  });

  const knobGlowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  /* ── render ─────────────────────────────── */

  return (
    <View style={gls.wrapper}>
      {/* Section header */}
      <View style={gls.headerRow}>
        <Text style={gls.sectionLabel}>INITIAL TEMPO SPEED</Text>
        {/* Floating glass readout badge */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 40 : 20}
          tint="dark"
          style={gls.readoutBlur}
        >
          <View style={gls.readoutInner}>
            <Text style={gls.readoutMultiplier}>{activeStep.short}</Text>
            <View style={gls.readoutDivider} />
            <Text style={gls.readoutBpm}>{effectiveBpm} BPM</Text>
            <View style={gls.readoutDivider} />
            <Text style={gls.readoutLabel}>{activeStep.label}</Text>
          </View>
        </BlurView>
      </View>

      {/* ── Glass Track Housing ─────────────────────── */}
      <View style={gls.trackShadowWrap}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 35 : 15}
          tint="dark"
          style={gls.glassTrack}
        >
          {/* Inner content layer with translucent overlay */}
          <View style={gls.glassTrackOverlay}>
            {/* Usable slider rail (padded inside glass housing) */}
            <View style={gls.railContainer} onLayout={handleTrackLayout}>
              {/* Unfilled rail */}
              <View style={gls.railBg} />

              {/* Filled cyan rail */}
              <Animated.View style={[gls.railFilled, { width: filledWidth }]} />

              {/* Frosted notch dots */}
              {trackWidth > 0 &&
                TEMPO_STEPS.map((step, idx) => {
                  const cx = positionForIndex(idx);
                  const isActive = step.value === value;
                  return (
                    <TouchableOpacity
                      key={step.value}
                      activeOpacity={0.7}
                      hitSlop={{ top: GLASS_KNOB_HIT, bottom: GLASS_KNOB_HIT, left: GLASS_KNOB_HIT, right: GLASS_KNOB_HIT }}
                      onPress={() => {
                        currentIndexRef.current = idx;
                        snapToNearest(cx);
                        onValueChange(step.value);
                      }}
                      style={[gls.notchHit, { left: cx - 18 }]}
                    >
                      <View
                        style={[
                          gls.notchDot,
                          isActive && gls.notchDotActive,
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}

              {/* ── Liquid Glass Knob (Thumb) ──────────── */}
              {trackWidth > 0 && (
                <Animated.View
                  style={[
                    gls.knobAnchor,
                    {
                      transform: [
                        { translateX: Animated.subtract(panX, GLASS_KNOB_SIZE / 2) },
                        { scale: scaleAnim },
                      ],
                    },
                  ]}
                  hitSlop={{ top: GLASS_KNOB_HIT, bottom: GLASS_KNOB_HIT, left: GLASS_KNOB_HIT, right: GLASS_KNOB_HIT }}
                  {...panResponder.panHandlers}
                >
                  {/* Outer liquid glow (visible on drag / snap) */}
                  <Animated.View
                    style={[
                      gls.knobGlowRing,
                      { opacity: isDragging ? 0.4 : knobGlowOpacity },
                    ]}
                  />

                  {/* Frosted glass knob body */}
                  <BlurView
                    intensity={Platform.OS === 'ios' ? 60 : 25}
                    tint="light"
                    style={gls.knobBlur}
                  >
                    <View style={gls.knobGlassBody}>
                      {/* Specular rim highlight */}
                      <View style={gls.knobSpecular} />
                    </View>
                  </BlurView>
                </Animated.View>
              )}
            </View>
          </View>
        </BlurView>
      </View>

      {/* ── Bottom notch labels ─────────────────────── */}
      {trackWidth > 0 && (
        <View style={gls.labelsRow}>
          {TEMPO_STEPS.map((step, idx) => {
            const cx = positionForIndex(idx);
            const isActive = step.value === value;
            return (
              <Text
                key={step.value}
                style={[
                  gls.notchLabelText,
                  isActive && gls.notchLabelActive,
                  { left: cx - 24, width: 48 },
                ]}
              >
                {step.short}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}

/* ── Liquid Glass Slider Styles ───────────────────────────────────────── */

const gls = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: IS_TABLET ? 12 : 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* Readout badge (glass pill) */
  readoutBlur: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  readoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IS_TABLET ? 14 : 10,
    paddingVertical: IS_TABLET ? 6 : 4,
    backgroundColor: 'rgba(0, 194, 255, 0.08)',
    gap: 6,
  },
  readoutMultiplier: {
    color: '#00C2FF',
    fontSize: IS_TABLET ? 14 : 12,
    fontWeight: '900',
  },
  readoutDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  readoutBpm: {
    color: '#E2E8F0',
    fontSize: IS_TABLET ? 13 : 11,
    fontWeight: '700',
  },
  readoutLabel: {
    color: '#94A3B8',
    fontSize: IS_TABLET ? 12 : 10,
    fontWeight: '600',
    fontStyle: 'italic',
  },

  /* Glass track housing */
  trackShadowWrap: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  glassTrack: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  glassTrackOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: (GLASS_TRACK_HEIGHT - 6) / 2,
    paddingHorizontal: GLASS_TRACK_PAD_H,
  },

  /* Inner rail */
  railContainer: {
    height: 6,
    justifyContent: 'center',
    position: 'relative',
  },
  railBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    top: 1,
  },
  railFilled: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    top: 1,
    backgroundColor: 'rgba(0, 194, 255, 0.55)',
  },

  /* Notch dots */
  notchHit: {
    position: 'absolute',
    width: 36,
    height: GLASS_TRACK_HEIGHT,
    top: -(GLASS_TRACK_HEIGHT - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notchDot: {
    width: GLASS_NOTCH_SIZE,
    height: GLASS_NOTCH_SIZE,
    borderRadius: GLASS_NOTCH_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  notchDotActive: {
    backgroundColor: 'rgba(0, 194, 255, 0.7)',
    borderColor: 'rgba(0, 194, 255, 0.9)',
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 5,
  },

  /* Glass knob */
  knobAnchor: {
    position: 'absolute',
    width: GLASS_KNOB_SIZE,
    height: GLASS_KNOB_SIZE,
    top: -(GLASS_KNOB_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  knobGlowRing: {
    position: 'absolute',
    width: GLASS_KNOB_SIZE + 20,
    height: GLASS_KNOB_SIZE + 20,
    borderRadius: (GLASS_KNOB_SIZE + 20) / 2,
    backgroundColor: '#00C2FF',
  },
  knobBlur: {
    width: GLASS_KNOB_SIZE,
    height: GLASS_KNOB_SIZE,
    borderRadius: GLASS_KNOB_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.50)',
  },
  knobGlassBody: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: GLASS_KNOB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  knobSpecular: {
    width: '70%',
    height: '38%',
    borderBottomLeftRadius: GLASS_KNOB_SIZE,
    borderBottomRightRadius: GLASS_KNOB_SIZE,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },

  /* Bottom labels */
  labelsRow: {
    position: 'relative',
    height: 20,
    marginTop: 6,
  },
  notchLabelText: {
    position: 'absolute',
    color: '#64748B',
    fontSize: IS_TABLET ? 11 : 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  notchLabelActive: {
    color: '#00C2FF',
    fontWeight: '900',
  },
});

export default function SongDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [song, setSong] = useState<Song | null>(null);
  const [bestAccuracy, setBestAccuracy] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'overview' | 'practice'>('overview');

  // Animation values for smooth screen transition
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [, setActiveNoteIndex] = useState(0);
  const [evaluationMap, setEvaluationMap] = useState<EvaluationMap>({});
  const [, setDetectedPitchHz] = useState<number | null>(null);
  const [detectedPitchFrame, setDetectedPitchFrame] = useState<PitchFrame | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(WINDOW_WIDTH - 32);
  const [tempoMultiplier, setTempoMultiplier] = useState(1.0);
  const [loopStartMs] = useState(0);
  const [loopEndMs, setLoopEndMs] = useState(0);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedScripture, setSelectedScripture] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const foundSong = INTERACTIVE_MUSIC_DATABASE.find((candidate) => candidate.id === id) ?? null;
    setSong(foundSong as Song | null);
    if (foundSong) {
      setBestAccuracy(foundSong.bestAccuracy ?? 0);
      setCurrentTimeMs(0);
      setActiveNoteIndex(0);
      setEvaluationMap(buildInitialEvaluationMap(foundSong.targetNotes));
      setLoopEndMs(
        foundSong.targetNotes.reduce((max, note) => {
          return Math.max(max, note.timestampMs + note.durationMs);
        }, 0),
      );
    }
  }, [id]);

  const totalDurationMs = useMemo(() => {
    if (!song) return 0;
    return song.targetNotes.reduce((max, note) => {
      return Math.max(max, note.timestampMs + note.durationMs);
    }, 0);
  }, [song]);

  // Practice engine integration (standard performance mode)
  const practiceEngine = usePracticeEngine(
    song?.targetNotes ?? [],
    evaluationMap,
    currentTimeMs,
    isPlaying,
    {
      mode: 'pitchHero',
      loopStartMs,
      loopEndMs,
      tempoMultiplier,
      pitchToleranceRatio: 0.05,
      autoResumeMissedNotes: false,
    },
  );

  const activeNote = useMemo(() => {
    if (!song || !song.targetNotes.length) return null;

    const nextActiveIndex = song.targetNotes.findIndex((note) => {
      const noteWindowEnd = note.timestampMs + note.durationMs + 200;
      return currentTimeMs >= note.timestampMs && currentTimeMs <= noteWindowEnd;
    });

    if (nextActiveIndex >= 0) {
      return song.targetNotes[nextActiveIndex];
    }

    const fallbackIndex = song.targetNotes.findIndex((note) => currentTimeMs < note.timestampMs);
    const safeIndex = fallbackIndex >= 0 ? fallbackIndex : Math.max(song.targetNotes.length - 1, 0);
    return song.targetNotes[safeIndex];
  }, [currentTimeMs, song]);

  useEffect(() => {
    if (!song) return;
    const nextIndex = song.targetNotes.findIndex((note) => note.id === activeNote?.id);
    if (nextIndex >= 0) {
      setActiveNoteIndex(nextIndex);
    }
  }, [activeNote, song]);

  // Playback animation loop - smoothly scales with tempoMultiplier in real time
  useEffect(() => {
    if (!song || !isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let lastFrameTime = 0;
    const tick = (frameTime: number) => {
      if (lastFrameTime === 0) {
        lastFrameTime = frameTime;
      }
      const deltaMs = (frameTime - lastFrameTime) * tempoMultiplier;
      lastFrameTime = frameTime;

      setCurrentTimeMs((previous) => {
        const candidate = previous + deltaMs;
        if (loopEndMs > 0 && candidate >= loopEndMs) {
          return loopStartMs;
        }
        return candidate >= totalDurationMs ? totalDurationMs : candidate;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, song, totalDurationMs, loopStartMs, loopEndMs, tempoMultiplier]);

  // Auto-mark expired notes during playback
  useEffect(() => {
    if (!song || !isPlaying) return;

    setEvaluationMap((previous) => {
      let hasChanges = false;
      const next = { ...previous };
      for (const note of song.targetNotes) {
        const currentState = previous[note.id] ?? 'pending';
        const noteExpired = currentTimeMs > note.timestampMs + note.durationMs + 150;
        if (currentState === 'pending' && noteExpired) {
          next[note.id] = 'incorrect';
          hasChanges = true;
        }
      }
      return hasChanges ? next : previous;
    });
  }, [currentTimeMs, song, isPlaying]);

  // Check if song reached end
  useEffect(() => {
    if (isPlaying && currentTimeMs >= totalDurationMs && totalDurationMs > 0) {
      setIsPlaying(false);
      setShowPerformanceModal(true);

      const finalAccuracy = practiceEngine.stats.accuracyPercentage;
      if (finalAccuracy > bestAccuracy) {
        setBestAccuracy(finalAccuracy);
      }
    }
  }, [isPlaying, currentTimeMs, totalDurationMs, practiceEngine.stats.accuracyPercentage, bestAccuracy]);

  const handlePitchDetected = useCallback((hz: number, frame?: PitchFrame) => {
    setDetectedPitchHz(hz);
    if (frame) {
      setDetectedPitchFrame(frame);
    }

    if (!song || !activeNote) return;

    const pitchMatches = evaluatePitchMatch(hz, activeNote.frequencyHz);
    setEvaluationMap((previous) => ({
      ...previous,
      [activeNote.id]: pitchMatches ? 'correct' : 'incorrect',
    }));
  }, [song, activeNote]);

  const togglePlayback = async () => {
    if (!song) return;

    if (isPlaying) {
      await audioEngine.pause();
      setIsPlaying(false);
      return;
    }

    const playbackTarget = INTERACTIVE_MUSIC_DATABASE.find((candidate) => candidate.id === song.id);
    if (playbackTarget?.accompAudioKey && playbackTarget?.vocalAudioKey) {
      const accompUri = `http://localhost:8081/assets/audio/${playbackTarget.accompAudioKey}`;
      const vocalUri = `http://localhost:8081/assets/audio/${playbackTarget.vocalAudioKey}`;
      await audioEngine.playTracks(accompUri, vocalUri);
      await audioEngine.setPlaybackRate(tempoMultiplier);
    }

    setIsPlaying(true);
  };

  const handleTempoChange = async (newMultiplier: number) => {
    setTempoMultiplier(newMultiplier);
    await audioEngine.setPlaybackRate(newMultiplier);
  };

  const resetPlayback = async () => {
    await audioEngine.stop();
    setIsPlaying(false);
    setCurrentTimeMs(0);
    setEvaluationMap(buildInitialEvaluationMap(song?.targetNotes ?? []));
    setDetectedPitchHz(null);
    setDetectedPitchFrame(null);
    practiceEngine.resetStats();
  };

  const toggleMicMonitoring = async () => {
    if (!song) return;

    if (isListening) {
      await stopPitchListening();
      setIsListening(false);
      return;
    }

    const started = await startPitchListening(handlePitchDetected);
    setIsListening(started);
  };

  const handlePlaySong = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -15,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setViewMode('practice');
      resetPlayback();

      slideAnim.setValue(15);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        togglePlayback();
      });
    });
  };

  const handleBackToOverview = () => {
    setIsPlaying(false);
    audioEngine.stop();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 15,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setViewMode('overview');
      slideAnim.setValue(-15);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSheetPress = (xRatio: number) => {
    if (totalDurationMs > 0) {
      setCurrentTimeMs(xRatio * totalDurationMs);
    }
  };

  const performanceSummary = practiceEngine.generatePerformanceSummary();

  if (!song) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading song details…</Text>
      </View>
    );
  }

  const status = getAccuracyStatus(bestAccuracy);
  const bookName = song.book || song.sourceBook || 'Hymns Collection';
  const keySig = song.keySignature ?? 'C';
  const timeSig = song.timeSignature ?? '3/4';
  const scriptures = song.scriptureReferences && song.scriptureReferences.length > 0
    ? song.scriptureReferences
    : ['Doctrine & Covenants 25:12'];

  const GAUGE_RADIUS = 34;
  const GAUGE_STROKE = 5.5;
  const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
  const strokeDashoffset = GAUGE_CIRCUMFERENCE - (bestAccuracy / 100) * GAUGE_CIRCUMFERENCE;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: song.title,
          headerShown: false,
        }}
      />

      {/* Top Navigation Bar: Minimalist Back/Close */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            if (viewMode === 'practice') {
              handleBackToOverview();
            } else {
              router.back();
            }
          }}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonIcon}>✕</Text>
          <Text style={styles.closeButtonLabel}>
            {viewMode === 'practice' ? 'Dashboard' : 'Close'}
          </Text>
        </TouchableOpacity>

        <View style={styles.topMetaRight}>
          <Text style={styles.topMetaKey}>Key of {keySig} • {song.tempoBpm} BPM</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {viewMode === 'overview' ? (
          /* ========================================================================= */
          /* FIXED SCREEN-FITTING OVERVIEW (NO SCROLLVIEW, OVERFLOW HIDDEN)            */
          /* ========================================================================= */
          <View style={styles.overviewFixedContainer}>
            {/* Top Content Area */}
            <View style={styles.overviewTopContent}>
              {/* 1. Header & Title Section */}
              <View style={styles.headerSection}>
                <Text style={styles.collectionSubtitle}>
                  HYMN #{song.number}  •  {bookName.toUpperCase()}
                </Text>
                <Text style={styles.songMainTitle} numberOfLines={2}>
                  {song.title}
                </Text>
              </View>

              {/* 2. Stats & Accuracy Meter */}
              <View style={styles.statsOverviewRow}>
                <View style={styles.scoreMeterWrap}>
                  <Svg width={78} height={78} viewBox="0 0 78 78">
                    <Defs>
                      <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#00C2FF" />
                        <Stop offset="100%" stopColor="#FFD700" />
                      </LinearGradient>
                    </Defs>
                    <Circle
                      cx={39}
                      cy={39}
                      r={GAUGE_RADIUS}
                      stroke="#1E293B"
                      strokeWidth={GAUGE_STROKE}
                      fill="none"
                    />
                    <Circle
                      cx={39}
                      cy={39}
                      r={GAUGE_RADIUS}
                      stroke="url(#gaugeGrad)"
                      strokeWidth={GAUGE_STROKE}
                      fill="none"
                      strokeDasharray={GAUGE_CIRCUMFERENCE}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      rotation="-90"
                      origin="39, 39"
                    />
                  </Svg>
                  <View style={styles.scoreNumberOverlay}>
                    <Text style={styles.scorePercentageText}>{bestAccuracy}%</Text>
                  </View>
                </View>

                <View style={styles.scoreTextGroup}>
                  <View style={styles.statusIndicatorRow}>
                    <Text style={styles.statusIcon}>{status.icon}</Text>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  <Text style={styles.metaRowText}>
                    {song.tempoBpm} BPM  •  {timeSig} Time  •  {song.targetNotes.length} Target Notes
                  </Text>
                </View>
              </View>

              {/* 3. Scripture References (Inline Chips) */}
              <View style={styles.scripturesSection}>
                <Text style={styles.sectionLabel}>SCRIPTURE REFERENCES</Text>
                <View style={styles.scriptureChipsWrap}>
                  {scriptures.map((refText, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.scriptureChip}
                      onPress={() => setSelectedScripture(refText)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.scriptureChipIcon}>📖</Text>
                      <Text style={styles.scriptureChipText}>{refText}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 4. Notched Tempo Slider */}
              <NotchedTempoSlider
                value={tempoMultiplier}
                baseBpm={song.tempoBpm}
                onValueChange={handleTempoChange}
              />
            </View>

            {/* Bottom Pinned Primary Action CTA Button ("PLAY SONG") */}
            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlaySong}
                activeOpacity={0.85}
              >
                <Text style={styles.playButtonIcon}>▶</Text>
                <Text style={styles.playButtonText}>PLAY SONG</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ========================================================================= */
          /* FIXED SCREEN-FITTING PERFORMANCE VIEW (GRAND STAFF + CONTROLS)            */
          /* ========================================================================= */
          <View style={styles.practiceFixedContainer}>
            {/* Header / Track Info */}
            <View style={styles.practiceHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.practiceSongTitle} numberOfLines={1}>{song.title}</Text>
                <Text style={styles.practiceSongMeta}>
                  Hymn #{song.number} • {bookName} • Key of {keySig}
                </Text>
              </View>
              <View style={styles.tempoBadge}>
                <Text style={styles.tempoBadgeText}>
                  {Math.round(song.tempoBpm * tempoMultiplier)} BPM
                </Text>
              </View>
            </View>

            {/* Grand Staff Sheet Music Viewport with In-Song Controls */}
            <View
              style={styles.grandStaffContainer}
              onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
            >
              <SvgSheetCanvas
                notes={song.targetNotes}
                activeNoteId={activeNote?.id ?? null}
                width={viewportWidth || WINDOW_WIDTH - 32}
                height={CANVAS_HEIGHT}
                keySignature={keySig}
                timeSignature={timeSig}
                tempoBpm={song.tempoBpm}
                isPlaying={isPlaying}
                tempoMultiplier={tempoMultiplier}
                onTogglePlay={togglePlayback}
                onTempoChange={handleTempoChange}
                highlightColor="#00C2FF"
                hitFeedback={evaluationMap}
                onSheetPress={handleSheetPress}
                showControls={true}
              />
            </View>

            {/* Live Pitch Tuner */}
            {isListening && detectedPitchFrame && activeNote && (
              <PitchTunerBar
                detectedHz={detectedPitchFrame.frequencyHz}
                targetHz={activeNote.frequencyHz}
                centsOff={detectedPitchFrame.centsOff}
                clarity={detectedPitchFrame.clarity}
                targetPitchName={activeNote.pitchName}
                detectedPitchName={detectedPitchFrame.pitchName}
                width={viewportWidth || WINDOW_WIDTH - 32}
                height={TUNER_HEIGHT}
              />
            )}

            {/* Live Stats Row */}
            <View style={styles.liveStatsRow}>
              <View style={styles.liveStatItem}>
                <Text style={styles.liveStatLabel}>Correct</Text>
                <Text style={[styles.liveStatValue, { color: '#10B981' }]}>
                  {practiceEngine.stats.correctCount}/{song.targetNotes.length}
                </Text>
              </View>
              <View style={styles.liveStatItem}>
                <Text style={styles.liveStatLabel}>Accuracy</Text>
                <Text style={[styles.liveStatValue, { color: '#00C2FF' }]}>
                  {practiceEngine.stats.accuracyPercentage}%
                </Text>
              </View>
              <View style={styles.liveStatItem}>
                <Text style={styles.liveStatLabel}>Streak</Text>
                <Text style={[styles.liveStatValue, { color: '#FFD700' }]}>
                  {practiceEngine.stats.longestStreak}
                </Text>
              </View>
              <View style={styles.liveStatItem}>
                <Text style={styles.liveStatLabel}>Deviation</Text>
                <Text style={[styles.liveStatValue, { color: '#A78BFA' }]}>
                  {Math.abs(practiceEngine.stats.averageCentsDeviation).toFixed(1)}¢
                </Text>
              </View>
            </View>

            {/* Bottom Control Bar */}
            <View style={styles.practiceControlStrip}>
              <TouchableOpacity
                style={[styles.practicePrimaryBtn, isPlaying && styles.practicePrimaryBtnActive]}
                onPress={togglePlayback}
              >
                <Text style={styles.practicePrimaryBtnText}>
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.practiceSecondaryBtn} onPress={resetPlayback}>
                <Text style={styles.practiceSecondaryBtnText}>↺ Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.practiceSecondaryBtn, isListening && styles.micBtnActive]}
                onPress={toggleMicMonitoring}
              >
                <Text style={styles.practiceSecondaryBtnText}>
                  {isListening ? '🎙 Mic On' : '🎙 Mic Off'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Scripture Reference Details Modal */}
      <Modal
        visible={!!selectedScripture}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedScripture(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scriptureModalCard}>
            <Text style={styles.scriptureModalIcon}>📖</Text>
            <Text style={styles.scriptureModalTitle}>{selectedScripture}</Text>
            <Text style={styles.scriptureModalSong}>{song.title}</Text>
            <Text style={styles.scriptureModalText}>
              This scriptural reference provides spiritual depth and context to the
              lyrics of Hymn #{song.number} in {bookName}.
            </Text>
            <TouchableOpacity
              style={styles.scriptureModalCloseBtn}
              onPress={() => setSelectedScripture(null)}
            >
              <Text style={styles.scriptureModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Performance Summary Modal */}
      <PerformanceSummaryModal
        visible={showPerformanceModal}
        summary={performanceSummary}
        onRetryLoop={() => {
          setShowPerformanceModal(false);
          resetPlayback();
        }}
        onRestartSong={() => {
          setShowPerformanceModal(false);
          resetPlayback();
        }}
        onBackToCatalog={() => {
          setShowPerformanceModal(false);
          handleBackToOverview();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C14',
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080C14',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  /* Minimalist Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  closeButtonIcon: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
  },
  closeButtonLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  topMetaRight: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 194, 255, 0.08)',
  },
  topMetaKey: {
    color: '#00C2FF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Fixed Screen-Fitting Overview Layout (No ScrollView) */
  overviewFixedContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  overviewTopContent: {
    flex: 1,
    justifyContent: 'space-around',
  },
  headerSection: {
    marginBottom: 12,
  },
  collectionSubtitle: {
    color: '#00C2FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  songMainTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },

  /* Minimalist Stats Row */
  statsOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  scoreMeterWrap: {
    position: 'relative',
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumberOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercentageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  scoreTextGroup: {
    flex: 1,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  statusIcon: {
    fontSize: 13,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '800',
  },
  metaRowText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },

  /* Section Labels */
  sectionLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  /* Scripture References Section */
  scripturesSection: {
    marginVertical: 4,
  },
  scriptureChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scriptureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
  },
  scriptureChipIcon: {
    fontSize: 11,
  },
  scriptureChipText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Tempo Speed Section (placeholder — slider styles are inline in the component) */

  /* Dominant Play Button */
  ctaContainer: {
    paddingTop: 12,
  },
  playButton: {
    backgroundColor: '#00C2FF',
    borderRadius: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonIcon: {
    color: '#080C14',
    fontSize: 15,
    fontWeight: '900',
  },
  playButtonText: {
    color: '#080C14',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  /* Practice Fixed View Styles */
  practiceFixedContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  practiceSongTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  practiceSongMeta: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  tempoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tempoBadgeText: {
    color: '#00C2FF',
    fontSize: 10,
    fontWeight: '800',
  },
  grandStaffContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  liveStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 6,
  },
  liveStatItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  liveStatLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  liveStatValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  practiceControlStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  practicePrimaryBtn: {
    flex: 1.2,
    backgroundColor: '#00C2FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  practicePrimaryBtnActive: {
    backgroundColor: '#FF9800',
  },
  practicePrimaryBtnText: {
    color: '#080C14',
    fontWeight: '900',
    fontSize: 13,
  },
  practiceSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  practiceSecondaryBtnText: {
    color: '#E2E8F0',
    fontWeight: '800',
    fontSize: 12,
  },
  micBtnActive: {
    backgroundColor: '#064E3B',
  },

  /* Scripture Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scriptureModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  scriptureModalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  scriptureModalTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  scriptureModalSong: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
    textAlign: 'center',
  },
  scriptureModalText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  scriptureModalCloseBtn: {
    backgroundColor: '#00C2FF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  scriptureModalCloseText: {
    color: '#080C14',
    fontSize: 14,
    fontWeight: '800',
  },
});
