import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface ScrollingCanvasProps {
  notes: any[];
  currentTimeMs: number;
  introDurationMs: number;
}

const NOTE_HEIGHT = 40;
const LANE_HEIGHT = 160;
const MULTIPLIER = 0.25; // Pixels per millisecond for note positioning

/**
 * Horizontal scrolling piano roll lane component.
 * Renders a single-measure musical strip with moving note blocks.
 */
export default function ScrollingCanvas({
  notes,
  currentTimeMs,
  introDurationMs,
}: ScrollingCanvasProps) {
  return (
    <View style={styles.container}>
      {/* Intro overlay - shown during pre-roll period */}
      {currentTimeMs < introDurationMs && (
        <View style={styles.introOverlay}>
          <Text style={styles.introText}>Intro Playing - Prepare Hands!</Text>
        </View>
      )}

      {/* Hit marker line on left boundary */}
      <View style={styles.hitMarker} />

      {/* Notes rendering lane */}
      <View style={styles.notesContainer}>
        {notes.map((note, index) => {
          const offsetMs = note.startTimeMs - currentTimeMs;
          const leftPosition = offsetMs * MULTIPLIER;

          return (
            <View
              key={`${note.pitch}-${index}`}
              style={[
                styles.noteBlock,
                {
                  left: leftPosition,
                  height: NOTE_HEIGHT,
                },
              ]}
            >
              <Text style={styles.notePitch}>{note.pitch}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: LANE_HEIGHT,
    backgroundColor: '#1E1E1E',
    position: 'relative',
    overflow: 'hidden',
  },
  introOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  introText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowRadius: 4,
    textShadowOffset: { width: 1, height: 1 },
  },
  hitMarker: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#ffffff',
    zIndex: 5,
  },
  notesContainer: {
    position: 'relative',
    height: LANE_HEIGHT - 48, // Leave room for hit marker
  },
  noteBlock: {
    position: 'absolute',
    top: 10,
    width: 60,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  notePitch: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});