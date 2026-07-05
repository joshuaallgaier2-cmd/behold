export function convertFrequencyToMidi(frequency: number): number {
  const SILENCE_THRESHOLD_HZ = 50; // Frequencies below this are considered silence

  if (isNaN(frequency) || frequency < SILENCE_THRESHOLD_HZ) {
    return -1; // Indicate silence or invalid frequency
  }

  // MIDI formula: 69 + 12 * log2(frequency / 440)
  // A4 (440 Hz) is MIDI number 69
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

export function convertMidiToNoteName(midiNumber: number): string {
  if (midiNumber < 0) {
    return "N/A"; // Or some other indicator for silence/invalid
  }

  const chromaticScale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const noteIndex = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1; // MIDI C0 is octave -1, C4 is octave 3 (for display)

  return chromaticScale[noteIndex] + octave;
}