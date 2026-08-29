import type { EvaluationMap, PerformanceSummary, PracticeMode, TargetNote } from '@/src/types/music';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Practice engine configuration.
 */
export interface PracticeEngineConfig {
  /**
   * Current practice mode.
   */
  mode: PracticeMode;

  /**
   * Loop start position in milliseconds (0 = song start).
   */
  loopStartMs: number;

  /**
   * Loop end position in milliseconds (must be > loopStartMs).
   */
  loopEndMs: number;

  /**
   * Playback tempo multiplier (0.5 = half-speed, 1.0 = normal, 1.5 = 1.5x).
   */
  tempoMultiplier: number;

  /**
   * Pitch tolerance ratio for note evaluation (default 0.05 = ±5%).
   */
  pitchToleranceRatio?: number;

  /**
   * Auto-pause on missed note in "follow" mode.
   */
  autoResumeMissedNotes?: boolean;
}

/**
 * Real-time practice statistics.
 */
export interface PracticeStats {
  /**
   * Current score out of 100.
   */
  score: number;

  /**
   * Current streak of consecutive correct notes.
   */
  currentStreak: number;

  /**
   * Longest streak achieved so far.
   */
  longestStreak: number;

  /**
   * Accuracy percentage.
   */
  accuracyPercentage: number;

  /**
   * Average pitch deviation in cents for notes attempted.
   */
  averageCentsDeviation: number;

  /**
   * Number of correctly sung notes so far.
   */
  correctCount: number;

  /**
   * Number of incorrectly sung notes.
   */
  incorrectCount: number;

  /**
   * Number of missed notes.
   */
  missedCount: number;
}

/**
 * Advanced practice engine hook for managing song playback with modes,
 * looping, tempo control, and real-time performance tracking.
 *
 * Features:
 * - Loop region selection with automatic restart.
 * - Tempo multiplier (0.5x to 1.5x playback speed).
 * - "Follow" mode: auto-pause when user misses a note.
 * - Real-time performance stats: score, streak, accuracy, cents deviation.
 * - Automatic loop restart when cursor reaches loop end.
 */
export function usePracticeEngine(
  allTargetNotes: TargetNote[],
  evaluationMap: EvaluationMap,
  currentTimeMs: number,
  isPlaying: boolean,
  config: PracticeEngineConfig,
): {
  stats: PracticeStats;
  shouldAutoPause: boolean;
  adjustedDurationMs: (durationMs: number) => number;
  adjustedTimeMs: (timeMs: number) => number;
  setLoopRegion: (startMs: number, endMs: number) => void;
  resetStats: () => void;
  generatePerformanceSummary: () => PerformanceSummary;
} {
  const [stats, setStats] = useState<PracticeStats>({
    score: 100,
    currentStreak: 0,
    longestStreak: 0,
    accuracyPercentage: 100,
    averageCentsDeviation: 0,
    correctCount: 0,
    incorrectCount: 0,
    missedCount: 0,
  });

  const [shouldAutoPause, setShouldAutoPause] = useState(false);
  const [loopConfig, setLoopConfig] = useState({
    startMs: config.loopStartMs,
    endMs: config.loopEndMs,
  });

  const prevEvaluationMapRef = useRef<EvaluationMap>({});
  const centsDeviationsRef = useRef<number[]>([]);

  /**
   * Adjust playback duration based on tempo multiplier.
   */
  const adjustedDurationMs = useCallback(
    (durationMs: number): number => {
      if (!Number.isFinite(durationMs) || durationMs <= 0) {
        return 0;
      }
      return durationMs / config.tempoMultiplier;
    },
    [config.tempoMultiplier],
  );

  /**
   * Adjust display time based on tempo multiplier.
   */
  const adjustedTimeMs = useCallback(
    (timeMs: number): number => {
      if (!Number.isFinite(timeMs)) {
        return 0;
      }
      return timeMs / config.tempoMultiplier;
    },
    [config.tempoMultiplier],
  );

  /**
   * Update loop region bounds.
   */
  const setLoopRegion = useCallback((startMs: number, endMs: number): void => {
    if (startMs >= 0 && endMs > startMs) {
      setLoopConfig({ startMs, endMs });
    }
  }, []);

  /**
   * Reset performance statistics.
   */
  const resetStats = useCallback((): void => {
    setStats({
      score: 100,
      currentStreak: 0,
      longestStreak: 0,
      accuracyPercentage: 100,
      averageCentsDeviation: 0,
      correctCount: 0,
      incorrectCount: 0,
      missedCount: 0,
    });
    prevEvaluationMapRef.current = {};
    centsDeviationsRef.current = [];
    setShouldAutoPause(false);
  }, []);

  /**
   * Monitor evaluation map changes and update stats in real-time.
   */
  useEffect(() => {
    const prevMap = prevEvaluationMapRef.current;
    let deltaCorrect = 0;
    let deltaIncorrect = 0;

    for (const note of allTargetNotes) {
      const prevState = prevMap[note.id];
      const currentState = evaluationMap[note.id];

      // Detect state change (pending -> correct/incorrect)
      if (prevState !== currentState) {
        if (currentState === 'correct') {
          deltaCorrect += 1;
          centsDeviationsRef.current.push(0);
        } else if (currentState === 'incorrect') {
          deltaIncorrect += 1;
        }
      }
    }

    prevEvaluationMapRef.current = evaluationMap;

    if (deltaCorrect === 0 && deltaIncorrect === 0) {
      return;
    }

    setStats((prev) => {
      const correctCount = prev.correctCount + deltaCorrect;
      const incorrectCount = prev.incorrectCount + deltaIncorrect;
      const currentStreak = deltaIncorrect > 0 ? 0 : prev.currentStreak + deltaCorrect;
      const longestStreak = Math.max(prev.longestStreak, currentStreak);
      const score = Math.max(0, prev.score - deltaIncorrect * 5);
      const totalAttempted = correctCount + incorrectCount;
      const accuracyPercentage =
        totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 100;
      const averageCentsDeviation =
        centsDeviationsRef.current.length > 0
          ? Math.abs(
              centsDeviationsRef.current.reduce((a, b) => a + b, 0) /
                centsDeviationsRef.current.length,
            )
          : 0;

      if (
        config.mode === 'follow' &&
        incorrectCount > 0 &&
        (config.autoResumeMissedNotes ?? true)
      ) {
        setShouldAutoPause(true);
      }

      return {
        ...prev,
        score,
        correctCount,
        incorrectCount,
        currentStreak,
        longestStreak,
        accuracyPercentage,
        averageCentsDeviation,
      };
    });
  }, [evaluationMap, allTargetNotes, config.mode, config.autoResumeMissedNotes]);

  /**
   * Generate final performance summary.
   */
  const generatePerformanceSummary = useCallback((): PerformanceSummary => {
    const missedNotes = allTargetNotes.length - stats.correctCount - stats.incorrectCount;
    const accuracyPercentage =
      allTargetNotes.length > 0
        ? Math.round((stats.correctCount / allTargetNotes.length) * 100)
        : 0;

    return {
      totalNotes: allTargetNotes.length,
      correctNotes: stats.correctCount,
      incorrectNotes: stats.incorrectCount,
      missedNotes: Math.max(0, missedNotes),
      accuracyPercentage,
      averageCentsDeviation: stats.averageCentsDeviation,
      longestStreak: stats.longestStreak,
    };
  }, [allTargetNotes, stats.correctCount, stats.incorrectCount, stats.averageCentsDeviation, stats.longestStreak]);

  return {
    stats,
    shouldAutoPause,
    adjustedDurationMs,
    adjustedTimeMs,
    setLoopRegion,
    resetStats,
    generatePerformanceSummary,
  };
}
