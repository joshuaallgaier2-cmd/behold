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

type Category = 'hymn' | 'children' | 'youth';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTabletOrChromebook = width > 600;
  const numColumns = isTabletOrChromebook ? 3 : 1;
  const itemWidth = isTabletOrChromebook ? (width - 48) / 3 : width - 32;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Category>('hymn');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void initializeBeholdAudioConfiguration();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        void safelyTeardownActiveAudioPlayback();
      }
    });

    return () => {
      subscription.remove();
      void safelyTeardownActiveAudioPlayback();
    };
  }, []);

  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return LDS_MUSIC_DATABASE.filter((song) => {
      if (song.category !== activeTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        String(song.number).includes(query) ||
        song.title.toLowerCase().includes(query) ||
        song.sourceBook.toLowerCase().includes(query)
      );
    });
  }, [activeTab, searchQuery]);

  const renderItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={[styles.row, { width: itemWidth }]}
      activeOpacity={0.86}
      onPress={() => {
        if (item.pageKeys.length > 0) {
          setNotice(null);
          router.push({ pathname: '/song-details', params: { number: String(item.number) } });
          return;
        }

        setNotice('Sheet music assets are pending upload for this selection.');
      }}
    >
      <View style={styles.rowContent}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.number}</Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.sourceBook}</Text>
          {item.pageKeys.length === 0 ? (
            <Text style={styles.pending}>Sheet music assets pending upload</Text>
          ) : (
            <Text style={styles.ready}>Ready to view and play</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={styles.headerTray}>
        {(['hymn', 'children', 'youth'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.navButton, activeTab === tab && styles.navButtonActive]}
          >
            <Text style={[styles.navText, activeTab === tab && styles.navTextActive]}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        placeholder="Search by title, number, or book"
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      {notice ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <FlatList
        data={filteredSongs}
        renderItem={renderItem}
        keyExtractor={(song) => song.id}
        numColumns={numColumns}
        key={isTabletOrChromebook ? 'grid-3' : 'list-1'}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={isTabletOrChromebook ? styles.columnWrapper : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerTray: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#171717',
  },
  navButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
  },
  navButtonActive: {
    backgroundColor: '#FFD700',
  },
  navText: {
    color: '#BDBDBD',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  navTextActive: {
    color: '#111111',
  },
  searchInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 14,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  noticeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  noticeText: {
    color: '#FFD700',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  row: {
    margin: 8,
    backgroundColor: '#1B1B1B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 14,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  meta: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 4,
  },
  pending: {
    color: '#FFCC00',
    fontSize: 12,
  },
  ready: {
    color: '#7BEA8A',
    fontSize: 12,
  },
});