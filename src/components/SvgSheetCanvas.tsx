import React, { useMemo } from 'react';
import Svg, { Circle, Defs, Ellipse, FeGaussianBlur, Filter, G, Line, Path, Text } from 'react-native-svg';

export interface TargetNote {
  id: string;
  pitch: string; // e.g., 'C4', 'G4', 'Bb4'
  accidental?: '#' | 'b' | 'n';
}

export interface SvgSheetCanvasProps {
  notes: TargetNote[];
  activeNoteId: string | null;
  width: number;
  height: number;
  clef: 'treble' | 'bass';
  keySignature: string; // e.g., 'C', 'G', 'F' (Used for layout context if needed)
}

// Map pitches to a scalar integer "step" on the staff. C0 = 0.
const parsePitchToStep = (pitch: string): number => {
  const match = pitch.match(/^([A-G])([#b]?)([0-9])$/);
  if (!match) return 34; // Fallback to B4
  const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const noteIndex = noteNames.indexOf(match[1]);
  const octave = parseInt(match[3], 10);
  return octave * 7 + noteIndex;
};

const SvgSheetCanvas: React.FC<SvgSheetCanvasProps> = ({
  notes,
  activeNoteId,
  width,
  height,
  clef,
  keySignature,
}) => {
  // Staff layout constants
  const lineSpacing = 10;
  const staffCenterY = height / 2;
  const staffWidth = width - 40;
  
  // The "middle line" step index:
  // Treble middle line = B4 (Step 34)
  // Bass middle line = D3 (Step 22)
  const middleLineStep = clef === 'treble' ? 34 : 22;
  
  // Vector Paths for Clefs
  const trebleClefPath = "M14.5,23.5 C14.5,18.5 19.5,15.5 22.5,19.5 C25.5,23.5 21.5,27.5 18.5,27.5 C14.5,27.5 11.5,24.5 11.5,19.5 C11.5,12.5 19.5,8.5 22.5,2.5 C24.5,-2.5 19.5,-5.5 16.5,-1.5 C13.5,2.5 12.5,9.5 16.5,17.5 C20.5,25.5 24.5,33.5 20.5,39.5 C16.5,45.5 8.5,44.5 8.5,39.5 C8.5,36.5 10.5,34.5 12.5,36.5 C14.5,38.5 13.5,41.5 16.5,41.5 C19.5,41.5 21.5,37.5 19.5,31.5 L14.5,23.5 Z";
  const bassClefPath = "M15,10 C25,10 30,20 25,30 C20,38 10,40 5,35 C10,38 15,35 15,28 C15,22 10,20 8,25 C6,30 15,35 15,10 Z";

  const renderStaffLines = () => {
    return [-2, -1, 0, 1, 2].map((offset) => {
      const y = staffCenterY + offset * lineSpacing;
      return (
        <Line
          key={`staff-line-${offset}`}
          x1={20}
          y1={y}
          x2={20 + staffWidth}
          y2={y}
          stroke="#444444"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      );
    });
  };

  const renderClef = () => {
    if (clef === 'treble') {
      return (
        <Path
          d={trebleClefPath}
          fill="none"
          stroke="#111111"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          // Aligning treble clef curl to G4 (second line from bottom)
          transform={`translate(30, ${staffCenterY - 14}) scale(1.1)`}
        />
      );
    } else {
      return (
        <G transform={`translate(30, ${staffCenterY - 20}) scale(1.1)`}>
          <Path
            d={bassClefPath}
            fill="#111111"
            stroke="#111111"
            strokeWidth={1}
            strokeLinecap="round"
          />
          {/* Bass clef dots around F3 */}
          <Circle cx="32" cy="15" r="2.5" fill="#111" />
          <Circle cx="32" cy="25" r="2.5" fill="#111" />
        </G>
      );
    }
  };

  const renderedNotes = useMemo(() => {
    const startX = 90;
    const availableWidth = width - startX - 30;
    const noteSpacing = notes.length > 1 ? availableWidth / (notes.length - 1) : 0;

    return notes.map((note, index) => {
      const step = parsePitchToStep(note.pitch);
      const isActive = note.id === activeNoteId;
      
      const x = startX + index * noteSpacing;
      // Each step difference moves the note half a line spacing vertically
      const y = staffCenterY - (step - middleLineStep) * (lineSpacing / 2);
      
      const color = isActive ? '#00E5FF' : '#111111';
      
      // Stem direction: Up if below middle line, Down if on or above
      const stemUp = step < middleLineStep;
      const stemX = stemUp ? x + 5 : x - 5;
      const stemY1 = y;
      const stemY2 = stemUp ? y - lineSpacing * 3.5 : y + lineSpacing * 3.5;

      // Calculate required ledger lines
      const ledgers = [];
      if (step >= middleLineStep + 6) { // Top ledger lines
        for (let s = middleLineStep + 6; s <= step; s += 2) {
          const ly = staffCenterY - (s - middleLineStep) * (lineSpacing / 2);
          ledgers.push(ly);
        }
      } else if (step <= middleLineStep - 6) { // Bottom ledger lines
        for (let s = middleLineStep - 6; s >= step; s -= 2) {
          const ly = staffCenterY - (s - middleLineStep) * (lineSpacing / 2);
          ledgers.push(ly);
        }
      }

      return (
        <G key={note.id}>
          {/* Active Note Glow Effect */}
          {isActive && (
            <G>
              <Ellipse cx={x} cy={y} rx={14} ry={14} fill="#00E5FF" opacity={0.2} filter="url(#glow)" />
              <Ellipse cx={x} cy={y} rx={20} ry={20} fill="#00E5FF" opacity={0.1} filter="url(#glow)" />
            </G>
          )}

          {/* Ledger Lines */}
          {ledgers.map((ly, i) => (
            <Line
              key={`ledger-${note.id}-${i}`}
              x1={x - 12}
              y1={ly}
              x2={x + 12}
              y2={ly}
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          ))}

          {/* Stem */}
          <Line
            x1={stemX}
            y1={stemY1}
            x2={stemX}
            y2={stemY2}
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
          />

          {/* Note Head */}
          <Ellipse
            cx={x}
            cy={y}
            rx={6}
            ry={4.5}
            fill={color}
            transform={`rotate(-25 ${x} ${y})`}
          />

          {/* Accidental */}
          {note.accidental && (
            <Text
              x={x - 18}
              y={y + 5}
              fontSize={18}
              fill={color}
              fontWeight="bold"
            >
              {note.accidental === '#' ? '♯' : note.accidental === 'b' ? '♭' : '♮'}
            </Text>
          )}
        </G>
      );
    });
  }, [notes, activeNoteId, width, height, clef, middleLineStep, staffCenterY]);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <Filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <FeGaussianBlur stdDeviation="3" result="blur" />
        </Filter>
      </Defs>

      {/* Musical Staff Background */}
      <G opacity={0.8}>
        {renderStaffLines()}
        {renderClef()}
      </G>

      {/* Render Dynamic Notes */}
      {renderedNotes}
    </Svg>
  );
};

export default React.memo(SvgSheetCanvas);