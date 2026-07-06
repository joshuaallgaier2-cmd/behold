import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeDashboard() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Jump Back In</Text>
        <Text style={styles.songTitle}>Hymn 173</Text>
        <TouchableOpacity 
          style={styles.playButton} 
          onPress={() => router.push('/song-details')}
        >
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <TouchableOpacity style={styles.statCard}>
          <Text style={styles.statLabel}>Current Streak</Text>
          <Text style={styles.statValue}>12 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard}>
          <Text style={styles.statLabel}>Notes Hit</Text>
          <Text style={styles.statValue}>842</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard}>
          <Text style={styles.statLabel}>Accuracy %</Text>
          <Text style={styles.statValue}>98%</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.listItem}>
          <Text>Practiced Hymn 173 - 2m ago</Text>
        </View>
        <View style={styles.listItem}>
          <Text>Unlocked Bronze Tier - 1h ago</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
  },
  banner: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    marginBottom: 20,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
  },
  songTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  playButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 140,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  listSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
});