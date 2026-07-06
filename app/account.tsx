import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useBeholdTheme } from '../src/context/ThemeContext';

export default function AccountScreen() {
  const { colors, toggleTheme, isDark } = useBeholdTheme();
  
  const [audioBuffering, setAudioBuffering] = useState(256);
  const [pitchDetection, setPitchDetection] = useState(true);
  const [cacheEnabled, setCacheEnabled] = useState(true);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Ionicons name="person" size={40} color={colors.background} />
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>Joshua Allgaier</Text>
        <Text style={[styles.userEmail, { color: colors.text, opacity: 0.5 }]}>Pro Member</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Audio Engine</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.controlRow}>
            <Text style={[styles.label, { color: colors.text }]}>Buffer Size (samples)</Text>
            <Text style={[styles.value, { color: colors.accent }]}>{audioBuffering}</Text>
          </View>
          <View style={styles.controlRow}>
            <Text style={[styles.label, { color: colors.text }]}>Pitch Detection</Text>
            <Switch value={pitchDetection} onValueChange={setPitchDetection} trackColor={{ true: colors.accent }} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.controlRow}>
            <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.accent }} />
          </View>
          <View style={styles.controlRow}>
            <Text style={[styles.label, { color: colors.text }]}>Local Cache</Text>
            <Switch value={cacheEnabled} onValueChange={setCacheEnabled} trackColor={{ true: colors.accent }} />
          </View>
        </View>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { borderColor: colors.error }]}>
        <Ionicons name="log-out-outline" size={22} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 32,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    opacity: 0.7,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 20,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});