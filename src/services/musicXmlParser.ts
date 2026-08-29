import { XMLParser } from 'fast-xml-parser';
import { Song, TargetNote } from '../types/music';

/**
 * musicXmlParser.ts
 *
 * Parses a MusicXML (score-partwise) string into the app's internal
 * `Song` / `TargetNote` model used by the sheet-music overlay and
 * playback engine.
 *
 * Design notes:
 * - Uses `fast-xml-parser` because React Native / Expo has no native
 *   DOMParser/XML DOM implementation available at runtime.
 * - All numeric MusicXML fields arrive as strings (or numbers, depending
 *   on parser config) so every value is defensively coerced.
 * - Tempo changes (<sound tempo="..."/>) and divisions changes are
 *   tracked as running state so timestamps stay accurate across the
 *   whole piece, not just the first measure.
 * - `xPosition` is a 0–100 percentage as required by `TargetNote`, so
 *   notes are walked in two passes: the first computes raw layout units
 *   from measure index / in-measure note position, the second normalizes
 *   those raw units against the full song width to produce a percentage.
 * - `Song` has no field for parse errors, key signature, or time
 *   signature, so those are only used internally for correct note math;
 *   on failure a valid, minimally-populated `Song` is still returned
 *   (never a throw) and details are surfaced via `console.warn` for
 *   debugging.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_DIVISIONS = 1;
const DEFAULT_TEMPO_BPM = 120;
const DEFAULT_BEATS = 4;
const DEFAULT_BEAT_TYPE = 4;
const DEFAULT_FIFTHS = 0;
const DEFAULT_CATEGORY: Song['category'] = 'hymn';
const DEFAULT_SOURCE_BOOK = 'Unknown';

const A4_FREQUENCY_HZ = 440;
const A4_MIDI_NUMBER = 69;

// Overlay layout constants used to compute raw (pre-normalization) note
// positions from measure index and in-measure note position.
const MEASURE_WIDTH_UNITS = 120;
const NOTE_HORIZONTAL_SPACING_UNITS = 18;
const STAFF_BASELINE_Y = 40;
const SEMITONE_VERTICAL_STEP = 3.2;
const MIDDLE_C_MIDI = 60;

const STEP_TO_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

// ---------------------------------------------------------------------------
// Raw MusicXML shape (partial — only fields this parser consumes)
// ---------------------------------------------------------------------------

interface RawAttributes {
  divisions?: number | string;
  key?: { fifths?: number | string };
  time?: { beats?: number | string; 'beat-type'?: number | string };
}

interface RawPitch {
  step?: string;
  alter?: number | string;
  octave?: number | string;
}

interface RawSound {
  tempo?: number | string;
}

interface RawNote {
  pitch?: RawPitch;
  rest?: unknown;
  duration?: number | string;
  chord?: unknown;
}

interface RawMeasure {
  '@_number'?: number | string;
  attributes?: RawAttributes | RawAttributes[];
  sound?: RawSound | RawSound[];
  note?: RawNote | RawNote[];
}

interface RawPart {
  '@_id'?: string;
  measure?: RawMeasure | RawMeasure[];
}

interface RawScorePartwise {
  part?: RawPart | RawPart[];
}

interface RawRoot {
  'score-partwise'?: RawScorePartwise;
}

// ---------------------------------------------------------------------------
// Internal running-state types
// ---------------------------------------------------------------------------

interface ParseState {
  divisions: number;
  tempoBpm: number;
  msPerDivision: number;
  cumulativeMs: number;
  measureIndex: number;
  noteIndexInMeasure: number;
  noteCounter: number;
}

interface HeaderInfo {
  divisions: number;
  tempoBpm: number;
  keyFifths: number;
  beats: number;
  beatType: number;
}

/**
 * Intermediate note record produced by the first walking pass, before
 * `xRaw` has been normalized into the 0–100 `xPosition` percentage
 * required by `TargetNote`.
 */
interface DraftNote {
  id: string;
  pitchName: string;
  frequencyHz: number;
  timestampMs: number;
  durationMs: number;
  measureIndex: number;
  xRaw: number;
  yPosition: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a MusicXML string into a fully-populated `Song` object.
 *
 * Never throws: on any parsing failure, a structured fallback `Song`
 * (empty `targetNotes`, sane defaults) is returned instead, so
 * downstream rendering code always has a valid object. Failure details
 * are logged via `console.warn` rather than embedded in the returned
 * object, since `Song` has no dedicated error field.
 */
export async function parseMusicXmlToSong(
  xmlString: string,
  songMetadata: Partial<Song>
): Promise<Song> {
  if (typeof xmlString !== 'string' || xmlString.trim().length === 0) {
    return buildFallbackSong(songMetadata, 'Empty or non-string MusicXML input.');
  }

  let root: RawRoot;
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true,
      isArray: (tagName: string) =>
        tagName === 'part' ||
        tagName === 'measure' ||
        tagName === 'note' ||
        tagName === 'sound' ||
        tagName === 'attributes',
    });
    root = parser.parse(xmlString) as RawRoot;
  } catch (err) {
    return buildFallbackSong(
      songMetadata,
      `MusicXML failed to parse: ${errorMessage(err)}`
    );
  }

  const scorePartwise = root?.['score-partwise'];
  if (!scorePartwise) {
    return buildFallbackSong(
      songMetadata,
      'Missing <score-partwise> root element (score-timewise or invalid document).'
    );
  }

  const parts = toArray<RawPart>(scorePartwise.part);
  if (parts.length === 0) {
    return buildFallbackSong(songMetadata, 'MusicXML document contains no <part> elements.');
  }

  // Use the first part as the primary melodic line for the target note
  // stream. This mirrors how the sheet-music trainer only ever tracks a
  // single staff/voice for pitch-matching purposes.
  const primaryPart = parts[0];
  const measures = toArray<RawMeasure>(primaryPart.measure);
  if (measures.length === 0) {
    return buildFallbackSong(songMetadata, 'Primary part contains no <measure> elements.');
  }

  const header = extractHeaderInfo(measures);
  if (header === null) {
    return buildFallbackSong(
      songMetadata,
      'Could not locate required <attributes> header (divisions/time/key) in first measure.'
    );
  }

  const state: ParseState = {
    divisions: header.divisions,
    tempoBpm: header.tempoBpm,
    msPerDivision: computeMsPerDivision(header.divisions, header.tempoBpm),
    cumulativeMs: 0,
    measureIndex: 0,
    noteIndexInMeasure: 0,
    noteCounter: 0,
  };

  const draftNotes: DraftNote[] = [];

  try {
    for (let m = 0; m < measures.length; m++) {
      state.measureIndex = m;
      state.noteIndexInMeasure = 0;
      processMeasure(measures[m], state, draftNotes);
    }
  } catch (err) {
    return buildFallbackSong(
      songMetadata,
      `Failed while walking measures/notes: ${errorMessage(err)}`
    );
  }

  const targetNotes = normalizeXPositions(draftNotes, measures.length);

  const FIFTHS_MAP: Record<number, string> = {
    0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#',
    '-1': 'F', '-2': 'Bb', '-3': 'Eb', '-4': 'Ab', '-5': 'Db', '-6': 'Gb', '-7': 'Cb',
  };
  const resolvedKey = songMetadata.keySignature ?? FIFTHS_MAP[header.keyFifths] ?? 'C';
  const resolvedTime = songMetadata.timeSignature ?? `${header.beats}/${header.beatType}`;

  const song: Song = {
    id: songMetadata.id ?? generateSongId(songMetadata),
    number: songMetadata.number ?? 0,
    title: songMetadata.title ?? 'Untitled Song',
    category: songMetadata.category ?? DEFAULT_CATEGORY,
    book: songMetadata.book ?? songMetadata.sourceBook ?? DEFAULT_SOURCE_BOOK,
    sourceBook: songMetadata.sourceBook ?? songMetadata.book ?? DEFAULT_SOURCE_BOOK,
    bestAccuracy: songMetadata.bestAccuracy ?? 0,
    scriptureReferences: songMetadata.scriptureReferences ?? [],
    keySignature: resolvedKey,
    timeSignature: resolvedTime,
    audioUrl: songMetadata.audioUrl,
    pageKeys: songMetadata.pageKeys ?? [],
    targetNotes,
    tempoBpm: header.tempoBpm,
  };

  return song;
}

// ---------------------------------------------------------------------------
// Header extraction
// ---------------------------------------------------------------------------

function extractHeaderInfo(measures: RawMeasure[]): HeaderInfo | null {
  let divisions = DEFAULT_DIVISIONS;
  let tempoBpm = DEFAULT_TEMPO_BPM;
  let keyFifths = DEFAULT_FIFTHS;
  let beats = DEFAULT_BEATS;
  let beatType = DEFAULT_BEAT_TYPE;
  let foundAttributes = false;

  // Header info (divisions/key/time) typically lives in the <attributes>
  // block of measure 1, but some exporters split it across the first few
  // measures, so scan forward until every field has been located or we
  // run out of measures to check.
  for (const measure of measures) {
    const attributesList = toArray<RawAttributes>(measure.attributes);
    for (const attrs of attributesList) {
      if (attrs.divisions !== undefined) {
        const parsed = toNumber(attrs.divisions);
        if (parsed !== null && parsed > 0) {
          divisions = parsed;
          foundAttributes = true;
        }
      }
      if (attrs.key?.fifths !== undefined) {
        const parsed = toNumber(attrs.key.fifths);
        if (parsed !== null) {
          keyFifths = parsed;
          foundAttributes = true;
        }
      }
      if (attrs.time?.beats !== undefined) {
        const parsed = toNumber(attrs.time.beats);
        if (parsed !== null && parsed > 0) {
          beats = parsed;
          foundAttributes = true;
        }
      }
      if (attrs.time?.['beat-type'] !== undefined) {
        const parsed = toNumber(attrs.time['beat-type']);
        if (parsed !== null && parsed > 0) {
          beatType = parsed;
          foundAttributes = true;
        }
      }
    }

    const soundList = toArray<RawSound>(measure.sound);
    for (const sound of soundList) {
      if (sound.tempo !== undefined) {
        const parsed = toNumber(sound.tempo);
        if (parsed !== null && parsed > 0) {
          tempoBpm = parsed;
        }
      }
    }

    if (foundAttributes) {
      break;
    }
  }

  if (!foundAttributes) {
    return null;
  }

  return { divisions, tempoBpm, keyFifths, beats, beatType };
}

// ---------------------------------------------------------------------------
// Measure / note walking (pass 1: raw units, absolute timing)
// ---------------------------------------------------------------------------

function processMeasure(measure: RawMeasure, state: ParseState, draftNotes: DraftNote[]): void {
  // A measure may re-declare divisions and/or introduce a tempo change via
  // <sound tempo="..."/>; both must update running state before notes in
  // this measure are timestamped.
  const attributesList = toArray<RawAttributes>(measure.attributes);
  for (const attrs of attributesList) {
    if (attrs.divisions !== undefined) {
      const parsed = toNumber(attrs.divisions);
      if (parsed !== null && parsed > 0) {
        state.divisions = parsed;
        state.msPerDivision = computeMsPerDivision(state.divisions, state.tempoBpm);
      }
    }
  }

  const soundList = toArray<RawSound>(measure.sound);
  for (const sound of soundList) {
    if (sound.tempo !== undefined) {
      const parsed = toNumber(sound.tempo);
      if (parsed !== null && parsed > 0) {
        state.tempoBpm = parsed;
        state.msPerDivision = computeMsPerDivision(state.divisions, state.tempoBpm);
      }
    }
  }

  const rawNotes = toArray<RawNote>(measure.note);

  for (const rawNote of rawNotes) {
    const durationDivisions = toNumber(rawNote.duration) ?? 0;
    const durationMs = durationDivisions * state.msPerDivision;
    const isChordNote = rawNote.chord !== undefined;
    const isRest = rawNote.rest !== undefined;

    // Chord notes share the timestamp/position of the preceding note in
    // the same chord stack and do not advance the timeline themselves.
    const timestampMs = state.cumulativeMs;

    if (!isRest) {
      const draft = buildDraftNote(rawNote, state, timestampMs, durationMs);
      if (draft !== null) {
        draftNotes.push(draft);
        state.noteCounter += 1;
      }
    }

    if (!isChordNote) {
      state.cumulativeMs += durationMs;
      state.noteIndexInMeasure += 1;
    }
  }
}

function buildDraftNote(
  rawNote: RawNote,
  state: ParseState,
  timestampMs: number,
  durationMs: number
): DraftNote | null {
  const pitch = rawNote.pitch;
  if (!pitch || !pitch.step) {
    // Note element with no pitch and no rest flag is unsupported
    // (e.g. unpitched percussion) — skip rather than fabricate a pitch.
    return null;
  }

  const step = String(pitch.step).toUpperCase();
  const alter = toNumber(pitch.alter) ?? 0;
  const octave = toNumber(pitch.octave);
  if (!(step in STEP_TO_SEMITONE) || octave === null) {
    return null;
  }

  const midiNote = stepAlterOctaveToMidi(step, alter, octave);
  const frequencyHz = midiToFrequencyHz(midiNote);
  const pitchName = buildPitchName(step, alter, octave);

  const xRaw =
    state.measureIndex * MEASURE_WIDTH_UNITS +
    state.noteIndexInMeasure * NOTE_HORIZONTAL_SPACING_UNITS;
  const semitoneOffsetFromMiddleC = midiNote - MIDDLE_C_MIDI;
  const yPosition = roundTo(
    STAFF_BASELINE_Y - semitoneOffsetFromMiddleC * SEMITONE_VERTICAL_STEP,
    2
  );

  return {
    id: `n${state.noteCounter}-m${state.measureIndex}-${pitchName}`,
    pitchName,
    frequencyHz,
    timestampMs: roundTo(timestampMs, 3),
    durationMs: roundTo(durationMs, 3),
    measureIndex: state.measureIndex,
    xRaw,
    yPosition,
  };
}

// ---------------------------------------------------------------------------
// Measure / note walking (pass 2: normalize xRaw -> 0-100 percentage)
// ---------------------------------------------------------------------------

function normalizeXPositions(draftNotes: DraftNote[], measureCount: number): TargetNote[] {
  if (draftNotes.length === 0) {
    return [];
  }

  // Denominator is the full song width in raw layout units, so xPosition
  // reflects each note's location across the entire piece (not just the
  // notes that happen to exist).
  const totalWidthUnits = Math.max(measureCount * MEASURE_WIDTH_UNITS, 1);

  return draftNotes.map((draft) => {
    const xPosition = clamp((draft.xRaw / totalWidthUnits) * 100, 0, 100);
    const note: TargetNote = {
      id: draft.id,
      pitchName: draft.pitchName,
      frequencyHz: draft.frequencyHz,
      timestampMs: draft.timestampMs,
      xPosition: roundTo(xPosition, 3),
      yPosition: draft.yPosition,
      durationMs: draft.durationMs,
      measureIndex: draft.measureIndex,
    };
    return note;
  });
}

// ---------------------------------------------------------------------------
// Pitch / frequency math
// ---------------------------------------------------------------------------

function stepAlterOctaveToMidi(step: string, alter: number, octave: number): number {
  const semitone = STEP_TO_SEMITONE[step] + alter;
  // MIDI note 12 == C0, so C4 (middle C) == 60.
  return 12 * (octave + 1) + semitone;
}

function midiToFrequencyHz(midiNote: number): number {
  const frequency = A4_FREQUENCY_HZ * Math.pow(2, (midiNote - A4_MIDI_NUMBER) / 12);
  return roundTo(frequency, 4);
}

function buildPitchName(step: string, alter: number, octave: number): string {
  let accidental = '';
  if (alter === 1) accidental = '#';
  else if (alter === 2) accidental = 'x';
  else if (alter === -1) accidental = 'b';
  else if (alter === -2) accidental = 'bb';
  return `${step}${accidental}${octave}`;
}

// ---------------------------------------------------------------------------
// Timing math
// ---------------------------------------------------------------------------

function computeMsPerDivision(divisions: number, tempoBpm: number): number {
  const safeDivisions = divisions > 0 ? divisions : DEFAULT_DIVISIONS;
  const safeTempo = tempoBpm > 0 ? tempoBpm : DEFAULT_TEMPO_BPM;
  const msPerQuarterNote = 60000 / safeTempo;
  return msPerQuarterNote / safeDivisions;
}

// ---------------------------------------------------------------------------
// Fallback / error handling
// ---------------------------------------------------------------------------

function buildFallbackSong(songMetadata: Partial<Song>, reason: string): Song {
  console.warn(`[musicXmlParser] Falling back to empty song: ${reason}`);

  const fallback: Song = {
    id: songMetadata.id ?? generateSongId(songMetadata),
    number: songMetadata.number ?? 0,
    title: songMetadata.title ?? 'Untitled Song',
    category: songMetadata.category ?? DEFAULT_CATEGORY,
    book: songMetadata.book ?? songMetadata.sourceBook ?? DEFAULT_SOURCE_BOOK,
    sourceBook: songMetadata.sourceBook ?? songMetadata.book ?? DEFAULT_SOURCE_BOOK,
    bestAccuracy: songMetadata.bestAccuracy ?? 0,
    scriptureReferences: songMetadata.scriptureReferences ?? [],
    audioUrl: songMetadata.audioUrl,
    pageKeys: songMetadata.pageKeys ?? [],
    targetNotes: [],
    tempoBpm: songMetadata.tempoBpm ?? DEFAULT_TEMPO_BPM,
  };

  return fallback;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function generateSongId(songMetadata: Partial<Song>): string {
  const seed = songMetadata.title ?? 'song';
  const slug = seed
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const suffix = Date.now().toString(36);
  return `${slug || 'song'}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}