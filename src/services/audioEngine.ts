import { useCallback, useState } from 'react';

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  currentSongId: string | null;
}

export interface PlaybackOptions {
  loop?: boolean;
  fadeDuration?: number;
}

interface AudioEngineContext {
  ctx: AudioContext;
  gainNode: GainNode;
  oscillator: OscillatorNode | null;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;

  constructor() {}

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
  }

  public async playTone(frequency: number, duration: number, volume: number = 0.1) {
    this.init();
    if (!this.ctx || !this.gainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public stopAll() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(volume, this.ctx ? this.ctx.currentTime : 0, 0.01);
    }
  }
}

export const audioEngine = new AudioEngine();

export function useAudioEngine() {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    playbackRate: 1,
    currentSongId: null,
  });

  const playSong = useCallback(async (songId: string, options: PlaybackOptions = {}) => {
    setState(prev => ({ ...prev, isPlaying: true, currentSongId: songId }));
    // Actual audio implementation would go here
    console.log(`Playing song ${songId} with options:`, options);
  }, []);

  const stopSong = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false, currentSongId: null }));
    audioEngine.stopAll();
  }, []);

  const updateVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume }));
    audioEngine.setVolume(volume);
  }, []);

  return {
    state,
    playSong,
    stopSong,
    updateVolume,
  };
}