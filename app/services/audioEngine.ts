import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

let accompSound: Audio.Sound | null = null;
let vocalSound: Audio.Sound | null = null;

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

export async function terminateAudioSession(): Promise<void> {
  const soundsToUnload = [accompSound, vocalSound];

  for (const sound of soundsToUnload) {
    if (!sound) {
      continue;
    }

    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (error) {
      console.warn('Audio subsystem teardown warning:', error);
    }
  }

  accompSound = null;
  vocalSound = null;
}

export async function safelyTeardownActiveAudioPlayback(): Promise<void> {
  await terminateAudioSession();
}

export async function startSyncedDualTracks(
  accompAsset: any,
  vocalAsset: any,
  playVocal: boolean,
  onTimeUpdate: (millis: number) => void,
): Promise<void> {
  await terminateAudioSession();
  await initializeBeholdAudioConfiguration();

  const [accompResult, vocalResult] = await Promise.all([
    Audio.Sound.createAsync(accompAsset, { shouldPlay: false }),
    Audio.Sound.createAsync(vocalAsset, { shouldPlay: false }),
  ]);

  accompSound = accompResult.sound;
  vocalSound = vocalResult.sound;

  accompSound.setOnPlaybackStatusUpdate((status: any) => {
    if (!status?.isLoaded) {
      return;
    }

    onTimeUpdate(status.positionMillis ?? 0);
  });

  await Promise.all([accompSound.setVolumeAsync(1.0), vocalSound.setVolumeAsync(playVocal ? 1.0 : 0.0)]);
  await Promise.all([accompSound.playAsync(), vocalSound.playAsync()]);
}

export async function setVocalTrackMuteState(isMuted: boolean): Promise<void> {
  if (!vocalSound) {
    return;
  }

  await vocalSound.setVolumeAsync(isMuted ? 0.0 : 1.0);
}

export async function modifyActivePlaybackRate(speedMultiplier: number): Promise<void> {
  if (!accompSound && !vocalSound) {
    return;
  }

  if (accompSound) {
    await accompSound.setRateAsync(speedMultiplier, true, Audio.PitchCorrectionQuality.High);
  }

  if (vocalSound) {
    await vocalSound.setRateAsync(speedMultiplier, true, Audio.PitchCorrectionQuality.High);
  }
}

export async function playTrackFromRegistry(
  assetSource: any,
  onPlaybackStatusUpdate: (status: any) => void,
): Promise<void> {
  await terminateAudioSession();
  const { sound } = await Audio.Sound.createAsync(assetSource, { shouldPlay: true }, onPlaybackStatusUpdate);
  accompSound = sound;
}
