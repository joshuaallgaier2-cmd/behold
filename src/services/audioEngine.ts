import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

let accompanimentInstance: Audio.Sound | null = null;
let vocalInstance: Audio.Sound | null = null;

export async function initializeBeholdAudioSystem(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      staysActiveInBackground: false,
    });
  } catch (error) {
    console.warn('initializeBeholdAudioSystem failed', error);
  }
}

export const initializeBeholdAudioConfiguration = initializeBeholdAudioSystem;

export async function terminateAudioSession(): Promise<void> {
  const pendingSounds = [accompanimentInstance, vocalInstance];

  for (const sound of pendingSounds) {
    if (!sound) {
      continue;
    }

    try {
      await sound.stopAsync();
    } catch (error) {
      console.warn('Audio stop warning:', error);
    }

    try {
      await sound.unloadAsync();
    } catch (error) {
      console.warn('Audio unload warning:', error);
    }
  }

  accompanimentInstance = null;
  vocalInstance = null;
}

export async function safelyTeardownActiveAudioPlayback(): Promise<void> {
  await terminateAudioSession();
}

export async function startSyncedDualTracks(
  accompSource: any,
  vocalSource: any,
  playVocal: boolean,
  onTimeUpdate: (ms: number) => void,
): Promise<void> {
  await terminateAudioSession();
  await initializeBeholdAudioSystem();

  const [accompanimentResult, vocalResult] = await Promise.all([
    Audio.Sound.createAsync(accompSource, { shouldPlay: false }),
    Audio.Sound.createAsync(vocalSource, { shouldPlay: false }),
  ]);

  accompanimentInstance = accompanimentResult.sound;
  vocalInstance = vocalResult.sound;

  accompanimentInstance.setOnPlaybackStatusUpdate((status: any) => {
    if (!status?.isLoaded) {
      return;
    }

    onTimeUpdate(status.positionMillis ?? 0);
  });

  await Promise.all([
    accompanimentInstance.setVolumeAsync(1.0),
    vocalInstance.setVolumeAsync(playVocal ? 1.0 : 0.0),
  ]);

  await Promise.all([accompanimentInstance.playAsync(), vocalInstance.playAsync()]);
}

export async function setVocalTrackMuteState(isMuted: boolean): Promise<void> {
  if (!vocalInstance) {
    return;
  }

  await vocalInstance.setVolumeAsync(isMuted ? 0.0 : 1.0);
}
