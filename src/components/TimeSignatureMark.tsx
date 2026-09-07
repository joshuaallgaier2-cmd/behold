import { parseTimeSignature } from '@/src/utils/musicNotationUtils';
import { StyleSheet, Text, View } from 'react-native';

interface TimeSignatureMarkProps {
  timeSignature?: string;
  color?: string;
  size?: number;
}

export default function TimeSignatureMark({
  timeSignature,
  color = '#F8FAFC',
  size = 13,
}: TimeSignatureMarkProps) {
  const { beats, beatUnit } = parseTimeSignature(timeSignature);

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={`${beats}/${beatUnit} time`}
    >
      <Text style={[styles.num, { color, fontSize: size, lineHeight: size + 1 }]}>{beats}</Text>
      <Text style={[styles.num, { color, fontSize: size, lineHeight: size + 1 }]}>{beatUnit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
