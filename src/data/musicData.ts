export interface NoteEvent {
  id: string;
  pitch: string;
  midiNumber: number;
  startTimeMs: number;
  durationMs: number;
}

export interface InteractiveSong {
  id: string;
  number: number;
  title: string;
  category: 'hymn' | 'children' | 'youth';
  sourceBook: string;
  bpm: number;
  introDurationMs: number;
  totalDurationMs: number;
  accompAudioKey: string;
  vocalAudioKey: string;
  notes: NoteEvent[];
}

export const BEHOLD_ASSET_REGISTRY: Record<string, any> = {
  'hymn_173_p1': require('../../../assets/hymn_173_p1.png'),
  'hymn_173_accomp': require('../../../assets/audio/hymn_173_accomp.mp3'),
  'hymn_173_vocal': require('../../../assets/audio/hymn_173_vocal.mp3'),
};

export const INTERACTIVE_MUSIC_DATABASE: InteractiveSong[] = [
  {
    id: 'hymn_173',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    sourceBook: 'Hymns',
    bpm: 70,
    introDurationMs: 4000,
    totalDurationMs: 30000, // Placeholder
    accompAudioKey: 'hymn_173_accomp',
    vocalAudioKey: 'hymn_173_vocal',
    notes: [
      { id: 'h173_01', pitch: 'C4', midiNumber: 60, startTimeMs: 4000, durationMs: 500 },
      { id: 'h173_02', pitch: 'D4', midiNumber: 62, startTimeMs: 4500, durationMs: 500 },
      { id: 'h173_03', pitch: 'E4', midiNumber: 64, startTimeMs: 5000, durationMs: 500 },
      { id: 'h173_04', pitch: 'F4', midiNumber: 65, startTimeMs: 5500, durationMs: 500 },
      { id: 'h173_05', pitch: 'G4', midiNumber: 67, startTimeMs: 6000, durationMs: 500 },
      { id: 'h173_06', pitch: 'A4', midiNumber: 69, startTimeMs: 6500, durationMs: 500 },
      { id: 'h173_07', pitch: 'B4', midiNumber: 71, startTimeMs: 7000, durationMs: 500 },
      { id: 'h173_08', pitch: 'C5', midiNumber: 72, startTimeMs: 7500, durationMs: 500 },
      { id: 'h173_09', pitch: 'B4', midiNumber: 71, startTimeMs: 8000, durationMs: 500 },
      { id: 'h173_10', pitch: 'A4', midiNumber: 69, startTimeMs: 8500, durationMs: 500 },
      { id: 'h173_11', pitch: 'G4', midiNumber: 67, startTimeMs: 9000, durationMs: 500 },
      { id: 'h173_12', pitch: 'F4', midiNumber: 65, startTimeMs: 9500, durationMs: 500 },
      { id: 'h173_13', pitch: 'E4', midiNumber: 64, startTimeMs: 10000, durationMs: 500 },
      { id: 'h173_14', pitch: 'D4', midiNumber: 62, startTimeMs: 10500, durationMs: 500 },
      { id: 'h173_15', pitch: 'C4', midiNumber: 60, startTimeMs: 11000, durationMs: 500 },
    ],
  },
  {
    id: 'children_placeholder',
    number: 1,
    title: 'Placeholder Children Song',
    category: 'children',
    sourceBook: 'Children\'s Songbook',
    bpm: 100,
    introDurationMs: 2000,
    totalDurationMs: 15000,
    accompAudioKey: '',
    vocalAudioKey: '',
    notes: [],
  },
  {
    id: 'youth_placeholder',
    number: 1,
    title: 'Placeholder Youth Song',
    category: 'youth',
    sourceBook: 'Youth Album',
    bpm: 90,
    introDurationMs: 3000,
        totalDurationMs: 20000,
    accompAudioKey: '',
    vocalAudioKey: '',
    notes: [],
  },
];