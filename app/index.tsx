import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors, useBeholdTheme } from '../src/context/ThemeContext';
import { INTERACTIVE_MUSIC_DATABASE, InteractiveSong } from '../src/data/musicData';

const { width } = Dimensions.get('window');

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  colors: ThemeColors;
}

const StatCard = ({ label, value, icon, colors }: StatCardProps) => (
  <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '20' }]}>
      <Ionicons name={icon} size={24} color={colors.accent} />
    </View>
    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.text, opacity: 0.6 }]}>{label}</Text>
  </View>
);

interface SongCardProps {
  song: InteractiveSong;
  colors: ThemeColors;
  onPress: () => void;
}

const SongCard = ({ song, colors, onPress }: SongCardProps) => (
  <TouchableOpacity 
    style={[styles.songCard, { backgroundColor: colors.surface, borderColor: colors.border }]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.songIconContainer, { backgroundColor: colors.background }]}>
      <Ionicons name="musical-note" size={24} color={colors.accent} />
    </View>
    <View style={styles.songInfo}>
      <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>
        {song.title}
      </Text>
      <Text style={[styles.songSubtitle, { color: colors.text, opacity: 0.5 }]}>
        #{song.number} • {song.sourceBook}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.text} style={{ opacity: 0.3 }} />
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useBeholdTheme();

  const stats: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Total Songs', value: INTERACTIVE_MUSIC_DATABASE.length, icon: 'library-outline' },
    { label: 'Hymns', value: INTERACTIVE_MUSIC_DATABASE.filter(s => s.category === 'hymn').length, icon: 'book-outline' },
    { label: 'Children', value: INTERACTIVE_MUSIC_DATABASE.filter(s => s.category === 'children').length, icon: 'happy-outline' },
    { label: 'Youth', value: INTERACTIVE_MUSIC_DATABASE.filter(s => s.category === 'youth').length, icon: 'flashlight-outline' },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>Welcome back,</Text>
        <Text style={[styles.title, { color: colors.text }]}>Your Music Library</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard 
            key={index} 
            label={stat.label} 
            value={stat.value} 
            icon={stat.icon} 
            colors={colors} 
          />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Access</Text>
        <TouchableOpacity onPress={() => router.push('/songs')}>
          <Text style={[styles.seeAll, { color: colors.accent }]}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.songList}>
        {INTERACTIVE_MUSIC_DATABASE.map((song) => (
          <SongCard 
            key={song.id} 
            song={song} 
            colors={colors} 
            onPress={() => router.push(`/(song)/${song.id}`)} 
          />
        ))}
      </View>

      <View style={[styles.footerHint, { borderColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={16} color={colors.text} style={{ opacity: 0.5 }} />
        <Text style={[styles.footerText, { color: colors.text, opacity: 0.5 }]}>
          Select a song to start the interactive playback experience.
        </Text>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statCard: {
    width: (width - 48 - 16) / 2,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  songList: {
    gap: 12,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  songIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  songSubtitle: {
    fontSize: 13,
  },
  footerHint: {
    marginTop: 40,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
  },
});