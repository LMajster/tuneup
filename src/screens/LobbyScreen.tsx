import React, { useState, useEffect } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

const MOCK_PLAYERS: Player[] = [
  {
    id: '1',
    username: 'Host',
    displayName: 'You',
    score: 0,
    status: 'ready',
    isHost: true,
    joinedAt: Date.now(),
  },
  {
    id: '2',
    username: 'Guest1',
    displayName: 'Guest1',
    score: 0,
    status: 'not_ready',
    isHost: false,
    joinedAt: Date.now(),
  },
];

export default function LobbyScreen({ navigation, route }: Props) {
  const { code } = route.params;
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);

  // TODO: connect to WebSocket, listen for player_joined events

  return (
    <SafeAreaView style={styles.container}>
      {/* Room Code Display */}
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Room Code</Text>
        <Text style={styles.code}>{code || '------'}</Text>
        <Text style={styles.codeHint}>Share this code with friends</Text>
      </View>

      {/* Players List */}
      <Text style={styles.sectionTitle}>
        Players ({players.length})
      </Text>

      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.playerList}
        renderItem={({ item }) => (
          <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.displayName[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.playerName}>{item.displayName}</Text>
                {item.isHost && (
                  <Text style={styles.hostBadge}>🎧 Host (music)</Text>
                )}
              </View>
            </View>
            <View
              style={[
                styles.statusDot,
                item.status === 'ready'
                  ? styles.statusReady
                  : styles.statusWaiting,
              ]}
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Waiting for players...</Text>
        }
      />

      {/* Host Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() =>
            navigation.replace('Game', { roomId: route.params.roomId })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>
            Start Game
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.leaveButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.leaveText}>Leave Room</Text>
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
  codeSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#161B22',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  codeLabel: {
    color: '#8B949E',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  code: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  codeHint: {
    color: '#484F58',
    fontSize: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  playerList: {
    gap: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hostBadge: {
    color: '#F0883E',
    fontSize: 12,
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusReady: {
    backgroundColor: '#3FB950',
  },
  statusWaiting: {
    backgroundColor: '#484F58',
  },
  emptyText: {
    color: '#484F58',
    textAlign: 'center',
    padding: 20,
  },
  controls: {
    marginTop: 24,
    gap: 12,
  },
  startButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  leaveButton: {
    padding: 12,
    alignItems: 'center',
  },
  leaveText: {
    color: '#F85149',
    fontSize: 14,
    fontWeight: '600',
  },
});
