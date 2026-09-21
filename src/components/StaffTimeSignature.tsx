import React, { useMemo } from 'react';
import { G, Path } from 'react-native-svg';
import {
  BRAVURA_GLYPHS,
  TIME_SIG_GLYPH_MAP,
  parseTimeSignature,
} from '@/src/utils/musicNotationUtils';

export interface StaffTimeSignatureProps {
  /**
   * Horizontal X position where the time signature begins on the staff.
   */
  x: number;
  /**
   * Y coordinate of the staff's top line (Line 5).
   */
  topY: number;
  /**
   * Distance between adjacent staff lines (typically 12 or 14).
   */
  lineSpacing: number;
  /**
   * Time signature string, supporting shorthand ('34', '44', '68', '128'),
   * standard ('3/4', '4/4', '12/8'), or symbols ('C', 'C|').
   */
  timeSignature?: string;
  /**
   * Ink color for the time signature numerals.
   */
  color?: string;
}

// Bounding box metrics for Bravura SMuFL time signature glyphs (centered around Y=0)
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

const KERNING_GAP = 36; // Font units between multi-digit numerals

interface DigitPosition {
  path: string;
  x: number;
}

interface RowLayout {
  totalWidth: number;
  digits: DigitPosition[];
}

function layoutDigits(text: string): RowLayout {
  const chars = text.split('');
  let currentX = 0;
  const digits: DigitPosition[] = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const metric = GLYPH_METRICS[ch] ?? GLYPH_METRICS['4'];
    const path = TIME_SIG_GLYPH_MAP[ch] ?? BRAVURA_GLYPHS.timeSig4.path;

    digits.push({
      path,
      // Shift by -minX so the visible glyph starts at currentX
      x: currentX - metric.minX,
    });

    currentX += metric.width + (i < chars.length - 1 ? KERNING_GAP : 0);
  }

  return { totalWidth: currentX, digits };
}

/**
 * Calculates the exact rendered pixel width of a time signature on the music staff.
 */
export function getTimeSignatureStaffWidth(
  timeSignature?: string,
  lineSpacing: number = 14,
): number {
  const parsed = parseTimeSignature(timeSignature);
  const scale = (lineSpacing * 2 * 0.95) / 720;

  if (parsed.symbol) {
    const metric = GLYPH_METRICS[parsed.symbol] ?? GLYPH_METRICS['C'];
    return metric.width * scale;
  }

  const topLayout = layoutDigits(parsed.beats);
  const botLayout = layoutDigits(parsed.beatUnit);
  const maxFontWidth = Math.max(topLayout.totalWidth, botLayout.totalWidth);
  return maxFontWidth * scale;
}

/**
 * Classical Music Notation Time Signature SVG Component
 *
 * Adheres strictly to Gould / Behind Bars classical music engraving rules:
 * - Numerator occupies Space 4 & Space 3 (Line 5 down to Line 3), centered at Line 4.
 * - Denominator occupies Space 2 & Space 1 (Line 3 down to Line 1), centered at Line 2.
 * - Middle Line 3 passes cleanly between the numbers without any fraction bar.
 * - Numerator and denominator are horizontally centered against each other.
 * - Common Time ('C') and Cut Time ('C|') are centered vertically on Line 3.
 */
const StaffTimeSignature: React.FC<StaffTimeSignatureProps> = ({
  x,
  topY,
  lineSpacing,
  timeSignature,
  color = '#1E293B',
}) => {
  const layout = useMemo(() => {
    const parsed = parseTimeSignature(timeSignature);
    const scale = (lineSpacing * 2 * 0.95) / 720;

    if (parsed.symbol) {
      const metric = GLYPH_METRICS[parsed.symbol] ?? GLYPH_METRICS['C'];
      const path = TIME_SIG_GLYPH_MAP[parsed.symbol] ?? BRAVURA_GLYPHS.timeSigCommon.path;
      return {
        isSymbol: true,
        scale,
        path,
        symbolX: x - metric.minX * scale,
        symbolY: topY + 2 * lineSpacing, // Line 3 (middle line)
        pixelWidth: metric.width * scale,
      };
    }

    const topRow = layoutDigits(parsed.beats);
    const botRow = layoutDigits(parsed.beatUnit);
    const maxFontWidth = Math.max(topRow.totalWidth, botRow.totalWidth);

    const topOffsetFont = (maxFontWidth - topRow.totalWidth) / 2;
    const botOffsetFont = (maxFontWidth - botRow.totalWidth) / 2;

    // Line 4 is topY + lineSpacing (center of upper two spaces)
    const topCenterY = topY + lineSpacing;
    // Line 2 is topY + 3 * lineSpacing (center of lower two spaces)
    const botCenterY = topY + 3 * lineSpacing;

    return {
      isSymbol: false,
      scale,
      topCenterY,
      botCenterY,
      topTranslateX: x + topOffsetFont * scale,
      botTranslateX: x + botOffsetFont * scale,
      topDigits: topRow.digits,
      botDigits: botRow.digits,
      pixelWidth: maxFontWidth * scale,
    };
  }, [timeSignature, x, topY, lineSpacing]);

  if (layout.isSymbol) {
    return (
      <G transform={`translate(${layout.symbolX}, ${layout.symbolY}) scale(${layout.scale})`}>
        <Path d={layout.path!} fill={color} />
      </G>
    );
  }

  return (
    <G>
      {/* Top Numerator (centered in upper two staff spaces) */}
      <G transform={`translate(${layout.topTranslateX}, ${layout.topCenterY}) scale(${layout.scale})`}>
        {layout.topDigits!.map((d, idx) => (
          <G key={`ts-top-${idx}`} transform={`translate(${d.x}, 0)`}>
            <Path d={d.path} fill={color} />
          </G>
        ))}
      </G>

      {/* Bottom Denominator (centered in lower two staff spaces) */}
      <G transform={`translate(${layout.botTranslateX}, ${layout.botCenterY}) scale(${layout.scale})`}>
        {layout.botDigits!.map((d, idx) => (
          <G key={`ts-bot-${idx}`} transform={`translate(${d.x}, 0)`}>
            <Path d={d.path} fill={color} />
          </G>
        ))}
      </G>
    </G>
  );
};

export default React.memo(StaffTimeSignature);
