import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBeholdTheme } from '@/hooks/use-behold-theme';
import { INTERACTIVE_MUSIC_DATABASE } from '@/src/data/musicData';
import SvgSheetCanvas from '@/src/components/SvgSheetCanvas';
import { usePracticeEngine } from '@/src/hooks/usePracticeEngine';
import { audioEngine } from '@/src/services/audioEngine';
import { evaluatePitchMatch, stopPitchListening } from '@/src/services/pitchDetector';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function SongDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useBeholdTheme();
  const [viewMode, setViewMode] = useState<'details' | 'viewer'>('details');

  const song = useMemo(() => 
    INTERACTIVE_MUSIC_DATABASE.find(s => s.id === id) || INTERACTIVE_MUSIC_DATABASE[0],
    [id]
  );

  const { play, pause, stop, currentBeat, totalBeats, bpm, tempoMultiplier } = usePracticeEngine(song);

  const handleStart = () => {
    setViewMode('viewer');
    play();
  };

  const handleBack = () => {
    router.back();
  };

  if (!song) return <Text>Song not found</Text>;

  if (viewMode === 'viewer') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Viewer Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{song.title}</Text>
          <TouchableOpacity onPress={pause} style={styles.iconButton}>
            <Ionicons name="pause" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.canvasContainer}>
          <SvgSheetCanvas 
            song={song} 
            currentBeat={currentBeat} 
            totalBeats={totalBeats} 
            bpm={bpm * tempoMultiplier}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Back Arrow */}
      <TouchableOpacity 
        onPress={handleBack} 
        style={[styles.backButton, { backgroundColor: colors.border }]}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: colors.background }]}>Hymn {song.number}</Text>
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>{song.title}</Text>
        
        <View style={styles.metadataRow}>
          <Text style={[styles.metadataLabel, { color: colors.text }]}>Key:</Text>
          <Text style={[styles.metadataValue, { color: colors.text }]}>{song.key || 'C Major'}</Text>
        </View>

        <View style={styles.metadataRow}>
          <Text style={[styles.metadataLabel, { color: colors.text }]}>Tempo:</Text>
          <Text style={[styles.metadataValue, { color: colors.text }]}>{song.bpm} BPM</Text>
        </View>

        <Text style={[styles.description, { color: colors.text }]}>
          {song.description || "No description available."}
        </Text>

        <TouchableOpacity 
          style={[styles.playButton, { backgroundColor: colors.accent }]}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={24} color={colors.background} />
          <Text style={[styles.playButtonText, { color: colors.background }]}>Start / Play</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  iconButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    padding: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    marginBottom: 24,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metadataLabel: {
    fontWeight: '600',
    fontSize: 16,
  },
  metadataValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    opacity: 0.7,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  playButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
});
