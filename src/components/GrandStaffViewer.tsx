import React, { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import Svg, {
    Circle,
    Defs,
    G,
    Line,
    LinearGradient,
    Path,
    Rect,
    Stop,
    Text as SvgText,
} from "react-native-svg";
import type { ClefNote, GrandStaffHymn } from "../types/music";
import {
    BRAVURA_GLYPHS,
    getBeatX,
    getKeySignatureGlyphs,
    getLedgerLineYs,
    getPitchStaffY,
    getStemGeometry,
    parsePitch,
} from "../utils/musicNotationUtils";
import StaffTimeSignature, {
    getTimeSignatureStaffWidth,
} from "./StaffTimeSignature";

export interface GrandStaffViewerProps {
  hymn: GrandStaffHymn;
  currentMeasure: number;
  currentBeat: number; // continuous float (e.g. 1.0 to beatsPerMeasure + 0.99)
  isPlaying: boolean;
  activeTrebleNoteIds?: string[];
  activeBassNoteIds?: string[];
  activeLyricIndex?: number;
  onMeasurePress?: (measure: number) => void;
  onNotePress?: (note: ClefNote) => void;
  scrollRef?: React.RefObject<ScrollView | null>;
}

// ── Classical Layout Constants ───────────────────────────────────────────────
const LINE_SPACING = 12; // Standard 12px line spacing
const STAFF_LINE_COUNT = 5;
const STAFF_HEIGHT = (STAFF_LINE_COUNT - 1) * LINE_SPACING; // 48px

const BRACE_WIDTH = 18;
const CLEF_WIDTH = 48;
const TOP_MARGIN = 48;
const CLEF_GAP = 58; // Vertical gap between Treble Line 1 and Bass Line 5
const TREBLE_TOP_Y = TOP_MARGIN; // F5 (Line 5)
const TREBLE_BOTTOM_Y = TREBLE_TOP_Y + STAFF_HEIGHT; // E4 (Line 1)
const BASS_TOP_Y = TREBLE_BOTTOM_Y + CLEF_GAP; // A3 (Line 5)
const BASS_BOTTOM_Y = BASS_TOP_Y + STAFF_HEIGHT; // G2 (Line 1)
const TOTAL_SVG_HEIGHT = BASS_BOTTOM_Y + 32;

const MEASURE_BASE_WIDTH = 230;

/**
 * Classical Grand Staff Curly Brace SVG Path
 */
const GRAND_STAFF_BRACE_PATH = (topY: number, bottomY: number): string => {
  const midY = (topY + bottomY) / 2;
  const height = bottomY - topY;
  return (
    `M 16 ${topY} ` +
    `C 12 ${topY + height * 0.15}, 6 ${midY - height * 0.1}, 2 ${midY - 3} ` +
    `L 0 ${midY} ` +
    `L 2 ${midY + 3} ` +
    `C 6 ${midY + height * 0.1}, 12 ${bottomY - height * 0.15}, 16 ${bottomY} ` +
    `C 13 ${bottomY - height * 0.15}, 9 ${midY + height * 0.1}, 6 ${midY + 2} ` +
    `L 4 ${midY} ` +
    `L 6 ${midY - 2} ` +
    `C 9 ${midY - height * 0.1}, 13 ${topY + height * 0.15}, 16 ${topY} Z`
  );
};

export default function GrandStaffViewer({
  hymn,
  currentMeasure,
  currentBeat,
  isPlaying,
  activeTrebleNoteIds = [],
  activeBassNoteIds = [],
  activeLyricIndex = -1,
  onMeasurePress,
  onNotePress,
  scrollRef,
}: GrandStaffViewerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [viewportWidth, setViewportWidth] = useState(Math.max(0, windowWidth - 24));

  // Compute key signature accidentals
  const keySigGlyphs = useMemo(() => {
    return getKeySignatureGlyphs(
      hymn.keySignature || "C",
      BRACE_WIDTH + CLEF_WIDTH + 8,
      LINE_SPACING,
      TREBLE_BOTTOM_Y,
      BASS_BOTTOM_Y,
    );
  }, [hymn.keySignature]);

  // Measure key signature width and time signature width
  const timeSigWidth = useMemo(
    () => getTimeSignatureStaffWidth(hymn.timeSignature, LINE_SPACING),
    [hymn.timeSignature],
  );

  const { timeSigX, headerWidth } = useMemo(() => {
    const keyAccidentalCount = Math.max(keySigGlyphs.treble.length, 0);
    const keyWidth = keyAccidentalCount > 0 ? keyAccidentalCount * 12 + 6 : 4;
    const startX = BRACE_WIDTH + CLEF_WIDTH + keyWidth + 8;
    return {
      timeSigX: startX,
      headerWidth: startX + timeSigWidth + 14,
    };
  }, [keySigGlyphs, timeSigWidth]);

  const totalSvgWidth = useMemo(() => {
    return headerWidth + hymn.totalMeasures * MEASURE_BASE_WIDTH + 50;
  }, [headerWidth, hymn.totalMeasures]);

  // Group notes by measure
  const measuresData = useMemo(() => {
    const list = [];
    for (let m = 0; m < hymn.totalMeasures; m++) {
      const treble = hymn.trebleNotes.filter((n) => n.measure === m);
      const bass = hymn.bassNotes.filter((n) => n.measure === m);
      list.push({ measureIndex: m, treble, bass });
    }
    return list;
  }, [hymn]);

  // Calculate exact X position of playhead
  const playheadX = useMemo(() => {
    const safeMeasure = Math.max(
      0,
      Math.min(hymn.totalMeasures - 1, currentMeasure),
    );
    const safeBeat = Math.max(
      1,
      Math.min(hymn.beatsPerMeasure + 1, currentBeat),
    );
    const measureStartX = headerWidth + safeMeasure * MEASURE_BASE_WIDTH;
    const beatProgress = (safeBeat - 1) / hymn.beatsPerMeasure;
    return measureStartX + beatProgress * MEASURE_BASE_WIDTH;
  }, [
    currentMeasure,
    currentBeat,
    hymn.totalMeasures,
    hymn.beatsPerMeasure,
    headerWidth,
  ]);
  const playheadAnchorX = viewportWidth / 4;
  const leadingSpace = Math.max(10, playheadAnchorX - headerWidth);
  const trailingSpace = viewportWidth - playheadAnchorX;

  useEffect(() => {
    if (!scrollRef?.current) return;

    const targetOffset = Math.max(
      0,
      leadingSpace + playheadX - playheadAnchorX,
    );
    scrollRef.current.scrollTo({ x: targetOffset, animated: false });
  }, [leadingSpace, playheadAnchorX, playheadX, scrollRef]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minWidth: Math.max(
              windowWidth,
              totalSvgWidth + leadingSpace + trailingSpace,
            ),
            paddingLeft: leadingSpace,
            paddingRight: trailingSpace + 10,
          },
        ]}
      >
        <Svg width={totalSvgWidth} height={TOTAL_SVG_HEIGHT}>
          <Defs>
            <LinearGradient id="playheadBarGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#FFD700" stopOpacity={0} />
              <Stop offset="100%" stopColor="#FFD700" stopOpacity={1} />
            </LinearGradient>

            <LinearGradient id="activeTrebleGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFD700" />
              <Stop offset="100%" stopColor="#FACC15" />
            </LinearGradient>

            <LinearGradient id="activeBassGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FACC15" />
              <Stop offset="100%" stopColor="#EAB308" />
            </LinearGradient>

            <LinearGradient id="activeLyricBg" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#EAB308" stopOpacity={0.85} />
              <Stop offset="100%" stopColor="#FFD700" stopOpacity={0.95} />
            </LinearGradient>
          </Defs>

          {/* ── 1. Grand Staff Left Bracket / Brace & Initial Bar ─────────────── */}
          <Path
            d={GRAND_STAFF_BRACE_PATH(TREBLE_TOP_Y, BASS_BOTTOM_Y)}
            fill="#CBD5E1"
          />
          {/* Left vertical double bar */}
          <Line
            x1={BRACE_WIDTH + 2}
            y1={TREBLE_TOP_Y}
            x2={BRACE_WIDTH + 2}
            y2={BASS_BOTTOM_Y}
            stroke="#94A3B8"
            strokeWidth={3}
          />
          <Line
            x1={BRACE_WIDTH + 6}
            y1={TREBLE_TOP_Y}
            x2={BRACE_WIDTH + 6}
            y2={BASS_BOTTOM_Y}
            stroke="#64748B"
            strokeWidth={1}
          />

          {/* ── 2. Parallel 5-Line Staves (Treble & Bass) ────────────────────── */}
          {Array.from({ length: STAFF_LINE_COUNT }).map((_, i) => {
            const trebleLineY = TREBLE_TOP_Y + i * LINE_SPACING;
            const bassLineY = BASS_TOP_Y + i * LINE_SPACING;
            return (
              <G key={`staff-lines-${i}`}>
                {/* Treble Staff Line */}
                <Line
                  x1={BRACE_WIDTH + 6}
                  y1={trebleLineY}
                  x2={totalSvgWidth - 20}
                  y2={trebleLineY}
                  stroke="#475569"
                  strokeWidth={1.3}
                />
                {/* Bass Staff Line */}
                <Line
                  x1={BRACE_WIDTH + 6}
                  y1={bassLineY}
                  x2={totalSvgWidth - 20}
                  y2={bassLineY}
                  stroke="#475569"
                  strokeWidth={1.3}
                />
              </G>
            );
          })}

          {/* ── 3. Clefs Header (Treble, Bass, Key Signatures, Time Sig) ────── */}
          <G id="clef-and-time-header">
            {/* Treble Clef Symbol (SMuFL Bravura G-Clef aligned to G4-line) */}
            <G
              transform={`translate(${BRACE_WIDTH + 8}, ${TREBLE_TOP_Y + 3 * LINE_SPACING}) scale(0.048)`}
            >
              <Path d={BRAVURA_GLYPHS.gClef.path} fill="#F8FAFC" />
            </G>

            {/* Bass Clef Symbol (SMuFL Bravura F-Clef aligned to F3-line with dots in spaces 3 & 4) */}
            <G
              transform={`translate(${BRACE_WIDTH + 8}, ${BASS_TOP_Y + LINE_SPACING}) scale(0.048)`}
            >
              <Path d={BRAVURA_GLYPHS.fClef.path} fill="#F8FAFC" />
            </G>

            {/* Key Signature Accidentals */}
            {keySigGlyphs.treble.map((g, idx) => (
              <SvgText
                key={`key-t-${idx}`}
                x={g.x}
                y={g.y + 4}
                fill="#FFD700"
                fontSize={16}
                fontWeight="bold"
                textAnchor="middle"
              >
                {g.symbol}
              </SvgText>
            ))}
            {keySigGlyphs.bass.map((g, idx) => (
              <SvgText
                key={`key-b-${idx}`}
                x={g.x}
                y={g.y + 4}
                fill="#FFD700"
                fontSize={16}
                fontWeight="bold"
                textAnchor="middle"
              >
                {g.symbol}
              </SvgText>
            ))}

            {/* Time Signature on Treble Staff (Classical Engraving) */}
            <StaffTimeSignature
              x={timeSigX}
              topY={TREBLE_TOP_Y}
              lineSpacing={LINE_SPACING}
              timeSignature={hymn.timeSignature}
              color="#F8FAFC"
            />

            {/* Time Signature on Bass Staff (Classical Engraving) */}
            <StaffTimeSignature
              x={timeSigX}
              topY={BASS_TOP_Y}
              lineSpacing={LINE_SPACING}
              timeSignature={hymn.timeSignature}
              color="#F8FAFC"
            />
          </G>

          {/* ── 4. Measures, Barlines, Notes ─────────────────────────────────── */}
          {measuresData.map(({ measureIndex, treble, bass }) => {
            const measureStartX =
              headerWidth + measureIndex * MEASURE_BASE_WIDTH;
            const measureEndX = measureStartX + MEASURE_BASE_WIDTH;
            const isFinalMeasure = measureIndex === hymn.totalMeasures - 1;

            return (
              <G key={`measure-${measureIndex}`}>
                {/* Continuous Measure Bar Line (through Treble and Bass) */}
                <Line
                  x1={measureEndX}
                  y1={TREBLE_TOP_Y}
                  x2={measureEndX}
                  y2={BASS_BOTTOM_Y}
                  stroke="#64748B"
                  strokeWidth={isFinalMeasure ? 3.5 : 1.5}
                />
                {isFinalMeasure && (
                  <Line
                    x1={measureEndX - 5}
                    y1={TREBLE_TOP_Y}
                    x2={measureEndX - 5}
                    y2={BASS_BOTTOM_Y}
                    stroke="#64748B"
                    strokeWidth={1}
                  />
                )}

                {/* ── A. Treble Clef Notes ──────────────────────────────────── */}
                {treble.map((note) => {
                  const noteX = getBeatX(
                    measureStartX,
                    MEASURE_BASE_WIDTH,
                    note.beat,
                    hymn.beatsPerMeasure,
                  );
                  const noteY = getPitchStaffY(
                    "treble",
                    note.pitch,
                    LINE_SPACING,
                    TREBLE_BOTTOM_Y,
                    BASS_BOTTOM_Y,
                  );
                  const isActive = activeTrebleNoteIds.includes(note.id);
                  const parsed = parsePitch(note.pitch);

                  // Calculate ledger lines
                  const ledgerYs = getLedgerLineYs(
                    "treble",
                    note.pitch,
                    LINE_SPACING,
                    TREBLE_TOP_Y,
                    TREBLE_BOTTOM_Y,
                    BASS_TOP_Y,
                    BASS_BOTTOM_Y,
                  );

                  // Calculate stem geometry
                  const stem = getStemGeometry(
                    "treble",
                    note.pitch,
                    noteX,
                    noteY,
                    28,
                    6,
                  );

                  return (
                    <G key={note.id}>
                      {/* Ledger Lines */}
                      {ledgerYs.map((ly, lIdx) => (
                        <Line
                          key={`t-ledger-${note.id}-${lIdx}`}
                          x1={noteX - 11}
                          y1={ly}
                          x2={noteX + 11}
                          y2={ly}
                          stroke="#94A3B8"
                          strokeWidth={1.5}
                        />
                      ))}

                      {/* Note Accidental Symbol (# or b) */}
                      {parsed.accidental && (
                        <SvgText
                          x={noteX - 12}
                          y={noteY + 4}
                          fill={isActive ? "#FFD700" : "#CBD5E1"}
                          fontSize={13}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {parsed.accidental === "#" ? "♯" : "♭"}
                        </SvgText>
                      )}

                      {/* Notehead */}
                      <Circle
                        cx={noteX}
                        cy={noteY}
                        r={isActive ? 7.5 : 6}
                        fill={isActive ? "url(#activeTrebleGrad)" : "#F8FAFC"}
                        stroke={isActive ? "#FFFFFF" : "#0F172A"}
                        strokeWidth={isActive ? 2 : 1}
                      />

                      {/* Note Stem */}
                      <Line
                        x1={stem.stemX}
                        y1={stem.stemStartY}
                        x2={stem.stemX}
                        y2={stem.stemEndY}
                        stroke={isActive ? "#FFD700" : "#F1F5F9"}
                        strokeWidth={1.8}
                      />
                    </G>
                  );
                })}

                {/* ── B. Bass Clef Notes ────────────────────────────────────── */}
                {bass.map((note) => {
                  const noteX = getBeatX(
                    measureStartX,
                    MEASURE_BASE_WIDTH,
                    note.beat,
                    hymn.beatsPerMeasure,
                  );
                  const noteY = getPitchStaffY(
                    "bass",
                    note.pitch,
                    LINE_SPACING,
                    TREBLE_BOTTOM_Y,
                    BASS_BOTTOM_Y,
                  );
                  const isActive = activeBassNoteIds.includes(note.id);
                  const parsed = parsePitch(note.pitch);

                  // Calculate ledger lines
                  const ledgerYs = getLedgerLineYs(
                    "bass",
                    note.pitch,
                    LINE_SPACING,
                    TREBLE_TOP_Y,
                    TREBLE_BOTTOM_Y,
                    BASS_TOP_Y,
                    BASS_BOTTOM_Y,
                  );

                  // Calculate stem geometry
                  const stem = getStemGeometry(
                    "bass",
                    note.pitch,
                    noteX,
                    noteY,
                    28,
                    6,
                  );

                  return (
                    <G key={note.id}>
                      {/* Ledger Lines */}
                      {ledgerYs.map((ly, lIdx) => (
                        <Line
                          key={`b-ledger-${note.id}-${lIdx}`}
                          x1={noteX - 11}
                          y1={ly}
                          x2={noteX + 11}
                          y2={ly}
                          stroke="#94A3B8"
                          strokeWidth={1.5}
                        />
                      ))}

                      {/* Note Accidental Symbol (# or b) */}
                      {parsed.accidental && (
                        <SvgText
                          x={noteX - 12}
                          y={noteY + 4}
                          fill={isActive ? "#FACC15" : "#CBD5E1"}
                          fontSize={13}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {parsed.accidental === "#" ? "♯" : "♭"}
                        </SvgText>
                      )}

                      {/* Notehead */}
                      <Circle
                        cx={noteX}
                        cy={noteY}
                        r={isActive ? 7.5 : 6}
                        fill={isActive ? "url(#activeBassGrad)" : "#E2E8F0"}
                        stroke={isActive ? "#FFFFFF" : "#0F172A"}
                        strokeWidth={isActive ? 2 : 1}
                      />

                      {/* Note Stem */}
                      <Line
                        x1={stem.stemX}
                        y1={stem.stemStartY}
                        x2={stem.stemX}
                        y2={stem.stemEndY}
                        stroke={isActive ? "#FACC15" : "#CBD5E1"}
                        strokeWidth={1.8}
                      />
                    </G>
                  );
                })}
              </G>
            );
          })}

          {/* ── 5. Animated Playhead Bar (Aligned through all 3 lanes) ───────── */}
          <G id="playhead">
            <Rect
              x={playheadX - 32}
              y={TREBLE_TOP_Y - 18}
              width={32}
              height={TOTAL_SVG_HEIGHT - TREBLE_TOP_Y - 14}
              fill="url(#playheadBarGrad)"
            />
          </G>
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A", // Slate-900
    borderRadius: 12,
    overflow: "hidden",
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 14,
    paddingRight: 10,
    alignItems: "flex-start",
    justifyContent: "center",
  },
});
