import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NoteEvent } from '../data/musicData';

type ScrollingCanvasProps = {
  notes: NoteEvent[];
  currentTimeMs: number;
  introDurationMs: number;
};

const PIXELS_PER_MS = 0.06;
const HIT_LINE_X = 72;

export default function ScrollingCanvas({ notes, currentTimeMs, introDurationMs }: ScrollingCanvasProps) {
  const isIntroPhase = currentTimeMs < introDurationMs;

  return (
    <View style={styles.canvasShell}>
      <View style={styles.gridBackground}>
        <View style={styles.hitLine} />
        {isIntroPhase ? (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>Intro Playing - Get Ready!</Text>
          </View>
        ) : null}
        {notes.map((note, index) => {
          const offset = note.startTimeMs - currentTimeMs;
          const x = HIT_LINE_X + offset * PIXELS_PER_MS;
          const width = Math.max(36, note.durationMs * 0.04);
          const isPast = x + width < HIT_LINE_X - 10;

          return (
            <View
              key={`${note.pitch}-${index}`}
              style={[
                styles.noteBlock,
                {
                  left: x,
                  width,
                  opacity: isPast ? 0.4 : 1,
                },
              ]}
            >
              <Text style={styles.noteText}>{note.pitch}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvasShell: {
    height: 180,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  gridBackground: {
    flex: 1,
    backgroundColor: '#171717',
    position: 'relative',
  },
  hitLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: HIT_LINE_X,
    width: 2,
    backgroundColor: '#FFD700',
  },
  noteBlock: {
    position: 'absolute',
    top: 58,
    height: 46,
    borderRadius: 999,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  noteText: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 12,
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(17, 17, 17, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
