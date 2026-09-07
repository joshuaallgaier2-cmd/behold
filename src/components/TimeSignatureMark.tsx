import { getTimeSigGlyphPath, parseTimeSignature } from '@/src/utils/musicNotationUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

interface TimeSignatureMarkProps {
  timeSignature?: string;
  color?: string;
  size?: number;
}

export default function TimeSignatureMark({
  timeSignature,
  color = '#F8FAFC',
  size = 14,
}: TimeSignatureMarkProps) {
  const { beats, beatUnit } = parseTimeSignature(timeSignature);

  // Each Bravura time signature numeral is 500 units high and ~420 units wide.
  // Stacking vertically: top baseline at y=500 (spans 0..500), bottom baseline at y=1000 (spans 500..1000).
  const topChars = beats.split('');
  const botChars = beatUnit.split('');
  const maxDigits = Math.max(topChars.length, botChars.length);
  const digitWidth = 420;
  const totalBBoxWidth = maxDigits * digitWidth;
  const totalBBoxHeight = 1000;

  const aspectRatio = totalBBoxWidth / totalBBoxHeight;
  const targetHeight = size * 2;
  const targetWidth = Math.max(12, targetHeight * aspectRatio);

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={`${beats}/${beatUnit} time`}
    >
      <Svg
        width={targetWidth}
        height={targetHeight}
        viewBox={`0 0 ${totalBBoxWidth} ${totalBBoxHeight}`}
      >
        {/* Top Numerator (baseline at y=500) */}
        <G transform="translate(0, 500)">
          {topChars.map((ch, idx) => (
            <G key={`top-${idx}`} transform={`translate(${idx * digitWidth}, 0)`}>
              <Path d={getTimeSigGlyphPath(ch)} fill={color} />
            </G>
          ))}
        </G>

        {/* Bottom Denominator (baseline at y=1000) */}
        <G transform="translate(0, 1000)">
          {botChars.map((ch, idx) => (
            <G key={`bot-${idx}`} transform={`translate(${idx * digitWidth}, 0)`}>
              <Path d={getTimeSigGlyphPath(ch)} fill={color} />
            </G>
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
