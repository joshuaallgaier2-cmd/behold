import SpeedSlider, { formatSpeedMultiplier } from "@/src/components/adaptive/SpeedSlider";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGrandStaffHymn } from "../data/hymnData";
import { LDS_MUSIC_DATABASE } from "../data/musicData";
import {
    AudioPlaybackState,
    grandStaffAudio,
} from "../services/grandStaffAudio";
import {
    getElevation,
    interaction,
    radius
} from "../theme/platformDesign";
import type { ClefNote, GrandStaffHymn } from "../types/music";
import GrandStaffViewer from "./GrandStaffViewer";

const isIOS = Platform.OS === "ios";

export interface HymnViewerModalProps {
  hymnIdOrNumber: string | number | null;
  isOpen: boolean;
  onClose: () => void;
}

const SPEED_NOTCH_VALUES = [0.5, 0.75, 1.0, 1.25, 1.5];

export default function HymnViewerModal({
  hymnIdOrNumber,
  isOpen,
  onClose,
}: HymnViewerModalProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isPortraitWeb = Platform.OS === "web" && windowWidth <= windowHeight;
  const scrollRef = useRef<ScrollView | null>(null);

  const hymn: GrandStaffHymn | undefined = useMemo(() => {
    if (hymnIdOrNumber == null) return undefined;
    return getGrandStaffHymn(hymnIdOrNumber);
  }, [hymnIdOrNumber]);

  const selectedSongTitle = useMemo(() => {
    if (hymn) return hymn.title;
    if (hymnIdOrNumber == null) return "Selected song";
    const selectedSong = LDS_MUSIC_DATABASE.find(
      (song) =>
        song.id.toLowerCase() === String(hymnIdOrNumber).toLowerCase() ||
        String(song.number) === String(hymnIdOrNumber),
    );
    return selectedSong?.title ?? "Selected song";
  }, [hymn, hymnIdOrNumber]);

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
    if (!isOpen || !hymn) {
      grandStaffAudio.stop();
    }
  }, [isOpen, hymn, hymnIdOrNumber]);

  // Audio tick handler
  const handleTick = useCallback((state: AudioPlaybackState) => {
    setPlaybackState(state);
    setIsPlaying(state.isPlaying);
  }, []);

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleClose = useCallback(() => {
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
    onClose();
  }, [onClose]);

  // Auto-start playback when hymn becomes available and modal opens
  useEffect(() => {
    if (!isOpen || !hymn) return;
    // Small delay to let the modal animation settle
    const timer = setTimeout(() => {
      grandStaffAudio.start(
        hymn,
        tempoMultiplier,
        0,
        handleTick,
        handleComplete,
      );
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
      if (
        playbackState.currentTimeMs > 0 &&
        playbackState.currentTimeMs < playbackState.totalDurationMs
      ) {
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
  }, [
    hymn,
    isPlaying,
    tempoMultiplier,
    playbackState,
    handleTick,
    handleComplete,
  ]);

  const handleMeasurePress = useCallback((measureIdx: number) => {
    grandStaffAudio.seekToMeasure(measureIdx);
  }, []);

  const handleTempoChange = useCallback((multiplier: number) => {
    setTempoMultiplier(multiplier);
    grandStaffAudio.setTempoMultiplier(multiplier);
  }, []);

  const handleNotePress = useCallback((note: ClefNote) => {
    grandStaffAudio.playPitch(note.pitch, (note.durationBeats * 60) / 76);
  }, []);

  const handleStepMeasure = useCallback(
    (delta: number) => {
      if (!hymn) return;
      const nextM = Math.max(
        0,
        Math.min(hymn.totalMeasures - 1, playbackState.currentMeasure + delta),
      );
      handleMeasurePress(nextM);
    },
    [hymn, playbackState.currentMeasure, handleMeasurePress],
  );

  // Keyboard shortcuts (web)
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || !isOpen)
      return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleStepMeasure(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleStepMeasure(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose, handleTogglePlay, handleStepMeasure]);

  if (!isOpen) return null;

  if (!hymn) {
    return (
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={true}
        supportedOrientations={["landscape-left", "landscape-right"]}
        onRequestClose={handleClose}
      >
        <View
          style={[
            styles.root,
            styles.unavailableContainer,
            {
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 24,
              paddingLeft: insets.left + 24,
              paddingRight: insets.right + 24,
            },
            isPortraitWeb && styles.hidden,
          ]}
          accessibilityElementsHidden={isPortraitWeb}
          importantForAccessibility={isPortraitWeb ? "no-hide-descendants" : "auto"}
        >
          <Text style={styles.unavailableTitle}>{selectedSongTitle}</Text>
          <Text style={styles.unavailableBody} accessibilityRole="alert">
            Sheet music for this song isn’t available yet. Choose another song to practice.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.unavailableButton, pressed && { opacity: 0.8 }]}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Choose another song"
          >
            <Text style={styles.unavailableButtonText}>Choose another song</Text>
          </Pressable>
        </View>
        {isPortraitWeb && (
          <View style={styles.orientationPrompt}>
            <Text style={styles.orientationPromptTitle}>Turn your screen sideways</Text>
            <Text style={styles.orientationPromptBody}>Behold sheet music works in landscape.</Text>
          </View>
        )}
      </Modal>
    );
  }

  // Controls visible only when paused
  const showExpandedControls = !isPlaying;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      supportedOrientations={["landscape-left", "landscape-right"]}
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        {/* ── EDGE-TO-EDGE TOP BAR ──────────────────────────────────────────── */}
        <View
          style={[
            styles.topBar,
            isPortraitWeb && styles.hidden,
            { paddingLeft: insets.left + 16, paddingRight: insets.right + 16 },
            { paddingTop: insets.top + 8 },
            getElevation(isIOS ? 0 : 3),
          ]}
          accessibilityElementsHidden={isPortraitWeb}
          importantForAccessibility={isPortraitWeb ? "no-hide-descendants" : "auto"}
        >
          <View style={styles.headerRow}>
            {/* Song identity */}
            <View style={styles.identity}>
              <View style={styles.numBadge}>
                <Text style={styles.numBadgeText}>#{hymn.number}</Text>
              </View>
              <View style={styles.titleBlock}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {hymn.title}
                </Text>
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {hymn.book} • Key of {hymn.keySignature}
                </Text>
              </View>
            </View>

            {showExpandedControls && (
              <SpeedSlider
                value={tempoMultiplier}
                onValueChange={handleTempoChange}
                notchValues={SPEED_NOTCH_VALUES}
                leftLabel={formatSpeedMultiplier(tempoMultiplier)}
                leftLabelContainerStyle={styles.speedLabelContainer}
                style={styles.speedSlider}
                trackColor="#334155"
                thumbColor="#FFD700"
                activeTrackColor="#FFD700"
                notchColor="#94A3B8"
              />
            )}

            {/* Right controls – context-sensitive */}
            <View style={styles.controlsRow}>
              {/* Exit – only when paused */}
              {showExpandedControls && (
                <>
                  <Pressable
                    style={({ pressed }) => [
                      styles.playPauseBtn,
                      isIOS && pressed && { opacity: interaction.pressOpacity },
                    ]}
                    onPress={handleClose}
                    android_ripple={
                      interaction.useRipple
                        ? { color: "rgba(0,0,0,0.15)", borderless: false }
                        : undefined
                    }
                    accessibilityLabel="Exit"
                  >
                    <Ionicons name="close" size={24} color="#000000" />
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
                android_ripple={
                  interaction.useRipple
                    ? { color: "rgba(0,0,0,0.15)", borderless: false }
                    : undefined
                }
                accessibilityLabel={isPlaying ? "Pause" : "Play"}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color="#000000"
                  style={!isPlaying ? { marginLeft: 2 } : undefined}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── SHEET MUSIC VIEWPORT ─────────────────────────────────────────── */}
        <View
          style={[styles.viewport, isPortraitWeb && styles.hidden, { paddingLeft: insets.left + 12, paddingRight: insets.right + 12, paddingBottom: insets.bottom + 12 }]}
          accessibilityElementsHidden={isPortraitWeb}
          importantForAccessibility={isPortraitWeb ? "no-hide-descendants" : "auto"}
        >
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
        {isPortraitWeb && (
          <View style={styles.orientationPrompt}>
            <Text style={styles.orientationPromptTitle}>Turn your screen sideways</Text>
            <Text style={styles.orientationPromptBody}>Behold sheet music works in landscape.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F172A",
    flexDirection: "column",
  },

  /* ── TOP BAR ─────────────────────────────────────────────────────────── */
  topBar: {
    width: "100%",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#1E293B",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#334155",
    zIndex: 50,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 0,
    minWidth: 0,
    flexBasis: 120,
  },
  numBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: isIOS ? 8 : 6,
    borderRadius: isIOS ? 22 : radius.small,
    marginRight: 10,
    height: isIOS ? 44 : 40,
    justifyContent: "center",
    alignItems: "center",
  },
  numBadgeText: {
    color: "#000000",
    fontWeight: "900",
    fontSize: 14,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: isIOS ? 17 : 18,
    fontWeight: isIOS ? "600" : "500",
    letterSpacing: isIOS ? -0.4 : 0,
  },
  subtitleText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },

  /* ── RIGHT CONTROLS ─────────────────────────────────────────────────── */
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  speedSlider: {
    flex: 1,
    flexBasis: 116,
    minWidth: 116,
    minHeight: 48,
  },
  speedLabelContainer: { minWidth: 40 },
  hidden: { display: "none" },
  playPauseBtn: {
    width: isIOS ? 44 : 40,
    height: isIOS ? 44 : 40,
    borderRadius: isIOS ? 22 : radius.small,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        boxShadow: "0px 3px 8px rgba(255, 215, 0, 0.45)",
      },
      android: { elevation: 5 },
    }),
  },
  playPauseBtnActive: {
    backgroundColor: "#FACC15",
  },

  /* ── VIEWPORT ───────────────────────────────────────────────────────── */
  viewport: {
    flex: 1,
    padding: 12,
  },
  orientationPrompt: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0F172A",
  },
  orientationPromptTitle: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  orientationPromptBody: {
    color: "#FFFFFF",
    marginTop: 8,
    textAlign: "center",
  },
  unavailableContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  unavailableTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  unavailableBody: {
    color: "#94A3B8",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 420,
    textAlign: "center",
  },
  unavailableButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFD700",
    borderRadius: radius.small,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  unavailableButtonText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "700",
  },
});
