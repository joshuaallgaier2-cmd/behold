import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

let activeSoundInstance: Audio.Sound | null = null;

export async function initializeBeholdAudioConfiguration(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      staysActiveInBackground: false,
    });
  } catch (error) {
    console.warn('initializeBeholdAudioConfiguration failed', error);
  }
}

export async function safelyTeardownActiveAudioPlayback(): Promise<void> {
  if (!activeSoundInstance) {
    return;
  }

  try {
    await activeSoundInstance.stopAsync();
    await activeSoundInstance.unloadAsync();
  } catch (error) {
    console.warn('Audio subsystem teardown warning:', error);
  } finally {
    activeSoundInstance = null;
  }
}

export async function playTrackFromRegistry(
  assetSource: any,
  onPlaybackStatusUpdate: (status: any) => void,
): Promise<void> {
  await safelyTeardownActiveAudioPlayback();
  const { sound } = await Audio.Sound.createAsync(assetSource, { shouldPlay: true }, onPlaybackStatusUpdate);
  activeSoundInstance = sound;
}

export async function modifyActivePlaybackRate(speedMultiplier: number): Promise<void> {
  if (!activeSoundInstance) {
    return;
  }

  await activeSoundInstance.setRateAsync(speedMultiplier, true, Audio.PitchCorrectionQuality.High);
}
