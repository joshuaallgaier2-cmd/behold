import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

let accompanimentInstance: Audio.Sound | null = null;
let vocalInstance: Audio.Sound | null = null;
let micPollingIntervalId: number | null = null;
let isMicrophoneActive: boolean = false; // Track microphone state

export async function initializeBeholdAudioSystem() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });
    console.log('Behold audio system initialized.');
  } catch (error) {
    console.error('Failed to initialize audio system:', error);
  }
}

export async function terminateAudioSession() {
  deactivateMicrophoneSession(); // Ensure microphone is off
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
  await terminateAudioSession(); // Clear out existing sound items first

  try {
    const { sound: newAccompInstance } = await Audio.Sound.createAsync(
      accompSource,
      { shouldPlay: true, isLooping: false, volume: 1.0 },
      status => {
        if (status.isLoaded && status.isPlaying) {
          onTimeUpdate(status.positionMillis);
        }
      }
    );
    accompanimentInstance = newAccompInstance;

    const { sound: newVocalInstance } = await Audio.Sound.createAsync(
      vocalSource,
      { shouldPlay: true, isLooping: false, volume: playVocal ? 1.0 : 0.0 },
    );
    vocalInstance = newVocalInstance;

    await newAccompInstance.playAsync();
    await newVocalInstance.playAsync();

    console.log('Dual tracks started.');
  } catch (error) {
    console.error('Failed to start dual tracks:', error);
    await terminateAudioSession();
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

    // Simulate microphone input polling
    micPollingIntervalId = setInterval(() => {
      if (!isMicrophoneActive) return; // Check if deactivated during interval
      // Simulate detecting a frequency. In a real scenario, this would come from a DSP library.
      const mockFrequency = 200 + Math.random() * 400; // Simulate a frequency between 200Hz and 600Hz
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