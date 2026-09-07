import AdaptiveCard from '@/src/components/adaptive/AdaptiveCard';
import AdaptiveChip from '@/src/components/adaptive/AdaptiveChip';
import HymnViewerModal from '@/src/components/HymnViewerModal';
import TimeSignatureMark from '@/src/components/TimeSignatureMark';
import { useBeholdTheme } from '@/src/context/ThemeContext';
import { LDS_MUSIC_DATABASE } from '@/src/data/musicData';
import { audioEngine } from '@/src/services/audioEngine';
import type { Song } from '@/src/types/music';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getElevation, heights, interaction, radius, spacing, typography } from '@/src/theme/platformDesign';

const isIOS = Platform.OS === 'ios';

const CATEGORY_TABS = [
  { key: 'hymn' as const, label: 'Hymns' },
  { key: 'children' as const, label: 'Children' },
  { key: 'youth' as const, label: 'Youth' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useBeholdTheme();
  const isLargeScreenDisplay = width > 600;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'hymn' | 'children' | 'youth'>('hymn');
  const [selectedHymnId, setSelectedHymnId] = useState<string | null>(null);

  useEffect(() => {
    audioEngine.initializeBeholdAudioConfiguration();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        audioEngine.safelyTeardownActiveAudioPlayback();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return LDS_MUSIC_DATABASE.filter((song) => {
      const matchesTab = song.category === activeTab;
      const bookStr = song.book || song.sourceBook || '';
      const matchesSearch =
        song.title.toLowerCase().includes(query) ||
        song.number.toString().includes(query) ||
        bookStr.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const renderSongItem = ({ item }: { item: Song }) => {
    const hasSheetMusic = (item.pageKeys ?? []).length > 0;
    const hasTargetNotes = (item.targetNotes ?? []).length > 0;

    return (
      <AdaptiveCard
        onPress={() => setSelectedHymnId(item.id)}
        elevation={1}
        backgroundColor={colors.surface}
        borderColor={colors.border}
        style={{
          ...styles.songCard,
          ...(!hasSheetMusic || !hasTargetNotes ? styles.songCardPending : undefined),
        }}
      >
        <View style={styles.songCardContent}>
          {/* Number Badge */}
          <View style={[styles.songNumberBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.songNumberText}>{item.number}</Text>
          </View>

          {/* Song Info */}
          <View style={styles.songInfo}>
            <Text style={[typography.titleSmall, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[typography.caption, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
              {item.sourceBook}
            </Text>

            <View style={styles.badgeRow}>
              <View style={[styles.timeSigBadge, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}>
                <TimeSignatureMark timeSignature={item.timeSignature} color={colors.text} size={11} />
              </View>
              <AdaptiveChip
                label="⚡ Interactive"
                selected
                selectedColor="#0369A1"
                selectedTextColor="#E0F2FE"
                style={styles.featureBadge}
              />
              <AdaptiveChip
                label={hasSheetMusic ? 'Dual-Clef' : 'No sheet'}
                selected={hasSheetMusic}
                selectedColor="#163f2d"
                selectedTextColor="#E5E5E5"
                color={colors.surfaceContainerHigh}
                textColor={colors.onSurfaceVariant}
                style={styles.featureBadge}
              />
            </View>
          </View>

          {/* Details Action */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              router.push({
                pathname: '/song-details',
                params: { id: item.id },
              });
            }}
            android_ripple={interaction.useRipple ? { color: 'rgba(255,255,255,0.1)', borderless: false } : undefined}
            style={({ pressed }) => [
              styles.detailsBtn,
              { backgroundColor: colors.surfaceContainerHigh },
              isIOS && pressed && { opacity: interaction.pressOpacity },
            ]}
            accessibilityLabel="Song Details"
          >
            <Text style={[typography.labelChip, { color: colors.onSurfaceVariant }]}>
              Details ›
            </Text>
          </Pressable>
        </View>
      </AdaptiveCard>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header with Category Tabs & Search ─────────────────────────────── */}
      <View style={[
        styles.header,
        {
          backgroundColor: isIOS ? colors.background : colors.surfaceContainer,
          borderBottomWidth: isIOS ? 0.5 : 0,
          borderBottomColor: colors.border,
          ...getElevation(isIOS ? 0 : 1),
        },
      ]}>
        {/* Category Tab Chips */}
        <View style={styles.tabBar}>
          {CATEGORY_TABS.map((tab) => (
            <AdaptiveChip
              key={tab.key}
              label={tab.label}
              selected={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
              selectedColor={colors.accent}
              selectedTextColor="#0F172A"
              style={styles.categoryChip}
            />
          ))}
        </View>

        {/* Search Bar */}
        <View style={[
          styles.searchBarWrap,
          {
            backgroundColor: colors.surfaceContainerHigh,
            borderRadius: isIOS ? radius.small : radius.pill,
            height: heights.searchBar,
          },
        ]}>
          <Ionicons
            name={(isIOS ? 'search-outline' : 'search-sharp') as any}
            size={18}
            color={colors.onSurfaceVariant}
            style={{ marginLeft: isIOS ? 8 : 12, marginRight: 8 }}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by title or number..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* ── Song List ──────────────────────────────────────────────────────── */}
      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={renderSongItem}
        contentContainerStyle={styles.listContent}
        numColumns={isLargeScreenDisplay ? 3 : 1}
        key={isLargeScreenDisplay ? 'grid-3-col' : 'list-1-col'}
      />

      {/* Fullscreen Interactive Sheet Music Modal */}
      <HymnViewerModal
        hymnIdOrNumber={selectedHymnId}
        isOpen={selectedHymnId !== null}
        onClose={() => setSelectedHymnId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: 8,
  },
  categoryChip: {
    flex: 1,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: isIOS ? 17 : 16,
    paddingHorizontal: 4,
    paddingRight: 12,
  },
  listContent: {
    padding: spacing.sm,
  },
  songCard: {
    margin: 4,
    flex: 1,
  },
  songCardPending: {
    opacity: 0.75,
  },
  songCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songNumberBadge: {
    width: isIOS ? 40 : 42,
    height: isIOS ? 40 : 42,
    borderRadius: isIOS ? 10 : 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  songNumberText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 16,
  },
  songInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  timeSigBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featureBadge: {
    height: 24,
    paddingHorizontal: 8,
  },
  detailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: isIOS ? radius.small : 8,
    marginLeft: 8,
    overflow: 'hidden',
  },
});
