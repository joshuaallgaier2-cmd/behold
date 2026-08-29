import type { ClefNote, GrandStaffHymn, LyricBeat, TargetNote } from '../types/music';

/**
 * Frequency helper for standard 12-TET tuning (A4 = 440 Hz).
 */
export const NOTE_FREQUENCIES: Record<string, number> = {
  // Octave 2
  'C2': 65.41, 'C#2': 69.30, 'Db2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'Eb2': 77.78,
  'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'Gb2': 92.50, 'G2': 98.00, 'G#2': 103.83,
  'Ab2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'Bb2': 116.54, 'B2': 123.47,

  // Octave 3
  'C3': 130.81, 'C#3': 138.59, 'Db3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'Eb3': 155.56,
  'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'Gb3': 185.00, 'G3': 196.00, 'G#3': 207.65,
  'Ab3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'Bb3': 233.08, 'B3': 246.94,

  // Octave 4
  'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'Eb4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30,
  'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16, 'B4': 493.88,

  // Octave 5
  'C5': 523.25, 'C#5': 554.37, 'Db5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'Eb5': 622.25,
  'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'Gb5': 739.99, 'G5': 783.99, 'G#5': 830.61,
  'Ab5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'Bb5': 932.33, 'B5': 987.77,

  // Octave 6
  'C6': 1046.50,
};

export function getNoteFrequency(pitch: string): number {
  return NOTE_FREQUENCIES[pitch] ?? 440;
}

const withFrequencies = (notes: Array<Omit<ClefNote, 'frequencyHz'>>): ClefNote[] =>
  notes.map((n) => ({
    ...n,
    frequencyHz: getNoteFrequency(n.pitch),
  }));

/**
 * Converts ClefNotes to legacy TargetNotes for backward compatibility.
 */
function convertToTargetNotes(trebleNotes: ClefNote[], bpm: number, beatsPerMeasure: number): TargetNote[] {
  const beatDurationMs = (60 / bpm) * 1000;
  return trebleNotes.map((note) => {
    const timeMs = (note.measure * beatsPerMeasure + (note.beat - 1)) * beatDurationMs;
    const durMs = note.durationBeats * beatDurationMs;
    return {
      id: note.id,
      pitchName: note.pitch,
      frequencyHz: note.frequencyHz ?? getNoteFrequency(note.pitch),
      timestampMs: Math.round(timeMs),
      durationMs: Math.round(durMs),
      xPosition: Math.round(((note.beat - 1) / beatsPerMeasure) * 80 + 10),
      yPosition: 40,
      label: note.label ?? note.pitch,
      measureIndex: note.measure,
    };
  });
}

/* ========================================================================== */
/* HYMN 173: While of These Emblems We Partake                                */
/* ========================================================================== */
const HYMN_173_TREBLE: ClefNote[] = withFrequencies([
  // Measure 0
  { id: '173-t-0-1', pitch: 'E4', clef: 'treble', measure: 0, beat: 1, durationBeats: 1, label: 'While' },
  { id: '173-t-0-2', pitch: 'E4', clef: 'treble', measure: 0, beat: 2, durationBeats: 1, label: 'of' },
  { id: '173-t-0-3', pitch: 'G4', clef: 'treble', measure: 0, beat: 3, durationBeats: 1 },
  // Measure 1
  { id: '173-t-1-1', pitch: 'F4', clef: 'treble', measure: 1, beat: 1, durationBeats: 1, label: 'these' },
  { id: '173-t-1-2', pitch: 'G4', clef: 'treble', measure: 1, beat: 2, durationBeats: 2, label: 'em-' },
  // Measure 2
  { id: '173-t-2-1', pitch: 'G4', clef: 'treble', measure: 2, beat: 1, durationBeats: 1, label: 'blems' },
  { id: '173-t-2-2', pitch: 'F4', clef: 'treble', measure: 2, beat: 2, durationBeats: 1, label: 'we' },
  { id: '173-t-2-3', pitch: 'E4', clef: 'treble', measure: 2, beat: 3, durationBeats: 1 },
  // Measure 3
  { id: '173-t-3-1', pitch: 'E4', clef: 'treble', measure: 3, beat: 1, durationBeats: 1, label: 'par-' },
  { id: '173-t-3-2', pitch: 'D4', clef: 'treble', measure: 3, beat: 2, durationBeats: 2, label: 'take,' },
  // Measure 4
  { id: '173-t-4-1', pitch: 'E4', clef: 'treble', measure: 4, beat: 1, durationBeats: 1, label: 'In' },
  { id: '173-t-4-2', pitch: 'F4', clef: 'treble', measure: 4, beat: 2, durationBeats: 1, label: 'Je-' },
  { id: '173-t-4-3', pitch: 'G4', clef: 'treble', measure: 4, beat: 3, durationBeats: 1 },
  // Measure 5
  { id: '173-t-5-1', pitch: 'G4', clef: 'treble', measure: 5, beat: 1, durationBeats: 1, label: "sus'" },
  { id: '173-t-5-2', pitch: 'A4', clef: 'treble', measure: 5, beat: 2, durationBeats: 2, label: 'name' },
  // Measure 6
  { id: '173-t-6-1', pitch: 'G4', clef: 'treble', measure: 6, beat: 1, durationBeats: 1, label: 'and' },
  { id: '173-t-6-2', pitch: 'F4', clef: 'treble', measure: 6, beat: 2, durationBeats: 1, label: 'for' },
  { id: '173-t-6-3', pitch: 'E4', clef: 'treble', measure: 6, beat: 3, durationBeats: 1 },
  // Measure 7
  { id: '173-t-7-1', pitch: 'E4', clef: 'treble', measure: 7, beat: 1, durationBeats: 1, label: 'his' },
  { id: '173-t-7-2', pitch: 'D4', clef: 'treble', measure: 7, beat: 2, durationBeats: 2, label: 'sake,' },
  // Measure 8
  { id: '173-t-8-1', pitch: 'G4', clef: 'treble', measure: 8, beat: 1, durationBeats: 1, label: 'Let' },
  { id: '173-t-8-2', pitch: 'G4', clef: 'treble', measure: 8, beat: 2, durationBeats: 1, label: 'us' },
  { id: '173-t-8-3', pitch: 'C5', clef: 'treble', measure: 8, beat: 3, durationBeats: 1 },
  // Measure 9
  { id: '173-t-9-1', pitch: 'A4', clef: 'treble', measure: 9, beat: 1, durationBeats: 1, label: 're-' },
  { id: '173-t-9-2', pitch: 'B4', clef: 'treble', measure: 9, beat: 2, durationBeats: 2, label: 'mem-' },
  // Measure 10
  { id: '173-t-10-1', pitch: 'C5', clef: 'treble', measure: 10, beat: 1, durationBeats: 1, label: 'ber' },
  { id: '173-t-10-2', pitch: 'B4', clef: 'treble', measure: 10, beat: 2, durationBeats: 1, label: 'and' },
  { id: '173-t-10-3', pitch: 'A4', clef: 'treble', measure: 10, beat: 3, durationBeats: 1 },
  // Measure 11
  { id: '173-t-11-1', pitch: 'A4', clef: 'treble', measure: 11, beat: 1, durationBeats: 1, label: 'be' },
  { id: '173-t-11-2', pitch: 'G4', clef: 'treble', measure: 11, beat: 2, durationBeats: 2, label: 'sure' },
  // Measure 12
  { id: '173-t-12-1', pitch: 'E4', clef: 'treble', measure: 12, beat: 1, durationBeats: 1, label: 'Our' },
  { id: '173-t-12-2', pitch: 'F4', clef: 'treble', measure: 12, beat: 2, durationBeats: 1, label: 'hearts' },
  { id: '173-t-12-3', pitch: 'G4', clef: 'treble', measure: 12, beat: 3, durationBeats: 1 },
  // Measure 13
  { id: '173-t-13-1', pitch: 'G4', clef: 'treble', measure: 13, beat: 1, durationBeats: 1, label: 'and' },
  { id: '173-t-13-2', pitch: 'C5', clef: 'treble', measure: 13, beat: 2, durationBeats: 2, label: 'hands' },
  // Measure 14
  { id: '173-t-14-1', pitch: 'B4', clef: 'treble', measure: 14, beat: 1, durationBeats: 1, label: 'are' },
  { id: '173-t-14-2', pitch: 'A4', clef: 'treble', measure: 14, beat: 2, durationBeats: 1, label: 'clean' },
  { id: '173-t-14-3', pitch: 'F4', clef: 'treble', measure: 14, beat: 3, durationBeats: 1 },
  // Measure 15
  { id: '173-t-15-1', pitch: 'E4', clef: 'treble', measure: 15, beat: 1, durationBeats: 1, label: 'and' },
  { id: '173-t-15-2', pitch: 'C4', clef: 'treble', measure: 15, beat: 2, durationBeats: 2, label: 'pure.' },
]);

const HYMN_173_BASS: ClefNote[] = withFrequencies([
  // Measure 0
  { id: '173-b-0-1', pitch: 'C3', clef: 'bass', measure: 0, beat: 1, durationBeats: 2 },
  { id: '173-b-0-2', pitch: 'E3', clef: 'bass', measure: 0, beat: 3, durationBeats: 1 },
  // Measure 1
  { id: '173-b-1-1', pitch: 'G2', clef: 'bass', measure: 1, beat: 1, durationBeats: 3 },
  // Measure 2
  { id: '173-b-2-1', pitch: 'A2', clef: 'bass', measure: 2, beat: 1, durationBeats: 2 },
  { id: '173-b-2-2', pitch: 'C3', clef: 'bass', measure: 2, beat: 3, durationBeats: 1 },
  // Measure 3
  { id: '173-b-3-1', pitch: 'G2', clef: 'bass', measure: 3, beat: 1, durationBeats: 3 },
  // Measure 4
  { id: '173-b-4-1', pitch: 'C3', clef: 'bass', measure: 4, beat: 1, durationBeats: 2 },
  { id: '173-b-4-2', pitch: 'C3', clef: 'bass', measure: 4, beat: 3, durationBeats: 1 },
  // Measure 5
  { id: '173-b-5-1', pitch: 'F2', clef: 'bass', measure: 5, beat: 1, durationBeats: 3 },
  // Measure 6
  { id: '173-b-6-1', pitch: 'C3', clef: 'bass', measure: 6, beat: 1, durationBeats: 2 },
  { id: '173-b-6-2', pitch: 'C3', clef: 'bass', measure: 6, beat: 3, durationBeats: 1 },
  // Measure 7
  { id: '173-b-7-1', pitch: 'G2', clef: 'bass', measure: 7, beat: 1, durationBeats: 3 },
  // Measure 8
  { id: '173-b-8-1', pitch: 'E3', clef: 'bass', measure: 8, beat: 1, durationBeats: 2 },
  { id: '173-b-8-2', pitch: 'C3', clef: 'bass', measure: 8, beat: 3, durationBeats: 1 },
  // Measure 9
  { id: '173-b-9-1', pitch: 'F3', clef: 'bass', measure: 9, beat: 1, durationBeats: 3 },
  // Measure 10
  { id: '173-b-10-1', pitch: 'C3', clef: 'bass', measure: 10, beat: 1, durationBeats: 2 },
  { id: '173-b-10-2', pitch: 'E3', clef: 'bass', measure: 10, beat: 3, durationBeats: 1 },
  // Measure 11
  { id: '173-b-11-1', pitch: 'G2', clef: 'bass', measure: 11, beat: 1, durationBeats: 3 },
  // Measure 12
  { id: '173-b-12-1', pitch: 'C3', clef: 'bass', measure: 12, beat: 1, durationBeats: 2 },
  { id: '173-b-12-2', pitch: 'C3', clef: 'bass', measure: 12, beat: 3, durationBeats: 1 },
  // Measure 13
  { id: '173-b-13-1', pitch: 'A2', clef: 'bass', measure: 13, beat: 1, durationBeats: 3 },
  // Measure 14
  { id: '173-b-14-1', pitch: 'F2', clef: 'bass', measure: 14, beat: 1, durationBeats: 2 },
  { id: '173-b-14-2', pitch: 'G2', clef: 'bass', measure: 14, beat: 3, durationBeats: 1 },
  // Measure 15
  { id: '173-b-15-1', pitch: 'C3', clef: 'bass', measure: 15, beat: 1, durationBeats: 3 },
]);

const HYMN_173_LYRICS: LyricBeat[] = [
  { measure: 0, beat: 1, text: 'While' },
  { measure: 0, beat: 2, text: 'of' },
  { measure: 1, beat: 1, text: 'these' },
  { measure: 1, beat: 2, text: 'em-' },
  { measure: 2, beat: 1, text: 'blems' },
  { measure: 2, beat: 2, text: 'we' },
  { measure: 3, beat: 1, text: 'par-' },
  { measure: 3, beat: 2, text: 'take,' },
  { measure: 4, beat: 1, text: 'In' },
  { measure: 4, beat: 2, text: 'Je-' },
  { measure: 5, beat: 1, text: "sus'" },
  { measure: 5, beat: 2, text: 'name' },
  { measure: 6, beat: 1, text: 'and' },
  { measure: 6, beat: 2, text: 'for' },
  { measure: 7, beat: 1, text: 'his' },
  { measure: 7, beat: 2, text: 'sake,' },
  { measure: 8, beat: 1, text: 'Let' },
  { measure: 8, beat: 2, text: 'us' },
  { measure: 9, beat: 1, text: 're-' },
  { measure: 9, beat: 2, text: 'mem-' },
  { measure: 10, beat: 1, text: 'ber' },
  { measure: 10, beat: 2, text: 'and' },
  { measure: 11, beat: 1, text: 'be' },
  { measure: 11, beat: 2, text: 'sure' },
  { measure: 12, beat: 1, text: 'Our' },
  { measure: 12, beat: 2, text: 'hearts' },
  { measure: 13, beat: 1, text: 'and' },
  { measure: 13, beat: 2, text: 'hands' },
  { measure: 14, beat: 1, text: 'are' },
  { measure: 14, beat: 2, text: 'clean' },
  { measure: 15, beat: 1, text: 'and' },
  { measure: 15, beat: 2, text: 'pure.' },
];

/* ========================================================================== */
/* HYMN 193: I Stand All Amazed                                              */
/* ========================================================================== */
const HYMN_193_TREBLE: ClefNote[] = withFrequencies([
  // Measure 0
  { id: '193-t-0-1', pitch: 'Ab4', clef: 'treble', measure: 0, beat: 1, durationBeats: 1, label: 'I' },
  { id: '193-t-0-2', pitch: 'C5', clef: 'treble', measure: 0, beat: 2, durationBeats: 1, label: 'stand' },
  { id: '193-t-0-3', pitch: 'Eb5', clef: 'treble', measure: 0, beat: 3, durationBeats: 1, label: 'all' },
  { id: '193-t-0-4', pitch: 'C5', clef: 'treble', measure: 0, beat: 4, durationBeats: 1, label: 'a-' },
  // Measure 1
  { id: '193-t-1-1', pitch: 'Ab4', clef: 'treble', measure: 1, beat: 1, durationBeats: 2, label: 'mazed' },
  { id: '193-t-1-2', pitch: 'F4', clef: 'treble', measure: 1, beat: 3, durationBeats: 1, label: 'at' },
  { id: '193-t-1-3', pitch: 'Ab4', clef: 'treble', measure: 1, beat: 4, durationBeats: 1, label: 'the' },
  // Measure 2
  { id: '193-t-2-1', pitch: 'Eb4', clef: 'treble', measure: 2, beat: 1, durationBeats: 2, label: 'love' },
  { id: '193-t-2-2', pitch: 'Ab4', clef: 'treble', measure: 2, beat: 3, durationBeats: 1, label: 'Je-' },
  { id: '193-t-2-3', pitch: 'Bb4', clef: 'treble', measure: 2, beat: 4, durationBeats: 1, label: 'sus' },
  // Measure 3
  { id: '193-t-3-1', pitch: 'C5', clef: 'treble', measure: 3, beat: 1, durationBeats: 1.5, label: 'of-' },
  { id: '193-t-3-2', pitch: 'Bb4', clef: 'treble', measure: 3, beat: 2.5, durationBeats: 0.5, label: 'fers' },
  { id: '193-t-3-3', pitch: 'Ab4', clef: 'treble', measure: 3, beat: 3, durationBeats: 2, label: 'me,' },
  // Measure 4
  { id: '193-t-4-1', pitch: 'Bb4', clef: 'treble', measure: 4, beat: 1, durationBeats: 1, label: 'Con-' },
  { id: '193-t-4-2', pitch: 'C5', clef: 'treble', measure: 4, beat: 2, durationBeats: 1, label: 'fused' },
  { id: '193-t-4-3', pitch: 'Db5', clef: 'treble', measure: 4, beat: 3, durationBeats: 1, label: 'at' },
  { id: '193-t-4-4', pitch: 'Bb4', clef: 'treble', measure: 4, beat: 4, durationBeats: 1, label: 'the' },
  // Measure 5
  { id: '193-t-5-1', pitch: 'C5', clef: 'treble', measure: 5, beat: 1, durationBeats: 2, label: 'grace' },
  { id: '193-t-5-2', pitch: 'Ab4', clef: 'treble', measure: 5, beat: 3, durationBeats: 1, label: 'that' },
  { id: '193-t-5-3', pitch: 'C5', clef: 'treble', measure: 5, beat: 4, durationBeats: 1, label: 'so' },
  // Measure 6
  { id: '193-t-6-1', pitch: 'Bb4', clef: 'treble', measure: 6, beat: 1, durationBeats: 2, label: 'ful-' },
  { id: '193-t-6-2', pitch: 'G4', clef: 'treble', measure: 6, beat: 3, durationBeats: 1, label: 'ly' },
  { id: '193-t-6-3', pitch: 'Eb4', clef: 'treble', measure: 6, beat: 4, durationBeats: 1, label: 'he' },
  // Measure 7
  { id: '193-t-7-1', pitch: 'Ab4', clef: 'treble', measure: 7, beat: 1, durationBeats: 4, label: 'gives.' },
]);

const HYMN_193_BASS: ClefNote[] = withFrequencies([
  // Measure 0
  { id: '193-b-0-1', pitch: 'Ab2', clef: 'bass', measure: 0, beat: 1, durationBeats: 2 },
  { id: '193-b-0-2', pitch: 'C3', clef: 'bass', measure: 0, beat: 3, durationBeats: 2 },
  // Measure 1
  { id: '193-b-1-1', pitch: 'Db3', clef: 'bass', measure: 1, beat: 1, durationBeats: 2 },
  { id: '193-b-1-2', pitch: 'F2', clef: 'bass', measure: 1, beat: 3, durationBeats: 2 },
  // Measure 2
  { id: '193-b-2-1', pitch: 'Ab2', clef: 'bass', measure: 2, beat: 1, durationBeats: 2 },
  { id: '193-b-2-2', pitch: 'Eb3', clef: 'bass', measure: 2, beat: 3, durationBeats: 2 },
  // Measure 3
  { id: '193-b-3-1', pitch: 'Eb2', clef: 'bass', measure: 3, beat: 1, durationBeats: 2 },
  { id: '193-b-3-2', pitch: 'Ab2', clef: 'bass', measure: 3, beat: 3, durationBeats: 2 },
  // Measure 4
  { id: '193-b-4-1', pitch: 'Eb3', clef: 'bass', measure: 4, beat: 1, durationBeats: 2 },
  { id: '193-b-4-2', pitch: 'G2', clef: 'bass', measure: 4, beat: 3, durationBeats: 2 },
  // Measure 5
  { id: '193-b-5-1', pitch: 'Ab2', clef: 'bass', measure: 5, beat: 1, durationBeats: 2 },
  { id: '193-b-5-2', pitch: 'C3', clef: 'bass', measure: 5, beat: 3, durationBeats: 2 },
  // Measure 6
  { id: '193-b-6-1', pitch: 'Eb3', clef: 'bass', measure: 6, beat: 1, durationBeats: 2 },
  { id: '193-b-6-2', pitch: 'Eb2', clef: 'bass', measure: 6, beat: 3, durationBeats: 2 },
  // Measure 7
  { id: '193-b-7-1', pitch: 'Ab2', clef: 'bass', measure: 7, beat: 1, durationBeats: 4 },
]);

const HYMN_193_LYRICS: LyricBeat[] = [
  { measure: 0, beat: 1, text: 'I' },
  { measure: 0, beat: 2, text: 'stand' },
  { measure: 0, beat: 3, text: 'all' },
  { measure: 0, beat: 4, text: 'a-' },
  { measure: 1, beat: 1, text: 'mazed' },
  { measure: 1, beat: 3, text: 'at' },
  { measure: 1, beat: 4, text: 'the' },
  { measure: 2, beat: 1, text: 'love' },
  { measure: 2, beat: 3, text: 'Je-' },
  { measure: 2, beat: 4, text: 'sus' },
  { measure: 3, beat: 1, text: 'of-' },
  { measure: 3, beat: 2.5, text: 'fers' },
  { measure: 3, beat: 3, text: 'me,' },
  { measure: 4, beat: 1, text: 'Con-' },
  { measure: 4, beat: 2, text: 'fused' },
  { measure: 4, beat: 3, text: 'at' },
  { measure: 4, beat: 4, text: 'the' },
  { measure: 5, beat: 1, text: 'grace' },
  { measure: 5, beat: 3, text: 'that' },
  { measure: 5, beat: 4, text: 'so' },
  { measure: 6, beat: 1, text: 'ful-' },
  { measure: 6, beat: 3, text: 'ly' },
  { measure: 6, beat: 4, text: 'he' },
  { measure: 7, beat: 1, text: 'gives.' },
];

/* ========================================================================== */
/* HYMN 301: I Am a Child of God                                             */
/* ========================================================================== */
const HYMN_301_TREBLE: ClefNote[] = withFrequencies([
  // Measure 0
  { id: '301-t-0-1', pitch: 'G4', clef: 'treble', measure: 0, beat: 1, durationBeats: 1, label: 'I' },
  { id: '301-t-0-2', pitch: 'A4', clef: 'treble', measure: 0, beat: 2, durationBeats: 1, label: 'am' },
  { id: '301-t-0-3', pitch: 'G4', clef: 'treble', measure: 0, beat: 3, durationBeats: 1, label: 'a' },
  { id: '301-t-0-4', pitch: 'E4', clef: 'treble', measure: 0, beat: 4, durationBeats: 1, label: 'child' },
  // Measure 1
  { id: '301-t-1-1', pitch: 'C4', clef: 'treble', measure: 1, beat: 1, durationBeats: 2, label: 'of' },
  { id: '301-t-1-2', pitch: 'E4', clef: 'treble', measure: 1, beat: 3, durationBeats: 2, label: 'God,' },
  // Measure 2
  { id: '301-t-2-1', pitch: 'G4', clef: 'treble', measure: 2, beat: 1, durationBeats: 1, label: 'And' },
  { id: '301-t-2-2', pitch: 'A4', clef: 'treble', measure: 2, beat: 2, durationBeats: 1, label: 'he' },
  { id: '301-t-2-3', pitch: 'G4', clef: 'treble', measure: 2, beat: 3, durationBeats: 1, label: 'has' },
  { id: '301-t-2-4', pitch: 'E4', clef: 'treble', measure: 2, beat: 4, durationBeats: 1, label: 'sent' },
  // Measure 3
  { id: '301-t-3-1', pitch: 'D4', clef: 'treble', measure: 3, beat: 1, durationBeats: 3, label: 'me' },
  { id: '301-t-3-2', pitch: 'D4', clef: 'treble', measure: 3, beat: 4, durationBeats: 1, label: 'here,' },
  // Measure 4
  { id: '301-t-4-1', pitch: 'A4', clef: 'treble', measure: 4, beat: 1, durationBeats: 1, label: 'Has' },
  { id: '301-t-4-2', pitch: 'B4', clef: 'treble', measure: 4, beat: 2, durationBeats: 1, label: 'giv-' },
  { id: '301-t-4-3', pitch: 'A4', clef: 'treble', measure: 4, beat: 3, durationBeats: 1, label: 'en' },
  { id: '301-t-4-4', pitch: 'F4', clef: 'treble', measure: 4, beat: 4, durationBeats: 1, label: 'me' },
  // Measure 5
  { id: '301-t-5-1', pitch: 'D4', clef: 'treble', measure: 5, beat: 1, durationBeats: 2, label: 'an' },
  { id: '301-t-5-2', pitch: 'F4', clef: 'treble', measure: 5, beat: 3, durationBeats: 2, label: 'earth-' },
  // Measure 6
  { id: '301-t-6-1', pitch: 'A4', clef: 'treble', measure: 6, beat: 1, durationBeats: 1, label: 'ly' },
  { id: '301-t-6-2', pitch: 'G4', clef: 'treble', measure: 6, beat: 2, durationBeats: 1, label: 'home' },
  { id: '301-t-6-3', pitch: 'F4', clef: 'treble', measure: 6, beat: 3, durationBeats: 1, label: 'With' },
  { id: '301-t-6-4', pitch: 'E4', clef: 'treble', measure: 6, beat: 4, durationBeats: 1, label: 'par-' },
  // Measure 7
  { id: '301-t-7-1', pitch: 'D4', clef: 'treble', measure: 7, beat: 1, durationBeats: 1, label: 'ents' },
  { id: '301-t-7-2', pitch: 'C4', clef: 'treble', measure: 7, beat: 2, durationBeats: 3, label: 'kind and dear.' },
]);

const HYMN_301_BASS: ClefNote[] = withFrequencies([
  // Measure 0
  { id: '301-b-0-1', pitch: 'C3', clef: 'bass', measure: 0, beat: 1, durationBeats: 4 },
  // Measure 1
  { id: '301-b-1-1', pitch: 'E3', clef: 'bass', measure: 1, beat: 1, durationBeats: 2 },
  { id: '301-b-1-2', pitch: 'C3', clef: 'bass', measure: 1, beat: 3, durationBeats: 2 },
  // Measure 2
  { id: '301-b-2-1', pitch: 'C3', clef: 'bass', measure: 2, beat: 1, durationBeats: 4 },
  // Measure 3
  { id: '301-b-3-1', pitch: 'G2', clef: 'bass', measure: 3, beat: 1, durationBeats: 4 },
  // Measure 4
  { id: '301-b-4-1', pitch: 'D3', clef: 'bass', measure: 4, beat: 1, durationBeats: 4 },
  // Measure 5
  { id: '301-b-5-1', pitch: 'F3', clef: 'bass', measure: 5, beat: 1, durationBeats: 2 },
  { id: '301-b-5-2', pitch: 'D3', clef: 'bass', measure: 5, beat: 3, durationBeats: 2 },
  // Measure 6
  { id: '301-b-6-1', pitch: 'G2', clef: 'bass', measure: 6, beat: 1, durationBeats: 4 },
  // Measure 7
  { id: '301-b-7-1', pitch: 'C3', clef: 'bass', measure: 7, beat: 1, durationBeats: 4 },
]);

const HYMN_301_LYRICS: LyricBeat[] = [
  { measure: 0, beat: 1, text: 'I' },
  { measure: 0, beat: 2, text: 'am' },
  { measure: 0, beat: 3, text: 'a' },
  { measure: 0, beat: 4, text: 'child' },
  { measure: 1, beat: 1, text: 'of' },
  { measure: 1, beat: 3, text: 'God,' },
  { measure: 2, beat: 1, text: 'And' },
  { measure: 2, beat: 2, text: 'he' },
  { measure: 2, beat: 3, text: 'has' },
  { measure: 2, beat: 4, text: 'sent' },
  { measure: 3, beat: 1, text: 'me' },
  { measure: 3, beat: 4, text: 'here,' },
  { measure: 4, beat: 1, text: 'Has' },
  { measure: 4, beat: 2, text: 'giv-' },
  { measure: 4, beat: 3, text: 'en' },
  { measure: 4, beat: 4, text: 'me' },
  { measure: 5, beat: 1, text: 'an' },
  { measure: 5, beat: 3, text: 'earth-' },
  { measure: 6, beat: 1, text: 'ly' },
  { measure: 6, beat: 2, text: 'home' },
  { measure: 6, beat: 3, text: 'With' },
  { measure: 6, beat: 4, text: 'par-' },
  { measure: 7, beat: 1, text: 'ents' },
  { measure: 7, beat: 2, text: 'kind' },
];

/* ========================================================================== */
/* HYMN 100: Nearer, My God, to Thee                                         */
/* ========================================================================== */
const HYMN_100_TREBLE: ClefNote[] = withFrequencies([
  // Measure 0
  { id: '100-t-0-1', pitch: 'A4', clef: 'treble', measure: 0, beat: 1, durationBeats: 3, label: 'Near-' },
  { id: '100-t-0-2', pitch: 'G4', clef: 'treble', measure: 0, beat: 4, durationBeats: 1, label: 'er,' },
  // Measure 1
  { id: '100-t-1-1', pitch: 'F4', clef: 'treble', measure: 1, beat: 1, durationBeats: 2, label: 'my' },
  { id: '100-t-1-2', pitch: 'A4', clef: 'treble', measure: 1, beat: 3, durationBeats: 2, label: 'God,' },
  // Measure 2
  { id: '100-t-2-1', pitch: 'C5', clef: 'treble', measure: 2, beat: 1, durationBeats: 3, label: 'to' },
  { id: '100-t-2-2', pitch: 'D5', clef: 'treble', measure: 2, beat: 4, durationBeats: 1, label: 'thee,' },
  // Measure 3
  { id: '100-t-3-1', pitch: 'C5', clef: 'treble', measure: 3, beat: 1, durationBeats: 4, label: 'Near-' },
  // Measure 4
  { id: '100-t-4-1', pitch: 'A4', clef: 'treble', measure: 4, beat: 1, durationBeats: 3, label: 'er' },
  { id: '100-t-4-2', pitch: 'G4', clef: 'treble', measure: 4, beat: 4, durationBeats: 1, label: 'to' },
  // Measure 5
  { id: '100-t-5-1', pitch: 'F4', clef: 'treble', measure: 5, beat: 1, durationBeats: 2, label: 'thee!' },
  { id: '100-t-5-2', pitch: 'G4', clef: 'treble', measure: 5, beat: 3, durationBeats: 2, label: 'E’en' },
  // Measure 6
  { id: '100-t-6-1', pitch: 'A4', clef: 'treble', measure: 6, beat: 1, durationBeats: 2, label: 'though' },
  { id: '100-t-6-2', pitch: 'G4', clef: 'treble', measure: 6, beat: 3, durationBeats: 2, label: 'it' },
  // Measure 7
  { id: '100-t-7-1', pitch: 'F4', clef: 'treble', measure: 7, beat: 1, durationBeats: 4, label: 'be a cross' },
]);

const HYMN_100_BASS: ClefNote[] = withFrequencies([
  // Measure 0
  { id: '100-b-0-1', pitch: 'F3', clef: 'bass', measure: 0, beat: 1, durationBeats: 4 },
  // Measure 1
  { id: '100-b-1-1', pitch: 'D3', clef: 'bass', measure: 1, beat: 1, durationBeats: 2 },
  { id: '100-b-1-2', pitch: 'F3', clef: 'bass', measure: 1, beat: 3, durationBeats: 2 },
  // Measure 2
  { id: '100-b-2-1', pitch: 'A2', clef: 'bass', measure: 2, beat: 1, durationBeats: 4 },
  // Measure 3
  { id: '100-b-3-1', pitch: 'C3', clef: 'bass', measure: 3, beat: 1, durationBeats: 4 },
  // Measure 4
  { id: '100-b-4-1', pitch: 'F3', clef: 'bass', measure: 4, beat: 1, durationBeats: 4 },
  // Measure 5
  { id: '100-b-5-1', pitch: 'Bb2', clef: 'bass', measure: 5, beat: 1, durationBeats: 2 },
  { id: '100-b-5-2', pitch: 'C3', clef: 'bass', measure: 5, beat: 3, durationBeats: 2 },
  // Measure 6
  { id: '100-b-6-1', pitch: 'F2', clef: 'bass', measure: 6, beat: 1, durationBeats: 2 },
  { id: '100-b-6-2', pitch: 'C3', clef: 'bass', measure: 6, beat: 3, durationBeats: 2 },
  // Measure 7
  { id: '100-b-7-1', pitch: 'F2', clef: 'bass', measure: 7, beat: 1, durationBeats: 4 },
]);

const HYMN_100_LYRICS: LyricBeat[] = [
  { measure: 0, beat: 1, text: 'Near-' },
  { measure: 0, beat: 4, text: 'er,' },
  { measure: 1, beat: 1, text: 'my' },
  { measure: 1, beat: 3, text: 'God,' },
  { measure: 2, beat: 1, text: 'to' },
  { measure: 2, beat: 4, text: 'thee,' },
  { measure: 3, beat: 1, text: 'Near-' },
  { measure: 4, beat: 1, text: 'er' },
  { measure: 4, beat: 4, text: 'to' },
  { measure: 5, beat: 1, text: 'thee!' },
  { measure: 5, beat: 3, text: 'E’en' },
  { measure: 6, beat: 1, text: 'though' },
  { measure: 6, beat: 3, text: 'it' },
  { measure: 7, beat: 1, text: 'be' },
];

/* ========================================================================== */
/* GRAND STAFF HYMN COLLECTION                                               */
/* ========================================================================== */
export const GRAND_STAFF_HYMNS: GrandStaffHymn[] = [
  {
    id: 'hymn-173',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    book: 'Hymns (1985)',
    sourceBook: 'Hymns (1985)',
    bestAccuracy: 88,
    scriptureReferences: ['Moroni 6:6', 'Mosiah 15:7–9'],
    keySignature: 'C',
    timeSignature: '3/4',
    tempoBpm: 76,
    beatsPerMeasure: 3,
    totalMeasures: 16,
    pageKeys: ['hymn-173-page-1'],
    trebleNotes: HYMN_173_TREBLE,
    bassNotes: HYMN_173_BASS,
    lyrics: HYMN_173_LYRICS,
    targetNotes: convertToTargetNotes(HYMN_173_TREBLE, 76, 3),
  },
  {
    id: 'hymn-193',
    number: 193,
    title: 'I Stand All Amazed',
    category: 'hymn',
    book: 'Hymns (1985)',
    sourceBook: 'Hymns (1985)',
    bestAccuracy: 92,
    scriptureReferences: ['Mosiah 3:5–8', 'Alma 7:11–13'],
    keySignature: 'Ab',
    timeSignature: '4/4',
    tempoBpm: 72,
    beatsPerMeasure: 4,
    totalMeasures: 8,
    pageKeys: ['hymn-193-page-1'],
    trebleNotes: HYMN_193_TREBLE,
    bassNotes: HYMN_193_BASS,
    lyrics: HYMN_193_LYRICS,
    targetNotes: convertToTargetNotes(HYMN_193_TREBLE, 72, 4),
  },
  {
    id: 'hymn-301',
    number: 301,
    title: 'I Am a Child of God',
    category: 'children',
    book: "Children's Songbook",
    sourceBook: "Children's Songbook",
    bestAccuracy: 95,
    scriptureReferences: ['Psalm 82:6', 'Mosiah 4:14–15'],
    keySignature: 'C',
    timeSignature: '4/4',
    tempoBpm: 84,
    beatsPerMeasure: 4,
    totalMeasures: 8,
    pageKeys: ['children-song-page-1'],
    trebleNotes: HYMN_301_TREBLE,
    bassNotes: HYMN_301_BASS,
    lyrics: HYMN_301_LYRICS,
    targetNotes: convertToTargetNotes(HYMN_301_TREBLE, 84, 4),
  },
  {
    id: 'hymn-100',
    number: 100,
    title: 'Nearer, My God, to Thee',
    category: 'hymn',
    book: 'Hymns (1985)',
    sourceBook: 'Hymns (1985)',
    bestAccuracy: 85,
    scriptureReferences: ['Genesis 28:10–22', 'Psalm 145:18'],
    keySignature: 'F',
    timeSignature: '4/4',
    tempoBpm: 68,
    beatsPerMeasure: 4,
    totalMeasures: 8,
    pageKeys: ['hymn-100-page-1'],
    trebleNotes: HYMN_100_TREBLE,
    bassNotes: HYMN_100_BASS,
    lyrics: HYMN_100_LYRICS,
    targetNotes: convertToTargetNotes(HYMN_100_TREBLE, 68, 4),
  },
];

export function getGrandStaffHymn(idOrNumber: string | number): GrandStaffHymn | undefined {
  if (typeof idOrNumber === 'number') {
    return GRAND_STAFF_HYMNS.find((h) => h.number === idOrNumber);
  }
  const idStr = String(idOrNumber).toLowerCase();
  return (
    GRAND_STAFF_HYMNS.find((h) => h.id === idStr || h.id === `hymn-${idStr}`) ??
    GRAND_STAFF_HYMNS.find((h) => h.number.toString() === idStr)
  );
}
