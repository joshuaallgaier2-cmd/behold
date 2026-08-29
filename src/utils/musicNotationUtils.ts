/**
 * Music Notation Calculation and Coordinate Mapping Utilities
 * Provides exact diatonic step parsing, pitch-to-Y staff offsets,
 * ledger line generation, stem geometry, and key signature placements.
 */

export interface ParsedPitch {
  noteLetter: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
  accidental: '#' | 'b' | 'n' | null;
  octave: number;
  diatonicStep: number;
  pitchString: string;
}

const DIATONIC_BASE_MAP: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

/**
 * Standard reference diatonic steps (Middle C = C4 = 28)
 */
export const NOTATION_CONSTANTS = {
  MIDDLE_C_STEP: 28, // C4
  TREBLE_BOTTOM_STEP: 30, // E4 (Line 1)
  TREBLE_MIDDLE_STEP: 34, // B4 (Line 3)
  TREBLE_TOP_STEP: 38, // F5 (Line 5)
  BASS_BOTTOM_STEP: 18, // G2 (Line 1)
  BASS_MIDDLE_STEP: 22, // D3 (Line 3)
  BASS_TOP_STEP: 26, // A3 (Line 5)
};

/**
 * Parses scientific pitch notation (e.g. "C4", "Eb5", "F#3", "Ab2") into structured pitch information.
 */
export function parsePitch(pitch: string): ParsedPitch {
  const trimmed = pitch.trim();
  const letter = trimmed.charAt(0).toUpperCase() as 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
  let accidental: '#' | 'b' | 'n' | null = null;
  let octaveStr = '';

  for (let i = 1; i < trimmed.length; i++) {
    const ch = trimmed.charAt(i);
    if (ch === '#' || ch === 'b' || ch === 'n') {
      accidental = ch as '#' | 'b' | 'n';
    } else if (ch >= '0' && ch <= '9') {
      octaveStr += ch;
    }
  }

  const octave = parseInt(octaveStr || '4', 10);
  const baseStep = DIATONIC_BASE_MAP[letter] ?? 0;
  const diatonicStep = octave * 7 + baseStep;

  return {
    noteLetter: letter,
    accidental,
    octave,
    diatonicStep,
    pitchString: pitch,
  };
}

/**
 * Calculates the exact vertical Y-pixel position for a note on either Treble or Bass clef.
 * Each diatonic step is equal to (lineSpacing / 2).
 */
export function getPitchStaffY(
  clef: 'treble' | 'bass',
  pitch: string,
  lineSpacing: number,
  trebleBottomY: number,
  bassBottomY: number,
): number {
  const parsed = parsePitch(pitch);
  const halfStep = lineSpacing / 2;

  if (clef === 'treble') {
    const diff = parsed.diatonicStep - NOTATION_CONSTANTS.TREBLE_BOTTOM_STEP;
    return trebleBottomY - diff * halfStep;
  } else {
    const diff = parsed.diatonicStep - NOTATION_CONSTANTS.BASS_BOTTOM_STEP;
    return bassBottomY - diff * halfStep;
  }
}

/**
 * Computes all required ledger line Y coordinates for pitches exceeding standard 5-line staff boundaries.
 */
export function getLedgerLineYs(
  clef: 'treble' | 'bass',
  pitch: string,
  lineSpacing: number,
  trebleTopY: number,
  trebleBottomY: number,
  bassTopY: number,
  bassBottomY: number,
): number[] {
  const parsed = parsePitch(pitch);
  const lines: number[] = [];

  if (clef === 'treble') {
    // Low notes on Treble staff: Below E4 (step 30).
    // Ledger lines occur on even steps: 28 (Middle C), 26 (A3), 24 (F3), 22 (D3)...
    if (parsed.diatonicStep <= 28) {
      for (let s = 28; s >= parsed.diatonicStep; s -= 2) {
        const diff = s - NOTATION_CONSTANTS.TREBLE_BOTTOM_STEP;
        lines.push(trebleBottomY - diff * (lineSpacing / 2));
      }
    }
    // High notes on Treble staff: Above F5 (step 38).
    // Ledger lines occur on even steps: 40 (A5), 42 (C6), 44 (E6)...
    if (parsed.diatonicStep >= 40) {
      for (let s = 40; s <= parsed.diatonicStep; s += 2) {
        const diff = s - NOTATION_CONSTANTS.TREBLE_BOTTOM_STEP;
        lines.push(trebleBottomY - diff * (lineSpacing / 2));
      }
    }
  } else {
    // High notes on Bass staff: Above A3 (step 26).
    // Ledger lines occur on even steps: 28 (Middle C), 30 (E4), 32 (G4)...
    if (parsed.diatonicStep >= 28) {
      for (let s = 28; s <= parsed.diatonicStep; s += 2) {
        const diff = s - NOTATION_CONSTANTS.BASS_BOTTOM_STEP;
        lines.push(bassBottomY - diff * (lineSpacing / 2));
      }
    }
    // Low notes on Bass staff: Below G2 (step 18).
    // Ledger lines occur on even steps: 16 (E2), 14 (C2), 12 (A1)...
    if (parsed.diatonicStep <= 16) {
      for (let s = 16; s >= parsed.diatonicStep; s -= 2) {
        const diff = s - NOTATION_CONSTANTS.BASS_BOTTOM_STEP;
        lines.push(bassBottomY - diff * (lineSpacing / 2));
      }
    }
  }

  return lines;
}

export interface StemGeometry {
  direction: 'up' | 'down';
  stemX: number;
  stemStartY: number;
  stemEndY: number;
}

/**
 * Calculates correct standard stem direction and coordinates:
 * - Notes below the middle staff line (B4 treble / D3 bass) have stems pointing UP on the right side.
 * - Notes on or above the middle staff line have stems pointing DOWN on the left side.
 */
export function getStemGeometry(
  clef: 'treble' | 'bass',
  pitch: string,
  noteX: number,
  noteY: number,
  stemLength = 28,
  noteRadius = 5.5,
): StemGeometry {
  const parsed = parsePitch(pitch);
  const middleStep =
    clef === 'treble' ? NOTATION_CONSTANTS.TREBLE_MIDDLE_STEP : NOTATION_CONSTANTS.BASS_MIDDLE_STEP;

  const isStemUp = parsed.diatonicStep < middleStep;

  if (isStemUp) {
    return {
      direction: 'up',
      stemX: noteX + noteRadius,
      stemStartY: noteY,
      stemEndY: noteY - stemLength,
    };
  } else {
    return {
      direction: 'down',
      stemX: noteX - noteRadius,
      stemStartY: noteY,
      stemEndY: noteY + stemLength,
    };
  }
}

/**
 * Key signature accidental descriptor.
 */
export interface KeySignatureGlyph {
  type: 'sharp' | 'flat';
  symbol: string;
  pitch: string;
  x: number;
  y: number;
}

const KEY_SIGNATURE_PITCHES: Record<string, { treble: string[]; bass: string[] }> = {
  C: { treble: [], bass: [] },
  G: { treble: ['F#5'], bass: ['F#3'] },
  D: { treble: ['F#5', 'C#5'], bass: ['F#3', 'C#3'] },
  A: { treble: ['F#5', 'C#5', 'G#5'], bass: ['F#3', 'C#3', 'G#3'] },
  E: { treble: ['F#5', 'C#5', 'G#5', 'D#5'], bass: ['F#3', 'C#3', 'G#3', 'D#3'] },
  F: { treble: ['Bb4'], bass: ['Bb2'] },
  Bb: { treble: ['Bb4', 'Eb5'], bass: ['Bb2', 'Eb3'] },
  Eb: { treble: ['Bb4', 'Eb5', 'Ab4'], bass: ['Bb2', 'Eb3', 'Ab2'] },
  Ab: { treble: ['Bb4', 'Eb5', 'Ab4', 'Db5'], bass: ['Bb2', 'Eb3', 'Ab2', 'Db3'] },
};

/**
 * Computes key signature accidentals to render at the start of both staves.
 */
export function getKeySignatureGlyphs(
  keySig: string,
  startX: number,
  lineSpacing: number,
  trebleBottomY: number,
  bassBottomY: number,
): { treble: KeySignatureGlyph[]; bass: KeySignatureGlyph[] } {
  const normKey = (keySig || 'C').trim();
  const config = KEY_SIGNATURE_PITCHES[normKey] ?? KEY_SIGNATURE_PITCHES.C;
  const isFlatKey = normKey.includes('b') || normKey === 'F';
  const symbol = isFlatKey ? '♭' : '♯';
  const type: 'flat' | 'sharp' = isFlatKey ? 'flat' : 'sharp';
  const glyphSpacing = 11;

  const treble = config.treble.map((pitch, idx) => ({
    type,
    symbol,
    pitch,
    x: startX + idx * glyphSpacing,
    y: getPitchStaffY('treble', pitch, lineSpacing, trebleBottomY, bassBottomY),
  }));

  const bass = config.bass.map((pitch, idx) => ({
    type,
    symbol,
    pitch,
    x: startX + idx * glyphSpacing,
    y: getPitchStaffY('bass', pitch, lineSpacing, trebleBottomY, bassBottomY),
  }));

  return { treble, bass };
}

/**
 * Calculates the exact horizontal X-coordinate for a specific measure beat.
 * Guaranteed to align treble notes, bass notes, and lyrics on the exact same vertical grid.
 */
export function getBeatX(
  measureStartX: number,
  measureWidth: number,
  beat: number,
  beatsPerMeasure: number,
  paddingLeft = 24,
  paddingRight = 16,
): number {
  const usableWidth = measureWidth - paddingLeft - paddingRight;
  const fraction = (beat - 1) / Math.max(1, beatsPerMeasure);
  return measureStartX + paddingLeft + fraction * usableWidth;
}
