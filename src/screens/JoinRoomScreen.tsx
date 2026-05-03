import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useStore } from '../store';
import api from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinRoom'>;

export default function JoinRoomScreen({ navigation }: Props) {
  const { token, setRoom } = useStore();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert('Room code required', 'Enter the 6-character room code');
      return;
    }
    if (!token) {
      Alert.alert('Not authenticated', 'Please go back and sign in first');
      return;
    }

    const roomCode = code.toUpperCase().trim();

    setJoining(true);
    try {
      // First get room info to verify it exists + get details
      const room = await api.joinRoom(token, roomCode);

      // Store room in state
      setRoom({
        id: room.id,
        code: room.code,
        mode: room.mode as any,
        totalRounds: room.total_rounds,
        status: room.status as any,
        hostId: room.host_id,
        players: room.players.map((p) => ({
          id: p.id,
          username: p.username,
          displayName: p.display_name,
          score: p.score,
          isHost: p.is_host,
          status: p.status as any,
          joinedAt: Date.now(),
        })),
      });

      navigation.navigate('Lobby', { roomId: room.id, code: room.code });
    } catch (err: any) {
      if (err.message?.includes('404')) {
        Alert.alert('Room not found', 'Check the code and try again');
      } else if (err.message?.includes('400')) {
        Alert.alert('Game already started', 'This room is already playing');
      } else {
        Alert.alert('Error', err.message || 'Failed to join room');
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>Join a Room</Text>
        <Text style={styles.subtitle}>
          Ask the host for their room code
        </Text>

        {/* Room Code */}
        <Text style={styles.label}>Room Code</Text>
        <TextInput
          style={styles.codeInput}
          placeholder="______"
          placeholderTextColor="#30363D"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase().slice(0, 6))}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.joinButton, joining && styles.joinButtonDisabled]}
          onPress={handleJoin}
          activeOpacity={0.85}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.joinButtonText}>Join Game</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backLinkText}>← Go back</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#8B949E',
    marginBottom: 24,
  },
  label: {
    color: '#8B949E',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 4,
  },
  codeInput: {
    backgroundColor: '#161B22',
    borderWidth: 2,
    borderColor: '#30363D',
    borderRadius: 12,
    padding: 20,
    fontSize: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  joinButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 32,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  backLink: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  backLinkText: {
    color: '#8B949E',
    fontSize: 14,
  },
});
