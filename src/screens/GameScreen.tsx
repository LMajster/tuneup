import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Round, Answer, Player, Song } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const MOCK_ROUND: Round = {
  id: 'r1',
  roundNumber: 1,
  song: {
    id: 's1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    albumArt: undefined,
    duration: 200,
    youtubeId: 'fHI8X4OXluQ',
  },
  startTime: Date.now(),
  endTime: Date.now() + 30000,
  clipDuration: 15,
  status: 'active',
  answers: [],
};

export default function GameScreen({ navigation, route }: Props) {
  const [round, setRound] = useState<Round>(MOCK_ROUND);
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState<{ player: string; guess: string; correct: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [roundNumber, setRoundNumber] = useState(1);
  const [scores, setScores] = useState<Record<string, number>>({
    You: 0,
    Guest1: 0,
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roundNumber]);

  const handleSubmitGuess = () => {
    if (!guess.trim()) return;

    const isCorrect = guess.toLowerCase().trim() ===
      round.song.title.toLowerCase().trim();

    setGuesses((prev) => [
      { player: 'You', guess: guess.trim(), correct: isCorrect },
      ...prev,
    ]);

    if (isCorrect) {
      const bonus = Math.max(0, timeLeft) * 10;
      setScores((s) => ({ ...s, You: (s.You || 0) + 100 + bonus }));
      Alert.alert('🎉 Correct!', `+${100 + bonus} points!`);
      setGuess('');
    } else {
      setGuess('');
    }
  };

  const handleNextRound = () => {
    if (roundNumber >= 10) {
      navigation.replace('Results', { roomId: route.params.roomId });
      return;
    }
    setRoundNumber((r) => r + 1);
    setTimeLeft(30);
    setGuesses([]);
    setGuess('');
    // TODO: fetch next round from server
  };

  const progress = (timeLeft / 30) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.roundText}>
          Round {roundNumber}/10
        </Text>
        <Text style={styles.scoreText}>
          🏆 {scores.You} pts
        </Text>
      </View>

      {/* Timer Bar */}
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.timerText}>{timeLeft}s</Text>

      {/* Song Info Placeholder */}
      <View style={styles.songCard}>
        <Text style={styles.songIcon}>🎵</Text>
        <Text style={styles.songHint}>
          {roundNumber === 1
            ? 'Playing on host device...'
            : '🔊 Listen to the song!'}
        </Text>
        {guesses.some((g) => g.correct) && (
          <View style={styles.reveal}>
            <Text style={styles.revealTitle}>{round.song.title}</Text>
            <Text style={styles.revealArtist}>{round.song.artist}</Text>
          </View>
        )}
      </View>

      {/* Guess Input */}
      <View style={styles.guessSection}>
        <TextInput
          style={styles.guessInput}
          placeholder="Type the song title..."
          placeholderTextColor="#484F58"
          value={guess}
          onChangeText={setGuess}
          returnKeyType="send"
          onSubmitEditing={handleSubmitGuess}
          editable={timeLeft > 0 && !guesses.some((g) => g.correct)}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSubmitGuess}
          activeOpacity={0.8}
        >
          <Text style={styles.sendText}>Guess!</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Guesses */}
      <FlatList
        data={guesses}
        keyExtractor={(_, i) => String(i)}
        style={styles.guessList}
        contentContainerStyle={{ gap: 6 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.guessRow,
              item.correct ? styles.guessCorrect : styles.guessWrong,
            ]}
          >
            <Text style={styles.guessPlayer}>{item.player}:</Text>
            <Text style={styles.guessText}>{item.guess}</Text>
            <Text style={styles.guessResult}>
              {item.correct ? '✅' : '❌'}
            </Text>
          </View>
        )}
      />

      {/* Next Round / End */}
      {(timeLeft === 0 || guesses.some((g) => g.correct)) && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextRound}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {roundNumber >= 10 ? 'See Results →' : 'Next Round →'}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundText: {
    color: '#8B949E',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  timerBar: {
    height: 6,
    backgroundColor: '#21262D',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  timerFill: {
    height: '100%',
    backgroundColor: '#1A73E8',
    borderRadius: 3,
  },
  timerText: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  songCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  songIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  songHint: {
    color: '#8B949E',
    fontSize: 16,
    textAlign: 'center',
  },
  reveal: {
    marginTop: 12,
    alignItems: 'center',
  },
  revealTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  revealArtist: {
    color: '#8B949E',
    fontSize: 16,
    marginTop: 4,
  },
  guessSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  guessInput: {
    flex: 1,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  sendButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  guessList: {
    flex: 1,
  },
  guessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  guessCorrect: {
    backgroundColor: '#3FB95020',
    borderWidth: 1,
    borderColor: '#3FB95040',
  },
  guessWrong: {
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  guessPlayer: {
    color: '#8B949E',
    fontWeight: '600',
  },
  guessText: {
    color: '#FFFFFF',
    flex: 1,
  },
  guessResult: {
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
