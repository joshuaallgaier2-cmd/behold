export interface NoteEvent {
  pitch: string;       // e.g., "E4", "G4", "A4"
  midiNumber: number;  // Used for hit verification (C4 = 60)
  startTimeMs: number; // The timeline mark where the note crosses the play line
  durationMs: number;  // Horizontal block visual length
}

export interface InteractiveSong {
  id: string;
  number: number;
  title: string;
  category: 'hymn' | 'children' | 'youth';
  sourceBook: string;
  introDurationMs: number; // Pre-roll intro timing offset
  totalDurationMs: number;
  accompAudioKey: string;
  vocalAudioKey: string;
  notes: NoteEvent[];
}

// Strictly evaluate all assets using hardcoded literal strings so Metro compiles cleanly
export const BEHOLD_ASSET_REGISTRY: Record<string, any> = {
  'hymn_173_p1': require('../../assets/hymn_173_p1.png'),
  'hymn_173_accomp': require('../../assets/audio/hymn_173_accomp.mp3'),
  'hymn_173_vocal': require('../../assets/audio/hymn_173_vocal.mp3'),
};

// Hymn 173: "While of These Emblems We Partake" - 12 note blocks over ~40s timeline
// Notes staggered evenly after 4000ms intro offset
const HYMN_173_NOTES: NoteEvent[] = [
  { pitch: 'C4', midiNumber: 60, startTimeMs: 4500, durationMs: 800 },
  { pitch: 'E4', midiNumber: 64, startTimeMs: 5300, durationMs: 600 },
  { pitch: 'G4', midiNumber: 67, startTimeMs: 5900, durationMs: 800 },
  { pitch: 'C5', midiNumber: 72, startTimeMs: 6700, durationMs: 600 },
  { pitch: 'G4', midiNumber: 67, startTimeMs: 7300, durationMs: 800 },
  { pitch: 'E4', midiNumber: 64, startTimeMs: 8100, durationMs: 600 },
  { pitch: 'C4', midiNumber: 60, startTimeMs: 8700, durationMs: 1200 },
  { pitch: 'E4', midiNumber: 64, startTimeMs: 9900, durationMs: 800 },
  { pitch: 'G4', midiNumber: 67, startTimeMs: 10700, durationMs: 800 },
  { pitch: 'C5', midiNumber: 72, startTimeMs: 11500, durationMs: 600 },
  { pitch: 'G4', midiNumber: 67, startTimeMs: 12100, durationMs: 800 },
  { pitch: 'C5', midiNumber: 72, startTimeMs: 12900, durationMs: 1000 },
];

export const INTERACTIVE_MUSIC_DATABASE: InteractiveSong[] = [
  {
    id: 'hymn-173-p1',
    number: 173,
    title: 'While of These Emblems We Partake',
    category: 'hymn',
    sourceBook: 'Hymns (Official)',
    introDurationMs: 4000,
    totalDurationMs: 13500,
    accompAudioKey: 'hymn_173_accomp',
    vocalAudioKey: 'hymn_173_vocal',
    notes: HYMN_173_NOTES,
  },
  {
    id: 'children-placeholder-1',
    number: 0,
    title: 'Children Genre Placeholder',
    category: 'children',
    sourceBook: 'Children Songs Book',
    introDurationMs: 2000,
    totalDurationMs: 15000,
    accompAudioKey: '',
    vocalAudioKey: '',
    notes: [],
  },
  {
    id: 'youth-placeholder-1',
    number: 0,
    title: 'Youth Genre Placeholder',
    category: 'youth',
    sourceBook: 'Youth Songs Book',
    introDurationMs: 2000,
    totalDurationMs: 15000,
    accompAudioKey: '',
    vocalAudioKey: '',
    notes: [],
  },
];