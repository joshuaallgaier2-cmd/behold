import AdaptiveButton from '@/src/components/adaptive/AdaptiveButton';
import AdaptiveCard from '@/src/components/adaptive/AdaptiveCard';
import AdaptiveChip from '@/src/components/adaptive/AdaptiveChip';
import AdaptiveHeader from '@/src/components/adaptive/AdaptiveHeader';
import HymnViewerModal from '@/src/components/HymnViewerModal';
import SvgSheetCanvas from '@/src/components/SvgSheetCanvas';
import TimeSignatureMark from '@/src/components/TimeSignatureMark';
import { useBeholdTheme } from '@/src/context/ThemeContext';
import { INTERACTIVE_MUSIC_DATABASE } from '@/src/data/musicData';
import { usePracticeEngine } from '@/src/hooks/usePracticeEngine';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getElevation, heights, interaction, radius, spacing, typography } from '@/src/theme/platformDesign';

const isIOS = Platform.OS === 'ios';
const { width: WINDOW_WIDTH } = Dimensions.get('window');

const TEMPO_SPEEDS = [
  { label: '0.75x', value: 0.75 },
  { label: '1.0x', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
];

export default function SongDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useBeholdTheme();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [tempoMultiplier, setTempoMultiplier] = useState(1.0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const song = useMemo(
    () => INTERACTIVE_MUSIC_DATABASE.find((s) => s.id === id) || INTERACTIVE_MUSIC_DATABASE[0],
    [id],
  );

  const targetNotes = useMemo(() => song?.targetNotes ?? [], [song]);

  const totalDurationMs = useMemo(() => {
    if (!targetNotes.length) return 10000;
    const lastNote = targetNotes[targetNotes.length - 1];
    return Math.max(1000, (lastNote?.timestampMs ?? 0) + (lastNote?.durationMs ?? 1000));
  }, [targetNotes]);

  const { adjustedTimeMs } = usePracticeEngine(
    targetNotes,
    {},
    currentTimeMs,
    isPlaying,
    {
      mode: 'listen',
      loopStartMs: 0,
      loopEndMs: totalDurationMs,
      tempoMultiplier,
    },
  );

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTimeMs((timeMs) => {
        const nextTimeMs = timeMs + 50 * tempoMultiplier;
        if (nextTimeMs >= totalDurationMs) {
          setIsPlaying(false);
          return 0;
        }
        return nextTimeMs;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, tempoMultiplier, totalDurationMs]);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const togglePlay = () => (isPlaying ? pause() : play());
  const resetPlayback = () => {
    setIsPlaying(false);
    setCurrentTimeMs(0);
  };

  const displayTimeMs = adjustedTimeMs(currentTimeMs);
  const activeNote = targetNotes.find(
    (note) =>
      displayTimeMs >= (note.timestampMs ?? 0) &&
      displayTimeMs < (note.timestampMs ?? 0) + (note.durationMs ?? 700),
  );

  const handleBack = () => {
    resetPlayback();
    router.back();
  };

  const [canvasLayoutWidth, setCanvasLayoutWidth] = useState<number>(0);
  const canvasWidth = Math.min(WINDOW_WIDTH - 32, 960);
  const currentSeconds = Math.floor(currentTimeMs / 1000);
  const totalSeconds = Math.ceil(totalDurationMs / 1000);
  const progressPercent = Math.min(100, Math.round((currentTimeMs / totalDurationMs) * 100));

  if (!song) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[typography.titleSmall, { color: colors.text, padding: 24 }]}>Song not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* ── PLATFORM-ADAPTIVE HEADER ──────────────────────────────────────── */}
      <AdaptiveHeader
        title={song.title}
        subtitle={`#${song.number} • ${song.keySignature || 'C'}`}
        onBack={handleBack}
        backgroundColor={colors.surface}
        textColor={colors.text}
        borderColor={colors.border}
        rightElement={
          <Pressable
            onPress={togglePlay}
            android_ripple={
              interaction.useRipple
                ? { color: 'rgba(255,255,255,0.15)', borderless: true, radius: 22 }
                : undefined
            }
            style={({ pressed }) => [
              styles.headerPlayBtn,
              isPlaying ? styles.headerPlayBtnActive : styles.headerPlayBtnDefault,
              isIOS && pressed && { opacity: interaction.pressOpacity },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause playback' : 'Start playback'}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color={isPlaying ? '#0F172A' : '#FFFFFF'}
              style={!isPlaying ? { marginLeft: 2 } : undefined}
            />
            <Text style={[
              typography.labelButton,
              { color: isPlaying ? '#0F172A' : '#FFFFFF', fontSize: isIOS ? 14 : 12 },
            ]}>
              {isPlaying ? 'Pause' : 'Play'}
            </Text>
          </Pressable>
        }
        centerElement={
          <View style={isIOS ? styles.headerCenterIOS : styles.headerCenterAndroid}>
            <Text style={[isIOS ? styles.iosTitleText : styles.androidTitleText, { color: colors.text }]} numberOfLines={1}>
              {song.title}
            </Text>
            <View style={styles.headerMetaRow}>
              <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
                #{song.number} • {song.keySignature || 'C'}
              </Text>
              <View style={styles.headerTimeBadge}>
                <TimeSignatureMark timeSignature={song.timeSignature} color={colors.text} size={11} />
              </View>
            </View>
          </View>
        }
      />

      {/* ── PLAYBACK CONTROL TOOLBAR ─────────────────────────────────────── */}
      <View style={[
        styles.playbackToolbar,
        {
          backgroundColor: isIOS ? colors.background : colors.surfaceContainer,
          borderBottomWidth: isIOS ? 0.5 : 0,
          borderBottomColor: colors.border,
          ...getElevation(isIOS ? 0 : 1),
        },
      ]}>
        {/* Progress Group */}
        <View style={styles.toolbarProgressGroup}>
          <Pressable
            onPress={resetPlayback}
            android_ripple={interaction.useRipple ? { color: 'rgba(255,255,255,0.1)', borderless: true, radius: 14 } : undefined}
            style={({ pressed }) => [
              styles.resetIconButton,
              { backgroundColor: colors.surfaceContainerHigh },
              isIOS && pressed && { opacity: interaction.pressOpacity },
            ]}
            accessibilityLabel="Reset playback to beginning"
          >
            <Ionicons name="refresh" size={16} color={colors.text} />
          </Pressable>
          <Text style={[styles.timeCounterText, { color: colors.text }]}>
            {currentSeconds}s / {totalSeconds}s
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>
        </View>

        {/* Speed Selector Chips */}
        <View style={styles.toolbarSpeedGroup}>
          <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
            {Math.round(song.tempoBpm * tempoMultiplier)} BPM
          </Text>
          <View style={styles.speedChipsWrap}>
            {TEMPO_SPEEDS.map((spd) => (
              <AdaptiveChip
                key={spd.value}
                label={spd.label}
                selected={tempoMultiplier === spd.value}
                onPress={() => setTempoMultiplier(spd.value)}
                selectedColor={colors.accent}
                selectedTextColor="#0F172A"
                style={styles.speedChip}
              />
            ))}
          </View>
        </View>
      </View>

      {/* ── MAIN SHEET MUSIC PRESENTATION ─────────────────────────────────── */}
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Standard Sheet Music Paper Card */}
        <AdaptiveCard
          elevation={2}
          backgroundColor={isIOS ? '#FFFFFF' : colors.surface}
          borderColor={colors.border}
          style={styles.sheetPaperCard}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleGroup}>
              <Text style={[typography.titleSmall, { color: isIOS ? '#0F172A' : colors.text }]}>
                {song.title}
              </Text>
              <Text style={[typography.caption, { color: isIOS ? '#64748B' : colors.onSurfaceVariant, marginTop: 2 }]}>
                {song.book || 'Standard Sheet Music'} • Hymn #{song.number}
              </Text>
            </View>
            <View style={styles.sheetMetaRight}>
              <Text style={[typography.caption, { color: isIOS ? '#475569' : colors.onSurfaceVariant }]}>
                Key of {song.keySignature || 'C'}
              </Text>
              <Text style={[typography.caption, { color: isIOS ? '#475569' : colors.onSurfaceVariant }]}>
                {song.timeSignature || '4/4'} Time
              </Text>
            </View>
          </View>

          {/* Standard 5-Line Music Staff Canvas */}
          <View
            style={styles.canvasContainer}
            onLayout={(e) => {
              const w = Math.round(e.nativeEvent.layout.width);
              if (w > 0 && w !== canvasLayoutWidth) {
                setCanvasLayoutWidth(w);
              }
            }}
          >
            <SvgSheetCanvas
              notes={targetNotes}
              activeNoteId={activeNote?.id ?? null}
              width={canvasLayoutWidth || canvasWidth}
              height={300}
              keySignature={song.keySignature}
              timeSignature={song.timeSignature}
              tempoBpm={song.tempoBpm}
              isPlaying={isPlaying}
              tempoMultiplier={tempoMultiplier}
              onTogglePlay={togglePlay}
              onTempoChange={setTempoMultiplier}
              showControls={false}
            />
          </View>
        </AdaptiveCard>

        {/* Dual-Clef Fullscreen Sheet Music Action */}
        <View style={styles.footerActionRow}>
          <AdaptiveButton
            label="Open Fullscreen Interactive Grand Staff"
            onPress={() => setIsModalOpen(true)}
            variant="outlined"
            color={colors.accent}
            textColor={colors.text}
            icon={<Ionicons name="musical-notes" size={18} color={colors.accent} style={{ marginRight: 6 }} />}
            style={styles.fullscreenBtn}
          />
        </View>
      </ScrollView>

      {/* Fullscreen Interactive Sheet Music Modal */}
      <HymnViewerModal
        hymnIdOrNumber={song.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: isIOS ? 14 : 16,
    paddingVertical: isIOS ? 8 : 6,
    borderRadius: isIOS ? 20 : radius.small,
    overflow: 'hidden',
  },
  headerPlayBtnDefault: {
    backgroundColor: '#0284C7',
  },
  headerPlayBtnActive: {
    backgroundColor: '#FACC15',
  },
  headerCenterIOS: {
    alignItems: 'center',
  },
  headerCenterAndroid: {
    alignItems: 'flex-start',
  },
  iosTitleText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
  androidTitleText: {
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 0,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  headerTimeBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  playbackToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toolbarProgressGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: spacing.md,
  },
  resetIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timeCounterText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  toolbarSpeedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speedChipsWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  speedChip: {
    height: 26,
    paddingHorizontal: 8,
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  sheetPaperCard: {
    width: '100%',
    maxWidth: 960,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitleGroup: {
    flex: 1,
  },
  sheetMetaRight: {
    alignItems: 'flex-end',
  },
  canvasContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  footerActionRow: {
    width: '100%',
    maxWidth: 960,
    marginTop: 16,
    marginBottom: 24,
  },
  fullscreenBtn: {
    height: isIOS ? 48 : 44,
    borderRadius: isIOS ? radius.medium : radius.small,
  },
});
