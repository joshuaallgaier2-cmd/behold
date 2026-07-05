import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BEHOLD_ASSET_REGISTRY, INTERACTIVE_MUSIC_DATABASE } from '../src/data/musicData';
import { activateMicrophoneSession, deactivateMicrophoneSession, initializeBeholdAudioSystem, startSyncedDualTracks, terminateAudioSession } from '../src/services/audioEngine';
import { convertFrequencyToMidi, convertMidiToNoteName } from '../src/services/pitchEngine';
import ScrollingCanvas from './components/ScrollingCanvas';

const NOTE_HIT_TOLERANCE_MS = 180; // Milliseconds tolerance for hitting a note

const SongDetailsScreen: React.FC = () => {
  const { id } = useLocalSearchParams();
  const songId = id as string;

  const currentSong = INTERACTIVE_MUSIC_DATABASE.find(song => song.id === songId);

  // State hooks
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hitNoteIds, setHitNoteIds] = useState<string[]>([]);
  const [missedNoteIds, setMissedNoteIds] = useState<string[]>([]);
  const [userScore, setUserScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [micStatusText, setMicStatusText] = useState("Microphone Inactive");
  const [latencyCalibrationMs, setLatencyCalibrationMs] = useState(0); // Adjustable delay tracker for hardware input lag
  const playbackIntervalRef = useRef<number | null>(null);

  // AppState listener for focus changes and unmount
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        console.log('App is in background or inactive, terminating audio/mic sessions.');
        await terminateAudioSession();
        deactivateMicrophoneSession();
        setIsPlaying(false);
        setMicStatusText("Microphone Inactive");
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      console.log('SongDetailsScreen unmounting, terminating audio/mic sessions.');
      terminateAudioSession();
      deactivateMicrophoneSession();
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    initializeBeholdAudioSystem();
  }, []);

  const handleTimeUpdate = (ms: number) => {
    setPlaybackTime(ms);
  };

  const startPractice = async () => {
    if (!currentSong) return;

    setPlaybackTime(0);
    setHitNoteIds([]);
    setMissedNoteIds([]);
    setUserScore(0);
    setCurrentStreak(0);
    setIsPlaying(true);
    setMicStatusText("Microphone Active");

    const accompAudioSource = BEHOLD_ASSET_REGISTRY[currentSong.accompAudioKey];
    const vocalAudioSource = BEHOLD_ASSET_REGISTRY[currentSong.vocalAudioKey];

    if (!accompAudioSource) {
      console.error(`Accompaniment audio source for key ${currentSong.accompAudioKey} not found.`);
      setIsPlaying(false);
      setMicStatusText("Microphone Inactive");
      return;
    }

    await startSyncedDualTracks(accompAudioSource, vocalAudioSource, false, handleTimeUpdate);

    activateMicrophoneSession((hertz) => {
      const midi = convertFrequencyToMidi(hertz);
      const noteName = convertMidiToNoteName(midi);
      // console.log(`Detected pitch: ${noteName} (${hertz}Hz, MIDI: ${midi})`);

      const calibratedTimeMark = playbackTime - latencyCalibrationMs;

      // Real-Time Note Verification Game Loop
      currentSong.notes.forEach((note) => {
        // Mark as missed if past the note's hit window and not already hit/missed
        const hasPassedNote = calibratedTimeMark > (note.startTimeMs + NOTE_HIT_TOLERANCE_MS);
        if (hasPassedNote && !hitNoteIds.includes(note.id) && !missedNoteIds.includes(note.id)) {
          setMissedNoteIds(prev => [...prev, note.id]);
          setCurrentStreak(0); // Reset streak on miss
        }

        // Check for hit
        const isWithinHitWindow =
          calibratedTimeMark >= (note.startTimeMs - NOTE_HIT_TOLERANCE_MS) &&
          calibratedTimeMark <= (note.startTimeMs + NOTE_HIT_TOLERANCE_MS);

        if (isWithinHitWindow && !hitNoteIds.includes(note.id)) {
          if (note.midiNumber === midi) {
            setHitNoteIds(prev => [...prev, note.id]);
            setCurrentStreak(prev => prev + 1);
            setUserScore(prev => prev + (100 * (currentStreak + 1))); // Score with multiplier
            console.log(`HIT! Note: ${note.pitch}, Streak: ${currentStreak + 1}`);
          } else if (midi !== -1) { // If a pitch is detected but it's wrong
            setCurrentStreak(0); // Reset streak on incorrect key
            console.log(`WRONG NOTE! Expected: ${note.pitch}, Detected: ${noteName}`);
          }
        }
      });
    });

    playbackIntervalRef.current = setInterval(() => {
      // This interval is primarily for UI updates if onTimeUpdate from expo-av isn't frequent enough
      // The onTimeUpdate callback from startSyncedDualTracks will drive the main playbackTime
    }, 50); // Update UI roughly every 50ms for smoother scrolling
  };

  const stopPractice = async () => {
    setIsPlaying(false);
    await terminateAudioSession();
    deactivateMicrophoneSession();
    setMicStatusText("Microphone Inactive");
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    setPlaybackTime(0); // Reset playback time on stop
  };

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Song not found!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Performance Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>Score: {userScore}</Text>
        <Text style={styles.topBarText}>Streak: {currentStreak}</Text>
        <Text style={styles.topBarText}>Mic: {micStatusText}</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>Latency Calibration: {latencyCalibrationMs}ms</Text>
          <View style={styles.calibrationButtons}>
            <TouchableOpacity 
              style={styles.calButton} 
              onPress={() => setLatencyCalibrationMs(prev => prev - 10)}
            >
              <Text style={styles.calButtonText}>-10ms</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.calButton} 
              onPress={() => setLatencyCalibrationMs(prev => prev + 10)}
            >
              <Text style={styles.calButtonText}>+10ms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Canvas Middle */}
      <ScrollingCanvas
        notes={currentSong.notes}
        currentTimeMs={playbackTime}
        introDurationMs={currentSong.introDurationMs}
        bpm={currentSong.bpm}
        hitNoteIds={hitNoteIds}
        missedNoteIds={missedNoteIds}
      />

      {/* Lower Panel Controls */}
      <View style={styles.lowerPanel}>
        <Button
          title={isPlaying ? "Stop Practice" : "Start Practice"}
          onPress={isPlaying ? stopPractice : startPractice}
          color={isPlaying ? "#FF3B30" : "#4CD964"}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // High-visibility dark mode
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1E1E1E',
  },
  topBarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  sliderLabel: {
    color: '#FFF',
    fontSize: 12,
    marginBottom: 5,
  },
  calibrationButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  calButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  calButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lowerPanel: {
    padding: 20,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default SongDetailsScreen;