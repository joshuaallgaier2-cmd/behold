export interface Song {
  id: string;
  number: number;
  title: string;
  category: 'hymn' | 'children' | 'youth';
  sourceBook: string;
  audioKey?: string;
  pageKeys: string[];
}

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
  introDurationMs: number;
  totalDurationMs: number;
  accompAudio: any;
  vocalAudio: any;
  notes: NoteEvent[];
}

export const BEHOLD_ASSET_REGISTRY: Record<string, any> = {
  hymn_173_p1: require('../../assets/hymn_173_p1.png'),
  hymn_173_audio: require('../../assets/audio/hymn_173.wav'),
};

export const LDS_MUSIC_DATABASE: Song[] = [
  {
    id: 'hymn_173',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    sourceBook: 'Official Hymnal',
    audioKey: 'hymn_173_audio',
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

export const INTERACTIVE_MUSIC_DATABASE: InteractiveSong[] = [
  {
    id: 'hymn_173_interactive',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    introDurationMs: 1800,
    totalDurationMs: 9600,
    accompAudio: require('../../assets/audio/hymn_173.wav'),
    vocalAudio: require('../../assets/audio/hymn_173.wav'),
    notes: [
      { pitch: 'C4', midiNumber: 60, startTimeMs: 2200, durationMs: 420 },
      { pitch: 'E4', midiNumber: 64, startTimeMs: 2600, durationMs: 420 },
      { pitch: 'G4', midiNumber: 67, startTimeMs: 3000, durationMs: 420 },
      { pitch: 'A4', midiNumber: 69, startTimeMs: 3400, durationMs: 420 },
      { pitch: 'G4', midiNumber: 67, startTimeMs: 3800, durationMs: 420 },
      { pitch: 'E4', midiNumber: 64, startTimeMs: 4200, durationMs: 420 },
      { pitch: 'D4', midiNumber: 62, startTimeMs: 4600, durationMs: 420 },
      { pitch: 'C4', midiNumber: 60, startTimeMs: 5000, durationMs: 420 },
      { pitch: 'E4', midiNumber: 64, startTimeMs: 5400, durationMs: 420 },
      { pitch: 'G4', midiNumber: 67, startTimeMs: 5800, durationMs: 420 },
      { pitch: 'A4', midiNumber: 69, startTimeMs: 6200, durationMs: 420 },
      { pitch: 'G4', midiNumber: 67, startTimeMs: 6600, durationMs: 420 },
    ],
  },
];