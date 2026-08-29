/**
 * Core music data models for the interactive sheet music application.
 *
 * These types are designed to be shared across rendering, audio playback,
 * note evaluation, and application state layers.
 */

/**
 * Represents a single target note within a song timeline.
 */
export interface TargetNote {
  /**
   * Globally unique identifier for the note.
   */
  id: string;

  /**
   * Scientific pitch notation (e.g. "C4", "E4", "G4", "A4").
   */
  pitchName: string;

  /**
   * Frequency of the note in Hertz.
   */
  frequencyHz: number;

  /**
   * Absolute position of the note within the song timeline, in milliseconds.
   */
  timestampMs: number;

  /**
   * Horizontal position on the rendered music canvas as a percentage
   * from 0 to 100.
   */
  xPosition: number;

  /**
   * Vertical staff offset used for rendering the note.
   */
  yPosition: number;

  /**
   * Duration of the note in milliseconds.
   */
  durationMs: number;

  /**
   * Optional label used to show note text on the sheet overlay.
   */
  label?: string;

  /**
   * Zero-based measure index containing this note.
   */
  measureIndex?: number;
}

/**
 * Represents a complete song and all of its interactive note data.
 */
export interface Song {
  /**
   * Globally unique identifier for the song.
   */
  id: string;

  /**
   * Song or hymn number.
   */
  number: number;

  /**
   * Display title of the song.
   */
  title: string;

  /**
   * Song classification.
   */
  category: 'hymn' | 'children' | 'youth';

  /**
   * Source hymnbook or music collection (e.g. "Hymns of the Church of Jesus Christ of Latter-day Saints", "Children's Songbook").
   */
  book: string;

  /**
   * Backward-compatible source hymnbook or music collection.
   */
  sourceBook?: string;

  /**
   * Peak accuracy percentage score (0 to 100).
   */
  bestAccuracy?: number;

  /**
   * List of related scripture references (e.g. ["Moroni 6:6", "Mosiah 15:7–9"]).
   */
  scriptureReferences?: string[];

  /**
   * Optional audio accompaniment URL.
   */
  audioUrl?: string;

  /**
   * Ordered collection of page asset keys used to render sheet music.
   */
  pageKeys: string[];

  /**
   * Ordered collection of target notes for interactive playback.
   */
  targetNotes: TargetNote[];

  /**
   * Key signature of the song (e.g. 'C', 'G', 'D', 'F', 'Bb', 'Eb', etc.).
   */
  keySignature?: string;

  /**
   * Time signature of the song (e.g. '4/4', '3/4', '6/8', etc.).
   */
  timeSignature?: string;

  /**
   * Playback tempo in beats per minute.
   */
  tempoBpm: number;
}

/**
 * Result of evaluating a performed note against its target.
 */
export type NoteEvaluation = 'correct' | 'incorrect' | 'pending';

/**
 * Maps a TargetNote identifier to its evaluation state.
 */
export type EvaluationMap = Record<string, NoteEvaluation>;

/**
 * Practice mode for song learning and performance.
 */
export type PracticeMode = 'listen' | 'follow' | 'pitchHero' | 'assessment';

/**
 * End-of-practice performance metrics and summary.
 */
export interface PerformanceSummary {
  /**
   * Total number of target notes in the song.
   */
  totalNotes: number;

  /**
   * Number of notes sung correctly (within acceptable pitch tolerance).
   */
  correctNotes: number;

  /**
   * Number of notes sung incorrectly.
   */
  incorrectNotes: number;

  /**
   * Number of notes missed (no attempt made during note window).
   */
  missedNotes: number;

  /**
   * Overall accuracy as a percentage (0 to 100).
   */
  accuracyPercentage: number;

  /**
   * Average pitch deviation in cents across all notes attempted.
   */
  averageCentsDeviation: number;

  /**
   * Longest consecutive streak of correct notes.
   */
  longestStreak: number;
}

/**
 * Maps a single syllable or word in the lyrics to an exact measure and beat.
 */
export interface LyricBeat {
  /**
   * Zero-based measure index (or 1-based, consistent within dataset).
   */
  measure: number;

  /**
   * 1-based beat position within the measure (e.g., 1, 1.5, 2, 3).
   */
  beat: number;

  /**
   * Syllable or word text (e.g., "While", "of", "em-").
   */
  text: string;

  /**
   * Optional beat duration of the syllable.
   */
  durationBeats?: number;
}

/**
 * Represents a single note rendered on a specific staff (Treble or Bass).
 */
export interface ClefNote {
  id: string;
  pitch: string; // Scientific pitch e.g. "E4", "C3", "G4"
  pitchName?: string;
  clef: 'treble' | 'bass';
  measure: number; // 0-based measure index
  beat: number; // 1-based beat index within measure (e.g. 1, 2, 2.5, 3)
  durationBeats: number; // Duration in beats (e.g. 1 = quarter, 0.5 = eighth, 2 = half, 3 = dotted half)
  frequencyHz?: number;
  accidental?: '#' | 'b' | 'n';
  tie?: boolean;
  label?: string;
}

/**
 * Rich dual-clef sheet music representation with synchronized lyrics and audio.
 */
export interface GrandStaffHymn extends Song {
  beatsPerMeasure: number;
  totalMeasures: number;
  trebleNotes: ClefNote[];
  bassNotes: ClefNote[];
  lyrics: LyricBeat[];
}