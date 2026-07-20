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
import { LDS_MUSIC_DATABASE, Song } from '../data/musicData';
import {
    initializeBeholdAudioConfiguration,
    safelyTeardownActiveAudioPlayback,
} from '../services/audioEngine';

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreenDisplay = width > 600;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'hymn' | 'children' | 'youth'>('hymn');

  // Initialize audio configuration on mount and handle app state changes
  useEffect(() => {
    initializeBeholdAudioConfiguration();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        // Kill audio instantly when app loses focus
        safelyTeardownActiveAudioPlayback();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Performance-optimized filtering logic
  const filteredSongs = useMemo(() => {
    return LDS_MUSIC_DATABASE.filter((song) => {
      const matchesTab = song.category === activeTab;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        song.title.toLowerCase().includes(query) ||
        song.number.toString().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [searchQuery, activeTab]);

  const renderSongItem = ({ item }: { item: Song }) => {
    const hasAssets = item.pageKeys.length > 0;

    return (
      <TouchableOpacity
        style={[styles.songCard, !hasAssets && styles.songCardPending]}
        onPress={() => {
          if (hasAssets) {
            router.push({
              pathname: '/(song)/[id]',
              params: { id: item.id },
            });
          }
        }}
      >
        <View style={styles.songNumberBadge}>
          <Text style={styles.songNumberText}>{item.number}</Text>
        </View>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{item.title}</Text>
          <Text style={styles.songSource}>{item.sourceBook}</Text>
          {!hasAssets && (
            <Text style={styles.pendingText}>Sheet music assets pending import</Text>
          )}
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
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab && styles.tabButtonTextActive,
                ]}
              >
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
        // Force fresh layout on column change to prevent Chromebook resize crashes
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
    opacity: 0.7,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  songNumberBadge: {
    backgroundColor: '#FFD700',
    width: 40,
    height: 40,
    borderRadius: 20,
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
  pendingText: {
    color: '#FFD700',
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
