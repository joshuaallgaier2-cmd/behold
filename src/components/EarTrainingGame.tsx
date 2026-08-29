// src/components/EarTrainingGame.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

type IntervalName = 'Unison' | 'Minor 3rd' | 'Perfect 5th' | 'Octave';
type Level = 'Beginner' | 'Intermediate' | 'Advanced';

interface IntervalDefinition {
  name: IntervalName;
  semitones: number;
}

interface Question {
  rootNote: string; // e.g. "C4"
  rootFreq: number;
  interval: IntervalDefinition;
  targetNote: string; // e.g. "G4"
  targetFreq: number;
}

interface PitchDetectionResult {
  frequency: number; // Hz, 0 or -1 if silent/undetected
  confidence: number; // 0..1
}

// ─────────────────────────────────────────────────────────────────────────
// Pitch / synth service layer
// Replace these stubs with real bindings to your native pitch detector
// and guide-tone synth modules.
// ─────────────────────────────────────────────────────────────────────────

const pitchService = {
  /** Plays a short reference tone at the given frequency (Hz). */
  async playGuideTone(frequency: number, durationMs: number = 900): Promise<void> {
    // e.g. bridge to expo-audio / react-native-sound oscillator synth
    console.log(`[guideSynth] playing ${frequency.toFixed(2)}Hz for ${durationMs}ms`);
    return new Promise((resolve) => setTimeout(resolve, durationMs));
  },

  /** Starts streaming mic pitch detection; returns an unsubscribe fn. */
  startListening(onResult: (result: PitchDetectionResult) => void): () => void {
    // e.g. bridge to a native pitch-detection module's event emitter.
    // Stub: emits a slowly-drifting fake pitch for demonstration/testing.
    let cancelled = false;
    let base = 220;
    const interval = setInterval(() => {
      if (cancelled) return;
      base += (Math.random() - 0.5) * 4;
      onResult({ frequency: base, confidence: 0.85 + Math.random() * 0.15 });
    }, 100);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Music theory helpers
// ─────────────────────────────────────────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4_FREQ = 440;
const A4_MIDI = 69;

/** Converts a MIDI note number to frequency in Hz. */
function midiToFreq(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

/** Converts a MIDI note number to a display name like "G4". */
function midiToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  return `${name}${octave}`;
}

/** Returns the signed cents difference between two frequencies. */
function centsDifference(freq: number, targetFreq: number): number {
  return 1200 * Math.log2(freq / targetFreq);
}

const INTERVALS_BY_LEVEL: Record<Level, IntervalDefinition[]> = {
  Beginner: [
    { name: 'Unison', semitones: 0 },
    { name: 'Octave', semitones: 12 },
  ],
  Intermediate: [
    { name: 'Unison', semitones: 0 },
    { name: 'Minor 3rd', semitones: 3 },
    { name: 'Octave', semitones: 12 },
  ],
  Advanced: [
    { name: 'Unison', semitones: 0 },
    { name: 'Minor 3rd', semitones: 3 },
    { name: 'Perfect 5th', semitones: 7 },
    { name: 'Octave', semitones: 12 },
  ],
};

// Root notes range: C4 (60) through B4 (71) — mid-range, singable by most voices.
const ROOT_MIDI_MIN = 60;
const ROOT_MIDI_MAX = 71;

function generateQuestion(level: Level): Question {
  const pool = INTERVALS_BY_LEVEL[level];
  const interval = pool[Math.floor(Math.random() * pool.length)];
  const rootMidi = ROOT_MIDI_MIN + Math.floor(Math.random() * (ROOT_MIDI_MAX - ROOT_MIDI_MIN + 1));
  const targetMidi = rootMidi + interval.semitones;

  return {
    rootNote: midiToName(rootMidi),
    rootFreq: midiToFreq(rootMidi),
    interval,
    targetNote: midiToName(targetMidi),
    targetFreq: midiToFreq(targetMidi),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

const CENTS_TOLERANCE = 25;
const HOLD_DURATION_MS = 1500;
const QUESTION_TIME_LIMIT_S = 20;
const MAX_STREAK_MULTIPLIER = 5;
const GAUGE_MAX_CENTS = 60; // needle clamps at ±60 cents

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────

const EarTrainingGame: React.FC = () => {
  const [level, setLevel] = useState<Level>('Beginner');
  const [question, setQuestion] = useState<Question>(() => generateQuestion('Beginner'));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT_S);
  const [isListening, setIsListening] = useState(false);
  const [liveCents, setLiveCents] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'timeout'>('idle');
  const [isPlayingGuide, setIsPlayingGuide] = useState(false);

  const needleAnim = useRef(new Animated.Value(0)).current;
  const holdStartRef = useRef<number | null>(null);
  const holdProgressRef = useRef(0); // 0..1, drives a small progress ring
  const [holdProgress, setHoldProgress] = useState(0);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const answeredRef = useRef(false);

  const streakMultiplier = Math.min(1 + Math.floor(streak / 3), MAX_STREAK_MULTIPLIER);

  // ── Question lifecycle ──────────────────────────────────────────────

  const startNewQuestion = useCallback(
    (forLevel: Level = level) => {
      answeredRef.current = false;
      holdStartRef.current = null;
      holdProgressRef.current = 0;
      setHoldProgress(0);
      setLiveCents(null);
      setFeedback('idle');
      setTimeLeft(QUESTION_TIME_LIMIT_S);
      setQuestion(generateQuestion(forLevel));
      needleAnim.setValue(0);
    },
    [level, needleAnim]
  );

  const handleLevelChange = (newLevel: Level) => {
    setLevel(newLevel);
    stopListening();
    startNewQuestion(newLevel);
  };

  // ── Guide tone playback ─────────────────────────────────────────────

  const playGuide = useCallback(async () => {
    setIsPlayingGuide(true);
    await pitchService.playGuideTone(question.rootFreq);
    setIsPlayingGuide(false);
  }, [question.rootFreq]);

  useEffect(() => {
    playGuide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  // ── Countdown timer ─────────────────────────────────────────────────

  useEffect(() => {
    if (feedback !== 'idle') return;
    if (timeLeft <= 0) {
      setFeedback('timeout');
      setStreak(0);
      stopListening();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, feedback]);

  // ── Live pitch evaluation loop ───────────────────────────────────────

  const handlePitchResult = useCallback(
    (result: PitchDetectionResult) => {
      if (answeredRef.current) return;
      if (result.frequency <= 0 || result.confidence < 0.5) {
        holdStartRef.current = null;
        holdProgressRef.current = 0;
        setHoldProgress(0);
        setLiveCents(null);
        return;
      }

      const cents = centsDifference(result.frequency, question.targetFreq);
      setLiveCents(cents);

      // Animate needle: clamp to gauge range and normalize to -1..1
      const clamped = Math.max(-GAUGE_MAX_CENTS, Math.min(GAUGE_MAX_CENTS, cents));
      Animated.timing(needleAnim, {
        toValue: clamped / GAUGE_MAX_CENTS,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      const inTolerance = Math.abs(cents) <= CENTS_TOLERANCE;

      if (inTolerance) {
        if (holdStartRef.current === null) {
          holdStartRef.current = Date.now();
        }
        const elapsed = Date.now() - holdStartRef.current;
        const progress = Math.min(1, elapsed / HOLD_DURATION_MS);
        holdProgressRef.current = progress;
        setHoldProgress(progress);

        if (elapsed >= HOLD_DURATION_MS) {
          answeredRef.current = true;
          const basePoints = 100;
          const timeBonus = Math.round((timeLeft / QUESTION_TIME_LIMIT_S) * 50);
          const points = (basePoints + timeBonus) * streakMultiplier;

          setScore((s) => s + points);
          setStreak((s) => s + 1);
          setFeedback('correct');
          stopListening();
        }
      } else {
        holdStartRef.current = null;
        holdProgressRef.current = 0;
        setHoldProgress(0);
      }
    },
    [question.targetFreq, needleAnim, timeLeft, streakMultiplier]
  );

  const startListening = useCallback(() => {
    if (unsubscribeRef.current) return;
    setIsListening(true);
    unsubscribeRef.current = pitchService.startListening(handlePitchResult);
  }, [handlePitchResult]);

  const stopListening = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived UI values ────────────────────────────────────────────────

  const needleRotation = needleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-60deg', '60deg'],
  });

  const gaugeColor = useMemo(() => {
    if (liveCents === null) return '#8a8a8a';
    return Math.abs(liveCents) <= CENTS_TOLERANCE ? '#33cc66' : '#e0523d';
  }, [liveCents]);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Level tabs */}
      <View style={styles.tabRow}>
        {(['Beginner', 'Intermediate', 'Advanced'] as Level[]).map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[styles.tab, level === lvl && styles.tabActive]}
            onPress={() => handleLevelChange(lvl)}
          >
            <Text style={[styles.tabText, level === lvl && styles.tabTextActive]}>{lvl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Score / streak / timer */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Streak</Text>
          <Text style={styles.statValue}>
            {streak} <Text style={styles.multiplierText}>x{streakMultiplier}</Text>
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={[styles.statValue, timeLeft <= 5 && styles.statValueDanger]}>
            {timeLeft}s
          </Text>
        </View>
      </View>

      {/* Prompt */}
      <View style={styles.promptCard}>
        <Text style={styles.promptText}>
          Sing a {question.interval.name} above {question.rootNote}
        </Text>
        <Text style={styles.promptTarget}>Target: {question.targetNote}</Text>

        <TouchableOpacity
          style={styles.guideButton}
          onPress={playGuide}
          disabled={isPlayingGuide}
        >
          <Text style={styles.guideButtonText}>
            {isPlayingGuide ? 'Playing…' : '🔊 Replay Root Note'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pitch gauge */}
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeArc}>
          <Animated.View
            style={[
              styles.needle,
              { backgroundColor: gaugeColor, transform: [{ rotate: needleRotation }] },
            ]}
          />
          <View style={styles.gaugeCenterDot} />
        </View>
        <Text style={styles.centsLabel}>
          {liveCents === null ? '— cents' : `${liveCents > 0 ? '+' : ''}${liveCents.toFixed(0)} cents`}
        </Text>

        {/* Hold progress bar */}
        <View style={styles.holdTrack}>
          <View style={[styles.holdFill, { width: `${holdProgress * 100}%` }]} />
        </View>
        <Text style={styles.holdLabel}>Hold pitch steady to lock in</Text>
      </View>

      {/* Feedback banner */}
      {feedback === 'correct' && (
        <View style={[styles.banner, styles.bannerSuccess]}>
          <Text style={styles.bannerText}>🎯 Nice! Pitch locked in.</Text>
        </View>
      )}
      {feedback === 'timeout' && (
        <View style={[styles.banner, styles.bannerFail]}>
          <Text style={styles.bannerText}>⏱ Time's up — streak reset.</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={isListening ? stopListening : startListening}
          disabled={feedback !== 'idle'}
        >
          <Text style={styles.micButtonText}>
            {isListening ? '🎤 Listening…' : '🎤 Start Singing'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            stopListening();
            startNewQuestion();
          }}
        >
          <Text style={styles.nextButtonText}>Next Question →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1115',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1d24',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3d6dff',
  },
  tabText: {
    color: '#8a8f9a',
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1d24',
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: '#8a8f9a',
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  statValueDanger: {
    color: '#e0523d',
  },
  multiplierText: {
    fontSize: 14,
    color: '#ffcc4d',
  },
  promptCard: {
    backgroundColor: '#1a1d24',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  promptText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  promptTarget: {
    color: '#3d6dff',
    fontSize: 15,
    marginTop: 6,
    fontWeight: '600',
  },
  guideButton: {
    marginTop: 14,
    backgroundColor: '#262b35',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  guideButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  gaugeArc: {
    width: 160,
    height: 90,
    borderTopLeftRadius: 160,
    borderTopRightRadius: 160,
    backgroundColor: '#1a1d24',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  needle: {
    width: 4,
    height: 70,
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  gaugeCenterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8a8f9a',
    position: 'absolute',
    bottom: -5,
  },
  centsLabel: {
    color: '#c7ccd6',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  holdTrack: {
    width: '80%',
    height: 8,
    backgroundColor: '#262b35',
    borderRadius: 4,
    overflow: 'hidden',
  },
  holdFill: {
    height: '100%',
    backgroundColor: '#33cc66',
  },
  holdLabel: {
    color: '#8a8f9a',
    fontSize: 11,
    marginTop: 6,
  },
  banner: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerSuccess: {
    backgroundColor: '#1e3a2c',
  },
  bannerFail: {
    backgroundColor: '#3a1e1e',
  },
  bannerText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    marginTop: 'auto',
    marginBottom: 20,
  },
  micButton: {
    flex: 1,
    backgroundColor: '#3d6dff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  micButtonActive: {
    backgroundColor: '#e0523d',
  },
  micButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#262b35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default EarTrainingGame;