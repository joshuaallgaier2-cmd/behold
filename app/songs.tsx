import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBeholdTheme } from '../hooks/use-behold-theme';
import { INTERACTIVE_MUSIC_DATABASE } from '../src/data/musicData';

type SongCategory = 'hymn' | 'children' | 'youth';

export default function SongsScreen() {
  const { colors } = useBeholdTheme();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<SongCategory>('hymn');

  const categories: { id: SongCategory; label: string }[] = [
    { id: 'hymn', label: 'Hymns' },
    { id: 'children', label: "Children's Songbook" },
    { id: 'youth', label: 'Youth Album' }
  ];

  const filteredSongs = INTERACTIVE_MUSIC_DATABASE.filter(song => song.category === activeCategory);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Music Catalog</Text>
      
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={[
                styles.tabItem,
                isActive && { borderBottomColor: colors.accent }
              ]}
            >
              <Text style={[
                styles.tabText, 
                { color: isActive ? colors.accent : colors.text, fontWeight: isActive ? '700' : '500' }
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.songCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/song-details', params: { id: item.id } })}
          >
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{item.number}</Text>
            </View>
            <View style={styles.songInfo}>
              <Text style={[styles.songTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.songSource, { color: colors.text }]}>{item.sourceBook}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  badgeText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  songSource: {
    fontSize: 13,
    opacity: 0.6,
  },
});