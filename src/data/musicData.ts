export interface NoteEvent {
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
  introDurationMs: number;
  totalDurationMs: number;
  accompAudioKey: string;
  vocalAudioKey: string;
  pageKeys: string[];
  notes: NoteEvent[];
}

export const BEHOLD_ASSET_REGISTRY: Record<string, any> = Object.freeze({
  hymn_173_p1: require('../../assets/hymn_173_p1.png'),
  hymn_173_accomp: require('../../assets/audio/hymn_173_accomp.mp3'),
  hymn_173_vocal: require('../../assets/audio/hymn_173_vocal.mp3'),
});

export const INTERACTIVE_MUSIC_DATABASE: InteractiveSong[] = [
  {
    id: 'hymn_173_interactive',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    sourceBook: 'Official Hymnal',
    introDurationMs: 4000,
    totalDurationMs: 14000,
    accompAudioKey: 'hymn_173_accomp',
    vocalAudioKey: 'hymn_173_vocal',
    pageKeys: ['hymn_173_p1'],
    notes: [
      { pitch: 'C4', midiNumber: 60, startTimeMs: 4000, durationMs: 420 },
      { pitch: 'E4', midiNumber: 64, startTimeMs: 4500, durationMs: 420 },
      { pitch: 'G4', midiNumber: 67, startTimeMs: 5000, durationMs: 420 },
      { pitch: 'A4', midiNumber: 69, startTimeMs: 5500, durationMs: 420 },
      { pitch: 'G4', midiNumber: 67, startTimeMs: 6000, durationMs: 420 },
      { pitch: 'E4', midiNumber: 64, startTimeMs: 6500, durationMs: 420 },
      { pitch: 'D4', midiNumber: 62, startTimeMs: 7000, durationMs: 420 },
      { pitch: 'C4', midiNumber: 60, startTimeMs: 7500, durationMs: 420 },
      { pitch: 'E4', midiNumber: 64, startTimeMs: 8000, durationMs: 420 },
      { pitch: 'G4', midiNumber: 67, startTimeMs: 8500, durationMs: 420 },
      { pitch: 'A4', midiNumber: 69, startTimeMs: 9000, durationMs: 420 },
      { pitch: 'F#4', midiNumber: 66, startTimeMs: 9500, durationMs: 420 },
      { pitch: 'E4', midiNumber: 64, startTimeMs: 10000, durationMs: 420 },
      { pitch: 'D4', midiNumber: 62, startTimeMs: 10500, durationMs: 420 },
    ],
  },
  {
    id: 'children_1_interactive',
    number: 1,
    title: 'I Am a Child of God',
    category: 'children',
    sourceBook: "Children's Songbook",
    introDurationMs: 1400,
    totalDurationMs: 7600,
    accompAudioKey: '',
    vocalAudioKey: '',
    pageKeys: ['hymn_173_p1'],
    notes: [
      { pitch: 'C4', midiNumber: 60, startTimeMs: 1800, durationMs: 400 },
      { pitch: 'E4', midiNumber: 64, startTimeMs: 2400, durationMs: 400 },
      { pitch: 'G4', midiNumber: 67, startTimeMs: 3000, durationMs: 400 },
      { pitch: 'A4', midiNumber: 69, startTimeMs: 3600, durationMs: 400 },
    ],
  },
  {
    id: 'youth_1_interactive',
    number: 2001,
    title: 'Youth Theme Prelude',
    category: 'youth',
    sourceBook: 'Youth Track Series',
    introDurationMs: 1600,
    totalDurationMs: 8200,
    accompAudioKey: '',
    vocalAudioKey: '',
    pageKeys: [],
    notes: [
      { pitch: 'D4', midiNumber: 62, startTimeMs: 1900, durationMs: 420 },
      { pitch: 'F4', midiNumber: 65, startTimeMs: 2500, durationMs: 420 },
      { pitch: 'A4', midiNumber: 69, startTimeMs: 3100, durationMs: 420 },
      { pitch: 'C5', midiNumber: 72, startTimeMs: 3700, durationMs: 420 },
    ],
  },
];

export interface Song {
  id: string;
  number: number;
  title: string;
  category: 'hymn' | 'children' | 'youth';
  sourceBook: string;
  audioKey?: string;
  pageKeys: string[];
}

export const LDS_MUSIC_DATABASE: Song[] = [
  {
    id: 'hymn_173',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    sourceBook: 'Official Hymnal',
    audioKey: 'hymn_173_accomp',
    pageKeys: ['hymn_173_p1'],
  },
  {
    id: 'children_1',
    number: 1,
    title: 'I Am a Child of God',
    category: 'children',
    sourceBook: "Children's Songbook",
    pageKeys: [],
  },
  {
    id: 'children_2',
    number: 2,
    title: 'Teach Me to Walk in the Light',
    category: 'children',
    sourceBook: "Children's Songbook",
    pageKeys: [],
  },
  {
    id: 'children_3',
    number: 3,
    title: 'The Wise Man and the Foolish Man',
    category: 'children',
    sourceBook: "Children's Songbook",
    pageKeys: [],
  },
  {
    id: 'youth_1',
    number: 2001,
    title: 'Youth Theme Prelude',
    category: 'youth',
    sourceBook: 'Youth Track Series',
    pageKeys: [],
  },
  {
    id: 'youth_2',
    number: 2002,
    title: 'Sacred Covenant Reflection',
    category: 'youth',
    sourceBook: 'Youth Track Series',
    pageKeys: [],
  },
  {
    id: 'youth_3',
    number: 2003,
    title: 'Missionary Purpose Instrumental',
    category: 'youth',
    sourceBook: 'Youth Track Series',
    pageKeys: [],
  },
];
