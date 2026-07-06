import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBeholdTheme } from '../src/context/ThemeContext';

export default function AccountScreen() {
  const { colors } = useBeholdTheme();

  const accountSettings = [
    { name: 'Profile', icon: 'person-outline', detail: 'Manage your personal info' },
    { name: 'Notifications', icon: 'notifications-outline', detail: 'Configure alerts and updates' },
    { name: 'Preferences', icon: 'settings-outline', detail: 'Customize your experience' },
    { name: 'Privacy', icon: 'lock-closed-outline', detail: 'Manage your data and security' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Ionicons name="person" size={40} color={colors.background} />
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>User Name</Text>
        <Text style={[styles.userEmail, { color: colors.text, opacity: 0.5 }]}>user@example.com</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
        <View style={styles.settingsList}>
          {accountSettings.map((setting) => (
            <TouchableOpacity 
              key={setting.name} 
              style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.settingLeft}>
                <Ionicons name={setting.icon as any} size={22} color={colors.accent} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingName, { color: colors.text }]}>{setting.name}</Text>
                  <Text style={[styles.settingDetail, { color: colors.text, opacity: 0.5 }]}>{setting.detail}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text} style={{ opacity: 0.3 }} />
            </TouchableOpacity>
          ))}
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
    padding: 24,
    paddingTop: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
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
  },
  settingsList: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingTextContainer: {
    gap: 4,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDetail: {
    fontSize: 13,
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