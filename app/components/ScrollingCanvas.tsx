import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NoteEvent } from '../../src/data/musicData';

interface ScrollingCanvasProps {
  notes: NoteEvent[];
  currentTimeMs: number;
  introDurationMs: number;
  bpm: number;
  hitNoteIds: string[];
  missedNoteIds: string[];
}

const ScrollingCanvas: React.FC<ScrollingCanvasProps> = ({
  notes,
  currentTimeMs,
  introDurationMs,
  bpm,
  hitNoteIds,
  missedNoteIds,
}) => {
  const pixelsPerBeat = 120;
  const beatsPerMs = bpm / 60000;
  const pixelsPerMs = beatsPerMs * pixelsPerBeat;

  // Render a standard 5-line musical staff layout grid
  const staffLines = Array.from({ length: 5 }).map((_, index) => (
    <View
      key={`staff-line-${index}`}
      style={[
        styles.staffLine,
        { top: 40 + index * 20 }, // Spaced 20 pixels apart
      ]}
    />
  ));

  // Determine if intro is playing
  const isIntroPlaying = currentTimeMs < introDurationMs;

  return (
    <View style={styles.container}>
      {staffLines}

      {/* Vertical timeline target indicator ("Hit Line") */}
      <View style={styles.hitLine} />

      {/* Notes */}
      {!isIntroPlaying && notes.map((note) => {
        const leftPositionX = 90 + (note.startTimeMs - currentTimeMs) * pixelsPerMs;
        const noteWidth = note.durationMs * pixelsPerMs;

        // Resolve vertical offsets based on note pitch.
        // This is a simplified mapping. A more complex system would map all pitches to staff positions.
        let topPosition;
        let showLedgerLine = false;
        switch (note.pitch) {
          case 'C5': topPosition = 30; break;
          case 'B4': topPosition = 40; break;
          case 'A4': topPosition = 50; break;
          case 'G4': topPosition = 60; break;
          case 'F4': topPosition = 70; break;
          case 'E4': topPosition = 80; break;
          case 'D4': topPosition = 90; break;
          case 'C4': topPosition = 100; showLedgerLine = true; break;
          case 'B3': topPosition = 110; break;
          default: topPosition = 70; // Default to F4 for unknown pitches
        }

        const isHit = hitNoteIds.includes(note.id);
        const isMissed = missedNoteIds.includes(note.id);

        let backgroundColor = '#4CD964'; // Emerald Green (Unplayed)
        if (isHit) {
          backgroundColor = '#007AFF'; // Pulsing Neon Blue (for hit, actual pulse would be animation)
        } else if (isMissed) {
          backgroundColor = '#FF3B30'; // Crimson Red (Missed)
        }

        const opacity = isMissed ? 0.3 : 1;

        return (
          <View
            key={note.id}
            style={[
              styles.noteBlock,
              {
                left: leftPositionX,
                width: noteWidth,
                top: topPosition,
                backgroundColor,
                opacity,
              },
            ]}
          >
            {showLedgerLine && (
              <View style={styles.ledgerLine} />
            )}
            <Text style={styles.noteText}>{note.pitch}</Text>
          </View>
        );
      })}

      {/* Intro Solo Playing Overlay */}
      {isIntroPlaying && (
        <View style={styles.introOverlay}>
          <Text style={styles.introText}>Introduction Solo Playing - Match Tempo!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    backgroundColor: '#1A1A1A',
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
  },
  staffLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#666',
  },
  hitLine: {
    position: 'absolute',
    left: 90,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFD700', // Gold color for the hit line
    zIndex: 10,
  },
  noteBlock: {
    position: 'absolute',
    height: 20, // Height of the note block, should align with staff lines
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  noteText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ledgerLine: {
    position: 'absolute',
    height: 1,
    width: '120%', // Slightly wider than the note block
    backgroundColor: '#FFF',
    top: '50%',
    left: '-10%',
    transform: [{ translateY: -0.5 }],
    zIndex: 4,
  },
  introOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  introText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ScrollingCanvas;