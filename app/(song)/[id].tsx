import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBeholdTheme } from '../../hooks/use-behold-theme';
import { INTERACTIVE_MUSIC_DATABASE } from '../../src/data/musicData';

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useBeholdTheme();
  const router = useRouter();

  const activeSong = INTERACTIVE_MUSIC_DATABASE.find((s) => s.id === id);

  if (!activeSong) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Song not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.accent }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: colors.accent }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{activeSong.title}</Text>
      </View>
      <View style={styles.content}>
        <Text style={{ color: colors.text }}>Number: {activeSong.number}</Text>
        <Text style={{ color: colors.text }}>Category: {activeSong.category}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  content: {
    padding: 24,
  },
});