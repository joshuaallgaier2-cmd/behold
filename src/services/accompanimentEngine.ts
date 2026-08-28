// src/services/accompanimentEngine.ts

import {
    AudioPlayer,
    createAudioPlayer,
    setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

type TrackName = 'backing' | 'guide' | 'metronome';

interface MixerState {
  backingTrackVolume: number;
  guideMelodyVolume: number;
  metronomeVolume: number;
  tempoBpm: number;
  tempoMultiplier: number;
}

interface GeneratedAudioAsset {
  uri: string;
  durationMs: number;
}

/**
 * Audio mixer / accompaniment engine for:
 * - Backing-track playback
 * - Guide melody tones
 * - Real-time metronome clicks
 *
 * Expo SDK 54:
 * - Uses expo-audio for native audio playback.
 * - Uses small generated PCM WAV files for synthesized guide tones/clicks.
 * - Uses performance.now() + a look-ahead scheduler for metronome timing.
 *
 * Install:
 *   npx expo install expo-audio expo-file-system
 */
export class AccompanimentEngine {
  private backingPlayer: AudioPlayer | null = null;

  private guidePlayers: AudioPlayer[] = [];
  private activeGuidePlayerIndex = 0;

  private accentClickPlayer: AudioPlayer | null = null;
  private regularClickPlayer: AudioPlayer | null = null;

  private state: MixerState = {
    backingTrackVolume: 1.0,
    guideMelodyVolume: 0.75,
    metronomeVolume: 0.6,
    tempoBpm: 80,
    tempoMultiplier: 1.0,
  };

  private currentTimeMs = 0;
  private isPlaying = false;
  private isDisposed = false;

  private metronomeTimer: ReturnType<typeof setTimeout> | null = null;
  private nextBeatTimeMs = 0;
  private metronomeBeatIndex = 0;

  private readonly schedulerIntervalMs = 25;
  private readonly schedulerLookAheadMs = 100;

  private generatedAssetCache = new Map<string, GeneratedAudioAsset>();
  private generatedFileUris = new Set<string>();

  private loadGeneration = 0;
  private loadPromise: Promise<void> | null = null;

  /**
   * Initializes the audio subsystem.
   */
  async initialize(): Promise<void> {
    this.assertNotDisposed();

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
      interruptionModeAndroid: 'duckOthers',
    });

    if (!this.backingPlayer) {
      this.backingPlayer = createAudioPlayer(null);
      this.backingPlayer.volume = this.state.backingTrackVolume;
      this.backingPlayer.shouldCorrectPitch = true;
      this.backingPlayer.playbackRate = this.state.tempoMultiplier;
    }

    if (!this.accentClickPlayer) {
      const accentAsset = await this.getGeneratedTone({
        frequencyHz: 800,
        durationMs: 70,
        volume: 0.85,
        envelopeMs: 5,
      });

      this.accentClickPlayer = createAudioPlayer(accentAsset.uri);
      this.accentClickPlayer.volume = this.state.metronomeVolume;
    }

    if (!this.regularClickPlayer) {
      const regularAsset = await this.getGeneratedTone({
        frequencyHz: 400,
        durationMs: 55,
        volume: 0.65,
        envelopeMs: 4,
      });

      this.regularClickPlayer = createAudioPlayer(regularAsset.uri);
      this.regularClickPlayer.volume = this.state.metronomeVolume;
    }

    // A small pool prevents consecutive guide notes from cutting each other off.
    if (this.guidePlayers.length === 0) {
      for (let i = 0; i < 4; i += 1) {
        const player = createAudioPlayer(null);
        player.volume = this.state.guideMelodyVolume;
        player.shouldCorrectPitch = false;
        this.guidePlayers.push(player);
      }
    }
  }

  /**
   * Loads/replaces the backing track.
   */
  async loadSongAudio(backingUrl: string): Promise<void> {
    this.assertNotDisposed();

    if (!backingUrl || typeof backingUrl !== 'string') {
      throw new Error('backingUrl must be a non-empty string.');
    }

    await this.initialize();

    const generation = ++this.loadGeneration;

    const load = async (): Promise<void> => {
      const player = this.backingPlayer;

      if (!player) {
        throw new Error('Backing player failed to initialize.');
      }

      player.pause();

      // replace() loads/replaces the backing source.
      player.replace(backingUrl);

      player.volume = this.state.backingTrackVolume;
      player.shouldCorrectPitch = true;
      player.playbackRate = this.state.tempoMultiplier;
      player.currentTime = this.currentTimeMs / 1000;

      if (generation !== this.loadGeneration || this.isDisposed) {
        return;
      }
    };

    this.loadPromise = load();

    try {
      await this.loadPromise;
    } finally {
      if (this.loadPromise) {
        this.loadPromise = null;
      }
    }
  }

  /**
   * Starts backing audio + metronome.
   */
  play(): void {
    this.assertNotDisposed();

    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;

    const now = this.now();
    this.nextBeatTimeMs = now + 10;
    this.metronomeBeatIndex = this.getBeatIndexForCurrentPosition();

    if (this.backingPlayer) {
      this.backingPlayer.volume = this.state.backingTrackVolume;
      this.backingPlayer.shouldCorrectPitch = true;
      this.backingPlayer.playbackRate = this.state.tempoMultiplier;
      this.backingPlayer.play();
    }

    this.startMetronomeScheduler();
  }

  /**
   * Pauses backing audio + metronome.
   */
  pause(): void {
    this.assertNotDisposed();

    this.isPlaying = false;

    if (this.backingPlayer) {
      this.backingPlayer.pause();
      this.currentTimeMs = this.backingPlayer.currentTime * 1000;
    }

    this.stopMetronomeScheduler();
  }

  /**
   * Seeks the backing track.
   */
  seekTo(timeMs: number): void {
    this.assertNotDisposed();

    const sanitizedTimeMs = Math.max(0, Number.isFinite(timeMs) ? timeMs : 0);
    this.currentTimeMs = sanitizedTimeMs;

    if (this.backingPlayer) {
      this.backingPlayer.currentTime = sanitizedTimeMs / 1000;
    }

    const now = this.now();
    this.nextBeatTimeMs =
      now + this.getTimeUntilNextBeatMs(sanitizedTimeMs);

    this.metronomeBeatIndex =
      this.getBeatIndexForTime(sanitizedTimeMs);
  }

  /**
   * Changes one of the mixer track volumes.
   */
  setTrackVolume(track: TrackName, level: number): void {
    this.assertNotDisposed();

    const volume = this.clamp(level, 0, 1);

    switch (track) {
      case 'backing':
        this.state.backingTrackVolume = volume;

        if (this.backingPlayer) {
          this.backingPlayer.volume = volume;
        }
        break;

      case 'guide':
        this.state.guideMelodyVolume = volume;

        for (const player of this.guidePlayers) {
          player.volume = volume;
        }
        break;

      case 'metronome':
        this.state.metronomeVolume = volume;

        if (this.accentClickPlayer) {
          this.accentClickPlayer.volume = volume;
        }

        if (this.regularClickPlayer) {
          this.regularClickPlayer.volume = volume;
        }
        break;
    }
  }

  /**
   * Sets the base metronome tempo.
   *
   * Tempo is clamped to a practical musical range.
   * The master tempo multiplier remains independently controlled
   * internally between 0.5x and 1.5x.
   */
  setTempo(bpm: number): void {
    this.assertNotDisposed();

    if (!Number.isFinite(bpm) || bpm <= 0) {
      throw new Error('Tempo BPM must be a positive finite number.');
    }

    this.state.tempoBpm = this.clamp(bpm, 20, 300);

    if (this.backingPlayer) {
      this.backingPlayer.playbackRate = this.state.tempoMultiplier;
    }

    if (this.isPlaying) {
      this.nextBeatTimeMs = this.now() + 5;
      this.metronomeBeatIndex =
        this.getBeatIndexForCurrentPosition();
    }
  }

  /**
   * Sets the master playback-speed multiplier.
   *
   * 0.5x = half speed
   * 1.0x = normal
   * 1.5x = one-and-a-half speed
   *
   * Pitch correction is explicitly enabled so backing-track
   * pitch does not change with playback speed.
   */
  setTempoMultiplier(multiplier: number): void {
    this.assertNotDisposed();

    this.state.tempoMultiplier = this.clamp(multiplier, 0.5, 1.5);

    if (this.backingPlayer) {
      this.backingPlayer.shouldCorrectPitch = true;
      this.backingPlayer.playbackRate = this.state.tempoMultiplier;
    }

    if (this.isPlaying) {
      this.nextBeatTimeMs = this.now() + 5;
      this.metronomeBeatIndex =
        this.getBeatIndexForCurrentPosition();
    }
  }

  /**
   * Plays a synthesized guide melody tone.
   *
   * A short PCM WAV is generated in-memory, written to the Expo
   * cache directory, and played through expo-audio.
   */
  async playGuideNote(
    frequencyHz: number,
    durationMs: number,
  ): Promise<void> {
    this.assertNotDisposed();

    if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
      throw new Error('frequencyHz must be a positive finite number.');
    }

    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error('durationMs must be a positive finite number.');
    }

    await this.initialize();

    const safeFrequency = this.clamp(frequencyHz, 20, 20_000);
    const safeDuration = this.clamp(durationMs, 10, 10_000);

    const asset = await this.getGeneratedTone({
      frequencyHz: safeFrequency,
      durationMs: safeDuration,
      volume: 0.85,
      envelopeMs: Math.min(12, safeDuration / 4),
    });

    const player =
      this.guidePlayers[this.activeGuidePlayerIndex];

    this.activeGuidePlayerIndex =
      (this.activeGuidePlayerIndex + 1) % this.guidePlayers.length;

    player.pause();
    player.replace(asset.uri);
    player.volume = this.state.guideMelodyVolume;
    player.shouldCorrectPitch = false;

    // Ensure every guide note starts at its beginning.
    await player.seekTo(0);
    player.play();
  }

  /**
   * Returns the current position of the backing track.
   */
  getCurrentTimeMs(): number {
    if (this.backingPlayer) {
      return this.backingPlayer.currentTime * 1000;
    }

    return this.currentTimeMs;
  }

  /**
   * Returns mixer state.
   */
  getState(): Readonly<MixerState> {
    return { ...this.state };
  }

  /**
   * Whether playback is currently active.
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * Full resource cleanup.
   *
   * Call this from the owning component's cleanup/unmount handler.
   */
  async dispose(): Promise<void> {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
    this.isPlaying = false;

    ++this.loadGeneration;

    this.stopMetronomeScheduler();

    const players = [
      this.backingPlayer,
      this.accentClickPlayer,
      this.regularClickPlayer,
      ...this.guidePlayers,
    ].filter((player): player is AudioPlayer => player !== null);

    this.backingPlayer = null;
    this.accentClickPlayer = null;
    this.regularClickPlayer = null;
    this.guidePlayers = [];

    for (const player of players) {
      try {
        player.pause();
      } catch {
        // Player may already have been released by the native layer.
      }

      try {
        player.remove();
      } catch {
        // Ignore cleanup races.
      }
    }

    for (const uri of this.generatedFileUris) {
      try {
        await FileSystem.deleteAsync(uri, {
          idempotent: true,
        });
      } catch {
        // Cache files can safely be left for the OS if deletion races.
      }
    }

    this.generatedFileUris.clear();
    this.generatedAssetCache.clear();
  }

  /**
   * Alias useful for React lifecycle cleanup.
   */
  async cleanup(): Promise<void> {
    await this.dispose();
  }

  // ---------------------------------------------------------------------------
  // Metronome scheduler
  // ---------------------------------------------------------------------------

  private startMetronomeScheduler(): void {
    this.stopMetronomeScheduler();

    const now = this.now();

    if (
      !Number.isFinite(this.nextBeatTimeMs) ||
      this.nextBeatTimeMs <= now
    ) {
      this.nextBeatTimeMs = now + 5;
    }

    this.scheduleMetronomeTick();
  }

  private stopMetronomeScheduler(): void {
    if (this.metronomeTimer !== null) {
      clearTimeout(this.metronomeTimer);
      this.metronomeTimer = null;
    }
  }

  private scheduleMetronomeTick(): void {
    if (!this.isPlaying || this.isDisposed) {
      return;
    }

    const now = this.now();
    const delay = Math.max(
      0,
      Math.min(
        this.schedulerIntervalMs,
        this.nextBeatTimeMs - now,
      ),
    );

    this.metronomeTimer = setTimeout(() => {
      this.runMetronomeScheduler();
    }, delay);
  }

  private runMetronomeScheduler(): void {
    if (!this.isPlaying || this.isDisposed) {
      return;
    }

    const now = this.now();

    while (
      this.nextBeatTimeMs <= now + this.schedulerLookAheadMs
    ) {
      const beatIndex = this.metronomeBeatIndex;
      const beatTime = this.nextBeatTimeMs;

      this.scheduleClick(beatIndex, beatTime);

      this.metronomeBeatIndex += 1;
      this.nextBeatTimeMs += this.getBeatIntervalMs();
    }

    this.scheduleMetronomeTick();
  }

  private scheduleClick(
    beatIndex: number,
    _scheduledTimeMs: number,
  ): void {
    // The first beat of each 4-beat bar is accented.
    //
    // This assumes a 4/4 metronome. The accompaniment engine can
    // later be extended with a configurable time signature without
    // changing the timing architecture.
    const isAccent = beatIndex % 4 === 0;

    const player = isAccent
      ? this.accentClickPlayer
      : this.regularClickPlayer;

    if (!player) {
      return;
    }

    player.volume = this.state.metronomeVolume;

    // Reset before every click so the click player can be reused.
    void player.seekTo(0).then(() => {
      if (!this.isDisposed && this.isPlaying) {
        player.play();
      }
    }).catch(() => {
      // A click failing should never stop the master scheduler.
    });
  }

  // ---------------------------------------------------------------------------
  // Timing
  // ---------------------------------------------------------------------------

  private getBeatIntervalMs(): number {
    const baseBeatMs = 60_000 / this.state.tempoBpm;

    // The master multiplier controls the entire musical transport.
    // For example:
    //   80 BPM @ 0.5x => 40 effective BPM
    //   80 BPM @ 1.0x => 80 effective BPM
    //   80 BPM @ 1.5x => 120 effective BPM
    return baseBeatMs / this.state.tempoMultiplier;
  }

  private getBeatIndexForCurrentPosition(): number {
    return this.getBeatIndexForTime(this.getCurrentTimeMs());
  }

  private getBeatIndexForTime(timeMs: number): number {
    const interval = this.getBeatIntervalMs();

    if (interval <= 0) {
      return 0;
    }

    return Math.max(
      0,
      Math.floor(Math.max(0, timeMs) / interval),
    );
  }

  private getTimeUntilNextBeatMs(timeMs: number): number {
    const interval = this.getBeatIntervalMs();

    if (interval <= 0) {
      return 0;
    }

    const remainder =
      ((Math.max(0, timeMs) % interval) + interval) % interval;

    return remainder === 0 ? 0 : interval - remainder;
  }

  private now(): number {
    return typeof performance !== 'undefined'
      ? performance.now()
      : Date.now();
  }

  // ---------------------------------------------------------------------------
  // Tone synthesis
  // ---------------------------------------------------------------------------

  private async getGeneratedTone(options: {
    frequencyHz: number;
    durationMs: number;
    volume: number;
    envelopeMs: number;
  }): Promise<GeneratedAudioAsset> {
    const frequencyKey = options.frequencyHz.toFixed(4);
    const durationKey = Math.round(options.durationMs);
    const volumeKey = options.volume.toFixed(4);
    const envelopeKey = Math.round(options.envelopeMs);

    const cacheKey = [
      frequencyKey,
      durationKey,
      volumeKey,
      envelopeKey,
    ].join(':');

    const cached = this.generatedAssetCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const wavBytes = this.generateSineWaveWav({
      frequencyHz: options.frequencyHz,
      durationMs: options.durationMs,
      volume: options.volume,
      envelopeMs: options.envelopeMs,
    });

    const base64 = this.bytesToBase64(wavBytes);

    const cacheDirectory =
      FileSystem.cacheDirectory ??
      FileSystem.documentDirectory;

    if (!cacheDirectory) {
      throw new Error(
        'Expo FileSystem does not provide a writable cache directory.',
      );
    }

    const safeFileName =
      `accompaniment_${this.hashString(cacheKey)}.wav`;

    const uri = `${cacheDirectory}${safeFileName}`;

    const fileInfo = await FileSystem.getInfoAsync(uri);

    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(
        uri,
        base64,
        {
          encoding: FileSystem.EncodingType.Base64,
        },
      );
    }

    this.generatedFileUris.add(uri);

    const asset: GeneratedAudioAsset = {
      uri,
      durationMs: options.durationMs,
    };

    this.generatedAssetCache.set(cacheKey, asset);

    return asset;
  }

  /**
   * Generates a mono 16-bit PCM WAV containing a sine tone with
   * attack/release fading to avoid audible clicks.
   */
  private generateSineWaveWav(options: {
    frequencyHz: number;
    durationMs: number;
    volume: number;
    envelopeMs: number;
  }): Uint8Array {
    const sampleRate = 44_100;
    const durationSeconds = options.durationMs / 1000;

    const sampleCount = Math.max(
      1,
      Math.ceil(sampleRate * durationSeconds),
    );

    const dataSize = sampleCount * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header.
    this.writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeAscii(view, 8, 'WAVE');

    // fmt chunk.
    this.writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits/sample

    // data chunk.
    this.writeAscii(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const frequency = this.clamp(
      options.frequencyHz,
      20,
      sampleRate / 2,
    );

    const volume = this.clamp(options.volume, 0, 1);

    const envelopeSamples = Math.max(
      1,
      Math.floor(
        sampleRate *
          (Math.max(0, options.envelopeMs) / 1000),
      ),
    );

    let phase = 0;
    const phaseIncrement =
      (2 * Math.PI * frequency) / sampleRate;

    for (let i = 0; i < sampleCount; i += 1) {
      const remainingSamples =
        sampleCount - i;

      let envelope = 1;

      if (i < envelopeSamples) {
        envelope = i / envelopeSamples;
      } else if (remainingSamples < envelopeSamples) {
        envelope = remainingSamples / envelopeSamples;
      }

      // Slightly softer than full-scale to prevent clipping.
      const amplitude =
        Math.sin(phase) *
        volume *
        envelope *
        0.90;

      const sample = Math.round(
        amplitude * 32_767,
      );

      view.setInt16(
        44 + i * 2,
        this.clamp(sample, -32_768, 32_767),
        true,
      );

      phase += phaseIncrement;

      if (phase >= Math.PI * 2) {
        phase -= Math.PI * 2;
      }
    }

    return new Uint8Array(buffer);
  }

  private writeAscii(
    view: DataView,
    offset: number,
    value: string,
  ): void {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(
        offset + i,
        value.charCodeAt(i),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Base64 / utility functions
  // ---------------------------------------------------------------------------

  private bytesToBase64(bytes: Uint8Array): string {
    const alphabet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    let output = '';
    let i = 0;

    while (i < bytes.length) {
      const byte1 = bytes[i++] ?? 0;
      const byte2 =
        i < bytes.length ? bytes[i++] : 0;
      const byte3 =
        i < bytes.length ? bytes[i++] : 0;

      const triplet =
        (byte1 << 16) |
        (byte2 << 8) |
        byte3;

      output += alphabet[(triplet >> 18) & 0x3f];
      output += alphabet[(triplet >> 12) & 0x3f];

      output +=
        i - 1 < bytes.length
          ? alphabet[(triplet >> 6) & 0x3f]
          : '=';

      output +=
        i <= bytes.length
          ? alphabet[triplet & 0x3f]
          : '=';
    }

    // Correct padding for lengths divisible by 3 / 1 / 2.
    const remainder = bytes.length % 3;

    if (remainder === 1) {
      output =
        output.substring(0, output.length - 2) + '==';
    } else if (remainder === 2) {
      output =
        output.substring(0, output.length - 1) + '=';
    }

    return output;
  }

  private hashString(value: string): string {
    let hash = 2166136261;

    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash =
        Math.imul(hash, 16_777_619) >>> 0;
    }

    return hash.toString(16).padStart(8, '0');
  }

  private clamp(
    value: number,
    min: number,
    max: number,
  ): number {
    return Math.min(
      max,
      Math.max(min, value),
    );
  }

  private assertNotDisposed(): void {
    if (this.isDisposed) {
      throw new Error(
        'AccompanimentEngine has been disposed and cannot be reused.',
      );
    }
  }
}

/**
 * Shared engine instance for applications that want one global
 * accompaniment transport.
 */
export const accompanimentEngine =
  new AccompanimentEngine();

export default accompanimentEngine;