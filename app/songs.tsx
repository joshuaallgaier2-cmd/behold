import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { INTERACTIVE_MUSIC_DATABASE } from '../src/data/musicData';

export default function SongsLibrary() {
  const [activeCategory, setActiveCategory] = useState<'hymn' | 'children' | 'youth'>('hymn');

  const filteredSongs = INTERACTIVE_MUSIC_DATABASE.filter(
    (song) => song.category === activeCategory
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Song Library</Text>
      
      <View style={styles.tabRow}>
        {(['hymn', 'children', 'youth'] as const).map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.tab, activeCategory === category && styles.activeTab]}
            onPress={() => setActiveCategory(category)}
          >
            <Text style={[styles.tabText, activeCategory === category && styles.activeTabText]}>
              {category === 'hymn' ? 'Hymns' : category === 'children' ? "Children's Songbook" : 'Youth Album'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {filteredSongs.map((song) => (
          <View key={song.id} style={styles.songCard}>
            <Text style={styles.songNumber}>{song.number}</Text>
            <Text style={styles.songTitle}>{song.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{song.difficulty.toUpperCase()}</Text>
              <Text style={styles.metaText}>{song.tempo}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#007AFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  songCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  songNumber: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});