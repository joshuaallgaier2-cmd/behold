import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBeholdTheme } from '../src/context/ThemeContext';
import { INTERACTIVE_MUSIC_DATABASE } from '../src/data/musicData';

export default function SongDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useBeholdTheme();

  const song = INTERACTIVE_MUSIC_DATABASE.find(s => s.id === id);

  const handleTimeUpdate = (time: number) => {
    console.log('Time updated:', time);
  };

  if (!song) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.text }]}>Song not found</Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} 
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity 
        style={[styles.backButtonSmall, { backgroundColor: colors.surface, borderColor: colors.border }]} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.songNumber, { color: colors.accent }]}>#{song.number}</Text>
        <Text style={[styles.songTitle, { color: colors.text }]}>{song.title}</Text>
        <Text style={[styles.songSource, { color: colors.text, opacity: 0.5 }]}>{song.sourceBook}</Text>
      </View>

      <View style={[styles.playerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.playerControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-back" size={32} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.accent }]}>
            <Ionicons name="play" size={40} color={colors.background} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-forward" size={32} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.accent }]} />
          </View>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: colors.text, opacity: 0.5 }]}>1:23</Text>
            <Text style={[styles.timeText, { color: colors.text, opacity: 0.5 }]}>3:45</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Song Details</Text>
        <View style={[styles.detailRow, { borderColor: colors.border }]}>
          <Text style={[styles.detailLabel, { color: colors.text, opacity: 0.5 }]}>Category</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{song.category}</Text>
        </View>
        <View style={[styles.detailRow, { borderColor: colors.border }]}>
          <Text style={[styles.detailLabel, { color: colors.text, opacity: 0.5 }]}>ID</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{song.id}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 40,
  },
  backButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  songNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  songTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  songSource: {
    fontSize: 18,
  },
  playerContainer: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 40,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    gap: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    width: '30%',
    height: '100%',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});