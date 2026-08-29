import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { getGrandStaffHymn, GRAND_STAFF_HYMNS } from '../data/hymnData';
import { AudioPlaybackState, grandStaffAudio } from '../services/grandStaffAudio';
import type { ClefNote, GrandStaffHymn } from '../types/music';
import GrandStaffViewer from './GrandStaffViewer';

export interface HymnViewerModalProps {
  hymnIdOrNumber: string | number | null;
  isOpen: boolean;
  onClose: () => void;
}

const TEMPO_SPEEDS = [
  { label: '0.75×', value: 0.75 },
  { label: '1.0×', value: 1.0 },
  { label: '1.25×', value: 1.25 },
  { label: '1.5×', value: 1.5 },
];

export default function HymnViewerModal({
  hymnIdOrNumber,
  isOpen,
  onClose,
}: HymnViewerModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);

  // Retrieve current hymn data
  const hymn: GrandStaffHymn | undefined = useMemo(() => {
    if (!hymnIdOrNumber) return undefined;
    return getGrandStaffHymn(hymnIdOrNumber) ?? GRAND_STAFF_HYMNS[0];
  }, [hymnIdOrNumber]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [tempoMultiplier, setTempoMultiplier] = useState(1.0);
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>({
    isPlaying: false,
    currentMeasure: 0,
    currentBeat: 1,
    totalMeasures: hymn?.totalMeasures ?? 8,
    currentTimeMs: 0,
    totalDurationMs: 0,
    progressPercent: 0,
    activeTrebleNoteIds: [],
    activeBassNoteIds: [],
    activeLyricIndex: -1,
  });

  // Keep playback stopped and reset when hymn changes or modal closes
  useEffect(() => {
    if (!isOpen) {
      grandStaffAudio.stop();
      setIsPlaying(false);
      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: false,
        currentMeasure: 0,
        currentBeat: 1,
        activeTrebleNoteIds: [],
        activeBassNoteIds: [],
        activeLyricIndex: -1,
      }));
    }
  }, [isOpen, hymnIdOrNumber]);

  // Audio tick handler
  const handleTick = useCallback((state: AudioPlaybackState) => {
    setPlaybackState(state);
    setIsPlaying(state.isPlaying);

    // Auto-scroll horizontal sheet music to follow playhead
    if (scrollRef.current && state.currentMeasure > 0) {
      const measureWidth = 220;
      const targetX = Math.max(0, 75 + (state.currentMeasure - 1) * measureWidth);
      scrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  }, []);

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Play / Pause / Reset handlers
  const handleTogglePlay = useCallback(() => {
    if (!hymn) return;

    if (isPlaying) {
      grandStaffAudio.pause();
      setIsPlaying(false);
    } else {
      if (playbackState.currentTimeMs > 0 && playbackState.currentTimeMs < playbackState.totalDurationMs) {
        grandStaffAudio.resume();
      } else {
        grandStaffAudio.start(
          hymn,
          tempoMultiplier,
          playbackState.currentMeasure,
          handleTick,
          handleComplete,
        );
      }
      setIsPlaying(true);
    }
  }, [hymn, isPlaying, tempoMultiplier, playbackState, handleTick, handleComplete]);

  const handleReset = useCallback(() => {
    grandStaffAudio.stop();
    setIsPlaying(false);
    if (hymn) {
      grandStaffAudio.seekToMeasure(0);
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: 0, animated: true });
    }
  }, [hymn]);

  const handleMeasurePress = useCallback(
    (measureIdx: number) => {
      grandStaffAudio.seekToMeasure(measureIdx);
      if (scrollRef.current) {
        const measureWidth = 220;
        const targetX = Math.max(0, 75 + (measureIdx - 1) * measureWidth);
        scrollRef.current.scrollTo({ x: targetX, animated: true });
      }
    },
    [],
  );

  const handleTempoChange = useCallback(
    (multiplier: number) => {
      setTempoMultiplier(multiplier);
      grandStaffAudio.setTempoMultiplier(multiplier);
    },
    [],
  );

  const handleNotePress = useCallback((note: ClefNote) => {
    grandStaffAudio.playPitch(note.pitch, (note.durationBeats * 60) / 76);
  }, []);

  // Step measure backward / forward
  const handleStepMeasure = useCallback(
    (delta: number) => {
      if (!hymn) return;
      const nextM = Math.max(0, Math.min(hymn.totalMeasures - 1, playbackState.currentMeasure + delta));
      handleMeasurePress(nextM);
    },
    [hymn, playbackState.currentMeasure, handleMeasurePress],
  );

  // Keyboard Shortcuts (Web listener: Escape to close, Space to Play/Pause, Left/Right arrows)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleStepMeasure(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleStepMeasure(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleTogglePlay, handleStepMeasure]);

  if (!isOpen || !hymn) {
    return null;
  }

  const effectiveBpm = Math.round(hymn.tempoBpm * tempoMultiplier);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.fullscreenContainer}>
        {/* ── STICKY HEADER BAR ────────────────────────────────────────────── */}
        <View style={styles.stickyHeader}>
          {/* Left Column: Hymn Identity */}
          <View style={styles.headerLeft}>
            <View style={styles.hymnNumberBadge}>
              <Text style={styles.hymnNumberText}>#{hymn.number}</Text>
            </View>
            <View style={styles.hymnMetaInfo}>
              <Text style={styles.hymnTitle} numberOfLines={1}>
                {hymn.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaBadge}>{hymn.book}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaBadge}>Key of {hymn.keySignature}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaBadge}>{hymn.timeSignature} Time</Text>
              </View>
            </View>
          </View>

          {/* Center Column: Playback Controls */}
          <View style={styles.headerCenter}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleStepMeasure(-1)}
              activeOpacity={0.7}
              accessibilityLabel="Previous Measure"
            >
              <Ionicons name="play-back" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryPlayBtn, isPlaying && styles.primaryPlayBtnActive]}
              onPress={handleTogglePlay}
              activeOpacity={0.8}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="#0F172A"
                style={!isPlaying ? { marginLeft: 2 } : undefined}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => handleStepMeasure(1)}
              activeOpacity={0.7}
              accessibilityLabel="Next Measure"
            >
              <Ionicons name="play-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
              activeOpacity={0.7}
              accessibilityLabel="Reset Playback"
            >
              <Ionicons name="refresh" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Current Position Counter */}
            <View style={styles.measureCounterBadge}>
              <Text style={styles.measureCounterText}>
                m.{playbackState.currentMeasure + 1} / {hymn.totalMeasures}
              </Text>
            </View>
          </View>

          {/* Right Column: Tempo Controls & Close Button */}
          <View style={styles.headerRight}>
            <View style={styles.tempoGroup}>
              <View style={styles.tempoLabelRow}>
                <Ionicons name="speedometer-outline" size={14} color="#38BDF8" />
                <Text style={styles.tempoBpmText}>{effectiveBpm} BPM</Text>
              </View>
              <View style={styles.tempoPillWrap}>
                {TEMPO_SPEEDS.map((spd) => (
                  <TouchableOpacity
                    key={spd.value}
                    style={[
                      styles.tempoSpeedPill,
                      tempoMultiplier === spd.value && styles.tempoSpeedPillActive,
                    ]}
                    onPress={() => handleTempoChange(spd.value)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.tempoSpeedText,
                        tempoMultiplier === spd.value && styles.tempoSpeedTextActive,
                      ]}
                    >
                      {spd.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Prominent Exit Fullscreen Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.75}
              accessibilityLabel="Close Fullscreen Sheet Music Viewer"
            >
              <Ionicons name="close" size={24} color="#F1F5F9" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── INTERACTIVE DUAL-CLEF GRAND STAFF VIEWPORT ────────────────────── */}
        <View style={styles.viewportContainer}>
          <GrandStaffViewer
            hymn={hymn}
            currentMeasure={playbackState.currentMeasure}
            currentBeat={playbackState.currentBeat}
            isPlaying={isPlaying}
            activeTrebleNoteIds={playbackState.activeTrebleNoteIds}
            activeBassNoteIds={playbackState.activeBassNoteIds}
            activeLyricIndex={playbackState.activeLyricIndex}
            onMeasurePress={handleMeasurePress}
            onNotePress={handleNotePress}
            scrollRef={scrollRef}
          />
        </View>

        {/* ── FOOTER BAR WITH SHORTCUTS & SYNC METRICS ─────────────────────── */}
        <View style={styles.footerBar}>
          <View style={styles.footerInfoLeft}>
            <View style={styles.liveNoteIndicator}>
              <Text style={styles.liveNoteDot}>●</Text>
              <Text style={styles.liveNoteText}>
                {isPlaying
                  ? `Treble: ${playbackState.activeTrebleNoteIds.length > 0 ? 'Active' : 'Rest'}  |  Bass: ${playbackState.activeBassNoteIds.length > 0 ? 'Active' : 'Rest'}`
                  : 'Interactive Dual-Clef Grand Staff • Click any measure or note'}
              </Text>
            </View>
          </View>

          {Platform.OS === 'web' && (
            <View style={styles.keyboardHints}>
              <Text style={styles.keyboardHintText}>
                <Text style={styles.keyTag}>Space</Text> Play/Pause  •  <Text style={styles.keyTag}>←/→</Text> Seek  •  <Text style={styles.keyTag}>Esc</Text> Exit
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A', // Slate-900
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
    marginRight: 12,
  },
  hymnNumberBadge: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  hymnNumberText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 15,
  },
  hymnMetaInfo: {
    flex: 1,
  },
  hymnTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  metaBadge: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  metaDot: {
    color: '#475569',
    fontSize: 10,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flex: 1.2,
  },
  primaryPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  primaryPlayBtnActive: {
    backgroundColor: '#FACC15',
    shadowColor: '#FACC15',
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  measureCounterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    marginLeft: 4,
  },
  measureCounterText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1.2,
    gap: 16,
  },
  tempoGroup: {
    alignItems: 'flex-end',
  },
  tempoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tempoBpmText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  tempoPillWrap: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 2,
    gap: 2,
  },
  tempoSpeedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tempoSpeedPillActive: {
    backgroundColor: '#38BDF8',
  },
  tempoSpeedText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  tempoSpeedTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  viewportContainer: {
    flex: 1,
    padding: 12,
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveNoteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveNoteDot: {
    color: '#10B981',
    fontSize: 10,
  },
  liveNoteText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  keyboardHints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyboardHintText: {
    color: '#64748B',
    fontSize: 11,
  },
  keyTag: {
    color: '#E2E8F0',
    backgroundColor: '#334155',
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
});
