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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, GameMode, MusicSource } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRoom'>;

const MODES: { id: GameMode; label: string; desc: string }[] = [
  { id: 'classic_rush', label: 'Classic Rush', desc: 'Guess from the intro' },
  { id: 'lyric_clues', label: 'Lyric Clues', desc: 'One line at a time' },
  { id: 'speed_round', label: 'Speed Round', desc: '0.5s snippets' },
];

const SOURCES: { id: MusicSource; label: string }[] = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'spotify', label: 'Spotify' },
];

export default function CreateRoomScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<GameMode>('classic_rush');
  const [source, setSource] = useState<MusicSource>('youtube');
  const [rounds, setRounds] = useState('10');

  const handleCreate = () => {
    if (!username.trim()) {
      Alert.alert('Name required', 'Enter a display name to host');
      return;
    }
    // TODO: connect to WebSocket, create room on server
    // For now, navigate with params
    navigation.navigate('Lobby', { roomId: 'new', code: '------' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Display Name */}
        <Text style={styles.label}>Your Display Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. SongNinja"
          placeholderTextColor="#484F58"
          value={username}
          onChangeText={setUsername}
          maxLength={20}
        />

        {/* Game Mode */}
        <Text style={styles.label}>Game Mode</Text>
        <View style={styles.modeGrid}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.modeCard, mode === m.id && styles.modeCardActive]}
              onPress={() => setMode(m.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeLabel,
                  mode === m.id && styles.modeLabelActive,
                ]}
              >
                {m.label}
              </Text>
              <Text style={styles.modeDesc}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Music Source */}
        <Text style={styles.label}>Music Source</Text>
        <View style={styles.sourceRow}>
          {SOURCES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.sourceChip,
                source === s.id && styles.sourceChipActive,
              ]}
              onPress={() => setSource(s.id)}
            >
              <Text
                style={[
                  styles.sourceLabel,
                  source === s.id && styles.sourceLabelActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rounds */}
        <Text style={styles.label}>Rounds</Text>
        <TextInput
          style={styles.input}
          placeholder="10"
          placeholderTextColor="#484F58"
          value={rounds}
          onChangeText={setRounds}
          keyboardType="number-pad"
        />

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          activeOpacity={0.85}
        >
          <Text style={styles.createButtonText}>Create Room</Text>
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
  label: {
    color: '#8B949E',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modeCardActive: {
    borderColor: '#1A73E8',
    backgroundColor: '#1A73E820',
  },
  modeLabel: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '700',
  },
  modeLabelActive: {
    color: '#FFFFFF',
  },
  modeDesc: {
    color: '#484F58',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sourceChip: {
    flex: 1,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  sourceChipActive: {
    borderColor: '#1A73E8',
    backgroundColor: '#1A73E820',
  },
  sourceLabel: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
  },
  sourceLabelActive: {
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
