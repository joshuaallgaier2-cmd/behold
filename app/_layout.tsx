import { Ionicons } from '@expo/vector-icons';
import { Slot, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeProvider, useBeholdTheme } from '../src/context/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * Sidebar Component
 * This is nested within ThemeProvider to ensure access to theme colors.
 */
function Sidebar() {
  const { colors } = useBeholdTheme();
  const router = useRouter();

  const navItems = [
    { name: 'Home', icon: 'home-outline', path: '/' },
    { name: 'Songs', icon: 'musical-notes-outline', path: '/songs' },
    { name: 'Account', icon: 'person-outline', path: '/account' },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.logoContainer}>
        <Ionicons name="compass" size={32} color={colors.accent} />
        <Text style={[styles.logoText, { color: colors.text }]}>BEHOLD</Text>
      </View>

      <View style={styles.navContainer}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.navItem,
              { borderColor: colors.border }
            ]}
            onPress={() => router.push(item.path as any)}
          >
            <Ionicons 
              name={item.icon as any} 
              size={22} 
              color={colors.text} 
              style={{ opacity: 0.8 }} 
            />
            <Text style={[styles.navText, { color: colors.text }]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.versionText, { color: colors.text, opacity: 0.4 }]}>v1.0.0</Text>
      </View>
    </View>
  );
}

/**
 * MainLayout
 * Handles the structural split between the Sidebar and the Content Area.
 */
function MainLayout() {
  const { colors } = useBeholdTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Sidebar />
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

/**
 * Root Layout
 * Wraps the entire application in the ThemeProvider to resolve context missing errors.
 * This is the absolute root entry point.
 */
export default function RootLayout() {
  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    borderRightWidth: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    height: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
    paddingLeft: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  navContainer: {
    gap: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});