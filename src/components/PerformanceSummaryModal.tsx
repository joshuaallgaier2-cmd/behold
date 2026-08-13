import type { PerformanceSummary } from '@/src/types/music';
import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Props for the performance summary modal.
 */
interface PerformanceSummaryModalProps {
  /**
   * Whether the modal is visible.
   */
  visible: boolean;

  /**
   * Performance summary data to display.
   */
  summary: PerformanceSummary | null;

  /**
   * Callback when "Retry Loop" button is pressed.
   */
  onRetryLoop: () => void;

  /**
   * Callback when "Restart Song" button is pressed.
   */
  onRestartSong: () => void;

  /**
   * Callback when "Back to Catalog" button is pressed.
   */
  onBackToCatalog: () => void;
}

/**
 * Calculate letter grade based on accuracy percentage.
 */
function getLetterGrade(accuracyPercentage: number): string {
  if (accuracyPercentage >= 95) return 'S';
  if (accuracyPercentage >= 90) return 'A';
  if (accuracyPercentage >= 80) return 'B';
  if (accuracyPercentage >= 70) return 'C';
  return 'F';
}

/**
 * Calculate color for letter grade.
 */
function getGradeColor(grade: string): string {
  switch (grade) {
    case 'S':
      return '#FFD700'; // Gold
    case 'A':
      return '#4CAF50'; // Green
    case 'B':
      return '#FFC107'; // Amber
    case 'C':
      return '#FF9800'; // Orange
    case 'F':
      return '#F44336'; // Red
    default:
      return '#999999';
  }
}

/**
 * End-of-song performance summary modal with letter grade,
 * detailed statistics, and practice action buttons.
 *
 * Features:
 * - Letter grade (S/A/B/C/F) based on accuracy
 * - Breakdown of correct/incorrect/missed notes
 * - Average pitch accuracy in cents
 * - Longest streak display
 * - Actions: Retry Loop, Restart Song, Back to Catalog
 * - Smooth modal animation
 */
const PerformanceSummaryModal: React.FC<PerformanceSummaryModalProps> = ({
  visible,
  summary,
  onRetryLoop,
  onRestartSong,
  onBackToCatalog,
}) => {
  const grade = useMemo(
    () => (summary ? getLetterGrade(summary.accuracyPercentage) : 'F'),
    [summary],
  );

  const gradeColor = useMemo(() => getGradeColor(grade), [grade]);

  if (!summary) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onBackToCatalog}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Grade Badge */}
          <View style={[styles.gradeBadge, { borderColor: gradeColor }]}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
          </View>

          {/* Accuracy Title */}
          <Text style={styles.accuracyTitle}>
            {summary.accuracyPercentage}% Accuracy
          </Text>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Correct Notes */}
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{summary.correctNotes}</Text>
              <Text style={styles.statLabel}>Correct</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#4CAF50' }]} />
            </View>

            {/* Incorrect Notes */}
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{summary.incorrectNotes}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#F44336' }]} />
            </View>

            {/* Missed Notes */}
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{summary.missedNotes}</Text>
              <Text style={styles.statLabel}>Missed</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#FFC107' }]} />
            </View>

            {/* Longest Streak */}
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{summary.longestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
              <View style={[styles.statIndicator, { backgroundColor: '#2196F3' }]} />
            </View>
          </View>

          {/* Pitch Accuracy */}
          <View style={styles.pitchAccuracyContainer}>
            <Text style={styles.pitchAccuracyLabel}>Pitch Accuracy</Text>
            <Text style={styles.pitchAccuracyValue}>
              {Math.abs(summary.averageCentsDeviation).toFixed(1)} ¢
            </Text>
            <Text style={styles.pitchAccuracyDescription}>
              Average deviation from target
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={onRetryLoop}
            >
              <Text style={styles.buttonTextPrimary}>Retry Loop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onRestartSong}
            >
              <Text style={styles.buttonTextSecondary}>Restart Song</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonTertiary]}
              onPress={onBackToCatalog}
            >
              <Text style={styles.buttonTextTertiary}>Back to Catalog</Text>
            </TouchableOpacity>
          </View>

          {/* Notes Summary */}
          <View style={styles.notesSummary}>
            <Text style={styles.notesSummaryText}>
              {summary.correctNotes} out of {summary.totalNotes} notes mastered
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  gradeBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gradeText: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 2,
  },
  accuracyTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
  },
  statIndicator: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  pitchAccuracyContainer: {
    width: '100%',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  pitchAccuracyLabel: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 4,
  },
  pitchAccuracyValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  pitchAccuracyDescription: {
    fontSize: 10,
    color: '#666666',
  },
  buttonContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
  },
  buttonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonSecondary: {
    backgroundColor: '#2196F3',
  },
  buttonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonTertiary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonTextTertiary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cccccc',
  },
  notesSummary: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  notesSummaryText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PerformanceSummaryModal;
