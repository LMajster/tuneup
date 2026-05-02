import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Player } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

const MOCK_RESULTS: (Player & { rank: number })[] = [
  {
    id: '1',
    username: 'Host',
    displayName: 'You',
    score: 2840,
    status: 'ready',
    isHost: true,
    joinedAt: Date.now(),
    rank: 1,
  },
  {
    id: '2',
    username: 'Guest1',
    displayName: 'Guest1',
    score: 1950,
    status: 'ready',
    isHost: false,
    joinedAt: Date.now(),
    rank: 2,
  },
];

export default function ResultsScreen({ navigation }: Props) {
  const sorted = [...MOCK_RESULTS].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Winner Crown */}
      <View style={styles.winnerSection}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.winnerLabel}>Winner</Text>
        <Text style={styles.winnerName}>{winner.displayName}</Text>
        <Text style={styles.winnerScore}>{winner.score} pts</Text>
      </View>

      {/* Full Rankings */}
      <Text style={styles.sectionTitle}>Final Rankings</Text>

      <FlatList
        data={sorted}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.rankRow,
              index === 0 && styles.goldRow,
            ]}
          >
            <Text style={styles.rankNumber}>#{item.rank}</Text>
            <View style={styles.rankInfo}>
              <Text style={styles.rankName}>{item.displayName}</Text>
              {item.isHost && (
                <Text style={styles.hostTag}>Host</Text>
              )}
            </View>
            <Text style={styles.scoreValue}>{item.score}</Text>
          </View>
        )}
      />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.secondaryText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    padding: 20,
  },
  winnerSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  trophy: {
    fontSize: 64,
    marginBottom: 8,
  },
  winnerLabel: {
    color: '#8B949E',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  winnerName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  winnerScore: {
    color: '#F0883E',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  goldRow: {
    borderColor: '#F0883E40',
    backgroundColor: '#F0883E10',
  },
  rankNumber: {
    color: '#8B949E',
    fontSize: 18,
    fontWeight: '800',
    width: 40,
  },
  rankInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hostTag: {
    color: '#F0883E',
    fontSize: 11,
    backgroundColor: '#F0883E20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    padding: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
  },
});
