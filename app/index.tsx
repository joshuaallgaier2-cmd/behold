import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBeholdTheme } from '../src/context/ThemeContext';

export default function DashboardScreen() {
  const { colors } = useBeholdTheme();
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>Welcome to Behold</Text>
      </View>

      <TouchableOpacity 
        style={[styles.actionBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push('/songs')}
      >
        <Text style={[styles.bannerTitle, { color: colors.accent }]}>Open Song Library</Text>
        <Text style={[styles.bannerSubtext, { color: colors.text }]}>Select a track to begin interactive microphone practice mode</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 50,
  },
  headerRow: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
  },
  actionBanner: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  bannerSubtext: {
    fontSize: 14,
    opacity: 0.8,
  },
});