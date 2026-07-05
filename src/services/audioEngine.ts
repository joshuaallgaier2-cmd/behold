import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

let accompanimentInstance: Audio.Sound | null = null;
let vocalInstance: Audio.Sound | null = null;
let micPollingIntervalId: any = null;
let isMicrophoneActive: boolean = false;

export const initializeBeholdAudioConfiguration = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true, // MUST be true on iOS if allowsRecordingIOS is true
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      staysActiveInBackground: false,
    });
    console.log('Behold audio configuration initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Behold audio configuration:', error);
    throw error;
  }
};

export async function terminateAudioSession() {
  deactivateMicrophoneSession();
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
    console.log('Audio session terminated.');
  } catch (error) {
    console.error('Failed to terminate audio session:', error);
  }
}

export async function startSyncedDualTracks(
  accompSource: any,
  vocalSource: any,
  playVocal: boolean,
  onTimeUpdate: (ms: number) => void
) {
  await terminateAudioSession();

  try {
    const { sound: newAccompInstance } = await Audio.Sound.createAsync(
      accompSource,
      { shouldPlay: false, isLooping: false, volume: 1.0 },
      (status) => {
        if (status.isLoaded && status.isPlaying) {
          onTimeUpdate(status.positionMillis);
        }
      }
    );
    accompanimentInstance = newAccompInstance;

    const { sound: newVocalInstance } = await Audio.Sound.createAsync(
      vocalSource,
      { shouldPlay: false, isLooping: false, volume: playVocal ? 1.0 : 0.0 }
    );
    vocalInstance = newVocalInstance;

    // Synchronized Start
    await accompanimentInstance.playAsync();
    await vocalInstance.playAsync();

    console.log('Dual tracks started in sync.');
  } catch (error) {
    console.error('Failed to start dual tracks:', error);
    await terminateAudioSession();
  }
}

export async function setVocalTrackMuteState(isMuted: boolean) {
  try {
    if (vocalInstance) {
      await vocalInstance.setVolumeAsync(isMuted ? 0.0 : 1.0);
      console.log(`Vocal track ${isMuted ? 'muted' : 'unmuted'}.`);
    } else {
      console.warn('Vocal instance not found, cannot change mute state.');
    }
  } catch (error) {
    console.error('Error setting vocal track mute state:', error);
  }
}

export async function activateMicrophoneSession(onPitchDetected: (hertz: number) => void) {
  if (isMicrophoneActive) {
    console.warn('Microphone session already active.');
    return;
  }

  try {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      console.error('Microphone permission not granted.');
      return;
    }

    isMicrophoneActive = true;
    console.log('Microphone session activated.');

    // Simulated Pitch Detection Polling
    micPollingIntervalId = setInterval(() => {
      if (!isMicrophoneActive) return;
      const mockFrequency = 200 + Math.random() * 400; 
      onPitchDetected(mockFrequency);
    }, 120);
  } catch (error) {
    console.error('Failed to activate microphone session:', error);
    isMicrophoneActive = false;
  }
}

export function deactivateMicrophoneSession() {
  if (micPollingIntervalId) {
    clearInterval(micPollingIntervalId);
    micPollingIntervalId = null;
  }
  isMicrophoneActive = false;
  console.log('Microphone session deactivated.');
}