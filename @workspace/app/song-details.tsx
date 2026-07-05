import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BEHOLD_ASSET_REGISTRY, INTERACTIVE_MUSIC_DATABASE } from '../../src/data/musicData';
import { initializeBeholdAudioSystem, setVocalTrackMuteState, startSyncedDualTracks, terminateAudioSession } from '../../src/services/audioEngine';
import ScrollingCanvas from './components/ScrollingCanvas';

export default function SongDetailsScreen() {
  const { number } = useLocalSearchParams();
  const router = useRouter();

  const activeSong = INTERACTIVE_MUSIC_DATABASE.find(s => s.number === Number(number));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isVocalMuted, setIsVocalMuted] = useState(false);

  // Initialize audio system on mount
  useEffect(() => {
    initializeBeholdAudioSystem();

    return () => {
      terminateAudioSession();
    };
  }, []);

  // Start playback handler
  const handleStartPractice = async () => {
    if (!activeSong) return;

    const accompSource = BEHOLD_ASSET_REGISTRY[activeSong.accompAudioKey];
    const vocalSource = BEHOLD_ASSET_REGISTRY[activeSong.vocalAudioKey];

    await startSyncedDualTracks(
      accompSource,
      vocalSource,
      !isVocalMuted,
      (time) => {
        setCurrentTimeMs(time);
      }
    );

    setIsPlaying(true);
  };

  const handleStopPractice = async () => {
    await terminateAudioSession();
    setIsPlaying(false);
    setCurrentTimeMs(0);
  };

  // Handle vocal mute toggle
  const handleVocalMuteToggle = () => {
    if (activeSong) {
      const accompSource = BEHOLD_ASSET_REGISTRY[activeSong.accompAudioKey];
      const vocalSource = BEHOLD_ASSET_REGISTRY[activeSong.vocalAudioKey];

      setVocalTrackMuteState(isVocalMuted);
      setIsVocalMuted(!isVocalMuted);

      // Restart tracks with new vocal state
      startSyncedDualTracks(
        accompSource,
        vocalSource,
        !isVocalMuted,
        (time) => {
          setCurrentTimeMs(time);
        }
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!activeSong) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No song data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{activeSong.title}</Text>
      </View>

      {/* Scrolling Canvas - Piano Roll View */}
      <View style={styles.canvasContainer}>
        <ScrollingCanvas
          notes={activeSong.notes}
          currentTimeMs={currentTimeMs}
          introDurationMs={activeSong.introDurationMs}
        />
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Playback Toggle */}
        <TouchableOpacity
          onPress={isPlaying ? handleStopPractice : handleStartPractice}
          style={[
            styles.playButton,
            isPlaying && styles.playButtonActive,
          ]}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? 'Stop Practice Track' : 'Start Practice Track'}
          </Text>
        </TouchableOpacity>

        {/* Mode Selector */}
        <View style={styles.modeSelectorContainer}>
          <Text style={styles.modeLabel}>Mode:</Text>
          <TouchableOpacity
            onPress={() => {
              setIsVocalMuted(true);
              handleVocalMuteToggle();
            }}
            style={[
              styles.modeButton,
              isVocalMuted && styles.modeButtonActive,
            ]}
          >
            <Text style={styles.modeButtonText}>Accompaniment Only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setIsVocalMuted(false);
              handleVocalMuteToggle();
            }}
            style={[
              styles.modeButton,
              !isVocalMuted && styles.modeButtonActive,
            ]}
          >
            <Text style={styles.modeButtonText}>Mix Choir Tracker</Text>
          </TouchableOpacity>
        </View>

        {/* Vocal Mute Toggle */}
        <TouchableOpacity
          onPress={handleVocalMuteToggle}
          style={[
            styles.vocalMuteButton,
            isVocalMuted && styles.vocalMuteButtonMuted,
          ]}
        >
          <Text style={styles.vocalMuteButtonText}>
            {isVocalMuted ? '🔊 Unmute Vocals' : '🔇 Mute Vocals'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlPanel: {
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    padding: 16,
  },
  playButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  playButtonActive: {
    backgroundColor: '#2563EB',
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modeSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeLabel: {
    color: '#ffffff',
    fontSize: 14,
    marginRight: 8,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modeButtonActive: {
    backgroundColor: '#4B5563',
  },
  modeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  vocalMuteButton: {
    backgroundColor: '#4B5563',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  vocalMuteButtonMuted: {
    backgroundColor: '#EF4444',
  },
  vocalMuteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666666',
    fontSize: 16,
  },
});