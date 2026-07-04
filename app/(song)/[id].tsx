import { BEHOLD_ASSET_REGISTRY, LDS_MUSIC_DATABASE } from '@/app/data/musicData';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SongDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const number = params.id as string;

  // Look up the active song by matching the 'number' parameter
  const activeSong = LDS_MUSIC_DATABASE.find(s => s.number === Number(number));
  
  // State for current page index
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Safe reference for the current image target using the asset registry
  const activePageKey = activeSong?.pageKeys[currentPageIndex];
  const resolvedImageAsset = activePageKey ? BEHOLD_ASSET_REGISTRY[activePageKey] : null;

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (activeSong && currentPageIndex < activeSong.pageKeys.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Persistent top action header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>{activeSong?.title}</Text>
      </View>

      {/* Center frame viewport - massive image rendering canvas */}
      <View style={styles.content}>
        {resolvedImageAsset ? (
          <Image
            source={resolvedImageAsset}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.placeholderText}>No image available</Text>
        )}

        {/* Footer control navigation row */}
        <View style={styles.controlBar}>
          <TouchableOpacity
            style={[
              styles.navButton, 
              currentPageIndex === 0 && styles.navButtonDisabled
            ]}
            onPress={handlePreviousPage}
            disabled={currentPageIndex === 0}
          >
            <Text style={[
              styles.navButtonText, 
              currentPageIndex === 0 && styles.navButtonTextDisabled
            ]}>
              {'<'} Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton, 
              (activeSong?.pageKeys.length ?? 1) - 1 === currentPageIndex && styles.navButtonDisabled
            ]}
            onPress={handleNextPage}
            disabled={(activeSong?.pageKeys.length ?? 1) - 1 === currentPageIndex}
          >
            <Text style={[
              styles.navButtonText, 
              (activeSong?.pageKeys.length ?? 1) - 1 === currentPageIndex && styles.navButtonTextDisabled
            ]}>
              Next {'>'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width: windowWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderColor: '#2a2a2a' 
  },
  backButton: { paddingRight: 20 },
  backText: { color: '#FFD700', fontSize: 16, fontWeight: '600' },
  titleText: { color: '#888', fontSize: 14, flex: 1, textAlign: 'right' },
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  image: { 
    width: windowWidth * 0.95, 
    height: windowWidth * 0.85, 
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    overflow: 'hidden'
  },
  placeholderText: { color: '#666', fontSize: 14, textAlign: 'center' },
  controlBar: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 20, 
    paddingVertical: 15, 
    backgroundColor: '#1E1E1E', 
    borderRadius: 12, 
    marginBottom: 10 
  },
  navButton: { 
    paddingHorizontal: 24, 
    paddingVertical: 10, 
    backgroundColor: '#2a2a2a', 
    borderRadius: 8, 
    minWidth: 120, 
    alignItems: 'center' 
  },
  navButtonDisabled: { backgroundColor: '#1E1E1E', opacity: 0.5 },
  navButtonText: { color: '#FFD700', fontSize: 14, fontWeight: '600' },
  navButtonTextDisabled: { color: '#666' }
});