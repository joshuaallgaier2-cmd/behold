import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useBeholdTheme } from '../src/context/ThemeContext';
import { INTERACTIVE_MUSIC_DATABASE, InteractiveSong } from '../src/data/musicData';

/**
 * Dynamic Category & Hymn Search Grid Dashboard.
 */
export default function SongsScreen() {
  const { colors } = useBeholdTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter songs based on search query.
  const filteredSongs = useMemo(() => {
    return INTERACTIVE_MUSIC_DATABASE.filter(song => 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.number.toString().includes(searchQuery)
    );
  }, [searchQuery]);

  const renderSongItem = ({ item }: { item: InteractiveSong }) => (
    <TouchableOpacity 
      style={[styles.songCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push({
        pathname: '/song-details',
        params: { id: item.id }
      })}
    >
      <View style={[styles.numberBadge, { backgroundColor: colors.accent }]}>
        <Text style={styles.numberText}>{item.number}</Text>
      </View>
      <View style={styles.songInfo}>
        <Text numberOfLines={1} style={[styles.songTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.songCategory, { color: colors.text, opacity: 0.6 }]}>
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)} • {item.sourceBook}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.accent} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header & Search */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Song Catalog</Text>
        <View style={[styles.searchBarContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by title or number..."
            placeholderTextColor={colors.isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Grid List */}
      <FlatList
        data={filteredSongs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>No songs found matching "{searchQuery}"</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  songCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  songInfo: {
    flex: 1,
    marginRight: 8,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  songCategory: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    opacity: 0.5,
  },
});