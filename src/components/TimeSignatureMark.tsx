import {
  BRAVURA_GLYPHS,
  TIME_SIG_GLYPH_MAP,
  parseTimeSignature,
} from '@/src/utils/musicNotationUtils';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

interface TimeSignatureMarkProps {
  timeSignature?: string;
  color?: string;
  size?: number;
}

const GLYPH_METRICS: Record<string, { minX: number; width: number }> = {
  '0': { minX: 29, width: 619 },
  '1': { minX: 29, width: 423 },
  '2': { minX: 29, width: 584 },
  '3': { minX: 29, width: 548 },
  '4': { minX: 29, width: 619 },
  '5': { minX: 29, width: 523 },
  '6': { minX: 29, width: 567 },
  '7': { minX: 29, width: 577 },
  '8': { minX: 29, width: 570 },
  '9': { minX: 29, width: 567 },
  'C': { minX: 7, width: 604 },
  'C|': { minX: 0, width: 602 },
};

const KERNING_GAP = 36;
const ROW_GAP = 70; // Vertical gap between stacked numerals
const GLYPH_HEIGHT = 720; // Natural height of Bravura timeSig numerals (from -360 to +360)

interface DigitLayout {
  path: string;
  x: number;
}

function layoutDigits(text: string) {
  const chars = text.split('');
  let currentX = 0;
  const digits: DigitLayout[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const metric = GLYPH_METRICS[ch] ?? GLYPH_METRICS['4'];
    const path = TIME_SIG_GLYPH_MAP[ch] ?? BRAVURA_GLYPHS.timeSig4.path;

    digits.push({
      path,
      x: currentX - metric.minX,
    });

    currentX += metric.width + (i < chars.length - 1 ? KERNING_GAP : 0);
  }

  return { totalWidth: currentX, digits };
}

export default function TimeSignatureMark({
  timeSignature,
  color = '#F8FAFC',
  size = 14,
}: TimeSignatureMarkProps) {
  const parsed = useMemo(() => parseTimeSignature(timeSignature), [timeSignature]);

  const layout = useMemo(() => {
    if (parsed.symbol) {
      const metric = GLYPH_METRICS[parsed.symbol] ?? GLYPH_METRICS['C'];
      const path = TIME_SIG_GLYPH_MAP[parsed.symbol] ?? BRAVURA_GLYPHS.timeSigCommon.path;
      const height = parsed.symbol === 'C|' ? 1040 : GLYPH_HEIGHT;
      const centerY = height / 2;

      const targetHeight = size * 2;
      const targetWidth = Math.max(10, (targetHeight * metric.width) / height);

      return {
        isSymbol: true,
        path,
        viewBox: `0 0 ${metric.width} ${height}`,
        targetWidth,
        targetHeight,
        x: -metric.minX,
        y: centerY,
      };
    }

    const top = layoutDigits(parsed.beats);
    const bot = layoutDigits(parsed.beatUnit);
    const maxWidth = Math.max(top.totalWidth, bot.totalWidth);

    const topOffsetX = (maxWidth - top.totalWidth) / 2;
    const botOffsetX = (maxWidth - bot.totalWidth) / 2;

    const totalHeight = GLYPH_HEIGHT * 2 + ROW_GAP;
    const topCenterY = GLYPH_HEIGHT / 2;
    const botCenterY = GLYPH_HEIGHT + ROW_GAP + GLYPH_HEIGHT / 2;

    const targetHeight = size * 2;
    const targetWidth = Math.max(10, (targetHeight * maxWidth) / totalHeight);

    return {
      isSymbol: false,
      viewBox: `0 0 ${maxWidth} ${totalHeight}`,
      targetWidth,
      targetHeight,
      topOffsetX,
      botOffsetX,
      topCenterY,
      botCenterY,
      topDigits: top.digits,
      botDigits: bot.digits,
    };
  }, [parsed, size]);

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={`${parsed.displayText} time`}
    >
      <Svg
        width={layout.targetWidth}
        height={layout.targetHeight}
        viewBox={layout.viewBox}
      >
        {layout.isSymbol ? (
          <G transform={`translate(${layout.x}, ${layout.y})`}>
            <Path d={layout.path!} fill={color} />
          </G>
        ) : (
          <>
            {/* Top Numerator */}
            <G transform={`translate(${layout.topOffsetX}, ${layout.topCenterY})`}>
              {layout.topDigits!.map((d, idx) => (
                <G key={`tsm-top-${idx}`} transform={`translate(${d.x}, 0)`}>
                  <Path d={d.path} fill={color} />
                </G>
              ))}
            </G>

            {/* Bottom Denominator */}
            <G transform={`translate(${layout.botOffsetX}, ${layout.botCenterY})`}>
              {layout.botDigits!.map((d, idx) => (
                <G key={`tsm-bot-${idx}`} transform={`translate(${d.x}, 0)`}>
                  <Path d={d.path} fill={color} />
                </G>
              ))}
            </G>
          </>
        )}
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
