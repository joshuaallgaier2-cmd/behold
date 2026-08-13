import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { INTERACTIVE_MUSIC_DATABASE } from '../../src/data/musicData';

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentSong = INTERACTIVE_MUSIC_DATABASE.find((s) => s.id === id);

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <Text>Song not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: currentSong.title,
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#FFF',
        }}
      />
      <Text style={styles.title}>{currentSong.title}</Text>
      <Text style={styles.subtitle}>Number: {currentSong.number}</Text>
      <Text style={styles.detail}>Category: {currentSong.category}</Text>
      <Text style={styles.detail}>Tempo: {currentSong.tempo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#BBB',
    marginBottom: 5,
  },
  detail: {
    fontSize: 16,
    color: '#888',
    marginBottom: 5,
  },
});
