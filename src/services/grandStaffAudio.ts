import { getNoteFrequency } from '../data/hymnData';
import type { ClefNote, GrandStaffHymn } from '../types/music';

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentMeasure: number;
  currentBeat: number; // continuous float (e.g. 1.0 to beatsPerMeasure + 0.99)
  totalMeasures: number;
  currentTimeMs: number;
  totalDurationMs: number;
  progressPercent: number;
  activeTrebleNoteIds: string[];
  activeBassNoteIds: string[];
  activeLyricIndex: number;
}

class GrandStaffAudioSynthesizer {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private isPaused = false;
  private currentHymn: GrandStaffHymn | null = null;
  private tempoMultiplier = 1.0;
  private animationFrameId: number | null = null;
  private startTimeMs = 0;
  private pauseTimeMs = 0;
  private onTickCallback: ((state: AudioPlaybackState) => void) | null = null;
  private onCompleteCallback: (() => void) | null = null;
  private scheduledNotes = new Set<string>();

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a synthesized musical tone using Web Audio API oscillator.
   */
  public playTone(frequencyHz: number, durationSeconds = 0.5, volume = 0.25, voiceType: 'treble' | 'bass' = 'treble') {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Treble uses warm triangle+sine mixture, bass uses warmer low sine/triangle
      osc.type = voiceType === 'treble' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(frequencyHz, now);

      // Envelope: gentle attack, sustain, smooth exponential decay
      const attackTime = 0.03;
      const releaseTime = Math.min(0.2, durationSeconds * 0.4);
      const sustainVolume = Math.max(0.001, volume);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(sustainVolume, now + attackTime);
      gainNode.gain.setValueAtTime(sustainVolume * 0.85, now + durationSeconds - releaseTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSeconds + 0.05);
    } catch {
      // Ignore web audio exceptions if audio is not yet authorized by user gesture
    }
  }

  /**
   * Plays a single note by pitch name (e.g. "C4", "G3").
   */
  public playPitch(pitch: string, durationSeconds = 0.6) {
    const freq = getNoteFrequency(pitch);
    const isBass = parseInt(pitch.slice(-1), 10) <= 3;
    this.playTone(freq, durationSeconds, isBass ? 0.35 : 0.25, isBass ? 'bass' : 'treble');
  }

  /**
   * Starts playing a GrandStaffHymn from a specific measure.
   */
  public start(
    hymn: GrandStaffHymn,
    multiplier = 1.0,
    startMeasure = 0,
    onTick?: (state: AudioPlaybackState) => void,
    onComplete?: () => void,
  ) {
    this.stop();
    this.currentHymn = hymn;
    this.tempoMultiplier = multiplier;
    this.onTickCallback = onTick ?? null;
    this.onCompleteCallback = onComplete ?? null;
    this.isPlaying = true;
    this.isPaused = false;
    this.scheduledNotes.clear();

    const bpm = hymn.tempoBpm * multiplier;
    const secondsPerBeat = 60 / bpm;
    const startBeat = startMeasure * hymn.beatsPerMeasure;
    this.startTimeMs = performance.now() - (startBeat * secondsPerBeat * 1000);

    this.loop();
  }

  private loop = () => {
    if (!this.isPlaying || !this.currentHymn) return;

    const now = performance.now();
    const elapsedMs = now - this.startTimeMs;
    const bpm = this.currentHymn.tempoBpm * this.tempoMultiplier;
    const msPerBeat = (60 / bpm) * 1000;
    const totalBeats = this.currentHymn.totalMeasures * this.currentHymn.beatsPerMeasure;
    const totalDurationMs = totalBeats * msPerBeat;

    if (elapsedMs >= totalDurationMs) {
      this.isPlaying = false;
      if (this.onTickCallback) {
        this.onTickCallback({
          isPlaying: false,
          currentMeasure: this.currentHymn.totalMeasures - 1,
          currentBeat: this.currentHymn.beatsPerMeasure,
          totalMeasures: this.currentHymn.totalMeasures,
          currentTimeMs: totalDurationMs,
          totalDurationMs,
          progressPercent: 100,
          activeTrebleNoteIds: [],
          activeBassNoteIds: [],
          activeLyricIndex: this.currentHymn.lyrics.length - 1,
        });
      }
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
      return;
    }

    const currentGlobalBeat = elapsedMs / msPerBeat;
    const currentMeasure = Math.min(
      this.currentHymn.totalMeasures - 1,
      Math.floor(currentGlobalBeat / this.currentHymn.beatsPerMeasure),
    );
    const measureBeat = (currentGlobalBeat % this.currentHymn.beatsPerMeasure) + 1;

    // Trigger any notes that fall around this current beat
    this.checkAndPlayNotes(this.currentHymn.trebleNotes, currentGlobalBeat, msPerBeat, 'treble');
    this.checkAndPlayNotes(this.currentHymn.bassNotes, currentGlobalBeat, msPerBeat, 'bass');

    // Find active note IDs for visual highlighting
    const activeTrebleNoteIds = this.getActiveNoteIds(this.currentHymn.trebleNotes, currentMeasure, measureBeat);
    const activeBassNoteIds = this.getActiveNoteIds(this.currentHymn.bassNotes, currentMeasure, measureBeat);

    // Find active lyric syllable
    let activeLyricIndex = -1;
    for (let i = 0; i < this.currentHymn.lyrics.length; i++) {
      const lyric = this.currentHymn.lyrics[i];
      const lyricGlobalBeat = lyric.measure * this.currentHymn.beatsPerMeasure + (lyric.beat - 1);
      if (currentGlobalBeat >= lyricGlobalBeat) {
        activeLyricIndex = i;
      } else {
        break;
      }
    }

    if (this.onTickCallback) {
      this.onTickCallback({
        isPlaying: true,
        currentMeasure,
        currentBeat: measureBeat,
        totalMeasures: this.currentHymn.totalMeasures,
        currentTimeMs: elapsedMs,
        totalDurationMs,
        progressPercent: (elapsedMs / totalDurationMs) * 100,
        activeTrebleNoteIds,
        activeBassNoteIds,
        activeLyricIndex,
      });
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private checkAndPlayNotes(notes: ClefNote[], currentGlobalBeat: number, msPerBeat: number, clef: 'treble' | 'bass') {
    if (!this.currentHymn) return;

    for (const note of notes) {
      const noteGlobalBeat = note.measure * this.currentHymn.beatsPerMeasure + (note.beat - 1);
      const diff = currentGlobalBeat - noteGlobalBeat;

      // If we crossed this note within a small window and haven't played it yet
      if (diff >= 0 && diff < 0.25 && !this.scheduledNotes.has(note.id)) {
        this.scheduledNotes.add(note.id);
        const durSec = Math.max(0.2, (note.durationBeats * msPerBeat) / 1000);
        const freq = note.frequencyHz ?? getNoteFrequency(note.pitch);
        this.playTone(freq, durSec, clef === 'treble' ? 0.3 : 0.4, clef);
      }
    }
  }

  private getActiveNoteIds(notes: ClefNote[], currentMeasure: number, currentBeat: number): string[] {
    return notes
      .filter((n) => {
        if (n.measure !== currentMeasure) return false;
        return currentBeat >= n.beat && currentBeat < n.beat + n.durationBeats;
      })
      .map((n) => n.id);
  }

  public pause() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    this.isPlaying = false;
    this.pauseTimeMs = performance.now();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resume() {
    if (!this.isPaused || !this.currentHymn) return;
    const pausedDuration = performance.now() - this.pauseTimeMs;
    this.startTimeMs += pausedDuration;
    this.isPaused = false;
    this.isPlaying = true;
    this.loop();
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.scheduledNotes.clear();
  }

  public seekToMeasure(measure: number) {
    if (!this.currentHymn) return;
    const bpm = this.currentHymn.tempoBpm * this.tempoMultiplier;
    const secondsPerBeat = 60 / bpm;
    const startBeat = measure * this.currentHymn.beatsPerMeasure;
    this.scheduledNotes.clear();

    if (this.isPlaying) {
      this.startTimeMs = performance.now() - (startBeat * secondsPerBeat * 1000);
    } else {
      this.startTimeMs = performance.now() - (startBeat * secondsPerBeat * 1000);
      this.pauseTimeMs = performance.now();
      if (this.onTickCallback) {
        const msPerBeat = (60 / bpm) * 1000;
        const totalBeats = this.currentHymn.totalMeasures * this.currentHymn.beatsPerMeasure;
        const totalDurationMs = totalBeats * msPerBeat;
        const elapsedMs = startBeat * msPerBeat;
        this.onTickCallback({
          isPlaying: false,
          currentMeasure: measure,
          currentBeat: 1,
          totalMeasures: this.currentHymn.totalMeasures,
          currentTimeMs: elapsedMs,
          totalDurationMs,
          progressPercent: (elapsedMs / totalDurationMs) * 100,
          activeTrebleNoteIds: [],
          activeBassNoteIds: [],
          activeLyricIndex: -1,
        });
      }
    }
  }

  public setTempoMultiplier(multiplier: number) {
    if (!this.currentHymn) return;
    const oldBpm = this.currentHymn.tempoBpm * this.tempoMultiplier;
    const newBpm = this.currentHymn.tempoBpm * multiplier;
    this.tempoMultiplier = multiplier;

    if (this.isPlaying) {
      const now = performance.now();
      const elapsedOld = now - this.startTimeMs;
      const currentBeats = (elapsedOld / ((60 / oldBpm) * 1000));
      const elapsedNew = currentBeats * ((60 / newBpm) * 1000);
      this.startTimeMs = now - elapsedNew;
    }
  }
}

export const grandStaffAudio = new GrandStaffAudioSynthesizer();
