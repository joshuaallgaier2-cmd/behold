import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NoteEvent } from '../../src/data/musicData';

interface ScrollingCanvasProps {
  notes: NoteEvent[];
}

export const ScrollingCanvas: React.FC<ScrollingCanvasProps> = ({ notes }) => {
  const renderedNotes = notes.slice(0, 5);

  return (
    <View style={styles.container}>
      {renderedNotes.map((note) => (
        <View key={note.id} style={[styles.note, { left: note.timeMs * 0.15 }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  note: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
  },
});

export default ScrollingCanvas;
