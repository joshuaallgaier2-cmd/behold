import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

/**
 * Tracking token container to cache the active Sound instance.
 * Allows for global access to the currently playing sound for cleanup and status checks.
 */
let activeSoundInstance: Audio.Sound | null = null;

/**
 * Native Audio Isolation Subsystem
 * Configures global audio parameters to ensure exclusive hardware focus 
 * and strict background playback cutoffs.
 */
export async function initializeBeholdAudioConfiguration() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false, // Respects physical mute switch
      interruptionModeIOS: InterruptionModeIOS.DoNotMix, // Demands exclusive focus
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix, // Single-source priority
      shouldDuckAndroid: false, // Prevents third-party sounds from altering volume
      staysActiveInBackground: false, // Hard-cut on app focus loss
    });
    console.log('Audio isolation framework initialized successfully');
  } catch (error) {
    console.error('Failed to initialize audio configuration:', error);
  }
}

/**
 * Memory-safe cleanup function for active playback.
 * Stops and unloads the current sound to clear memory buffers.
 */
export async function safelyTeardownActiveAudioPlayback() {
  if (activeSoundInstance) {
    try {
      const status = await activeSoundInstance.getStatusAsync();
      if (status.isLoaded) {
        await activeSoundInstance.stopAsync();
        await activeSoundInstance.unloadAsync();
      }
    } catch (error) {
      console.error('Error during audio teardown:', error);
    } finally {
      activeSoundInstance = null;
    }
  }
}

/**
 * Setter for the active sound instance.
 * Used by playback components to register their sound for global lifecycle management.
 */
export function setActiveSound(sound: Audio.Sound | null) {
  activeSoundInstance = sound;
}

/**
 * Getter for the active sound instance.
 */
export function getActiveSound(): Audio.Sound | null {
  return activeSoundInstance;
}
