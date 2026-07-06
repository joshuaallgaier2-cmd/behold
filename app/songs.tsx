import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useBeholdTheme } from '../src/context/ThemeContext';
import { INTERACTIVE_MUSIC_DATABASE, InteractiveSong } from '../src/data/musicData';

export default function SongsScreen() {
  const router = useRouter();
  const { colors } = useBeholdTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = INTERACTIVE_MUSIC_DATABASE.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    song.number.toString().includes(searchQuery)
  );

  const renderSongItem = ({ item }: { item: InteractiveSong }) => (
    <TouchableOpacity 
      style={[styles.songItem, { backgroundColor: colors.surface, borderColor: colors.border }]} 
      onPress={() => router.push(`/song-details?id=${item.id}`)}
    >
      <View style={[styles.songIcon, { backgroundColor: colors.background }]}>
        <Ionicons name="musical-note" size={20} color={colors.accent} />
      </View>
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.songSubtitle, { color: colors.text, opacity: 0.5 }]}>
          #{item.number} • {item.sourceBook}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text} style={{ opacity: 0.3 }} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>All Songs</Text>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.text} style={{ opacity: 0.5 }} />
          <TextInput 
            style={[styles.searchInput, { color: colors.text }]} 
            placeholder="Search by title or number..." 
            placeholderTextColor={colors.text} 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList 
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={renderSongItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContainer: {
    padding: 24,
    gap: 12,
    paddingBottom: 40,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  songIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  songSubtitle: {
    fontSize: 13,
  },
});