import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, TouchableOpacity, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  FeGaussianBlur,
  Filter,
  G,
  Line,
  Path,
  Rect,
  Text,
} from 'react-native-svg';

export interface TargetNote {
  id: string;
  pitch?: string; // e.g., 'C4', 'G4', 'Bb4', 'Eb5'
  pitchName?: string; // backward compatibility with TargetNote model
  frequencyHz?: number;
  timestampMs?: number;
  durationMs?: number;
  xPosition?: number;
  yPosition?: number;
  label?: string;
  accidental?: '#' | 'b' | 'n';
}

export type NoteHitFeedback = 'correct' | 'incorrect' | 'pending' | 'hit' | 'miss';

export interface SvgSheetCanvasProps {
  notes: TargetNote[];
  activeNoteId: string | null;
  width: number;
  height: number;
  clef?: 'treble' | 'bass';
  keySignature?: string;
  timeSignature?: string;
  tempoBpm?: number;
  isPlaying?: boolean;
  tempoMultiplier?: number;
  onTogglePlay?: () => void;
  onTempoChange?: (multiplier: number) => void;
  highlightColor?: string;
  hitFeedback?: Record<string, NoteHitFeedback>;
  onNotePress?: (note: TargetNote) => void;
  onSheetPress?: (xRatio: number) => void;
  showControls?: boolean;
}

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 320;

const LINE_SPACING = 14;
const STAFF_HEIGHT = LINE_SPACING * 4;
const LEFT_MARGIN = 28;
const STAFF_RIGHT = VIEW_WIDTH - 24;
const CLEF_X = 52;
const NOTE_END_X = VIEW_WIDTH - 40;

const MIDDLE_C_STEP = 28; // C4
const TREBLE_BOTTOM_STEP = 30; // E4
const TREBLE_TOP_STEP = 38; // F5
const BASS_TOP_STEP = 26; // A3
const BASS_BOTTOM_STEP = 18; // G2

import {
  BRAVURA_GLYPHS,
  getTimeSigGlyphPath,
  parseTimeSignature,
} from '../utils/musicNotationUtils';

const STAFF_INK = '#1E293B';
const DEFAULT_NOTE = '#0F172A';
const DEFAULT_HIGHLIGHT = '#00C2FF';
const HIT_CORRECT = '#10B981';
const HIT_INCORRECT = '#EF4444';

interface KeySignatureInfo {
  type: '#' | 'b';
  count: number;
  displayName: string;
}

const KEY_ACCIDENTALS: Record<string, KeySignatureInfo> = {
  C: { type: '#', count: 0, displayName: 'C Major' },
  Am: { type: '#', count: 0, displayName: 'A Minor' },
  'C Major': { type: '#', count: 0, displayName: 'C Major' },
  'A Minor': { type: '#', count: 0, displayName: 'A Minor' },

  G: { type: '#', count: 1, displayName: 'G Major (1♯)' },
  Em: { type: '#', count: 1, displayName: 'E Minor (1♯)' },
  'G Major': { type: '#', count: 1, displayName: 'G Major (1♯)' },
  '1#': { type: '#', count: 1, displayName: '1 Sharp' },
  '1': { type: '#', count: 1, displayName: '1 Sharp' },

  D: { type: '#', count: 2, displayName: 'D Major (2♯)' },
  Bm: { type: '#', count: 2, displayName: 'B Minor (2♯)' },
  'D Major': { type: '#', count: 2, displayName: 'D Major (2♯)' },
  '2#': { type: '#', count: 2, displayName: '2 Sharps' },
  '2': { type: '#', count: 2, displayName: '2 Sharps' },

  A: { type: '#', count: 3, displayName: 'A Major (3♯)' },
  'F#m': { type: '#', count: 3, displayName: 'F♯ Minor (3♯)' },
  'A Major': { type: '#', count: 3, displayName: 'A Major (3♯)' },
  '3#': { type: '#', count: 3, displayName: '3 Sharps' },
  '3': { type: '#', count: 3, displayName: '3 Sharps' },

  E: { type: '#', count: 4, displayName: 'E Major (4♯)' },
  'C#m': { type: '#', count: 4, displayName: 'C♯ Minor (4♯)' },
  'E Major': { type: '#', count: 4, displayName: 'E Major (4♯)' },

  B: { type: '#', count: 5, displayName: 'B Major (5♯)' },
  'G#m': { type: '#', count: 5, displayName: 'G♯ Minor (5♯)' },

  'F#': { type: '#', count: 6, displayName: 'F♯ Major (6♯)' },
  'C#': { type: '#', count: 7, displayName: 'C♯ Major (7♯)' },

  F: { type: 'b', count: 1, displayName: 'F Major (1♭)' },
  Dm: { type: 'b', count: 1, displayName: 'D Minor (1♭)' },
  'F Major': { type: 'b', count: 1, displayName: 'F Major (1♭)' },
  '1b': { type: 'b', count: 1, displayName: '1 Flat' },
  '-1': { type: 'b', count: 1, displayName: '1 Flat' },

  Bb: { type: 'b', count: 2, displayName: 'B♭ Major (2♭)' },
  Gm: { type: 'b', count: 2, displayName: 'G Minor (2♭)' },
  'Bb Major': { type: 'b', count: 2, displayName: 'B♭ Major (2♭)' },
  'B-flat': { type: 'b', count: 2, displayName: 'B♭ Major (2♭)' },
  '2b': { type: 'b', count: 2, displayName: '2 Flats' },
  '-2': { type: 'b', count: 2, displayName: '2 Flats' },

  Eb: { type: 'b', count: 3, displayName: 'E♭ Major (3♭)' },
  Cm: { type: 'b', count: 3, displayName: 'C Minor (3♭)' },
  'Eb Major': { type: 'b', count: 3, displayName: 'E♭ Major (3♭)' },
  'E-flat': { type: 'b', count: 3, displayName: 'E♭ Major (3♭)' },
  '3b': { type: 'b', count: 3, displayName: '3 Flats' },
  '-3': { type: 'b', count: 3, displayName: '3 Flats' },

  Ab: { type: 'b', count: 4, displayName: 'A♭ Major (4♭)' },
  Fm: { type: 'b', count: 4, displayName: 'F Minor (4♭)' },
  'Ab Major': { type: 'b', count: 4, displayName: 'A♭ Major (4♭)' },

  Db: { type: 'b', count: 5, displayName: 'D♭ Major (5♭)' },
  Gb: { type: 'b', count: 6, displayName: 'G♭ Major (6♭)' },
  Cb: { type: 'b', count: 7, displayName: 'C♭ Major (7♭)' },
};

const SHARP_STEPS_FROM_BOTTOM = {
  treble: [8, 5, 9, 6, 3, 7, 4],
  bass: [6, 3, 7, 4, 1, 5, 2],
};

const FLAT_STEPS_FROM_BOTTOM = {
  treble: [4, 7, 3, 6, 2, 5, 1],
  bass: [2, 5, 1, 4, 0, 3, -1],
};

const parsePitchToStep = (pitchStr: string): number => {
  const match = pitchStr.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) return MIDDLE_C_STEP;
  const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const noteIndex = noteNames.indexOf(match[1]);
  const octave = parseInt(match[3], 10);
  return octave * 7 + noteIndex;
};

const resolveNoteColor = (
  noteId: string,
  activeNoteId: string | null,
  highlightColor: string,
  hitFeedback?: Record<string, NoteHitFeedback>,
): string => {
  const feedback = hitFeedback?.[noteId];
  if (feedback === 'correct' || feedback === 'hit') return HIT_CORRECT;
  if (feedback === 'incorrect' || feedback === 'miss') return HIT_INCORRECT;
  if (noteId === activeNoteId) return highlightColor;
  return DEFAULT_NOTE;
};

const staffLineYs = (topY: number): number[] =>
  [0, 1, 2, 3, 4].map((index) => topY + index * LINE_SPACING);

const ledgerYsForNote = (
  step: number,
  onTreble: boolean,
  trebleBottomY: number,
  bassTopY: number,
): number[] => {
  const half = LINE_SPACING / 2;
  const ys: number[] = [];

  if (onTreble) {
    if (step > TREBLE_TOP_STEP) {
      for (let s = TREBLE_TOP_STEP + 2; s <= step; s += 2) {
        ys.push(trebleBottomY - (s - TREBLE_BOTTOM_STEP) * half);
      }
    }
    if (step < TREBLE_BOTTOM_STEP) {
      for (let s = TREBLE_BOTTOM_STEP - 2; s >= step; s -= 2) {
        ys.push(trebleBottomY - (s - TREBLE_BOTTOM_STEP) * half);
      }
    }
  } else {
    if (step > BASS_TOP_STEP) {
      for (let s = BASS_TOP_STEP + 2; s <= step; s += 2) {
        ys.push(bassTopY + (BASS_TOP_STEP - s) * half);
      }
    }
    if (step < BASS_BOTTOM_STEP) {
      for (let s = BASS_BOTTOM_STEP - 2; s >= step; s -= 2) {
        ys.push(bassTopY + (BASS_TOP_STEP - s) * half);
      }
    }
  }

  return ys;
};

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5];

const SvgSheetCanvas: React.FC<SvgSheetCanvasProps> = ({
  notes,
  activeNoteId,
  width,
  height,
  keySignature = 'C',
  timeSignature = '4/4',
  tempoBpm = 76,
  isPlaying = false,
  tempoMultiplier = 1.0,
  onTogglePlay,
  onTempoChange,
  highlightColor = DEFAULT_HIGHLIGHT,
  hitFeedback,
  onNotePress,
  onSheetPress,
  showControls = false,
}) => {
  const trebleTopY = 54;
  const trebleBottomY = trebleTopY + STAFF_HEIGHT;
  const bassTopY = trebleBottomY + LINE_SPACING * 3.25;
  const bassBottomY = bassTopY + STAFF_HEIGHT;
  const braceMidY = (trebleTopY + bassBottomY) / 2;

  const keyInfo = KEY_ACCIDENTALS[keySignature] ?? KEY_ACCIDENTALS.C;
  const accidentalCount = keyInfo.count;
  const accidentalGlyph = keyInfo.type === '#' ? '♯' : '♭';
  const keyEndX = CLEF_X + 46 + accidentalCount * 16;
  const { beats, beatUnit } = parseTimeSignature(timeSignature);

  const dynamicNoteStartX = Math.max(195, keyEndX + 52);

  const yForStep = (step: number, onTreble: boolean): number => {
    const half = LINE_SPACING / 2;
    if (onTreble) {
      return trebleBottomY - (step - TREBLE_BOTTOM_STEP) * half;
    }
    return bassTopY + (BASS_TOP_STEP - step) * half;
  };

  const renderStaff = (topY: number, key: string) =>
    staffLineYs(topY).map((y, index) => (
      <Line
        key={`${key}-${index}`}
        x1={LEFT_MARGIN + 18}
        y1={y}
        x2={STAFF_RIGHT}
        y2={y}
        stroke={STAFF_INK}
        strokeWidth={1.35}
        strokeLinecap="round"
      />
    ));

  const renderKeyAccidentals = (staff: 'treble' | 'bass', staffBottomY: number) => {
    if (accidentalCount === 0) return null;
    const offsets =
      keyInfo.type === '#' ? SHARP_STEPS_FROM_BOTTOM[staff] : FLAT_STEPS_FROM_BOTTOM[staff];
    return offsets.slice(0, accidentalCount).map((stepsFromBottom, index) => {
      const y = staffBottomY - stepsFromBottom * (LINE_SPACING / 2) + 6;
      return (
        <Text
          key={`${staff}-acc-${index}`}
          x={CLEF_X + 48 + index * 16}
          y={y}
          fontSize={keyInfo.type === '#' ? 22 : 24}
          fill={STAFF_INK}
          fontWeight="bold"
        >
          {accidentalGlyph}
        </Text>
      );
    });
  };

  const renderTimeSignature = (topY: number, bottomY: number) => {
    const timeSigScale = LINE_SPACING / 250;
    const topChars = beats.split('');
    const botChars = beatUnit.split('');
    const timeSigX = keyEndX + 16;

    return (
      <G>
        {/* Numerator between line 3 and line 5 (baseline on middle Line 3) */}
        <G transform={`translate(${timeSigX}, ${topY + LINE_SPACING * 2}) scale(${timeSigScale})`}>
          {topChars.map((ch, idx) => (
            <G key={`ts-top-${idx}`} transform={`translate(${idx * 420}, 0)`}>
              <Path d={getTimeSigGlyphPath(ch)} fill={STAFF_INK} />
            </G>
          ))}
        </G>

        {/* Denominator between line 1 and line 3 (baseline on bottom Line 1) */}
        <G transform={`translate(${timeSigX}, ${bottomY}) scale(${timeSigScale})`}>
          {botChars.map((ch, idx) => (
            <G key={`ts-bot-${idx}`} transform={`translate(${idx * 420}, 0)`}>
              <Path d={getTimeSigGlyphPath(ch)} fill={STAFF_INK} />
            </G>
          ))}
        </G>
      </G>
    );
  };

  const renderedNotes = useMemo(() => {
    const safeNotes = notes ?? [];
    const count = Math.max(safeNotes.length, 1);
    const usableWidth = NOTE_END_X - dynamicNoteStartX;
    const noteSpacing = safeNotes.length > 1 ? usableWidth / (safeNotes.length - 1) : 0;

    return safeNotes.map((note, index) => {
      const pitchString = note.pitch ?? note.pitchName ?? 'C4';
      const step = parsePitchToStep(pitchString);
      const onTreble = step >= MIDDLE_C_STEP;
      const x = dynamicNoteStartX + (safeNotes.length === 1 ? usableWidth / count : index * noteSpacing);
      const y = yForStep(step, onTreble);
      const color = resolveNoteColor(note.id, activeNoteId, highlightColor, hitFeedback);
      const isActive = note.id === activeNoteId;
      const stemUp = onTreble
        ? step < TREBLE_BOTTOM_STEP + 4
        : step < BASS_BOTTOM_STEP + 4;
      const stemX = stemUp ? x + 5.5 : x - 5.5;
      const stemY2 = stemUp ? y - LINE_SPACING * 3.4 : y + LINE_SPACING * 3.4;
      const ledgers = ledgerYsForNote(step, onTreble, trebleBottomY, bassTopY);

      return (
        <G
          key={note.id}
          onPress={onNotePress ? () => onNotePress(note) : undefined}
        >
          <Rect
            x={x - 20}
            y={y - 24}
            width={40}
            height={48}
            fill="transparent"
          />

          {isActive && (
            <G>
              <Ellipse cx={x} cy={y} rx={18} ry={18} fill={highlightColor} opacity={0.25} filter="url(#glow)" />
              <Ellipse cx={x} cy={y} rx={26} ry={26} fill={highlightColor} opacity={0.12} filter="url(#glow)" />
            </G>
          )}

          {ledgers.map((ly, ledgerIndex) => (
            <Line
              key={`ledger-${note.id}-${ledgerIndex}`}
              x1={x - 14}
              y1={ly}
              x2={x + 14}
              y2={ly}
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          ))}

          <Line
            x1={stemX}
            y1={y}
            x2={stemX}
            y2={stemY2}
            stroke={color}
            strokeWidth={1.6}
            strokeLinecap="round"
          />

          <Ellipse
            cx={x}
            cy={y}
            rx={7.5}
            ry={5.2}
            fill={color}
            transform={`rotate(-22 ${x} ${y})`}
          />

          {note.accidental ? (
            <Text x={x - 20} y={y + 6} fontSize={18} fill={color} fontWeight="bold">
              {note.accidental === '#' ? '♯' : note.accidental === 'b' ? '♭' : '♮'}
            </Text>
          ) : null}

          {note.label ? (
            <Text
              x={x}
              y={stemUp ? stemY2 - 8 : stemY2 + 16}
              fontSize={11}
              fontWeight="bold"
              fill={isActive ? highlightColor : '#64748B'}
              textAnchor="middle"
            >
              {note.label}
            </Text>
          ) : null}
        </G>
      );
    });
  }, [
    notes,
    activeNoteId,
    highlightColor,
    hitFeedback,
    onNotePress,
    dynamicNoteStartX,
    trebleBottomY,
    bassTopY,
  ]);

  const handleSheetPress = (event: { nativeEvent: { locationX?: number; offsetX?: number } }) => {
    if (!onSheetPress || width <= 0) return;
    const tapX = event.nativeEvent.locationX ?? event.nativeEvent.offsetX ?? 0;
    onSheetPress(Math.max(0, Math.min(1, tapX / width)));
  };

  const calculatedBpm = Math.round(tempoBpm * tempoMultiplier);

  return (
    <View style={[styles.canvasWrapper, { width, height }]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMinYMid meet"
      >
        <Defs>
          <Filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <FeGaussianBlur stdDeviation="3" result="blur" />
          </Filter>
        </Defs>

        <Rect
          x={0}
          y={0}
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
          fill="transparent"
          onPress={onSheetPress ? handleSheetPress : undefined}
        />

        {/* Left brace uniting treble + bass */}
        <Path
          d={`M ${LEFT_MARGIN + 10} ${trebleTopY}
              C ${LEFT_MARGIN - 10} ${trebleTopY + 18},
                ${LEFT_MARGIN - 12} ${braceMidY - 28},
                ${LEFT_MARGIN - 20} ${braceMidY}
              C ${LEFT_MARGIN - 12} ${braceMidY + 28},
                ${LEFT_MARGIN - 10} ${bassBottomY - 18},
                ${LEFT_MARGIN + 10} ${bassBottomY}`}
          fill="none"
          stroke={STAFF_INK}
          strokeWidth={3.2}
          strokeLinecap="round"
        />

        {/* System bar lines */}
        <Line
          x1={LEFT_MARGIN + 18}
          y1={trebleTopY}
          x2={LEFT_MARGIN + 18}
          y2={bassBottomY}
          stroke={STAFF_INK}
          strokeWidth={3.4}
          strokeLinecap="square"
        />
        <Line
          x1={STAFF_RIGHT}
          y1={trebleTopY}
          x2={STAFF_RIGHT}
          y2={bassBottomY}
          stroke={STAFF_INK}
          strokeWidth={1.6}
        />

        {renderStaff(trebleTopY, 'treble')}
        {renderStaff(bassTopY, 'bass')}

        {/* Treble (G) clef (SMuFL Bravura G-Clef aligned to G4-line) */}
        <G transform={`translate(${CLEF_X}, ${trebleTopY + LINE_SPACING * 3}) scale(${LINE_SPACING / 250})`}>
          <Path d={BRAVURA_GLYPHS.gClef.path} fill={STAFF_INK} />
        </G>

        {/* Bass (F) clef (SMuFL Bravura F-Clef aligned to F3-line with dots in spaces 3 & 4) */}
        <G transform={`translate(${CLEF_X}, ${bassTopY + LINE_SPACING}) scale(${LINE_SPACING / 250})`}>
          <Path d={BRAVURA_GLYPHS.fClef.path} fill={STAFF_INK} />
        </G>

        {renderKeyAccidentals('treble', trebleBottomY)}
        {renderKeyAccidentals('bass', bassBottomY)}

        {renderTimeSignature(trebleTopY, trebleBottomY)}
        {renderTimeSignature(bassTopY, bassBottomY)}

        {renderedNotes}
      </Svg>

      {/* Floating In-Song Pause & Speed Control Bar */}
      {showControls && (
        <View style={styles.floatingControlBar}>
          {onTogglePlay && (
            <TouchableOpacity
              style={[styles.floatingPlayBtn, isPlaying && styles.floatingPlayBtnActive]}
              onPress={onTogglePlay}
              activeOpacity={0.8}
            >
              <RNText style={styles.floatingPlayBtnText}>
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </RNText>
            </TouchableOpacity>
          )}

          <View style={styles.floatingSpeedGroup}>
            <RNText style={styles.floatingBpmLabel}>{calculatedBpm} BPM</RNText>
            <View style={styles.floatingSpeedPills}>
              {SPEED_OPTIONS.map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.floatingSpeedPill,
                    tempoMultiplier === speed && styles.floatingSpeedPillActive,
                  ]}
                  onPress={() => onTempoChange?.(speed)}
                  activeOpacity={0.75}
                >
                  <RNText
                    style={[
                      styles.floatingSpeedPillText,
                      tempoMultiplier === speed && styles.floatingSpeedPillTextActive,
                    ]}
                  >
                    {speed}x
                  </RNText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  canvasWrapper: {
    position: 'relative',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    overflow: 'hidden',
  },
  floatingControlBar: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingPlayBtn: {
    backgroundColor: '#00C2FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  floatingPlayBtnActive: {
    backgroundColor: '#F59E0B',
  },
  floatingPlayBtnText: {
    color: '#080C14',
    fontSize: 11,
    fontWeight: '900',
  },
  floatingSpeedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingBpmLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  floatingSpeedPills: {
    flexDirection: 'row',
    gap: 4,
  },
  floatingSpeedPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  floatingSpeedPillActive: {
    backgroundColor: '#00C2FF',
  },
  floatingSpeedPillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  floatingSpeedPillTextActive: {
    color: '#080C14',
    fontWeight: '900',
  },
});

export default React.memo(SvgSheetCanvas);
