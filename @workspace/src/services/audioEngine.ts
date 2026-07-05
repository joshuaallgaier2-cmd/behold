import * as Audio from 'expo-av';

// Internal module parameters for track instances
let accompanimentInstance: Audio.Sound | null = null;
let vocalInstance: Audio.Sound | null = null;

/**
 * Initialize the Behold audio system with isolation settings.
 * Configures interruption modes and silent mode behavior per platform.
 */
export async function initializeBeholdAudioSystem(): Promise<void> {
  await Audio.setAsync({
    interruptionModeIOS: Audio.InterruptionMode.DoNotMix,
    interruptionModeAndroid: Audio.InterruptionMode.DoNotMix,
    playsInSilentModeIOS: false, // Follow hardware physical silent/ringer switch
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
 * @param accompSource - Accompaniment audio asset (require'd image source)
 * @param vocalSource - Vocal audio asset (require'd image source)
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
  accompanimentInstance = new Audio.Sound(accompSource);
  await accompanimentInstance.playAsync();

  // Initialize vocal track only if enabled
  if (playVocal && vocalInstance) {
    await vocalInstance.unloadAsync();
  }
  if (playVocal) {
    vocalInstance = new Audio.Sound(vocalSource);
    await vocalInstance.playAsync();
  }

  // Set up time update listener for playback position
  accompanimentInstance?.setOnPlaybackStatusUpdate((status: any) => {
    if (status.isLoaded && status.didJustFinish) {
      // Track finished - clean up instances
      terminateAudioSession();
    } else if (status.isLoaded) {
      onTimeUpdate(status.positionMillis);
    }
  });

  vocalInstance?.setOnPlaybackStatusUpdate((status: any) => {
    if (status.isLoaded && status.didJustFinish) {
      // Vocal track finished - clean up instances
      terminateAudioSession();
    } else if (status.isLoaded) {
      onTimeUpdate(status.positionMillis);
    }
  });
}

/**
 * Toggle vocal track volume between muted (0.0) and full (1.0).
 * @param isMuted - Set true to mute vocals, false to unmute
 */
export function setVocalTrackMuteState(isMuted: boolean): void {
  if (vocalInstance) {
    const newVolume = isMuted ? 0.0 : 1.0;
    vocalInstance.setVolumeAsync(newVolume);
  }
}