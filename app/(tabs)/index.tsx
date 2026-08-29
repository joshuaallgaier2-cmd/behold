import { LDS_MUSIC_DATABASE } from '@/src/data/musicData';
import { audioEngine } from '@/src/services/audioEngine';
import type { Song } from '@/src/types/music';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreenDisplay = width > 600;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'hymn' | 'children' | 'youth'>('hymn');

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
      const matchesSearch =
        song.title.toLowerCase().includes(query) ||
        song.number.toString().includes(query) ||
        song.sourceBook.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const renderSongItem = ({ item }: { item: Song }) => {
    const hasSheetMusic = (item.pageKeys ?? []).length > 0;
    const hasTargetNotes = (item.targetNotes ?? []).length > 0;

    // TODO: In a full implementation, fetch performance scores from AsyncStorage or a database
    // For now, show the badge infrastructure but no actual badges (performance scores are always null in this version)

    return (
      <TouchableOpacity
        style={[styles.songCard, (!hasSheetMusic || !hasTargetNotes) && styles.songCardPending]}
        onPress={() => {
          router.push({
            pathname: '/song-details',
            params: { id: item.id },
          });
        }}
      >
        <View style={styles.songNumberBadge}>
          <Text style={styles.songNumberText}>{item.number}</Text>
        </View>

        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{item.title}</Text>
          <Text style={styles.songSource}>{item.sourceBook}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.assetBadge, hasSheetMusic ? styles.assetBadgeActive : styles.assetBadgeMuted]}>
              <Text style={styles.assetBadgeText}>{hasSheetMusic ? 'Sheet' : 'No sheet'}</Text>
            </View>
            <View style={[styles.assetBadge, hasTargetNotes ? styles.assetBadgeActive : styles.assetBadgeMuted]}>
              <Text style={styles.assetBadgeText}>{hasTargetNotes ? 'Notes' : 'No notes'}</Text>
            </View>

            {/* Performance badge infrastructure ready - will display when score persistence is implemented */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabBar}>
          {(['hymn', 'children', 'youth'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.searchBar}
          placeholder="Search by title or number..."
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={renderSongItem}
        contentContainerStyle={styles.listContent}
        numColumns={isLargeScreenDisplay ? 3 : 1}
        key={isLargeScreenDisplay ? 'grid-3-col' : 'list-1-col'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#FFD700',
  },
  tabButtonText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  tabButtonTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  searchBar: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  listContent: {
    padding: 12,
  },
  songCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    margin: 4,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  songCardPending: {
    opacity: 0.75,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  songNumberBadge: {
    backgroundColor: '#FFD700',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  songNumberText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  songSource: {
    color: '#888',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  assetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  assetBadgeActive: {
    backgroundColor: '#163f2d',
  },
  assetBadgeMuted: {
    backgroundColor: '#2a2a2a',
  },
  assetBadgeText: {
    color: '#E5E5E5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  // Performance badge (shown when song has been completed with a score)
  performanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFD700',
    borderWidth: 1.5,
    borderColor: '#FFA500',
  },
  performanceBadgeText: {
    color: '#1a1a1a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
