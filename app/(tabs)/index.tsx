import React, { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LDS_MUSIC_DATABASE } from '../data/musicData';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<'hymn' | 'children' | 'youth'>('hymn');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Text style={styles.header}>BEHOLD</Text>

        {/* Category Tabs */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            onPress={() => setSelectedCategory('hymn')}
          >
            <Text style={styles.buttonText}>Hymns</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            onPress={() => setSelectedCategory('children')}
          >
            <Text style={styles.buttonText}>Children's</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            onPress={() => setSelectedCategory('youth')}
          >
            <Text style={styles.buttonText}>Youth</Text>
          </TouchableOpacity>
        </View>

        {/* Song List */}
        <FlatList
          data={LDS_MUSIC_DATABASE.filter(song => song.category === selectedCategory)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} activeOpacity={0.7}>
              <View style={styles.rowContent}>
                <Text style={styles.songNumber}>#{item.number.toString().padStart(3, '0')}</Text>
                <Text style={styles.songTitle}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
  row: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  songNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    minWidth: 50,
    textAlign: 'right',
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
});