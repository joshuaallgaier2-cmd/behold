import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { BEHOLD_ASSET_REGISTRY, LDS_MUSIC_DATABASE } from './data/musicData';
import {
  modifyActivePlaybackRate,
  playTrackFromRegistry,
  safelyTeardownActiveAudioPlayback,
} from './services/audioEngine';

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5];

export default function SongDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const rawNumber = Array.isArray(params.number) ? params.number[0] : params.number;
  const numericNumber = Number(rawNumber ?? 0);
  const activeSong = LDS_MUSIC_DATABASE.find((song) => song.number === numericNumber);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [trackTimeDisplay, setTrackTimeDisplay] = useState('00:00 / 00:00');

  const activePageKey = activeSong?.pageKeys[currentPageIndex];
  const resolvedImageAsset = activePageKey ? BEHOLD_ASSET_REGISTRY[activePageKey] : null;
  const resolvedAudioAsset = activeSong?.audioKey ? BEHOLD_ASSET_REGISTRY[activeSong.audioKey] : null;
  const pageCount = activeSong?.pageKeys.length ?? 0;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = pageCount === 0 || currentPageIndex >= pageCount - 1;

  useEffect(() => {
    setCurrentPageIndex(0);
    setIsPlaying(false);
    setPlaybackSpeed(1.0);
    setPlaybackProgress(0);
    setTrackTimeDisplay('00:00 / 00:00');
  }, [numericNumber]);

  useEffect(() => {
    return () => {
      void safelyTeardownActiveAudioPlayback();
    };
  }, []);

  const formatTimeDisplay = (millis: number) => {
    if (!millis || Number.isNaN(millis)) {
      return '00:00';
    }

    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePreviousPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex((previous) => previous - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLastPage) {
      setCurrentPageIndex((previous) => previous + 1);
    }
  };

  const handleTogglePlayback = async () => {
    if (isPlaying) {
      await safelyTeardownActiveAudioPlayback();
      setIsPlaying(false);
      setPlaybackProgress(0);
      setTrackTimeDisplay('00:00 / 00:00');
      return;
    }

    if (!resolvedAudioAsset) {
      return;
    }

    try {
      await playTrackFromRegistry(resolvedAudioAsset, (status: any) => {
        if (!status?.isLoaded) {
          return;
        }

        if (status.didJustFinish) {
          setIsPlaying(false);
          setPlaybackProgress(0);
          setTrackTimeDisplay('00:00 / 00:00');
          return;
        }

        const nextProgress = status.durationMillis
          ? (status.positionMillis ?? 0) / status.durationMillis
          : 0;
        const nextPosition = formatTimeDisplay(status.positionMillis ?? 0);
        const nextDuration = formatTimeDisplay(status.durationMillis ?? 0);

        setPlaybackProgress(Math.min(1, Math.max(0, nextProgress)));
        setTrackTimeDisplay(`${nextPosition} / ${nextDuration}`);
        setIsPlaying(Boolean(status.isPlaying));
      });
      setIsPlaying(true);
    } catch (error) {
      console.warn('Failed to play audio', error);
      setIsPlaying(false);
      setPlaybackProgress(0);
      setTrackTimeDisplay('00:00 / 00:00');
    }
  };

  const handleSpeedChange = async (nextSpeed: number) => {
    setPlaybackSpeed(nextSpeed);

    if (!isPlaying) {
      return;
    }

    try {
      await modifyActivePlaybackRate(nextSpeed);
    } catch (error) {
      console.warn('Failed to update playback speed', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to List</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>{activeSong?.title ?? 'Song details'}</Text>
      </View>

      <View style={styles.content}>
        {resolvedImageAsset ? (
          <Image
            source={resolvedImageAsset}
            style={[styles.image, { width: width - 32, height: Math.max(260, width * 0.72) }]}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>Sheet page is loading or not yet uploaded.</Text>
          </View>
        )}

        <View style={styles.mediaPanel}>
          <TouchableOpacity onPress={handleTogglePlayback} style={styles.playButton}>
            <Text style={styles.playButtonText}>{isPlaying ? '■ Stop Audio' : '▶ Play Audio'}</Text>
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(playbackProgress * 100)}%` }]} />
          </View>
          <Text style={styles.timeText}>{trackTimeDisplay}</Text>

          <View style={styles.speedRow}>
            {SPEED_OPTIONS.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[styles.speedChip, playbackSpeed === speed && styles.speedChipActive]}
                onPress={() => void handleSpeedChange(speed)}
              >
                <Text style={[styles.speedText, playbackSpeed === speed && styles.speedTextActive]}>
                  {speed.toFixed(2)}×
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.pageRow}>
          <TouchableOpacity
            style={[styles.navButton, isFirstPage && styles.navButtonDisabled]}
            onPress={handlePreviousPage}
            disabled={isFirstPage}
          >
            <Text style={[styles.navButtonText, isFirstPage && styles.navButtonTextDisabled]}>Previous Page</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, isLastPage && styles.navButtonDisabled]}
            onPress={handleNextPage}
            disabled={isLastPage}
          >
            <Text style={[styles.navButtonText, isLastPage && styles.navButtonTextDisabled]}>Next Page</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#2A2A2A',
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
  },
  titleText: {
    flex: 1,
    color: '#F2F2F2',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  image: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    alignSelf: 'center',
  },
  placeholderBox: {
    minHeight: 280,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
  },
  mediaPanel: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  playButton: {
    backgroundColor: '#FFD700',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  timeText: {
    color: '#CFCFCF',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 10,
    textAlign: 'center',
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  speedChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    backgroundColor: '#1B1B1B',
  },
  speedChipActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  speedText: {
    color: '#F2F2F2',
    fontSize: 13,
    fontWeight: '700',
  },
  speedTextActive: {
    color: '#111111',
  },
  pageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#FFD700',
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#666',
  },
});
