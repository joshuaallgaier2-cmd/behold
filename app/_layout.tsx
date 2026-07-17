import { Slot, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LiquidGlassView } from '../src/components/LiquidGlassView';
import { ThemeProvider, useBeholdTheme } from '../src/context/ThemeContext';

function NavigationLayoutContent() {
  const { width, height } = useWindowDimensions();
  const { colors } = useBeholdTheme();
  const router = useRouter();
  const pathname = usePathname();
  
  const isLandscape = width > height;
  const navItems = [
    { id: 'home', label: 'Home', route: '/' as const },
    { id: 'songs', label: 'Songs', route: '/songs' as const },
    { id: 'account', label: 'Account', route: '/account' as const }
  ];

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      {isLandscape ? (
        <View style={styles.landscapeWrapper}>
          <LiquidGlassView style={styles.sidebar}>
            <Text style={[styles.brandText, { color: colors.accent }]}>BEHOLD</Text>
            <View style={styles.sidebarNavGroup}>
              {navItems.map((item) => {
                const isActive = pathname === item.route;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(item.route)}
                    style={[
                      styles.sidebarNavItem,
                      isActive && { backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: 8 }
                    ]}
                  >
                    <View style={[styles.activeIndicator, { backgroundColor: isActive ? colors.accent : "transparent" }]} />
                    <Text style={[styles.navText, { color: colors.text, fontWeight: isActive ? "700" : "400" }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </LiquidGlassView>
          <View style={styles.mainContent}>
            <Slot />
          </View>
        </View>
      ) : (
        <View style={styles.portraitWrapper}>
          <View style={styles.mainContent}>
            <Slot />
          </View>
          <LiquidGlassView style={styles.bottomTabBar}>
            {navItems.map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(item.route)}
                  style={styles.bottomTabItem}
                >
                  <Text style={[styles.bottomNavText, { color: isActive ? colors.accent : colors.text, fontWeight: isActive ? "700" : "400" }]}>
                    {item.label}
                  </Text>
                  <View style={[styles.bottomActiveIndicator, { backgroundColor: isActive ? colors.accent : "transparent" }]} />
                </TouchableOpacity>
              );
            })}
          </LiquidGlassView>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NavigationLayoutContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  landscapeWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  portraitWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  sidebar: {
    width: 240,
    height: '100%',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 40,
    textAlign: 'center',
  },
  sidebarNavGroup: {
    flex: 1,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  activeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  navText: {
    fontSize: 16,
  },
  mainContent: {
    flex: 1,
  },
  bottomTabBar: {
    height: 75,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 15 : 0,
  },
  bottomTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  bottomNavText: {
    fontSize: 14,
    marginBottom: 4,
  },
  bottomActiveIndicator: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  }
});