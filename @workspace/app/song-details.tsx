import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HYMN_ASSET_REGISTRY, LDS_MUSIC_DATABASE } from './data/musicData';

export default function SongDetailsScreen() {
  const { number } = useLocalSearchParams();
  const router = useRouter();

  const activeSong = LDS_MUSIC_DATABASE.find(s => s.number === Number(number));
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const activePageKey = activeSong?.pageKeys[currentPageIndex];
  const resolvedImageAsset = activePageKey ? HYMN_ASSET_REGISTRY[activePageKey] : null;

  const handleBack = () => {
    router.back();
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeSong && currentPageIndex < activeSong.pageKeys.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{activeSong?.title}</Text>
      </View>

      {/* Image Viewport */}
      <View style={styles.imageContainer}>
        {resolvedImageAsset ? (
          <Image
            source={resolvedImageAsset}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No image available</Text>
          </View>
        )}
      </View>

      {/* Navigation Controls */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handlePrevious}
          disabled={currentPageIndex === 0}
          style={[styles.navButton, currentPageIndex === 0 && styles.navButtonDisabled]}
        >
          <Text style={[styles.navButtonText, currentPageIndex === 0 && styles.navButtonTextDisabled]}>
            {'<'} Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          disabled={activeSong ? currentPageIndex >= activeSong.pageKeys.length - 1 : true}
          style={[styles.navButton, (activeSong ? currentPageIndex >= activeSong.pageKeys.length - 1 : true) && styles.navButtonDisabled]}
        >
          <Text style={[styles.navButtonText, (activeSong ? currentPageIndex >= activeSong.pageKeys.length - 1 : true) && styles.navButtonTextDisabled]}>
            Next {'>'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  image: {
    width: Dimensions.get('window').width - 16,
    height: Dimensions.get('window').height * 0.5,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 8,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#666666',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#333333',
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    opacity: 0.5,
  },
});