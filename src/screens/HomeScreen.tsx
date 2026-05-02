import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />

      <View style={styles.header}>
        <Text style={styles.logo}>♪ Tuneup</Text>
        <Text style={styles.tagline}>Guess the song. Beat the room.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('CreateRoom')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonIcon}>🎤</Text>
          <Text style={styles.buttonLabel}>Host a Game</Text>
          <Text style={styles.buttonDesc}>Create a room and play music</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('JoinRoom')}
          activeOpacity={0.85}
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
