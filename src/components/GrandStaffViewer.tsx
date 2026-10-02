import React, { useLayoutEffect, useMemo, useState } from "react";
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
} from "react-native-svg";
import type { ClefNote, GrandStaffHymn } from "../types/music";
import {
    BRAVURA_GLYPHS,
    getBeatX,
    getKeySignatureGlyphs,
    getLedgerLineYs,
    getNoteDurationNotation,
  getPlaybackBeatX,
    getPitchStaffY,
    getStemGeometry,
    parsePitch,
} from "../utils/musicNotationUtils";
import {
    BRAVURA_NOTE_GLYPHS,
    BRAVURA_STAFF_SPACE_UNITS,
    type BravuraGlyph,
} from "../utils/musicNoteGlyphs";
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
const NOTEHEAD_STEM_X_OFFSET =
  ((BRAVURA_NOTE_GLYPHS.noteheadBlack.bounds[2] - BRAVURA_NOTE_GLYPHS.noteheadBlack.bounds[0]) / 2) *
  (LINE_SPACING / BRAVURA_STAFF_SPACE_UNITS);
const NOTEHEAD_STEM_Y_OFFSET = 42 * LINE_SPACING / BRAVURA_STAFF_SPACE_UNITS;
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

const MEASURE_BASE_WIDTH = 210;

/**
 * Classical Grand Staff Curly Brace SVG Path
 */
const GRAND_STAFF_BRACE_PATH = (topY: number, bottomY: number): string => {
  const midY = (topY + bottomY) / 2;
  const height = bottomY - topY;
  return (
    `M 16 ${topY} ` +
    `C 16 ${topY + height * 0.16}, 11 ${midY - height * 0.18}, 5 ${midY - 12} ` +
    `C 3 ${midY - 7}, 2 ${midY - 3}, 0 ${midY} ` +
    `C 2 ${midY + 3}, 3 ${midY + 7}, 5 ${midY + 12} ` +
    `C 11 ${midY + height * 0.18}, 16 ${bottomY - height * 0.16}, 16 ${bottomY} ` +
    `C 13 ${bottomY - height * 0.12}, 8 ${midY + height * 0.14}, 4 ${midY + 7} ` +
    `C 2 ${midY + 4}, 1 ${midY + 2}, 0 ${midY} ` +
    `C 1 ${midY - 2}, 2 ${midY - 4}, 4 ${midY - 7} ` +
    `C 8 ${midY - height * 0.14}, 13 ${topY + height * 0.12}, 16 ${topY} Z`
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [viewportWidth, setViewportWidth] = useState(
    Math.max(0, windowWidth - 24),
  );
  const [viewportHeight, setViewportHeight] = useState(windowHeight);
  // Keep noteheads and staff lines at a familiar engraved size on wide screens.
  // Height is a limit, not a reason to magnify the notation until only one
  // measure fits on screen.
  const svgScale = Math.max(
    0.1,
    Math.min(
      (viewportHeight - 28) / TOTAL_SVG_HEIGHT,
      Math.max(0.85, Math.min(1.2, viewportWidth / 950)),
    ),
  );

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
    const measureStartX = headerWidth + safeMeasure * MEASURE_BASE_WIDTH;
    return getPlaybackBeatX(
      measureStartX,
      MEASURE_BASE_WIDTH,
      currentBeat,
      hymn.beatsPerMeasure,
    );
  }, [
    currentMeasure,
    currentBeat,
    hymn.totalMeasures,
    hymn.beatsPerMeasure,
    headerWidth,
  ]);
  const playheadAnchorX = viewportWidth / 4;
  const leadingSpace = Math.max(10, playheadAnchorX - headerWidth * svgScale);
  const trailingSpace = viewportWidth - playheadAnchorX;

  useLayoutEffect(() => {
    if (!scrollRef?.current) return;

    const targetOffset = Math.max(
      0,
      leadingSpace + playheadX * svgScale - playheadAnchorX,
    );
    scrollRef.current.scrollTo({ x: targetOffset, animated: false });
  }, [leadingSpace, playheadAnchorX, playheadX, scrollRef, svgScale]);

  // Retain the engraved score between animation frames. Fresh arrays of
  // unchanged active IDs must not invalidate the cached notation.
  const trebleActiveKey = JSON.stringify(activeTrebleNoteIds);
  const bassActiveKey = JSON.stringify(activeBassNoteIds);
  const trebleActive = useMemo(
    () => new Set<string>(JSON.parse(trebleActiveKey)), [trebleActiveKey],
  );
  const bassActive = useMemo(
    () => new Set<string>(JSON.parse(bassActiveKey)), [bassActiveKey],
  );
  const cursorLayer = (
          <Rect
            x={playheadX - 1}
            y={TREBLE_TOP_Y - 8}
            width={2}
            height={BASS_BOTTOM_Y - TREBLE_TOP_Y + 16}
            fill="#FFD700"
            opacity={0.5}
          />  );
  const notation = useMemo(() => (
    <G>
          <Defs>
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
          {/* Opening barline shared by the two staves */}
          <Line
            x1={BRACE_WIDTH + 6}
            y1={TREBLE_TOP_Y}
            x2={BRACE_WIDTH + 6}
            y2={BASS_BOTTOM_Y}
            stroke="#64748B"
            strokeWidth={1.25}
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
                  stroke="#64748B"
                  strokeWidth={1}
                />
                {/* Bass Staff Line */}
                <Line
                  x1={BRACE_WIDTH + 6}
                  y1={bassLineY}
                  x2={totalSvgWidth - 20}
                  y2={bassLineY}
                  stroke="#64748B"
                  strokeWidth={1}
                />
              </G>
            );
          })}

          {/* ── 3. Clefs Header (Treble, Bass, Key Signatures, Time Sig) ────── */}
          <G id="clef-and-time-header">
            {/* Treble Clef Symbol (SMuFL Bravura G-Clef aligned to G4-line) */}
            <G
              transform={`translate(${BRACE_WIDTH + 8}, ${TREBLE_BOTTOM_Y - LINE_SPACING}) scale(0.032)`}
            >
              <Path d={BRAVURA_GLYPHS.gClef.path} fill="#F8FAFC" />
            </G>

            {/* Bass Clef Symbol (SMuFL Bravura F-Clef aligned to F3-line with dots in spaces 3 & 4) */}
            <G
              transform={`translate(${BRACE_WIDTH + 8}, ${BASS_TOP_Y + LINE_SPACING}) scale(0.0333)`}
            >
              <Path d={BRAVURA_GLYPHS.fClef.path} fill="#F8FAFC" />
            </G>

            {/* Key Signature Accidentals */}
            {keySigGlyphs.treble.map((g, idx) => (
              <AccidentalGlyph key={`key-t-${idx}`} symbol={g.type === "flat" ? "b" : "#"} x={g.x} y={g.y} color="#CBD5E1" />
            ))}
            {keySigGlyphs.bass.map((g, idx) => (
              <AccidentalGlyph key={`key-b-${idx}`} symbol={g.type === "flat" ? "b" : "#"} x={g.x} y={g.y} color="#CBD5E1" />
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
                  strokeWidth={isFinalMeasure ? 2.5 : 1}
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
                  const isActive = trebleActive.has(note.id);
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
                    42,
                    NOTEHEAD_STEM_X_OFFSET,
                    NOTEHEAD_STEM_Y_OFFSET,
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
                        <AccidentalGlyph
                          symbol={parsed.accidental}
                          x={noteX - 14}
                          y={noteY}
                          color={isActive ? "#FFD700" : "#CBD5E1"}
                        />
                      )}

                      <NoteGlyph
                        x={noteX}
                        y={noteY}
                        durationBeats={note.durationBeats}
                        stem={stem}
                        staffTopY={TREBLE_TOP_Y}
                        active={isActive}
                        activeFill="url(#activeTrebleGrad)"
                        inactiveFill="#F8FAFC"
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
                  const isActive = bassActive.has(note.id);
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
                    42,
                    NOTEHEAD_STEM_X_OFFSET,
                    NOTEHEAD_STEM_Y_OFFSET,
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
                        <AccidentalGlyph
                          symbol={parsed.accidental}
                          x={noteX - 14}
                          y={noteY}
                          color={isActive ? "#FACC15" : "#CBD5E1"}
                        />
                      )}

                      <NoteGlyph
                        x={noteX}
                        y={noteY}
                        durationBeats={note.durationBeats}
                        stem={stem}
                        staffTopY={BASS_TOP_Y}
                        active={isActive}
                        activeFill="url(#activeBassGrad)"
                        inactiveFill="#E2E8F0"
                      />
                    </G>
                  );
                })}
              </G>
            );
          })}

    </G>
  ), [bassActive, headerWidth, hymn, keySigGlyphs, measuresData, timeSigX, totalSvgWidth, trebleActive]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => {
          setViewportWidth(event.nativeEvent.layout.width);
          setViewportHeight(event.nativeEvent.layout.height);
        }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minWidth: Math.max(
              viewportWidth,
              totalSvgWidth * svgScale + leadingSpace + trailingSpace,
            ),
            paddingLeft: leadingSpace,
            paddingRight: trailingSpace + 10,
          },
        ]}
      >
        <Svg
          width={totalSvgWidth * svgScale}
          height={TOTAL_SVG_HEIGHT * svgScale}
          viewBox={`0 0 ${totalSvgWidth} ${TOTAL_SVG_HEIGHT}`}
          preserveAspectRatio="xMinYMid meet"
        >
          {cursorLayer}
          {notation}
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
    alignItems: "center",
    justifyContent: "flex-start",
  },
});

interface NoteGlyphProps {
  x: number;
  y: number;
  durationBeats: number;
  stem: ReturnType<typeof getStemGeometry>;
  staffTopY: number;
  active: boolean;
  activeFill: string;
  inactiveFill: string;
}

const ACCIDENTAL_GLYPHS: Record<string, BravuraGlyph> = {
  "#": BRAVURA_NOTE_GLYPHS.accidentalSharp,
  b: BRAVURA_NOTE_GLYPHS.accidentalFlat,
  n: BRAVURA_NOTE_GLYPHS.accidentalNatural,
};

function AccidentalGlyph({
  symbol,
  x,
  y,
  color,
}: {
  symbol: string;
  x: number;
  y: number;
  color: string;
}) {
  const glyph = ACCIDENTAL_GLYPHS[symbol];
  if (!glyph) return null;
  const scale = LINE_SPACING / BRAVURA_STAFF_SPACE_UNITS;
  const width = glyph.bounds[2] - glyph.bounds[0];

  return (
    <G transform={`translate(${x - (width * scale) / 2}, ${y}) scale(${scale}, ${-scale})`}>
      <Path d={glyph.path} fill={color} />
    </G>
  );
}

function NoteGlyph({
  x,
  y,
  durationBeats,
  stem,
  staffTopY,
  active,
  activeFill,
  inactiveFill,
}: NoteGlyphProps) {
  const notation = getNoteDurationNotation(durationBeats);
  const noteFill = active ? activeFill : inactiveFill;
  const noteheadGlyph = notation.notehead === 'whole'
    ? BRAVURA_NOTE_GLYPHS.noteheadWhole
    : notation.notehead === 'half'
      ? BRAVURA_NOTE_GLYPHS.noteheadHalf
      : BRAVURA_NOTE_GLYPHS.noteheadBlack;
  const glyphWidth = noteheadGlyph.bounds[2] - noteheadGlyph.bounds[0];
  const glyphScale = LINE_SPACING / BRAVURA_STAFF_SPACE_UNITS;
  const isOnStaffLine = Math.abs(((y - staffTopY) / LINE_SPACING) - Math.round((y - staffTopY) / LINE_SPACING)) < 0.001;
  const dotY = isOnStaffLine ? y - LINE_SPACING / 2 : y;
  const flagsUp = [
    BRAVURA_NOTE_GLYPHS.flag8thUp,
    BRAVURA_NOTE_GLYPHS.flag16thUp,
    BRAVURA_NOTE_GLYPHS.flag32ndUp,
    BRAVURA_NOTE_GLYPHS.flag64thUp,
    BRAVURA_NOTE_GLYPHS.flag128thUp,
  ];
  const flagsDown = [
    BRAVURA_NOTE_GLYPHS.flag8thDown,
    BRAVURA_NOTE_GLYPHS.flag16thDown,
    BRAVURA_NOTE_GLYPHS.flag32ndDown,
    BRAVURA_NOTE_GLYPHS.flag64thDown,
    BRAVURA_NOTE_GLYPHS.flag128thDown,
  ];
  const flagGlyph = notation.flags > 0
    ? (stem.direction === 'up' ? flagsUp : flagsDown)[Math.min(notation.flags, 5) - 1]
    : undefined;

  return (
    <G>
      {notation.hasStem && (
        <Line
          x1={stem.stemX}
          y1={stem.stemStartY}
          x2={stem.stemX}
          y2={stem.stemEndY}
          stroke={active ? '#FFD700' : inactiveFill}
          strokeWidth={1.4}
        />
      )}
      <G transform={`translate(${x - (glyphWidth * glyphScale) / 2}, ${y}) scale(${glyphScale}, ${-glyphScale})`}>
        <Path d={noteheadGlyph.path} fill={noteFill} />
      </G>
      {Array.from({ length: notation.dots }).map((_, index) => (
        <Circle
          key={`dot-${index}`}
          cx={x + 12 + index * 5}
          cy={dotY}
          r={1.8}
          fill={active ? '#FFD700' : inactiveFill}
        />
      ))}
      {flagGlyph && (
        <G transform={`translate(${stem.stemX}, ${stem.stemEndY}) scale(${glyphScale}, ${-glyphScale})`}>
          <Path d={flagGlyph.path} fill={active ? '#FFD700' : inactiveFill} />
        </G>
      )}
    </G>
  );
}
