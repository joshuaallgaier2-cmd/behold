import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let accompanimentInstance: AudioPlayer | null = null;
let vocalInstance: AudioPlayer | null = null;

function safePause(player: AudioPlayer | null): void {
  if (!player) {
    return;
  }

  try {
    player.pause();
  } catch (error) {
    console.error('Error pausing audio player:', error);
  }
}

function safeRemove(player: AudioPlayer | null): void {
  if (!player) {
    return;
  }

  safePause(player);

  try {
    player.remove();
  } catch (error) {
    console.error('Error releasing audio player:', error);
  }
}

function safePlay(player: AudioPlayer | null): void {
  if (!player) {
    return;
  }

  try {
    player.play();
  } catch (error) {
    console.error('Error starting audio playback:', error);
  }
}

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
    if (!vocalInstance) {
      vocalInstance = createAudioPlayer(null);
      vocalInstance.shouldCorrectPitch = false;
    }

    if (!accompanimentInstance || !vocalInstance) {
      console.error('Audio players were not initialized; skipping playback.');
      return;
    }

    accompanimentInstance.replace(accompUri);
    accompanimentInstance.volume = 1.0;
    vocalInstance.replace(vocalUri);
    vocalInstance.volume = 1.0;

    // Play both simultaneously from the beginning
    safePlay(accompanimentInstance);
    safePlay(vocalInstance);
    console.log('Both tracks started playing.');

  } catch (error) {
    console.error('Error playing tracks:', error);
    // Attempt to clean up if playback fails
    await stop();
  }
}

export async function pause() {
  try {
    safePause(accompanimentInstance);
    safePause(vocalInstance);
    console.log('Playback paused.');
  } catch (error) {
    console.error('Error pausing tracks:', error);
  }
}

export async function stop() {
  const accompaniment = accompanimentInstance;
  const vocal = vocalInstance;
  accompanimentInstance = null;
  vocalInstance = null;

  try {
    safeRemove(accompaniment);
    safeRemove(vocal);
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
  if (!vocalInstance) {
    return;
  }

  try {
    vocalInstance.muted = muted;
    vocalInstance.volume = muted ? 0 : 1.0;
  } catch (error) {
    console.error('Error updating vocal mute state:', error);
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
