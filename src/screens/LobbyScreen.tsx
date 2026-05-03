import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Player } from '../types';
import { useStore } from '../store';
import { socketClient } from '../services/socket';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

export default function LobbyScreen({ navigation, route }: Props) {
  const { code, roomId } = route.params;
  const {
    token,
    user,
    players,
    setRoom,
    updatePlayers,
    addPlayer,
    removePlayer,
    setGameStatus,
    isHost,
  } = useStore();

  const [connecting, setConnecting] = useState(true);
  const [wsError, setWsError] = useState<string | null>(null);

  // Connect WebSocket on mount
  useEffect(() => {
    if (!token || !roomId) return;

    setConnecting(true);
    setWsError(null);

    socketClient
      .connect(roomId, token)
      .then(() => {
        setConnecting(false);
      })
      .catch((err) => {
        setConnecting(false);
        setWsError('Failed to connect to game server');
        console.error('[Lobby] WS connect error:', err);
      });

    // Listen for player events
    socketClient.on('room_state', (data) => {
      if (data.players) {
        updatePlayers(
          data.players.map((p: any) => ({
            id: p.id,
            username: p.username,
            displayName: p.display_name || p.username,
            score: p.score || 0,
            isHost: p.is_host || p.isHost,
            status: p.status || 'not_ready',
            joinedAt: Date.now(),
          }))
        );
      }
      if (data.status) {
        setGameStatus(data.status);
      }
    });

    socketClient.on('player_connected', (data) => {
      // Player connected — the room_state broadcast will update the list
    });

    socketClient.on('player_disconnected', (data) => {
      removePlayer(data.player_id);
    });

    socketClient.on('game_starting', (data) => {
      // Navigate to game after countdown
      const countdown = data.countdown || 3;
      setTimeout(() => {
        navigation.replace('Game', { roomId });
      }, countdown * 1000);
    });

    socketClient.on('error', (data) => {
      Alert.alert('Error', data.message || 'Something went wrong');
    });

    return () => {
      // Don't disconnect on unmount — we might navigate to Game screen
    };
  }, [roomId]);

  const handleStartGame = () => {
    socketClient.send({ type: 'start_game', data: {} });
  };

  const handleLeave = () => {
    socketClient.disconnect();
    navigation.popToTop();
  };

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isHost) return -1;
    if (b.isHost) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  if (connecting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#1A73E8" size="large" />
          <Text style={styles.connectingText}>Connecting to room...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Room Code Display */}
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Room Code</Text>
        <Text style={styles.code}>{code || '------'}</Text>
        <Text style={styles.codeHint}>Share this code with friends</Text>
      </View>

      {wsError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {wsError}</Text>
        </View>
      )}

      {/* Players List */}
      <Text style={styles.sectionTitle}>
        Players ({players.length})
      </Text>

      <FlatList
        data={sortedPlayers}
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
        {isHost ? (
          <TouchableOpacity
            style={[
              styles.startButton,
              players.length < 1 && styles.startButtonDisabled,
            ]}
            onPress={handleStartGame}
            activeOpacity={0.85}
            disabled={players.length < 1}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingHost}>
            <Text style={styles.waitingText}>
              Waiting for host to start...
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingText: {
    color: '#8B949E',
    fontSize: 16,
    marginTop: 16,
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
  errorBanner: {
    backgroundColor: '#F8514920',
    borderWidth: 1,
    borderColor: '#F8514940',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#F85149',
    fontSize: 13,
    textAlign: 'center',
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
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  waitingHost: {
    padding: 18,
    alignItems: 'center',
  },
  waitingText: {
    color: '#8B949E',
    fontSize: 14,
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
