import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useBeholdTheme } from '../../src/context/ThemeContext';
import { initializeBeholdAudioConfiguration } from '../../src/services/audioEngine';

/**
 * FILE 3: Responsive Application Dashboard Screen
 * Path: 'app/(tabs)/index.tsx'
 */

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => {
  const { colors } = useBeholdTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const LessonItem = ({ title, duration }: { title: string; duration: string }) => {
  const { colors } = useBeholdTheme();
  return (
    <View style={[styles.lessonItem, { borderBottomColor: colors.border }]}>
      <View>
        <Text style={[styles.lessonTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.lessonDuration, { color: colors.text, opacity: 0.6 }]}>{duration}</Text>
      </View>
      <View style={[styles.playButton, { backgroundColor: colors.accent }]}>
        <View style={styles.playIcon} />
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const { colors } = useBeholdTheme();

  useEffect(() => {
    const startupBeholdSystems = async () => {
      try {
        await initializeBeholdAudioConfiguration();
      } catch (error) {
        console.warn("Audio system initialization bypassed safely:", error);
      }
    };
    startupBeholdSystems();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.greeting, { color: colors.text }]}>Welcome back,</Text>
        <Text style={[styles.header, { color: colors.accent }]}>Your Dashboard</Text>

        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Lessons" value="12" color={colors.accent} />
          <StatCard label="Practice" value="4.5h" color="#4CAF50" />
          <StatCard label="Accuracy" value="94%" color="#2196F3" />
        </View>

        {/* Recent Lessons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Lessons</Text>
          <View style={[styles.lessonContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LessonItem title="Vocal Resonance I" duration="15 mins" />
            <LessonItem title="Pitch Precision" duration="10 mins" />
            <LessonItem title="Diaphragm Control" duration="20 mins" />
          </View>
        </View>

        {/* Dynamic Progress */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Progress</Text>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>S</Text>
              <Text style={[styles.progressLabel, { color: colors.text }]}>M</Text>
              <Text style={[styles.progressLabel, { color: colors.text }]}>T</Text>
              <Text style={[styles.progressLabel, { color: colors.text }]}>W</Text>
              <Text style={[styles.progressLabel, { color: colors.text }]}>T</Text>
              <Text style={[styles.progressLabel, { color: colors.text }]}>F</Text>
              <Text style={[styles.progressLabel, { color: colors.text }]}>S</Text>
            </View>
            <View style={styles.chartArea}>
              {[40, 70, 45, 90, 65, 80, 30].map((height, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.chartBar, 
                    { height: height, backgroundColor: i === 3 ? colors.accent : colors.text, opacity: i === 3 ? 1 : 0.2 }
                  ]} 
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 32,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '400',
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.7,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  lessonContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  lessonDuration: {
    fontSize: 13,
    marginTop: 2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderBottomWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'black',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 3,
  },
  progressBarContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 20,
    textAlign: 'center',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  chartBar: {
    width: 12,
    borderRadius: 6,
  },
});