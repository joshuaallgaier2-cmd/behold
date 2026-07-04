import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ScrollingCanvas from './components/ScrollingCanvas';
import { INTERACTIVE_MUSIC_DATABASE } from './data/musicData';
import {
    initializeBeholdAudioConfiguration,
    setVocalTrackMuteState,
    startSyncedDualTracks,
    terminateAudioSession,
} from './services/audioEngine';

export default function SongDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const rawNumber = Array.isArray(params.number) ? params.number[0] : params.number;
  const numericNumber = Number(rawNumber ?? 0);
  const activeSong = INTERACTIVE_MUSIC_DATABASE.find((song) => song.number === numericNumber) ?? INTERACTIVE_MUSIC_DATABASE[0];

  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [enableVocals, setEnableVocals] = useState(false);
  const [detectedNoteText, setDetectedNoteText] = useState('Listening...');

  useEffect(() => {
    void initializeBeholdAudioConfiguration();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        void terminateAudioSession();
        setIsPlaying(false);
        setPlaybackTime(0);
        setDetectedNoteText('Listening...');
      }
    });

    return () => {
      subscription.remove();
      void terminateAudioSession();
    };
  }, []);

  useEffect(() => {
    setPlaybackTime(0);
    setIsPlaying(false);
    setEnableVocals(false);
    setDetectedNoteText('Listening...');
  }, [numericNumber]);

  const handleBackPress = async () => {
    await terminateAudioSession();
    router.back();
  };

  const handleTogglePlayback = async () => {
    if (isPlaying) {
      await terminateAudioSession();
      setIsPlaying(false);
      setPlaybackTime(0);
      setDetectedNoteText('Listening...');
      return;
    }

    if (!activeSong) {
      return;
    }

    try {
      setDetectedNoteText('Listening...');
      await startSyncedDualTracks(activeSong.accompAudio, activeSong.vocalAudio, enableVocals, (millis: number) => {
        setPlaybackTime(millis);
      });
      setIsPlaying(true);
    } catch (error) {
      console.warn('Failed to start synced tracks', error);
      setIsPlaying(false);
      setPlaybackTime(0);
      setDetectedNoteText('Listening...');
    }
  };

  const handleVocalToggle = async (nextValue: boolean) => {
    setEnableVocals(nextValue);

    if (!isPlaying) {
      return;
    }

    try {
      await setVocalTrackMuteState(!nextValue);
    } catch (error) {
      console.warn('Failed to toggle vocal track', error);
    }
  };

  const formatPlaybackTime = (millis: number) => {
    if (!millis || Number.isNaN(millis)) {
      return '00:00';
    }

    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => void handleBackPress()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>{activeSong?.title ?? 'Practice Mode'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.heroPanel}>
          <Text style={styles.heroTitle}>Interactive Music Trainer</Text>
          <Text style={styles.heroSubtitle}>Follow the paced note lane, then sing or play along with the synchronized mix.</Text>
        </View>

        <View style={styles.controlPanel}>
          <Text style={styles.panelLabel}>Mix</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, !enableVocals && styles.toggleButtonActive]}
              onPress={() => void handleVocalToggle(false)}
            >
              <Text style={[styles.toggleText, !enableVocals && styles.toggleTextActive]}>Accompaniment Only</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, enableVocals && styles.toggleButtonActive]}
              onPress={() => void handleVocalToggle(true)}
            >
              <Text style={[styles.toggleText, enableVocals && styles.toggleTextActive]}>Include Vocal Choir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.canvasPanel}>
          <ScrollingCanvas
            notes={activeSong?.notes ?? []}
            currentTimeMs={playbackTime}
            introDurationMs={activeSong?.introDurationMs ?? 0}
          />
        </View>

        <View style={styles.bottomPanel}>
          <TouchableOpacity style={styles.playButton} onPress={() => void handleTogglePlayback()}>
            <Text style={styles.playButtonText}>{isPlaying ? '■ Stop Practice' : '▶ Start Practice'}</Text>
          </TouchableOpacity>
          <Text style={styles.timeText}>Playback: {formatPlaybackTime(playbackTime)}</Text>
          <View style={styles.detectionCard}>
            <Text style={styles.detectionLabel}>Microphone Note Detector</Text>
            <Text style={styles.detectionValue}>{detectedNoteText}</Text>
            {/* Placeholder for future native pitch detection integration. */}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#292929',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
  },
  titleText: {
    flex: 1,
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  heroPanel: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#B6B6B6',
    fontSize: 13,
    lineHeight: 18,
  },
  controlPanel: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  panelLabel: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    backgroundColor: '#222222',
  },
  toggleButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  toggleText: {
    color: '#F2F2F2',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#111111',
  },
  canvasPanel: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  bottomPanel: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    gap: 10,
  },
  playButton: {
    backgroundColor: '#FFD700',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  timeText: {
    color: '#D1D1D1',
    fontSize: 13,
    textAlign: 'center',
  },
  detectionCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  detectionLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  detectionValue: {
    color: '#F2F2F2',
    fontSize: 14,
    fontWeight: '600',
  },
});
