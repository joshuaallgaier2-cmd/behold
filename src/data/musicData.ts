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
    title: 'Hymn 173',
    category: 'hymn',
    sourceBook: 'Hymns',
    pageKeys: ['hymn-173-page-1'],
    audioUrl: 'https://example.com/audio/hymn-173.mp3',
    tempoBpm: 86,
    targetNotes: [
      ...buildTargetNotes(1100, [
        { pitchName: 'C4', frequencyHz: 261.63, xPosition: 12, yPosition: 58, label: '1' },
        { pitchName: 'E4', frequencyHz: 329.63, xPosition: 22, yPosition: 48, label: '2' },
        { pitchName: 'G4', frequencyHz: 392.0, xPosition: 32, yPosition: 38, label: '3' },
        { pitchName: 'A4', frequencyHz: 440.0, xPosition: 48, yPosition: 35, label: '4' },
        { pitchName: 'G4', frequencyHz: 392.0, xPosition: 62, yPosition: 38, label: '5' },
        { pitchName: 'E4', frequencyHz: 329.63, xPosition: 76, yPosition: 48, label: '6' },
        { pitchName: 'C4', frequencyHz: 261.63, xPosition: 88, yPosition: 58, label: '7' },
      ], 0),
    ],
  },
  {
    id: 'children-song-example',
    number: 21,
    title: 'Children Song Example',
    category: 'children',
    sourceBook: "Children's Songbook",
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
    title: 'Youth Album Track',
    category: 'youth',
    sourceBook: 'Youth Album',
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
