import NoteSheetOverlay from '@/src/components/NoteSheetOverlay';
import PerformanceSummaryModal from '@/src/components/PerformanceSummaryModal';
import PitchTunerBar from '@/src/components/PitchTunerBar';
import PlaybackCursorBar from '@/src/components/PlaybackCursorBar';
import { INTERACTIVE_MUSIC_DATABASE } from '@/src/data/musicData';
import { usePracticeEngine } from '@/src/hooks/usePracticeEngine';
import { audioEngine } from '@/src/services/audioEngine';
import { evaluatePitchMatch, PitchFrame, startPitchListening, stopPitchListening } from '@/src/services/pitchDetector';
import type { EvaluationMap, PracticeMode, Song, TargetNote } from '@/src/types/music';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const SHEET_HEIGHT = 260;
const SHEET_PADDING = 24;
const TUNER_HEIGHT = 80;

const buildInitialEvaluationMap = (notes: TargetNote[]): EvaluationMap =>
  Object.fromEntries(notes.map((note) => [note.id, 'pending'])) as EvaluationMap;

export default function SongDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [song, setSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [evaluationMap, setEvaluationMap] = useState<EvaluationMap>({});
  const [detectedPitchHz, setDetectedPitchHz] = useState<number | null>(null);
  const [detectedPitchFrame, setDetectedPitchFrame] = useState<PitchFrame | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(WINDOW_WIDTH - SHEET_PADDING * 2);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('listen');
  const [tempoMultiplier, setTempoMultiplier] = useState(1.0);
  const [loopStartMs, setLoopStartMs] = useState(0);
  const [loopEndMs, setLoopEndMs] = useState(0);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const foundSong = INTERACTIVE_MUSIC_DATABASE.find((candidate) => candidate.id === id) ?? null;
    setSong(foundSong as Song | null);
    if (foundSong) {
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
    if (!song) {
      return 0;
    }

    return song.targetNotes.reduce((max, note) => {
      return Math.max(max, note.timestampMs + note.durationMs);
    }, 0);
  }, [song]);

  // Practice engine integration
  const practiceEngine = usePracticeEngine(
    song?.targetNotes ?? [],
    evaluationMap,
    currentTimeMs,
    isPlaying,
    {
      mode: practiceMode,
      loopStartMs,
      loopEndMs,
      tempoMultiplier,
      pitchToleranceRatio: 0.05,
      autoResumeMissedNotes: true,
    },
  );

  const activeNote = useMemo(() => {
    if (!song || !song.targetNotes.length) {
      return null;
    }

    const nextActiveIndex = song.targetNotes.findIndex((note, index) => {
      const noteWindowEnd = note.timestampMs + note.durationMs + 200;
      const isCurrent = currentTimeMs >= note.timestampMs && currentTimeMs <= noteWindowEnd;
      if (isCurrent) {
        setActiveNoteIndex(index);
      }
      return isCurrent;
    });

    if (nextActiveIndex >= 0) {
      return song.targetNotes[nextActiveIndex];
    }

    const fallbackIndex = song.targetNotes.findIndex((note) => currentTimeMs < note.timestampMs);
    const safeIndex = fallbackIndex >= 0 ? fallbackIndex : Math.max(song.targetNotes.length - 1, 0);
    return song.targetNotes[safeIndex];
  }, [currentTimeMs, song]);

  useEffect(() => {
    if (!song) {
      return;
    }

    const nextIndex = song.targetNotes.findIndex((note) => note.id === activeNote?.id);
    if (nextIndex >= 0) {
      setActiveNoteIndex(nextIndex);
    }
  }, [activeNote, song]);

  // Auto-pause in follow mode if user misses note
  useEffect(() => {
    if (practiceEngine.shouldAutoPause && isPlaying && practiceMode === 'follow') {
      setIsPlaying(false);
    }
  }, [practiceEngine.shouldAutoPause, isPlaying, practiceMode]);

  // Playback animation loop
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
      const deltaMs = frameTime - lastFrameTime;
      lastFrameTime = frameTime;

      setCurrentTimeMs((previous) => {
        const candidate = previous + deltaMs;

        // Check if we've reached the end of the loop
        if (loopEndMs > 0 && candidate >= loopEndMs) {
          // Loop back to start
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
  }, [isPlaying, song, totalDurationMs, loopStartMs, loopEndMs]);

  // Auto-mark missed notes
  useEffect(() => {
    if (!song) {
      return;
    }

    setEvaluationMap((previous) => {
      const next = { ...previous };
      for (const note of song.targetNotes) {
        const currentState = previous[note.id] ?? 'pending';
        const noteExpired = currentTimeMs > note.timestampMs + note.durationMs + 150;
        if (currentState === 'pending' && noteExpired) {
          next[note.id] = 'incorrect';
        }
      }
      return next;
    });
  }, [currentTimeMs, song]);

  // Check if song finished
  useEffect(() => {
    if (isPlaying && currentTimeMs >= totalDurationMs && totalDurationMs > 0) {
      setIsPlaying(false);
      setShowPerformanceModal(true);
    }
  }, [isPlaying, currentTimeMs, totalDurationMs]);

  const handlePitchDetected = (hz: number, frame?: PitchFrame) => {
    setDetectedPitchHz(hz);
    if (frame) {
      setDetectedPitchFrame(frame);
    }

    if (!song || !activeNote) {
      return;
    }

    const pitchMatches = evaluatePitchMatch(hz, activeNote.frequencyHz);
    setEvaluationMap((previous) => ({
      ...previous,
      [activeNote.id]: pitchMatches ? 'correct' : 'incorrect',
    }));
  };

  const togglePlayback = async () => {
    if (!song) {
      return;
    }

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
    }

    setIsPlaying(true);
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
    if (!song) {
      return;
    }

    if (isListening) {
      await stopPitchListening();
      setIsListening(false);
      return;
    }

    const started = await startPitchListening(handlePitchDetected);
    setIsListening(started);
  };

  const handleSheetTap = (timestampMs: number) => {
    setCurrentTimeMs(timestampMs);
  };

  const performanceSummary = practiceEngine.generatePerformanceSummary();

  if (!song) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading song details…</Text>
      </View>
    );
  }

  const categoryStyle =
    song.category === 'hymn'
      ? styles.categoryBadgeHymn
      : song.category === 'children'
        ? styles.categoryBadgeChildren
        : styles.categoryBadgeYouth;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: song.title,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#101418' },
          headerTintColor: '#FFFFFF',
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.songTitle}>{song.title}</Text>
            <Text style={styles.songMeta}>Hymn {song.number}</Text>
          </View>

          <View style={[styles.categoryBadge, categoryStyle]}>
            <Text style={styles.categoryBadgeText}>{song.category}</Text>
          </View>
        </View>

        {/* Practice Mode Switcher */}
        <View style={styles.modeSwitcher}>
          <Text style={styles.modeSwitcherLabel}>Practice Mode</Text>
          <View style={styles.modeButtonRow}>
            {(['listen', 'follow', 'pitchHero', 'assessment'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  practiceMode === mode && styles.modeButtonActive,
                ]}
                onPress={() => setPracticeMode(mode)}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    practiceMode === mode && styles.modeButtonTextActive,
                  ]}
                >
                  {mode === 'listen' ? 'Listen' : mode === 'follow' ? 'Follow' : mode === 'pitchHero' ? 'Pitch Hero' : 'Assessment'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tempo Control */}
        <View style={styles.tempoControl}>
          <Text style={styles.tempoControlLabel}>Tempo</Text>
          <View style={styles.tempoButtonRow}>
            {[0.5, 0.75, 1.0, 1.25].map((tempo) => (
              <TouchableOpacity
                key={tempo}
                style={[
                  styles.tempoButton,
                  tempoMultiplier === tempo && styles.tempoButtonActive,
                ]}
                onPress={() => setTempoMultiplier(tempo)}
              >
                <Text
                  style={[
                    styles.tempoButtonText,
                    tempoMultiplier === tempo && styles.tempoButtonTextActive,
                  ]}
                >
                  {tempo === 1.0 ? 'Normal' : `${(tempo * 100).toFixed(0)}%`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sheet Music Viewport */}
        <View style={styles.viewportWrapper} onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}>
          <View style={styles.sheetBackground}>
            {[...Array(5)].map((_, index) => (
              <View key={index} style={[styles.staffLine, { top: 32 + index * 42 }]} />
            ))}
          </View>

          <NoteSheetOverlay
            notes={song.targetNotes}
            activeNoteId={activeNote?.id ?? null}
            evaluationMap={evaluationMap}
            containerWidth={viewportWidth || WINDOW_WIDTH - SHEET_PADDING * 2}
            containerHeight={SHEET_HEIGHT}
            onSheetTap={handleSheetTap}
            totalDurationMs={totalDurationMs}
          />

          <PlaybackCursorBar
            isPlaying={isPlaying}
            currentTimeMs={currentTimeMs}
            totalDurationMs={totalDurationMs}
            containerWidth={viewportWidth || WINDOW_WIDTH - SHEET_PADDING * 2}
            containerHeight={SHEET_HEIGHT}
            loopStartMs={loopStartMs}
            loopEndMs={loopEndMs}
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
            width={viewportWidth || WINDOW_WIDTH - SHEET_PADDING * 2}
            height={TUNER_HEIGHT}
          />
        )}

        {/* Performance Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Correct</Text>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {practiceEngine.stats.correctCount}/{song.targetNotes.length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={[styles.statValue, { color: '#2196F3' }]}>
              {practiceEngine.stats.accuracyPercentage}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={[styles.statValue, { color: '#FFC107' }]}>
              {practiceEngine.stats.longestStreak}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pitch Acc.</Text>
            <Text style={[styles.statValue, { color: '#9C27B0' }]}>
              {Math.abs(practiceEngine.stats.averageCentsDeviation).toFixed(1)}¢
            </Text>
          </View>
        </View>

        {/* Control Bar */}
        <View style={styles.controlBar}>
          <TouchableOpacity style={styles.primaryButton} onPress={togglePlayback}>
            <Text style={styles.primaryButtonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={resetPlayback}>
            <Text style={styles.secondaryButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isListening && styles.micButtonActive]}
            onPress={toggleMicMonitoring}
          >
            <Text style={styles.secondaryButtonText}>{isListening ? 'Mic On' : 'Mic Off'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1220',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#18232F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  songTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  songMeta: {
    color: '#9FB1C3',
    fontSize: 13,
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryBadgeText: {
    color: '#0B1220',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  categoryBadgeHymn: { backgroundColor: '#FFD166' },
  categoryBadgeChildren: { backgroundColor: '#7DD3FC' },
  categoryBadgeYouth: { backgroundColor: '#A78BFA' },

  // Mode Switcher
  modeSwitcher: {
    marginBottom: 16,
  },
  modeSwitcherLabel: {
    color: '#8EA4B9',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeButtonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#18232F',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#00E5FF',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8EA4B9',
  },
  modeButtonTextActive: {
    color: '#FFF',
  },

  // Tempo Control
  tempoControl: {
    marginBottom: 16,
  },
  tempoControlLabel: {
    color: '#8EA4B9',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tempoButtonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tempoButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#18232F',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  tempoButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#A5F5B0',
  },
  tempoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8EA4B9',
  },
  tempoButtonTextActive: {
    color: '#FFF',
  },

  // Sheet viewport
  viewportWrapper: {
    width: '100%',
    height: SHEET_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#223044',
    position: 'relative',
    marginBottom: 16,
  },
  sheetBackground: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#10151E',
  },
  staffLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3A4D63',
    opacity: 0.8,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#131E29',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#213042',
    alignItems: 'center',
  },
  statLabel: {
    color: '#8EA4B9',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Control Bar
  controlBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#00C2FF',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#05151C',
    fontWeight: '900',
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1B2A38',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#F3F8FF',
    fontWeight: '800',
    fontSize: 14,
  },
  micButtonActive: {
    backgroundColor: '#154E47',
  },
  // Scroll view styles
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
  },
});
