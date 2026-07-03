import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LDS_MUSIC_DATABASE } from './data/musicData';

export default function SongDetailsScreen() {
  const params = useLocalSearchParams();
  const songId = params.id as string;
  
  // Find the selected song from the database
  const selectedSong = LDS_MUSIC_DATABASE.find((song) => song.id === songId);
  
  // State to track current page index for multi-page items
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  if (!selectedSong) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.bookTitle}>Song Not Found</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.bookTitle}>The requested song could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < selectedSong.pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.bookTitle}>{selectedSong.sourceBook}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.songNumber}>#{selectedSong.number}</Text>
        <Text style={styles.songTitle}>{selectedSong.title}</Text>

        {/* Sheet Music Image Display */}
        <View style={styles.imageContainer}>
          <Image
            source={require(`../../assets/${selectedSong.pages[currentPageIndex]}`)}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Horizontal Control Bar for Page Navigation */}
        <View style={styles.controlBar}>
          <TouchableOpacity
            style={[styles.navButton, currentPageIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePreviousPage}
            disabled={currentPageIndex === 0}
          >
            <Text style={[styles.navButtonText, currentPageIndex === 0 && styles.navButtonTextDisabled]}>
              Previous Page
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, currentPageIndex === selectedSong.pages.length - 1 && styles.navButtonDisabled]}
            onPress={handleNextPage}
            disabled={currentPageIndex === selectedSong.pages.length - 1}
          >
            <Text style={[styles.navButtonText, currentPageIndex === selectedSong.pages.length - 1 && styles.navButtonTextDisabled]}>
              Next Page
            </Text>
          </TouchableOpacity>
        </View>

        {/* Page Indicator */}
        <Text style={styles.pageIndicator}>
          Page {currentPageIndex + 1} of {selectedSong.pages.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#2a2a2a' },
  backButton: { paddingRight: 20 },
  backText: { color: '#FFD700', fontSize: 16, fontWeight: '600' },
  bookTitle: { color: '#888', fontSize: 14, flex: 1, textAlign: 'right' },
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  songNumber: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  songTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  imageContainer: { width: '100%', height: '100%', backgroundColor: '#1E1E1E', borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  controlBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 15, backgroundColor: '#1E1E1E', borderRadius: 12, marginBottom: 10 },
  navButton: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#2a2a2a', borderRadius: 8, minWidth: 120, alignItems: 'center' },
  navButtonDisabled: { backgroundColor: '#1E1E1E', opacity: 0.5 },
  navButtonText: { color: '#FFD700', fontSize: 14, fontWeight: '600' },
  navButtonTextDisabled: { color: '#666' },
  pageIndicator: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 8 }
});