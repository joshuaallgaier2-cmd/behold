import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let accompanimentInstance: AudioPlayer | null = null;
let vocalInstance: AudioPlayer | null = null;

export async function initializeBeholdAudioConfiguration() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
      interruptionModeAndroid: 'duckOthers',
    });
    console.log('Audio configuration initialized successfully.');
  } catch (error) {
    console.error('Error initializing audio configuration:', error);
  }
}

function isValidHttpUrl(url: string): boolean {
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch {
    return false;
  }
  return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
}

export async function playTracks(accompUri: string, vocalUri: string) {
  try {
    // Initialize config if not already done
    if (!accompanimentInstance && !vocalInstance) {
      await initializeBeholdAudioConfiguration();
    }

    // Validate URLs before attempting to play
    if (!isValidHttpUrl(accompUri)) {
      console.error('Invalid accompaniment URL:', accompUri);
      // Consider throwing an error or returning false if URL is invalid
      return;
    }
    if (!isValidHttpUrl(vocalUri)) {
      console.error('Invalid vocal URL:', vocalUri);
      // Consider throwing an error or returning false if URL is invalid
      return;
    }

    if (!accompanimentInstance) {
      accompanimentInstance = createAudioPlayer(null);
      accompanimentInstance.shouldCorrectPitch = true;
    }
    // Use replace to load the new source
    accompanimentInstance.replace(accompUri);
    accompanimentInstance.volume = 1.0; // Set default volume, can be adjusted later

    if (!vocalInstance) {
      vocalInstance = createAudioPlayer(null);
      vocalInstance.shouldCorrectPitch = false; // Typically don't correct pitch for vocals
    }
    vocalInstance.replace(vocalUri);
    vocalInstance.volume = 1.0; // Set default volume

    // Play both simultaneously from the beginning
    accompanimentInstance.play();
    vocalInstance.play();
    console.log('Both tracks started playing.');

  } catch (error) {
    console.error('Error playing tracks:', error);
    // Attempt to clean up if playback fails
    await stop();
  }
}

export async function pause() {
  try {
    if (accompanimentInstance) {
      accompanimentInstance.pause();
    }
    if (vocalInstance) {
      vocalInstance.pause();
    }
    console.log('Playback paused.');
  } catch (error) {
    console.error('Error pausing tracks:', error);
  }
}

export async function stop() {
  try {
    if (accompanimentInstance) {
      accompanimentInstance.pause(); // Pause before stopping/removing
      accompanimentInstance.remove();
      accompanimentInstance = null;
    }
    if (vocalInstance) {
      vocalInstance.pause(); // Pause before stopping/removing
      vocalInstance.remove();
      vocalInstance = null;
    }
    console.log('Playback stopped and resources unloaded.');
  } catch (error) {
    console.error('Error stopping tracks:', error);
  }
}

export async function getCurrentPosition(): Promise<number> {
  try {
    if (accompanimentInstance) {
      // Use currentTime property for current playback position
      return accompanimentInstance.currentTime * 1000; // currentTime is in seconds
    }
  } catch (error) {
    console.error('Error getting current position:', error);
  }
  return 0; // Default to 0 if unable to get position
}

export async function safelyTeardownActiveAudioPlayback() {
  try {
    if (accompanimentInstance || vocalInstance) {
      console.log('Tearing down active audio playback...');
      await stop();
    }
  } catch (error) {
    console.error('Error during safe teardown:', error);
  }
}

// Aliases / extra exports for compatibility
export const initializeBeholdAudioSystem = initializeBeholdAudioConfiguration;
export const startSyncedDualTracks = playTracks;
export const terminateAudioSession = stop;

export const setVocalTrackMuteState = async (muted: boolean) => {
  if (vocalInstance) {
    // Assuming expo-audio's AudioPlayer has an setIsMutedAsync or similar, or use volume = 0
    // Based on investigation, expo-audio doesn't directly expose `setIsMutedAsync` on AudioPlayer.
    // We will use volume manipulation instead.
    if (vocalInstance) {
      vocalInstance.volume = muted ? 0 : 1.0; // Set volume to 0 if muted, else to 1.0
    }
  }
};

// Export as an object named audioEngine for compatibility with existing components
export const audioEngine = {
  initializeBeholdAudioConfiguration,
  initializeBeholdAudioSystem,
  playTracks,
  startSyncedDualTracks,
  pause,
  stop,
  terminateAudioSession,
  getCurrentPosition,
  safelyTeardownActiveAudioPlayback,
  setVocalTrackMuteState,
};
