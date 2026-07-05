import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useBeholdTheme } from '../src/context/ThemeContext';

/**
 * Account Management & Configuration Control Dashboard.
 */
export default function AccountScreen() {
  const { colors, isDark, toggleTheme } = useBeholdTheme();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Account</Text>

      {/* Profile Card Section */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Ionicons name="person" size={40} color="#000" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>Behold User</Text>
          <Text style={[styles.userEmail, { color: colors.text, opacity: 0.6 }]}>premium@behold.app</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.accent }]}>24</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Lessons</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.accent }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Songs</Text>
          </View>
        </View>
      </View>

      {/* System Settings Group Container */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.5 }]}>SYSTEM SETTINGS</Text>
        
        <View style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingLabelGroup}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={22} color={colors.accent} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>App Color Theme Configuration</Text>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: colors.accent }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleTheme}
            value={isDark}
          />
        </View>

        <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingLabelGroup}>
            <Ionicons name="mic-outline" size={22} color={colors.accent} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>Acoustic Microphone Input Calibration Adjustments</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text} style={{ opacity: 0.3 }} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingLabelGroup}>
            <Ionicons name="cloud-upload-outline" size={22} color={colors.accent} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>Cloud Sync Configuration Profiles</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text} style={{ opacity: 0.3 }} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton}>
        <Text style={[styles.signOutText, { color: '#FF3B30' }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 30,
    paddingBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 30,
  },
  profileCard: {
    padding: 25,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    paddingTop: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 15,
    marginLeft: 5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 15,
  },
  signOutButton: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
  },
});