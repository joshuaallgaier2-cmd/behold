import { Audio } from 'expo-av';

let accompanimentInstance: InstanceType<typeof Audio.Sound> | null = null;
let vocalInstance: InstanceType<typeof Audio.Sound> | null = null;

export async function initializeBeholdAudioConfiguration() {
  try {
    // Use numeric raw values for compatibility with SDK 54
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      interruptionModeIOS: 1, // DoNotMix
      interruptionModeAndroid: 1, // DoNotMix
      shouldDuckAndroid: false,
      staysActiveInBackground: false,
    });
    console.log('Audio configuration initialized successfully.');
  } catch (error) {
    console.error('Error initializing audio configuration:', error);
  }
}

export async function playTracks(accompUri: string, vocalUri: string) {
  try {
    await initializeBeholdAudioConfiguration(); // Ensure config is set before playing

    const accompSource = { uri: accompUri };
    const vocalSource = { uri: vocalUri };

    if (!accompanimentInstance) {
      accompanimentInstance = new Audio.Sound();
    }
    await accompanimentInstance.loadAsync(accompSource, { shouldPlay: false });

    if (!vocalInstance) {
      vocalInstance = new Audio.Sound();
    }
    await vocalInstance.loadAsync(vocalSource, { shouldPlay: false });

    // Play both simultaneously
    await accompanimentInstance.playFromPositionAsync(0);
    await vocalInstance.playFromPositionAsync(0);
    console.log('Both tracks started playing.');

  } catch (error) {
    console.error('Error playing tracks:', error);
    // Optionally, attempt to clean up if playback fails
    await stop();
  }
}

export async function pause() {
  try {
    if (accompanimentInstance) {
      await accompanimentInstance.pauseAsync();
    }
    if (vocalInstance) {
      await vocalInstance.pauseAsync();
    }
    console.log('Playback paused.');
  } catch (error) {
    console.error('Error pausing tracks:', error);
  }
}

export async function stop() {
  try {
    if (accompanimentInstance) {
      await accompanimentInstance.stopAsync();
      await accompanimentInstance.unloadAsync();
      accompanimentInstance = null;
    }
    if (vocalInstance) {
      await vocalInstance.stopAsync();
      await vocalInstance.unloadAsync();
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
      const status = await accompanimentInstance.getStatusAsync();
      if (status.isLoaded && status.positionMillis !== undefined) {
        return status.positionMillis;
      }
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
    await vocalInstance.setIsMutedAsync(muted);
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
