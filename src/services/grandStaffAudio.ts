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
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  /** AudioContext time corresponding to global beat zero in the current run. */
  private audioStartTime = 0;
  private performanceStartTimeMs = 0;
  private pausedAtBeat = 0;
  private onTickCallback: ((state: AudioPlaybackState) => void) | null = null;
  private onCompleteCallback: (() => void) | null = null;
  private scheduledNotes = new Set<string>();
  private activeVoices = new Set<{ oscillator: OscillatorNode; gain: GainNode }>();
  private readonly scheduleIntervalMs = 25;
  private readonly scheduleAheadSeconds = 0.2;

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

    this.playToneAt(frequencyHz, durationSeconds, volume, voiceType, ctx.currentTime);
  }

  private playToneAt(
    frequencyHz: number,
    durationSeconds: number,
    volume: number,
    voiceType: 'treble' | 'bass',
    startAt: number,
  ) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = Math.max(startAt, ctx.currentTime + 0.005);
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const voice = { oscillator: osc, gain: gainNode };
      this.activeVoices.add(voice);

      // Treble uses warm triangle+sine mixture, bass uses warmer low sine/triangle
      osc.type = voiceType === 'treble' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(frequencyHz, now);

      // Envelope: gentle attack, sustain, smooth exponential decay
      const attackTime = Math.min(0.03, durationSeconds * 0.25);
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
      osc.onended = () => {
        this.activeVoices.delete(voice);
        osc.disconnect();
        gainNode.disconnect();
      };
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
    this.tempoMultiplier = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
    this.onTickCallback = onTick ?? null;
    this.onCompleteCallback = onComplete ?? null;
    this.isPlaying = true;
    this.isPaused = false;
    this.scheduledNotes.clear();

    const startBeat = Math.max(0, Math.min(hymn.totalMeasures - 1, startMeasure)) * hymn.beatsPerMeasure;
    const ctx = this.getAudioContext();
    this.audioStartTime = (ctx?.currentTime ?? 0) - startBeat * this.secondsPerBeat;
    this.performanceStartTimeMs = performance.now() - startBeat * this.secondsPerBeat * 1000;
    this.pausedAtBeat = startBeat;
    this.startScheduler();

    this.loop();
  }

  private get secondsPerBeat(): number {
    return this.currentHymn ? 60 / (this.currentHymn.tempoBpm * this.tempoMultiplier) : 0;
  }

  private getCurrentBeat(): number {
    if (!this.currentHymn) return 0;
    if (!this.isPlaying) return this.pausedAtBeat;
    if (this.audioCtx) return Math.max(0, (this.audioCtx.currentTime - this.audioStartTime) / this.secondsPerBeat);
    return Math.max(0, (performance.now() - this.performanceStartTimeMs) / (this.secondsPerBeat * 1000));
  }

  private startScheduler() {
    this.stopScheduler();
    this.scheduleNotesAhead();
    this.schedulerId = setInterval(this.scheduleNotesAhead, this.scheduleIntervalMs);
  }

  private stopScheduler() {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  private scheduleNotesAhead = () => {
    if (!this.isPlaying || !this.currentHymn) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const currentBeat = this.getCurrentBeat();
    const beatHorizon = currentBeat + this.scheduleAheadSeconds / this.secondsPerBeat;
    for (const [notes, clef] of [
      [this.currentHymn.trebleNotes, 'treble'],
      [this.currentHymn.bassNotes, 'bass'],
    ] as const) {
      for (const note of notes) {
        if (this.scheduledNotes.has(note.id)) continue;
        const noteBeat = note.measure * this.currentHymn.beatsPerMeasure + note.beat - 1;
        if (noteBeat > beatHorizon) continue;

        this.scheduledNotes.add(note.id);
        const endBeat = noteBeat + note.durationBeats;
        // Seeking/resuming must not replay notes already finished. A sustained
        // note resumes only for its remaining duration, including after a delay.
        if (endBeat <= currentBeat) continue;
        const startBeat = Math.max(noteBeat, currentBeat);
        const duration = Math.max(0.04, (endBeat - startBeat) * this.secondsPerBeat);
        const frequency = note.frequencyHz ?? getNoteFrequency(note.pitch);
        const scheduledAt = this.audioStartTime + startBeat * this.secondsPerBeat;
        this.playToneAt(frequency, duration, clef === 'treble' ? 0.3 : 0.4, clef, scheduledAt);
      }
    }
  };

  private stopVoices() {
    const ctx = this.audioCtx;
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const voice of this.activeVoices) {
      try {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now);
        voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
        voice.oscillator.stop(now + 0.02);
      } catch {
        // A voice may already have ended or been stopped.
      }
    }
    this.activeVoices.clear();
  }

  private loop = () => {
    if (!this.isPlaying || !this.currentHymn) return;

    const currentGlobalBeat = this.getCurrentBeat();
    const msPerBeat = this.secondsPerBeat * 1000;
    const totalBeats = this.currentHymn.totalMeasures * this.currentHymn.beatsPerMeasure;
    const totalDurationMs = totalBeats * msPerBeat;
    const elapsedMs = currentGlobalBeat * msPerBeat;

    if (elapsedMs >= totalDurationMs) {
      this.isPlaying = false;
      this.pausedAtBeat = totalBeats;
      this.stopScheduler();
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

    const currentMeasure = Math.min(
      this.currentHymn.totalMeasures - 1,
      Math.floor(currentGlobalBeat / this.currentHymn.beatsPerMeasure),
    );
    const measureBeat = (currentGlobalBeat % this.currentHymn.beatsPerMeasure) + 1;

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
    this.pausedAtBeat = this.getCurrentBeat();
    this.isPaused = true;
    this.isPlaying = false;
    this.performanceStartTimeMs = performance.now() - this.pausedAtBeat * this.secondsPerBeat * 1000;
    this.stopScheduler();
    this.stopVoices();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resume() {
    if (!this.isPaused || !this.currentHymn) return;
    const ctx = this.getAudioContext();
    if (ctx) this.audioStartTime = ctx.currentTime - this.pausedAtBeat * this.secondsPerBeat;
    this.performanceStartTimeMs = performance.now() - this.pausedAtBeat * this.secondsPerBeat * 1000;
    this.isPaused = false;
    this.isPlaying = true;
    this.scheduledNotes.clear();
    this.startScheduler();
    this.loop();
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.stopScheduler();
    this.stopVoices();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.scheduledNotes.clear();
  }

  public seekToMeasure(measure: number) {
    if (!this.currentHymn) return;
    const startBeat = Math.max(0, Math.min(this.currentHymn.totalMeasures - 1, measure)) * this.currentHymn.beatsPerMeasure;
    const ctx = this.audioCtx;
    this.stopVoices();
    this.scheduledNotes.clear();
    if (ctx) this.audioStartTime = ctx.currentTime - startBeat * this.secondsPerBeat;
    this.performanceStartTimeMs = performance.now() - startBeat * this.secondsPerBeat * 1000;
    this.pausedAtBeat = startBeat;

    if (this.isPlaying) {
      this.scheduleNotesAhead();
    } else {
      this.isPaused = true;
      if (this.onTickCallback) {
        const msPerBeat = this.secondsPerBeat * 1000;
        const totalBeats = this.currentHymn.totalMeasures * this.currentHymn.beatsPerMeasure;
        const totalDurationMs = totalBeats * msPerBeat;
        const elapsedMs = startBeat * msPerBeat;
        this.onTickCallback({
          isPlaying: false,
          currentMeasure: startBeat / this.currentHymn.beatsPerMeasure,
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
    if (!this.currentHymn || !Number.isFinite(multiplier) || multiplier <= 0) return;
    const currentBeat = this.getCurrentBeat();
    this.stopVoices();
    this.scheduledNotes.clear();
    this.tempoMultiplier = multiplier;

    if (this.isPlaying) {
      const ctx = this.getAudioContext();
      if (ctx) this.audioStartTime = ctx.currentTime - currentBeat * this.secondsPerBeat;
      this.performanceStartTimeMs = performance.now() - currentBeat * this.secondsPerBeat * 1000;
      this.startScheduler();
    } else {
      this.pausedAtBeat = currentBeat;
    }
  }
}

export const grandStaffAudio = new GrandStaffAudioSynthesizer();
