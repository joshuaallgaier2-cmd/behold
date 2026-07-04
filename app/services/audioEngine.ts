/**
 * Behold Audio Engine - Global Audio Isolation & Application Lifecycle Manager
 * 
 * Enforces absolute priority over audio hardware layers:
 * - Claims exclusive, single-source playback (no mixing/ducking with background players)
 * - Respects iOS/iPad hardware mute toggle and Control Center silent selection
 * - Terminates audio processing immediately when app loses focus
 */

import { InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as AudioModule from 'expo-av/Audio';

/**
 * Initialize Behold Audio Configuration
 * 
 * Wraps the following settings parameters for exclusive audio isolation:
 * - playsInSilentModeIOS: false -> Tells iOS/iPad to mute when physical side switch or Control Center silent toggle is ON
 * - interruptionModeIOS: InterruptionModeIOS.DoNotMix -> Commands iOS to disconnect other background audio providers
 * - interruptionModeAndroid: InterruptionModeAndroid.DoNotMix -> Standardizes identical exclusive behavior across Android/ChromeOS
 * - shouldDuckAndroid: false -> Blocks incoming third-party notification alerts from interacting with volume parameters
 * - staysActiveInBackground: false -> Hard-kills device sound pipelines when focus boundaries change
 */
export async function initializeBeholdAudioConfiguration(): Promise<void> {
  await AudioModule.setAudioModeAsync({
    playsInSilentModeIOS: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: false,
    staysActiveInBackground: false,
  });
}

/**
 * Active Sound Instance Container
 * Holds the currently active audio playback reference for safe teardown operations.
 */
let activeSoundInstance: any = null;

/**
 * Export tracking reference container holding the current active Sound instance
 */
export const getActiveSound = (): any => {
  return activeSoundInstance;
};

/**
 * Set the active sound instance for tracking purposes
 */
export function setActiveSound(sound: any): void {
  activeSoundInstance = sound;
}

/**
 * Safely Terminate Active Audio Playback
 * 
 * Calls .stopAsync() immediately followed by .unloadAsync() to completely clear memory buckets
 * when an audio row is deselected or interrupted. Ensures no background processing or caching
 * routines survive a focus loss.
 */
export async function safelyTeardownActiveAudioPlayback(): Promise<void> {
  if (activeSoundInstance) {
    try {
      await activeSoundInstance.stopAsync();
    } catch (error) {
      // Silently handle stop errors during teardown
    }

    try {
      await activeSoundInstance.unloadAsync();
    } catch (error) {
      // Silently handle unload errors during teardown
    }

    activeSoundInstance = null;
  }

  // Always reset to ensure clean state even if no sound was playing
  activeSoundInstance = null;
}

/**
 * Initialize audio configuration when app starts
 * Call this in your app's initialization flow
 */
export async function initializeAudioEngine(): Promise<void> {
  await initializeBeholdAudioConfiguration();
}