import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useBeholdTheme } from '../hooks/use-behold-theme';
import { INTERACTIVE_MUSIC_DATABASE, InteractiveSong } from '../src/data/musicData';
import { audioEngine } from '../src/services/audioEngine';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const STAFF_HEIGHT = 200;
const PLAYHEAD_X = WINDOW_WIDTH * 0.2;
const PIXELS_PER_MS = 0.15;

const PITCH_MAP: Record<string, number> = {
  'C4': 0,
  'D4': 1,
  'E4': 2,
  'F4': 3,
  'G4': 4,
  'A4': 5,
  'B4': 6,
  'C5': 7,
};

export default function SongDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useBeholdTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<InteractiveSong | null>(null);
  
  const scrollX = useSharedValue(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const song = INTERACTIVE_MUSIC_DATABASE.find(s => s.id === id);
    setCurrentSong(song || null);
  }, [id]);

  useEffect(() => {
    audioEngine.init();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const updatePosition = async () => {
        const position = await audioEngine.getCurrentPosition();
        scrollX.value = position * PIXELS_PER_MS;
        requestRef.current = requestAnimationFrame(updatePosition);
      };
      requestRef.current = requestAnimationFrame(updatePosition);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  const togglePlayback = async () => {
    if (!currentSong) return;

    if (isPlaying) {
      await audioEngine.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Directly use the song's audio files for playback
      await audioEngine.play({
        uri: `http://localhost:8081/assets/audio/${currentSong.id}_accomp.mp3` // Placeholder, adjust as needed
      }, {
        uri: `http://localhost:8081/assets/audio/${currentSong.id}_vocals.mp3` // Placeholder, adjust as needed
      });
    }
  };

  const resetPlayback = async () => {
    await audioEngine.stop();
    setIsPlaying(false);
    scrollX.value = withTiming(0, { duration: 300 });
  };

  const animatedStaffStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
  }));

  if (!currentSong) return null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{
          title: currentSong.title,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
        }}
      />

      <View style={styles.header}>
        <ThemedText style={styles.title}>{currentSong.title}</ThemedText>
        <ThemedText style={styles.subtitle}>{currentSong.number}</ThemedText>
      </View>

      <View style={[styles.canvasContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.staffLinesContainer}>
          {[...Array(5)].map((_, i) => (
            <View 
              key={i} 
              style={[styles.staffLine, { backgroundColor: theme.colors.border }]} 
            />
          ))}
        </View>

        <View style={[styles.playhead, { backgroundColor: theme.colors.primary }]} />

        <Animated.View style={[styles.noteStrip, animatedStaffStyle]}>
          {currentSong.notes.map((note) => {
            const pitchY = PITCH_MAP[note.pitch] ?? 0;
            return (
              <View 
                key={note.id} 
                style={[
                  styles.note, 
                  {
                    left: note.timeMs * PIXELS_PER_MS,
                    bottom: (pitchY * 10) + 40,
                    backgroundColor: theme.colors.primary 
                  }
                ]} 
              />
            );
          })}
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }]} 
          onPress={togglePlayback}
        >
          <ThemedText style={styles.buttonText}>
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.border }]} 
          onPress={resetPlayback}
        >
          <ThemedText style={styles.buttonText}>RESET</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  canvasContainer: {
    height: STAFF_HEIGHT,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  staffLinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  staffLine: {
    height: 2,
    marginVertical: 10,
    width: '100%',
  },
  playhead: {
    position: 'absolute',
    left: PLAYHEAD_X,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 10,
  },
  noteStrip: {
    position: 'absolute',
    top: 0,
    left: PLAYHEAD_X,
    height: '100%',
    width: 5000,
  },
  note: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  controls: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    color: 'white',
  },
});
