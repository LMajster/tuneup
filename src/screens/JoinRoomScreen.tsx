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
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinRoom'>;

export default function JoinRoomScreen({ navigation }: Props) {
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');

  const handleJoin = () => {
    if (!code.trim()) {
      Alert.alert('Room code required', 'Enter a 6-character room code');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Name required', 'Enter a display name');
      return;
    }
    // TODO: validate code with server, join room via WebSocket
    navigation.navigate('Lobby', { roomId: 'joined', code: code.toUpperCase() });
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

        {/* Display Name */}
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. MelodyMaster"
          placeholderTextColor="#484F58"
          value={username}
          onChangeText={setUsername}
          maxLength={20}
        />

        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoin}
          activeOpacity={0.85}
        >
          <Text style={styles.joinButtonText}>Join Game</Text>
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
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  joinButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 32,
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
