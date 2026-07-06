import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

// Internal module parameters for track instances
let accompanimentInstance: Audio.Sound | null = null;
let vocalInstance: Audio.Sound | null = null;

/**
 * Initialize the Behold audio system with isolation settings.
 * Configures interruption modes and silent mode behavior per platform.
 */
export async function initializeBeholdAudioSystem(): Promise<void> {
  await Audio.setAudioModeAsync({
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    playsInSilentModeIOS: false,
  });
}

/**
 * Safely clear and unload both audio track players.
 * Called when app loses focus or user exits to prevent memory leaks.
 */
export async function terminateAudioSession(): Promise<void> {
  if (accompanimentInstance) {
    await accompanimentInstance.unloadAsync();
    accompanimentInstance = null;
  }
  if (vocalInstance) {
    await vocalInstance.unloadAsync();
    vocalInstance = null;
  }
}

/**
 * Launch both audio tracks concurrently with time update callbacks.
 * @param accompSource - Accompaniment audio asset
 * @param vocalSource - Vocal audio asset
 * @param playVocal - Whether to enable vocal track playback
 * @param onTimeUpdate - Callback receiving current playback time in milliseconds
 */
export async function startSyncedDualTracks(
  accompSource: any,
  vocalSource: any,
  playVocal: boolean,
  onTimeUpdate: (ms: number) => void
): Promise<void> {
  // Initialize accompaniment track
  if (accompanimentInstance) {
    await accompanimentInstance.unloadAsync();
  }
  const { sound: accompSound } = await Audio.Sound.createAsync(accompSource);
  accompanimentInstance = accompSound;
  await accompanimentInstance.playAsync();

  // Initialize vocal track only if enabled
  if (vocalInstance) {
    await vocalInstance.unloadAsync();
  }
  if (playVocal) {
    const { sound: vocalSound } = await Audio.Sound.createAsync(vocalSource);
    vocalInstance = vocalSound;
    await vocalInstance.playAsync();
  }

  // Set up time update listener for playback position
  accompanimentInstance.setOnPlaybackStatusUpdate((status: any) => {
    if (status.isLoaded && status.didJustFinish) {
      terminateAudioSession();
    } else if (status.isLoaded) {
      onTimeUpdate(status.positionMillis);
    }
  });

  if (vocalInstance) {
    vocalInstance.setOnPlaybackStatusUpdate((status: any) => {
      if (status.isLoaded && status.didJustFinish) {
        terminateAudioSession();
      } else if (status.isLoaded) {
        onTimeUpdate(status.positionMillis);
      }
    });
  }
}

/**
 * Toggle vocal track volume between muted (0.0) and full (1.0).
 * @param isMuted - Set true to mute vocals, false to unmute
 */
export async function setVocalTrackMuteState(isMuted: boolean): Promise<void> {
  if (vocalInstance) {
    const newVolume = isMuted ? 0.0 : 1.0;
    await vocalInstance.setVolumeAsync(newVolume);
  }
}