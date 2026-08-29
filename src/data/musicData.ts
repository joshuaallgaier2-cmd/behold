import type { Song, TargetNote } from '../types/music';

export interface NoteEvent {
  id: string;
  timeMs: number;
  pitch: string;
}

export interface InteractiveSong extends Omit<Song, 'number'> {
  number: number | string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tempo?: string;
  notes?: NoteEvent[];
  accompAudioKey?: string;
  vocalAudioKey?: string;
}

const buildTargetNotes = (
  baseOffsetMs: number,
  pitchSequence: Array<{ pitchName: string; frequencyHz: number; xPosition: number; yPosition: number; label?: string; }>,
  measureIndex = 0,
): TargetNote[] =>
  pitchSequence.map((entry, index) => ({
    id: `${measureIndex}-${index + 1}`,
    pitchName: entry.pitchName,
    frequencyHz: entry.frequencyHz,
    timestampMs: baseOffsetMs + index * 1200,
    xPosition: entry.xPosition,
    yPosition: entry.yPosition,
    durationMs: 700,
    label: entry.label ?? entry.pitchName,
    measureIndex,
  }));

export const LDS_MUSIC_DATABASE: Song[] = [
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
    pageKeys: ['hymn-173-page-1'],
    audioUrl: 'https://example.com/audio/hymn-173.mp3',
    tempoBpm: 76,
    targetNotes: [
      // --- Phrase 1: "While of these emblems we partake," (Measure 1-4) ---
      { id: '1-1', pitchName: 'E4', frequencyHz: 329.63, timestampMs: 800, durationMs: 750, xPosition: 10, yPosition: 48, label: 'While', measureIndex: 0 },
      { id: '1-2', pitchName: 'C3', frequencyHz: 130.81, timestampMs: 800, durationMs: 1500, xPosition: 10, yPosition: 82, label: 'C', measureIndex: 0 },
      { id: '1-3', pitchName: 'E4', frequencyHz: 329.63, timestampMs: 1600, durationMs: 750, xPosition: 16, yPosition: 48, label: 'of', measureIndex: 0 },
      { id: '1-4', pitchName: 'F4', frequencyHz: 349.23, timestampMs: 2400, durationMs: 750, xPosition: 22, yPosition: 44, label: 'these', measureIndex: 1 },
      { id: '1-5', pitchName: 'G2', frequencyHz: 98.00, timestampMs: 2400, durationMs: 1500, xPosition: 22, yPosition: 95, label: 'G', measureIndex: 1 },
      { id: '1-6', pitchName: 'G4', frequencyHz: 392.00, timestampMs: 3200, durationMs: 750, xPosition: 28, yPosition: 38, label: 'em-', measureIndex: 1 },
      { id: '1-7', pitchName: 'G4', frequencyHz: 392.00, timestampMs: 4000, durationMs: 750, xPosition: 34, yPosition: 38, label: 'blems', measureIndex: 2 },
      { id: '1-8', pitchName: 'A2', frequencyHz: 110.00, timestampMs: 4000, durationMs: 1500, xPosition: 34, yPosition: 90, label: 'A', measureIndex: 2 },
      { id: '1-9', pitchName: 'F4', frequencyHz: 349.23, timestampMs: 4800, durationMs: 750, xPosition: 40, yPosition: 44, label: 'we', measureIndex: 2 },
      { id: '1-10', pitchName: 'E4', frequencyHz: 329.63, timestampMs: 5600, durationMs: 750, xPosition: 46, yPosition: 48, label: 'par-', measureIndex: 3 },
      { id: '1-11', pitchName: 'G2', frequencyHz: 98.00, timestampMs: 5600, durationMs: 1500, xPosition: 46, yPosition: 95, label: 'G', measureIndex: 3 },
      { id: '1-12', pitchName: 'D4', frequencyHz: 293.66, timestampMs: 6400, durationMs: 1200, xPosition: 52, yPosition: 52, label: 'take,', measureIndex: 3 },

      // --- Phrase 2: "In Jesus' name and for his sake," (Measure 5-8) ---
      { id: '2-1', pitchName: 'E4', frequencyHz: 329.63, timestampMs: 8000, durationMs: 750, xPosition: 58, yPosition: 48, label: 'In', measureIndex: 4 },
      { id: '2-2', pitchName: 'C3', frequencyHz: 130.81, timestampMs: 8000, durationMs: 1500, xPosition: 58, yPosition: 82, label: 'C', measureIndex: 4 },
      { id: '2-3', pitchName: 'F4', frequencyHz: 349.23, timestampMs: 8800, durationMs: 750, xPosition: 63, yPosition: 44, label: 'Je-', measureIndex: 4 },
      { id: '2-4', pitchName: 'G4', frequencyHz: 392.00, timestampMs: 9600, durationMs: 750, xPosition: 68, yPosition: 38, label: "sus'", measureIndex: 5 },
      { id: '2-5', pitchName: 'F2', frequencyHz: 87.31, timestampMs: 9600, durationMs: 1500, xPosition: 68, yPosition: 98, label: 'F', measureIndex: 5 },
      { id: '2-6', pitchName: 'A4', frequencyHz: 440.00, timestampMs: 10400, durationMs: 750, xPosition: 73, yPosition: 34, label: 'name', measureIndex: 5 },
      { id: '2-7', pitchName: 'G4', frequencyHz: 392.00, timestampMs: 11200, durationMs: 750, xPosition: 78, yPosition: 38, label: 'and', measureIndex: 6 },
      { id: '2-8', pitchName: 'C3', frequencyHz: 130.81, timestampMs: 11200, durationMs: 1500, xPosition: 78, yPosition: 82, label: 'C', measureIndex: 6 },
      { id: '2-9', pitchName: 'F4', frequencyHz: 349.23, timestampMs: 12000, durationMs: 750, xPosition: 83, yPosition: 44, label: 'for', measureIndex: 6 },
      { id: '2-10', pitchName: 'E4', frequencyHz: 329.63, timestampMs: 12800, durationMs: 750, xPosition: 88, yPosition: 48, label: 'his', measureIndex: 7 },
      { id: '2-11', pitchName: 'G2', frequencyHz: 98.00, timestampMs: 12800, durationMs: 1500, xPosition: 88, yPosition: 95, label: 'G', measureIndex: 7 },
      { id: '2-12', pitchName: 'D4', frequencyHz: 293.66, timestampMs: 13600, durationMs: 1200, xPosition: 93, yPosition: 52, label: 'sake,', measureIndex: 7 },

      // --- Phrase 3: "Let us remember and be sure" (Measure 9-12) ---
      { id: '3-1', pitchName: 'G4', frequencyHz: 392.00, timestampMs: 15200, durationMs: 750, xPosition: 12, yPosition: 38, label: 'Let', measureIndex: 8 },
      { id: '3-2', pitchName: 'E3', frequencyHz: 164.81, timestampMs: 15200, durationMs: 1500, xPosition: 12, yPosition: 76, label: 'E', measureIndex: 8 },
      { id: '3-3', pitchName: 'G4', frequencyHz: 392.00, timestampMs: 16000, durationMs: 750, xPosition: 18, yPosition: 38, label: 'us', measureIndex: 8 },
      { id: '3-4', pitchName: 'A4', frequencyHz: 440.00, timestampMs: 16800, durationMs: 750, xPosition: 24, yPosition: 34, label: 're-', measureIndex: 9 },
      { id: '3-5', pitchName: 'F3', frequencyHz: 174.61, timestampMs: 16800, durationMs: 1500, xPosition: 24, yPosition: 72, label: 'F', measureIndex: 9 },
      { id: '3-6', pitchName: 'B4', frequencyHz: 493.88, timestampMs: 17600, durationMs: 750, xPosition: 30, yPosition: 30, label: 'mem-', measureIndex: 9 },
      { id: '3-7', pitchName: 'C5', frequencyHz: 523.25, timestampMs: 18400, durationMs: 750, xPosition: 36, yPosition: 25, label: 'ber', measureIndex: 10 },
      { id: '3-8', pitchName: 'C3', frequencyHz: 130.81, timestampMs: 18400, durationMs: 1500, xPosition: 36, yPosition: 82, label: 'C', measureIndex: 10 },
      { id: '3-9', pitchName: 'B4', frequencyHz: 493.88, timestampMs: 19200, durationMs: 750, xPosition: 42, yPosition: 30, label: 'and', measureIndex: 10 },
      { id: '3-10', pitchName: 'A4', frequencyHz: 440.00, timestampMs: 20000, durationMs: 750, xPosition: 48, yPosition: 34, label: 'be', measureIndex: 11 },
      { id: '3-11', pitchName: 'G2', frequencyHz: 98.00, timestampMs: 20000, durationMs: 1500, xPosition: 48, yPosition: 95, label: 'G', measureIndex: 11 },
      { id: '3-12', pitchName: 'G4', frequencyHz: 392.00, timestampMs: 20800, durationMs: 1200, xPosition: 54, yPosition: 38, label: 'sure', measureIndex: 11 },

      // --- Phrase 4: "Our hearts and hands are clean and pure." (Measure 13-16) ---
      { id: '4-1', pitchName: 'E4', frequencyHz: 329.63, timestampMs: 22400, durationMs: 750, xPosition: 60, yPosition: 48, label: 'Our', measureIndex: 12 },
      { id: '4-2', pitchName: 'C3', frequencyHz: 130.81, timestampMs: 22400, durationMs: 1500, xPosition: 60, yPosition: 82, label: 'C', measureIndex: 12 },
      { id: '4-3', pitchName: 'F4', frequencyHz: 349.23, timestampMs: 23200, durationMs: 750, xPosition: 65, yPosition: 44, label: 'hearts', measureIndex: 12 },
      { id: '4-4', pitchName: 'G4', frequencyHz: 392.00, timestampMs: 24000, durationMs: 750, xPosition: 70, yPosition: 38, label: 'and', measureIndex: 13 },
      { id: '4-5', pitchName: 'A2', frequencyHz: 110.00, timestampMs: 24000, durationMs: 1500, xPosition: 70, yPosition: 90, label: 'A', measureIndex: 13 },
      { id: '4-6', pitchName: 'C5', frequencyHz: 523.25, timestampMs: 24800, durationMs: 750, xPosition: 75, yPosition: 25, label: 'hands', measureIndex: 13 },
      { id: '4-7', pitchName: 'B4', frequencyHz: 493.88, timestampMs: 25600, durationMs: 750, xPosition: 80, yPosition: 30, label: 'are', measureIndex: 14 },
      { id: '4-8', pitchName: 'F2', frequencyHz: 87.31, timestampMs: 25600, durationMs: 1500, xPosition: 80, yPosition: 98, label: 'F', measureIndex: 14 },
      { id: '4-9', pitchName: 'A4', frequencyHz: 440.00, timestampMs: 26400, durationMs: 750, xPosition: 85, yPosition: 34, label: 'clean', measureIndex: 14 },
      { id: '4-10', pitchName: 'G4', frequencyHz: 392.00, timestampMs: 27200, durationMs: 750, xPosition: 90, yPosition: 38, label: 'and', measureIndex: 15 },
      { id: '4-11', pitchName: 'G2', frequencyHz: 98.00, timestampMs: 27200, durationMs: 1500, xPosition: 90, yPosition: 95, label: 'G', measureIndex: 15 },
      { id: '4-12', pitchName: 'C4', frequencyHz: 261.63, timestampMs: 28000, durationMs: 1800, xPosition: 95, yPosition: 58, label: 'pure.', measureIndex: 15 },
      { id: '4-13', pitchName: 'C3', frequencyHz: 130.81, timestampMs: 28000, durationMs: 1800, xPosition: 95, yPosition: 82, label: 'C', measureIndex: 15 },
    ],
  },
  {
    id: 'children-song-example',
    number: 21,
    title: 'I Am a Child of God',
    category: 'children',
    book: "Children's Songbook",
    sourceBook: "Children's Songbook",
    bestAccuracy: 94,
    scriptureReferences: ['Psalm 82:6', 'Mosiah 4:14–15'],
    keySignature: 'C',
    timeSignature: '4/4',
    pageKeys: ['children-song-page-1'],
    audioUrl: 'https://example.com/audio/children-song.mp3',
    tempoBpm: 104,
    targetNotes: [
      ...buildTargetNotes(900, [
        { pitchName: 'G4', frequencyHz: 392.0, xPosition: 18, yPosition: 40, label: 'G' },
        { pitchName: 'A4', frequencyHz: 440.0, xPosition: 32, yPosition: 35, label: 'A' },
        { pitchName: 'G4', frequencyHz: 392.0, xPosition: 48, yPosition: 40, label: 'G' },
        { pitchName: 'E4', frequencyHz: 329.63, xPosition: 64, yPosition: 48, label: 'E' },
        { pitchName: 'C4', frequencyHz: 261.63, xPosition: 80, yPosition: 58, label: 'C' },
      ], 0),
    ],
  },
  {
    id: 'youth-track',
    number: 9,
    title: 'Peace in Christ',
    category: 'youth',
    book: 'Youth Theme Album',
    sourceBook: 'Youth Theme Album',
    bestAccuracy: 0,
    scriptureReferences: ['John 14:27', 'Philippians 4:7'],
    keySignature: 'G',
    timeSignature: '4/4',
    pageKeys: ['youth-track-page-1'],
    audioUrl: 'https://example.com/audio/youth-track.mp3',
    tempoBpm: 128,
    targetNotes: [
      ...buildTargetNotes(800, [
        { pitchName: 'A4', frequencyHz: 440.0, xPosition: 14, yPosition: 34, label: 'A' },
        { pitchName: 'C5', frequencyHz: 523.25, xPosition: 28, yPosition: 24, label: 'C' },
        { pitchName: 'B4', frequencyHz: 493.88, xPosition: 42, yPosition: 28, label: 'B' },
        { pitchName: 'A4', frequencyHz: 440.0, xPosition: 58, yPosition: 34, label: 'A' },
        { pitchName: 'G4', frequencyHz: 392.0, xPosition: 74, yPosition: 40, label: 'G' },
        { pitchName: 'E4', frequencyHz: 329.63, xPosition: 88, yPosition: 48, label: 'E' },
      ], 0),
    ],
  },
];

export const INTERACTIVE_MUSIC_DATABASE: InteractiveSong[] = LDS_MUSIC_DATABASE.map((song) => ({
  ...song,
  number: song.number,
  difficulty: song.category === 'children' ? 'easy' : song.category === 'hymn' ? 'medium' : 'hard',
  tempo: `${song.tempoBpm} BPM`,
  notes: song.targetNotes.map((note) => ({
    id: note.id,
    timeMs: note.timestampMs,
    pitch: note.pitchName,
  })),
  accompAudioKey: `${song.id}-accompaniment.mp3`,
  vocalAudioKey: `${song.id}-vocal.mp3`,
}));
