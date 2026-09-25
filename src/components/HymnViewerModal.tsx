import AdaptiveChip from '@/src/components/adaptive/AdaptiveChip';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getGrandStaffHymn, GRAND_STAFF_HYMNS } from '../data/hymnData';
import { AudioPlaybackState, grandStaffAudio } from '../services/grandStaffAudio';
import type { ClefNote, GrandStaffHymn } from '../types/music';
import GrandStaffViewer from './GrandStaffViewer';
import { getElevation, interaction, radius, typography } from '../theme/platformDesign';

const isIOS = Platform.OS === 'ios';

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
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);

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

  // Stop + reset when modal closes
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
    if (scrollRef.current && state.currentMeasure > 0) {
      const measureWidth = 220;
      const targetX = Math.max(0, 75 + (state.currentMeasure - 1) * measureWidth);
      scrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  }, []);

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Auto-start playback when hymn becomes available and modal opens
  useEffect(() => {
    if (!isOpen || !hymn) return;
    // Small delay to let the modal animation settle
    const timer = setTimeout(() => {
      grandStaffAudio.start(hymn, tempoMultiplier, 0, handleTick, handleComplete);
      setIsPlaying(true);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hymn?.id]);

  const handleTogglePlay = useCallback(() => {
    if (!hymn) return;
    if (isPlaying) {
      grandStaffAudio.pause();
      setIsPlaying(false);
    } else {
      if (playbackState.currentTimeMs > 0 && playbackState.currentTimeMs < playbackState.totalDurationMs) {
        grandStaffAudio.resume();
      } else {
        grandStaffAudio.start(hymn, tempoMultiplier, playbackState.currentMeasure, handleTick, handleComplete);
      }
      setIsPlaying(true);
    }
  }, [hymn, isPlaying, tempoMultiplier, playbackState, handleTick, handleComplete]);

  const handleMeasurePress = useCallback((measureIdx: number) => {
    grandStaffAudio.seekToMeasure(measureIdx);
    if (scrollRef.current) {
      const measureWidth = 220;
      const targetX = Math.max(0, 75 + (measureIdx - 1) * measureWidth);
      scrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  }, []);

  const handleTempoChange = useCallback((multiplier: number) => {
    setTempoMultiplier(multiplier);
    grandStaffAudio.setTempoMultiplier(multiplier);
  }, []);

  const handleNotePress = useCallback((note: ClefNote) => {
    grandStaffAudio.playPitch(note.pitch, (note.durationBeats * 60) / 76);
  }, []);

  const handleStepMeasure = useCallback((delta: number) => {
    if (!hymn) return;
    const nextM = Math.max(0, Math.min(hymn.totalMeasures - 1, playbackState.currentMeasure + delta));
    handleMeasurePress(nextM);
  }, [hymn, playbackState.currentMeasure, handleMeasurePress]);

  // Keyboard shortcuts (web)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); handleTogglePlay(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); handleStepMeasure(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleStepMeasure(1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleTogglePlay, handleStepMeasure]);

  if (!isOpen || !hymn) return null;

  // Controls visible only when paused
  const showExpandedControls = !isPlaying;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* ── EDGE-TO-EDGE TOP BAR ──────────────────────────────────────────── */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }, getElevation(isIOS ? 0 : 3)]}>
          {/* Song identity */}
          <View style={styles.identity}>
            <View style={styles.numBadge}>
              <Text style={styles.numBadgeText}>#{hymn.number}</Text>
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.titleText} numberOfLines={1}>{hymn.title}</Text>
              <Text style={styles.subtitleText} numberOfLines={1}>
                {hymn.book}  •  Key of {hymn.keySignature}
              </Text>
            </View>
          </View>

          {/* Right controls – context-sensitive */}
          <View style={styles.controlsRow}>
            {/* Speed chips + exit – only when paused */}
            {showExpandedControls && (
              <>
                <View style={styles.speedChips}>
                  {TEMPO_SPEEDS.map((spd) => (
                    <AdaptiveChip
                      key={spd.value}
                      label={spd.label}
                      selected={tempoMultiplier === spd.value}
                      onPress={() => handleTempoChange(spd.value)}
                      selectedColor="#FFD700"
                      selectedTextColor="#000000"
                      style={styles.speedChip}
                    />
                  ))}
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.exitBtn,
                    isIOS && pressed && { opacity: interaction.pressOpacity },
                  ]}
                  onPress={onClose}
                  android_ripple={interaction.useRipple ? { color: 'rgba(255,255,255,0.12)', borderless: false } : undefined}
                  accessibilityLabel="Exit"
                >
                  <Ionicons name="close" size={20} color="#F1F5F9" />
                </Pressable>
              </>
            )}

            {/* Play / Pause – always visible */}
            <Pressable
              style={({ pressed }) => [
                styles.playPauseBtn,
                isPlaying && styles.playPauseBtnActive,
                isIOS && pressed && { opacity: interaction.pressOpacity },
              ]}
              onPress={handleTogglePlay}
              android_ripple={interaction.useRipple ? { color: 'rgba(0,0,0,0.15)', borderless: false } : undefined}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#000000"
                style={!isPlaying ? { marginLeft: 2 } : undefined}
              />
            </Pressable>
          </View>
        </View>

        {/* ── SHEET MUSIC VIEWPORT ─────────────────────────────────────────── */}
        <View style={styles.viewport}>
          <GrandStaffViewer
            hymn={hymn}
            currentMeasure={playbackState.currentMeasure}
            currentBeat={playbackState.currentBeat}
            isPlaying={isPlaying}
            activeTrebleNoteIds={playbackState.activeTrebleNoteIds}
            activeBassNoteIds={playbackState.activeBassNoteIds}
            activeLyricIndex={-1}
            onMeasurePress={handleMeasurePress}
            onNotePress={handleNotePress}
            scrollRef={scrollRef}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
    flexDirection: 'column',
  },

  /* ── TOP BAR ─────────────────────────────────────────────────────────── */
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#334155',
    zIndex: 50,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  numBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  numBadgeText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 14,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: isIOS ? 17 : 18,
    fontWeight: isIOS ? '600' : '500',
    letterSpacing: isIOS ? -0.4 : 0,
  },
  subtitleText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },

  /* ── RIGHT CONTROLS ─────────────────────────────────────────────────── */
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  speedChips: {
    flexDirection: 'row',
    gap: 4,
  },
  speedChip: {
    height: 32,
    paddingHorizontal: 8,
  },
  exitBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#334155',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playPauseBtn: {
    width: 48,
    height: 48,
    borderRadius: isIOS ? 24 : 14,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  playPauseBtnActive: {
    backgroundColor: '#FACC15',
  },

  /* ── VIEWPORT ───────────────────────────────────────────────────────── */
  viewport: {
    flex: 1,
    padding: 12,
  },
});
