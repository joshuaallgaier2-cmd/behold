import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NoteEvent } from '../../src/data/musicData';

type ScrollingCanvasProps = {
  notes: NoteEvent[];
  currentTimeMs: number;
  introDurationMs: number;
};

const PIXELS_PER_MS = 0.07;
const HIT_LINE_X = 86;

export default function ScrollingCanvas({ notes, currentTimeMs, introDurationMs }: ScrollingCanvasProps) {
  const isIntroPhase = currentTimeMs < introDurationMs;

  return (
    <View style={styles.canvasShell}>
      <View style={styles.gridBackground}>
        <View style={styles.hitLine} />
        <View style={styles.guidelineRow} />
        <View style={styles.guidelineRowBottom} />
        {isIntroPhase ? (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>Intro Pre-roll Section Playing - Prepare Hands!</Text>
          </View>
        ) : null}
        {notes.map((note, index) => {
          const offset = note.startTimeMs - currentTimeMs;
          const x = HIT_LINE_X + offset * PIXELS_PER_MS;
          const width = Math.max(34, note.durationMs * 0.035);
          const isPast = x + width < HIT_LINE_X - 8;

          return (
            <View
              key={`${note.pitch}-${index}`}
              style={[
                styles.noteBlock,
                {
                  left: x,
                  width,
                  opacity: isPast ? 0.45 : 1,
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
    height: 160,
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2F2F2F',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridBackground: {
    flex: 1,
    backgroundColor: '#1E1E1E',
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
  guidelineRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 44,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  guidelineRowBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 44,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  noteBlock: {
    position: 'absolute',
    top: 56,
    height: 48,
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
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: 'rgba(17, 17, 17, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
