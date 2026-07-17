import { Audio } from 'expo-av';

let accompanimentInstance: Audio.Sound | null = null;
let vocalInstance: Audio.Sound | null = null;

export const audioEngine = {
  async init() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to set audio mode:', error);
    }
  },

  async play(accompSource: any, vocalSource: any = null) {
    await this.stop();

    try {
      const { sound: accomp } = await Audio.Sound.createAsync(accompSource, {}, () => {});
      accompanimentInstance = accomp;

      if (vocalSource) {
        const { sound: vocal } = await Audio.Sound.createAsync(vocalSource, {}, () => {});
        vocalInstance = vocal;
        await vocalInstance.playAsync();
      }

      await accompanimentInstance.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  },

  async pause() {
    if (accompanimentInstance) {
      await accompanimentInstance.pauseAsync();
    }
    if (vocalInstance) {
      await vocalInstance.pauseAsync();
    }
  },

  async resume() {
    if (accompanimentInstance) {
      await accompanimentInstance.playAsync();
    }
    if (vocalInstance) {
      await vocalInstance.playAsync();
    }
  },

  async stop() {
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
  },

  async getCurrentPosition() {
    if (accompanimentInstance) {
      try {
        const status = await accompanimentInstance.getStatusAsync();
        if (status.isLoaded) {
          return status.positionMillis || 0;
        }
      } catch (error) {
        console.error('Error getting current position:', error);
        return 0;
      }
    }
    return 0;
  },

  async terminateAudioSession() {
    await this.stop();
    // Potentially more cleanup here if needed
  }
};
