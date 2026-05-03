import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useStore, registerOrLogin } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { restoreAuth, isAuthenticated, setAuth, setDisplayName, displayName } = useStore();
  const [nameInput, setNameInput] = useState(displayName || '');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Restore saved auth on mount
  useEffect(() => {
    (async () => {
      const restored = await restoreAuth();
      setLoading(false);
    })();
  }, []);

  const ensureAuth = async (callback: () => void) => {
    if (isAuthenticated && useStore.getState().token) {
      callback();
      return;
    }
    if (!nameInput.trim()) {
      Alert.alert('Name required', 'Enter a display name to continue');
      return;
    }
    setAuthLoading(true);
    try {
      const result = await registerOrLogin(nameInput.trim());
      await setAuth(result.token, result.user);
      await setDisplayName(nameInput.trim());
      callback();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to connect');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.logo}>♪ Tuneup</Text>
          <ActivityIndicator color="#1A73E8" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />

      <View style={styles.header}>
        <Text style={styles.logo}>♪ Tuneup</Text>
        <Text style={styles.tagline}>Guess the song. Beat the room.</Text>
      </View>

      {!isAuthenticated && (
        <View style={styles.nameSection}>
          <TextInput
            style={styles.nameInput}
            placeholder="Your display name"
            placeholderTextColor="#484F58"
            value={nameInput}
            onChangeText={setNameInput}
            maxLength={20}
            autoCapitalize="words"
          />
        </View>
      )}

      {authLoading && (
        <View style={styles.center}>
          <ActivityIndicator color="#1A73E8" size="small" />
          <Text style={styles.loadingText}>Connecting...</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => ensureAuth(() => navigation.navigate('CreateRoom'))}
          activeOpacity={0.85}
          disabled={authLoading}
        >
          <Text style={styles.buttonIcon}>🎤</Text>
          <Text style={styles.buttonLabel}>Host a Game</Text>
          <Text style={styles.buttonDesc}>Create a room and play music</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => ensureAuth(() => navigation.navigate('JoinRoom'))}
          activeOpacity={0.85}
          disabled={authLoading}
        >
          <Text style={styles.buttonIcon}>👂</Text>
          <Text style={styles.buttonLabel}>Join a Game</Text>
          <Text style={styles.buttonDesc}>Enter a room code to play</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.features}>
        <Feature icon="🎵" text="YouTube + Spotify" />
        <Feature icon="⚡" text="Real-time multiplayer" />
        <Feature icon="🏆" text="Multiple game modes" />
      </View>

      <Text style={styles.version}>v0.1.0 · Tuneup</Text>
    </SafeAreaView>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#8B949E',
  },
  nameSection: {
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadingText: {
    color: '#8B949E',
    fontSize: 14,
    marginTop: 8,
  },
  actions: {
    gap: 16,
    marginBottom: 40,
  },
  button: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#1A73E8',
  },
  secondaryButton: {
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  buttonIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  buttonLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  buttonDesc: {
    fontSize: 13,
    color: '#8B949E',
    width: '100%',
    marginTop: 4,
    marginLeft: 44,
  },
  features: {
    gap: 12,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#8B949E',
  },
  version: {
    textAlign: 'center',
    color: '#484F58',
    fontSize: 12,
    marginBottom: 16,
  },
});
