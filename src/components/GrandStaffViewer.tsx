import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
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
} from 'react-native-svg';
import type { ClefNote, GrandStaffHymn } from '../types/music';
import {
  BRAVURA_GLYPHS,
  getBeatX,
  getKeySignatureGlyphs,
  getLedgerLineYs,
  getPitchStaffY,
  getStemGeometry,
  getTimeSigGlyphPath,
  parsePitch,
  parseTimeSignature,
} from '../utils/musicNotationUtils';

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
const TIME_SIG_WIDTH = 24;
const TOP_MARGIN = 36;
const CLEF_GAP = 58; // Vertical gap between Treble Line 1 and Bass Line 5
const LYRICS_OFFSET_Y = 32;

const TREBLE_TOP_Y = TOP_MARGIN; // F5 (Line 5)
const TREBLE_BOTTOM_Y = TREBLE_TOP_Y + STAFF_HEIGHT; // E4 (Line 1)
const BASS_TOP_Y = TREBLE_BOTTOM_Y + CLEF_GAP; // A3 (Line 5)
const BASS_BOTTOM_Y = BASS_TOP_Y + STAFF_HEIGHT; // G2 (Line 1)
const LYRICS_Y = BASS_BOTTOM_Y + LYRICS_OFFSET_Y;
const TOTAL_SVG_HEIGHT = LYRICS_Y + 48;

const MEASURE_BASE_WIDTH = 230;

/**
 * Classical Grand Staff Curly Brace SVG Path
 */
const GRAND_STAFF_BRACE_PATH = (topY: number, bottomY: number): string => {
  const midY = (topY + bottomY) / 2;
  const height = bottomY - topY;
  const cpX = 14;
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

  // Compute key signature accidentals
  const keySigGlyphs = useMemo(() => {
    return getKeySignatureGlyphs(
      hymn.keySignature || 'C',
      BRACE_WIDTH + CLEF_WIDTH + 8,
      LINE_SPACING,
      TREBLE_BOTTOM_Y,
      BASS_BOTTOM_Y,
    );
  }, [hymn.keySignature]);

  const { beats: timeBeats, beatUnit: timeBeatUnit } = parseTimeSignature(hymn.timeSignature);

  // Total width of clef header before measure 0 starts
  const headerWidth = useMemo(() => {
    const keyAccidentalCount = Math.max(keySigGlyphs.treble.length, 0);
    const keyWidth = keyAccidentalCount > 0 ? keyAccidentalCount * 12 + 6 : 4;
    return BRACE_WIDTH + CLEF_WIDTH + keyWidth + TIME_SIG_WIDTH + 14;
  }, [keySigGlyphs]);

  const totalSvgWidth = useMemo(() => {
    return headerWidth + hymn.totalMeasures * MEASURE_BASE_WIDTH + 50;
  }, [headerWidth, hymn.totalMeasures]);

  // Group notes by measure
  const measuresData = useMemo(() => {
    const list = [];
    for (let m = 0; m < hymn.totalMeasures; m++) {
      const treble = hymn.trebleNotes.filter((n) => n.measure === m);
      const bass = hymn.bassNotes.filter((n) => n.measure === m);
      const lyrics = hymn.lyrics.filter((l) => l.measure === m);
      list.push({ measureIndex: m, treble, bass, lyrics });
    }
    return list;
  }, [hymn]);

  // Calculate exact X position of playhead
  const playheadX = useMemo(() => {
    const safeMeasure = Math.max(0, Math.min(hymn.totalMeasures - 1, currentMeasure));
    const safeBeat = Math.max(1, Math.min(hymn.beatsPerMeasure + 1, currentBeat));
    const measureStartX = headerWidth + safeMeasure * MEASURE_BASE_WIDTH;
    return getBeatX(measureStartX, MEASURE_BASE_WIDTH, safeBeat, hymn.beatsPerMeasure);
  }, [currentMeasure, currentBeat, hymn.totalMeasures, hymn.beatsPerMeasure, headerWidth]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={[styles.scrollContent, { minWidth: Math.max(windowWidth, totalSvgWidth) }]}
      >
        <Svg width={totalSvgWidth} height={TOTAL_SVG_HEIGHT}>
          <Defs>
            <LinearGradient id="playheadGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity={1} />
              <Stop offset="50%" stopColor="#0284C7" stopOpacity={0.9} />
              <Stop offset="100%" stopColor="#38BDF8" stopOpacity={1} />
            </LinearGradient>

            <LinearGradient id="activeTrebleGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#38BDF8" />
              <Stop offset="100%" stopColor="#0EA5E9" />
            </LinearGradient>

            <LinearGradient id="activeBassGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FACC15" />
              <Stop offset="100%" stopColor="#EAB308" />
            </LinearGradient>

            <LinearGradient id="activeLyricBg" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#0284C7" stopOpacity={0.85} />
              <Stop offset="100%" stopColor="#38BDF8" stopOpacity={0.95} />
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
            <G transform={`translate(${BRACE_WIDTH + 8}, ${TREBLE_TOP_Y + 3 * LINE_SPACING}) scale(0.048)`}>
              <Path d={BRAVURA_GLYPHS.gClef.path} fill="#F8FAFC" />
            </G>

            {/* Bass Clef Symbol (SMuFL Bravura F-Clef aligned to F3-line with dots in spaces 3 & 4) */}
            <G transform={`translate(${BRACE_WIDTH + 8}, ${BASS_TOP_Y + LINE_SPACING}) scale(0.048)`}>
              <Path d={BRAVURA_GLYPHS.fClef.path} fill="#F8FAFC" />
            </G>

            {/* Key Signature Accidentals */}
            {keySigGlyphs.treble.map((g, idx) => (
              <SvgText
                key={`key-t-${idx}`}
                x={g.x}
                y={g.y + 4}
                fill="#38BDF8"
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
                fill="#38BDF8"
                fontSize={16}
                fontWeight="bold"
                textAnchor="middle"
              >
                {g.symbol}
              </SvgText>
            ))}

            {/* Time Signature on Treble Staff (SMuFL Engraved Numerals) */}
            <G transform={`translate(${headerWidth - 22}, ${TREBLE_TOP_Y + 2 * LINE_SPACING}) scale(0.048)`}>
              <Path d={getTimeSigGlyphPath(timeBeats)} fill="#F8FAFC" />
            </G>
            <G transform={`translate(${headerWidth - 22}, ${TREBLE_BOTTOM_Y}) scale(0.048)`}>
              <Path d={getTimeSigGlyphPath(timeBeatUnit)} fill="#F8FAFC" />
            </G>

            {/* Time Signature on Bass Staff (SMuFL Engraved Numerals) */}
            <G transform={`translate(${headerWidth - 22}, ${BASS_TOP_Y + 2 * LINE_SPACING}) scale(0.048)`}>
              <Path d={getTimeSigGlyphPath(timeBeats)} fill="#F8FAFC" />
            </G>
            <G transform={`translate(${headerWidth - 22}, ${BASS_BOTTOM_Y}) scale(0.048)`}>
              <Path d={getTimeSigGlyphPath(timeBeatUnit)} fill="#F8FAFC" />
            </G>
          </G>

          {/* ── 4. Measures, Barlines, Notes, and Synchronized Lyrics ───────── */}
          {measuresData.map(({ measureIndex, treble, bass, lyrics }) => {
            const measureStartX = headerWidth + measureIndex * MEASURE_BASE_WIDTH;
            const measureEndX = measureStartX + MEASURE_BASE_WIDTH;
            const isCurrentMeasure = measureIndex === currentMeasure;
            const isFinalMeasure = measureIndex === hymn.totalMeasures - 1;

            return (
              <G key={`measure-${measureIndex}`}>
                {/* Active Measure Glow */}
                {isCurrentMeasure && (
                  <Rect
                    x={measureStartX}
                    y={TREBLE_TOP_Y - 14}
                    width={MEASURE_BASE_WIDTH}
                    height={TOTAL_SVG_HEIGHT - 12}
                    fill="#0284C7"
                    fillOpacity={0.12}
                    rx={6}
                  />
                )}

                {/* Measure Number */}
                <SvgText
                  x={measureStartX + 8}
                  y={TREBLE_TOP_Y - 10}
                  fill={isCurrentMeasure ? '#38BDF8' : '#64748B'}
                  fontSize={11}
                  fontWeight={isCurrentMeasure ? 'bold' : 'normal'}
                >
                  m.{measureIndex + 1}
                </SvgText>

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
                  const noteX = getBeatX(measureStartX, MEASURE_BASE_WIDTH, note.beat, hymn.beatsPerMeasure);
                  const noteY = getPitchStaffY('treble', note.pitch, LINE_SPACING, TREBLE_BOTTOM_Y, BASS_BOTTOM_Y);
                  const isActive = activeTrebleNoteIds.includes(note.id);
                  const parsed = parsePitch(note.pitch);

                  // Calculate ledger lines
                  const ledgerYs = getLedgerLineYs(
                    'treble',
                    note.pitch,
                    LINE_SPACING,
                    TREBLE_TOP_Y,
                    TREBLE_BOTTOM_Y,
                    BASS_TOP_Y,
                    BASS_BOTTOM_Y,
                  );

                  // Calculate stem geometry
                  const stem = getStemGeometry('treble', note.pitch, noteX, noteY, 28, 6);

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
                          fill={isActive ? '#38BDF8' : '#CBD5E1'}
                          fontSize={13}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {parsed.accidental === '#' ? '♯' : '♭'}
                        </SvgText>
                      )}

                      {/* Notehead */}
                      <Circle
                        cx={noteX}
                        cy={noteY}
                        r={isActive ? 7.5 : 6}
                        fill={isActive ? 'url(#activeTrebleGrad)' : '#F8FAFC'}
                        stroke={isActive ? '#FFFFFF' : '#0F172A'}
                        strokeWidth={isActive ? 2 : 1}
                      />

                      {/* Note Stem */}
                      <Line
                        x1={stem.stemX}
                        y1={stem.stemStartY}
                        x2={stem.stemX}
                        y2={stem.stemEndY}
                        stroke={isActive ? '#38BDF8' : '#F1F5F9'}
                        strokeWidth={1.8}
                      />

                      {/* Pitch Label */}
                      <SvgText
                        x={noteX}
                        y={stem.direction === 'up' ? noteY + 16 : noteY - 14}
                        fill={isActive ? '#38BDF8' : '#94A3B8'}
                        fontSize={9}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {note.pitch}
                      </SvgText>
                    </G>
                  );
                })}

                {/* ── B. Bass Clef Notes ────────────────────────────────────── */}
                {bass.map((note) => {
                  const noteX = getBeatX(measureStartX, MEASURE_BASE_WIDTH, note.beat, hymn.beatsPerMeasure);
                  const noteY = getPitchStaffY('bass', note.pitch, LINE_SPACING, TREBLE_BOTTOM_Y, BASS_BOTTOM_Y);
                  const isActive = activeBassNoteIds.includes(note.id);
                  const parsed = parsePitch(note.pitch);

                  // Calculate ledger lines
                  const ledgerYs = getLedgerLineYs(
                    'bass',
                    note.pitch,
                    LINE_SPACING,
                    TREBLE_TOP_Y,
                    TREBLE_BOTTOM_Y,
                    BASS_TOP_Y,
                    BASS_BOTTOM_Y,
                  );

                  // Calculate stem geometry
                  const stem = getStemGeometry('bass', note.pitch, noteX, noteY, 28, 6);

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
                          fill={isActive ? '#FACC15' : '#CBD5E1'}
                          fontSize={13}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {parsed.accidental === '#' ? '♯' : '♭'}
                        </SvgText>
                      )}

                      {/* Notehead */}
                      <Circle
                        cx={noteX}
                        cy={noteY}
                        r={isActive ? 7.5 : 6}
                        fill={isActive ? 'url(#activeBassGrad)' : '#E2E8F0'}
                        stroke={isActive ? '#FFFFFF' : '#0F172A'}
                        strokeWidth={isActive ? 2 : 1}
                      />

                      {/* Note Stem */}
                      <Line
                        x1={stem.stemX}
                        y1={stem.stemStartY}
                        x2={stem.stemX}
                        y2={stem.stemEndY}
                        stroke={isActive ? '#FACC15' : '#CBD5E1'}
                        strokeWidth={1.8}
                      />

                      {/* Pitch Label */}
                      <SvgText
                        x={noteX}
                        y={stem.direction === 'up' ? noteY + 16 : noteY - 14}
                        fill={isActive ? '#FACC15' : '#64748B'}
                        fontSize={9}
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {note.pitch}
                      </SvgText>
                    </G>
                  );
                })}

                {/* ── C. Synchronized Lyrics Row (Exact X Match with Notes) ──── */}
                {lyrics.map((lyric, lyricIdx) => {
                  const lyricX = getBeatX(measureStartX, MEASURE_BASE_WIDTH, lyric.beat, hymn.beatsPerMeasure);
                  const globalLyricIndex = hymn.lyrics.findIndex(
                    (l) => l.measure === lyric.measure && l.beat === lyric.beat && l.text === lyric.text,
                  );
                  const isLyricActive = globalLyricIndex === activeLyricIndex;

                  return (
                    <G key={`lyric-${measureIndex}-${lyric.beat}-${lyricIdx}`}>
                      {/* Active Syllable Highlight Pill */}
                      {isLyricActive && (
                        <Rect
                          x={lyricX - 22}
                          y={LYRICS_Y - 14}
                          width={44}
                          height={24}
                          rx={12}
                          fill="url(#activeLyricBg)"
                        />
                      )}

                      <SvgText
                        x={lyricX}
                        y={LYRICS_Y + 2}
                        fill={isLyricActive ? '#FFFFFF' : '#E2E8F0'}
                        fontSize={isLyricActive ? 15 : 13}
                        fontWeight={isLyricActive ? 'bold' : '500'}
                        textAnchor="middle"
                      >
                        {lyric.text}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            );
          })}

          {/* ── 5. Animated Playhead Bar (Aligned through all 3 lanes) ───────── */}
          <G id="playhead">
            <Line
              x1={playheadX}
              y1={TREBLE_TOP_Y - 18}
              x2={playheadX}
              y2={LYRICS_Y + 24}
              stroke="url(#playheadGrad)"
              strokeWidth={3}
            />
            {/* Top Playhead Marker */}
            <Path
              d={`M ${playheadX} ${TREBLE_TOP_Y - 22} L ${playheadX + 7} ${TREBLE_TOP_Y - 15} L ${playheadX} ${TREBLE_TOP_Y - 8} L ${playheadX - 7} ${TREBLE_TOP_Y - 15} Z`}
              fill="#38BDF8"
            />
            {/* Bottom Glow Indicator */}
            <Circle cx={playheadX} cy={LYRICS_Y + 24} r={5} fill="#38BDF8" />
          </G>
        </Svg>
      </ScrollView>

      {/* Measure Jump & Navigation Chips Strip */}
      <View style={styles.measureJumpStrip}>
        <Text style={styles.measureJumpLabel}>MEASURES:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.measureChips}>
          {Array.from({ length: hymn.totalMeasures }).map((_, mIdx) => {
            const isCur = mIdx === currentMeasure;
            return (
              <TouchableOpacity
                key={`chip-${mIdx}`}
                style={[styles.measureChip, isCur && styles.measureChipActive]}
                onPress={() => onMeasurePress?.(mIdx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.measureChipText, isCur && styles.measureChipTextActive]}>
                  {mIdx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate-900
    borderRadius: 12,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  measureJumpStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  measureJumpLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 10,
    letterSpacing: 0.8,
  },
  measureChips: {
    flexDirection: 'row',
    gap: 6,
  },
  measureChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  measureChipActive: {
    backgroundColor: '#0284C7',
  },
  measureChipText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  measureChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
