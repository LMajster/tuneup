import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useStore } from '../store';
import { socketClient } from '../services/socket';
import YouTubePlayer from '../components/YouTubePlayer';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

interface GuessEntry {
  player: string;
  guess: string;
  correct: boolean;
}

export default function GameScreen({ navigation, route }: Props) {
  const { roomId } = route.params;
  const {
    players,
    currentRound,
    totalRounds,
    isHost,
    setCurrentRound,
    setGameStatus,
    updatePlayers,
    setLastGameResults,
    user,
  } = useStore();

  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [roundNumber, setRoundNumber] = useState(1);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [revealedSong, setRevealedSong] = useState<{ title: string; artist: string } | null>(null);
  const [roundActive, setRoundActive] = useState(true);
  const [answerFeedback, setAnswerFeedback] = useState<{ correct: boolean; points: number } | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize scores from players
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    players.forEach((p) => {
      initialScores[p.displayName] = p.score;
    });
    setScores(initialScores);
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    socketClient.on('round_start', (data) => {
      setRoundNumber(data.round_number);
      setCurrentRound(data.round_number);
      setTimeLeft(data.guess_time || 30);
      setGuesses([]);
      setRevealedSong(null);
      setRoundActive(true);
      setAnswerFeedback(null);
      setIsAnswering(false);
      setGuess('');

      // Play the song on host's device
      if (data.youtube_id) {
        setYoutubeId(data.youtube_id);
      }

      // Start timer
      if (timerRef.current) clearInterval(timerRef.current);
      let remaining = data.guess_time || 30;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setTimeLeft(Math.max(0, remaining));
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 1000);
    });

    socketClient.on('round_end', (data) => {
      setRoundActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeLeft(0);
      setRevealedSong({
        title: data.song?.title || 'Unknown',
        artist: data.song?.artist || 'Unknown',
      });
      // Stop playing when round ends
      setYoutubeId(null);

      // Update scores from rankings
      if (data.rankings) {
        const newScores = { ...scores };
        data.rankings.forEach((r: any) => {
          const player = players.find((p) => p.id === r.player_id);
          if (player) {
            newScores[player.displayName] = r.score;
          }
        });
        setScores(newScores);
      }
    });

    socketClient.on('answer_result', (data) => {
      setAnswerFeedback({
        correct: data.correct,
        points: data.points || 0,
      });
      setIsAnswering(false);
    });

    socketClient.on('player_guessed', (data) => {
      const player = players.find((p) => p.id === data.player_id);
      if (player) {
        setGuesses((prev) => [
          { player: player.displayName, guess: '🎵 guessed!', correct: false },
          ...prev,
        ]);
      }
    });

    socketClient.on('game_over', (data) => {
      setGameStatus('finished');

      // Build results for the results screen
      const rankings = data.players
        ?.sort((a: any, b: any) => (a.rank || 0) - (b.rank || 0))
        .map((p: any) => ({
          id: p.player_id,
          displayName: p.display_name || p.username || p.player_id,
          score: p.score || 0,
          rank: p.rank || 0,
        })) || [];

      const winner = rankings[0] || null;
      setLastGameResults({ winner, rankings });

      setTimeout(() => {
        navigation.replace('Results', { roomId });
      }, 2000);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId, players]);

  const handleSubmitGuess = () => {
    if (!guess.trim() || !roundActive || isAnswering) return;

    setIsAnswering(true);
    socketClient.send({
      type: 'submit_guess',
      data: { guess: guess.trim() },
    });

    // Add to local list
    setGuesses((prev) => [
      { player: 'You', guess: guess.trim(), correct: false },
      ...prev,
    ]);
    setGuess('');
  };

  const handleNextRound = () => {
    if (isHost) {
      socketClient.send({ type: 'next_round', data: {} });
    } else {
      setRoundActive(true);
      setGuess('');
    }
  };

  const progress = totalRounds > 0 ? (timeLeft / 30) * 100 : 100;
  const myScore = user?.id ? (scores[players.find((p) => p.id === user?.id)?.displayName || ''] || 0) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.roundText}>
          Round {roundNumber}/{totalRounds}
        </Text>
        <Text style={styles.scoreText}>
          🏆 {myScore} pts
        </Text>
      </View>

      {/* Timer Bar */}
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, { width: `${Math.max(0, progress)}%` }]} />
      </View>
      <Text style={styles.timerText}>{timeLeft}s</Text>

      {/* Song Card */}
      <View style={styles.songCard}>
        <Text style={styles.songIcon}>🎵</Text>
        {revealedSong ? (
          <View style={styles.reveal}>
            <Text style={styles.revealTitle}>{revealedSong.title}</Text>
            <Text style={styles.revealArtist}>{revealedSong.artist}</Text>
          </View>
        ) : (
          <Text style={styles.songHint}>
            {revealedSong ? '' : 'Guess the song!'}
          </Text>
        )}
      </View>

      {/* YouTube Player */}
      <YouTubePlayer
        videoId={youtubeId}
        songTitle={revealedSong?.title}
        songArtist={revealedSong?.artist}
      />

      {/* Answer Feedback */}
      {answerFeedback && (
        <View style={answerFeedback.correct ? styles.feedbackCorrect : styles.feedbackWrong}>
          <Text style={styles.feedbackText}>
            {answerFeedback.correct
              ? `🎉 Correct! +${answerFeedback.points} pts`
              : '❌ Wrong guess!'}
          </Text>
        </View>
      )}

      {/* Guess Input */}
      {roundActive && (
        <View style={styles.guessSection}>
          <TextInput
            style={styles.guessInput}
            placeholder="Type the song title..."
            placeholderTextColor="#484F58"
            value={guess}
            onChangeText={setGuess}
            returnKeyType="send"
            onSubmitEditing={handleSubmitGuess}
            editable={roundActive && !isAnswering}
          />
          <TouchableOpacity
            style={[styles.sendButton, isAnswering && styles.sendButtonDisabled]}
            onPress={handleSubmitGuess}
            activeOpacity={0.8}
            disabled={isAnswering}
          >
            <Text style={styles.sendText}>Guess!</Text>
          </TouchableOpacity>
        </View>
      )}

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
            <Text style={styles.guessText} numberOfLines={1}>{item.guess}</Text>
            <Text style={styles.guessResult}>
              {item.correct ? '✅' : item.guess.includes('guessed') ? '🤔' : '❌'}
            </Text>
          </View>
        )}
      />

      {/* Next Round / End */}
      {!roundActive && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextRound}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {roundNumber >= totalRounds ? 'See Results →' : 'Next Round →'}
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
    marginBottom: 12,
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
  feedbackCorrect: {
    backgroundColor: '#3FB95020',
    borderWidth: 1,
    borderColor: '#3FB95040',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  feedbackWrong: {
    backgroundColor: '#F8514920',
    borderWidth: 1,
    borderColor: '#F8514940',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  feedbackText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
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
  sendButtonDisabled: {
    opacity: 0.6,
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
