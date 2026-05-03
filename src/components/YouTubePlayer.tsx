// ─── YouTube Player ────────────────────────────────
// Uses react-native-youtube-iframe (official YouTube IFrame player)
// for legal, app-store-compliant YouTube playback.
// Shows a compact native YouTube player directly in the game screen.

import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';

interface YouTubePlayerProps {
  videoId: string | null;
  songTitle?: string;
  songArtist?: string;
  shouldPlay?: boolean;
  onPlaybackEnd?: () => void;
}

const PLAYER_HEIGHT = 180;

export default function YouTubePlayer({
  videoId,
  songTitle,
  songArtist,
  shouldPlay = false,
  onPlaybackEnd,
}: YouTubePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  // Sync shouldPlay prop with internal playing state
  useEffect(() => {
    if (shouldPlay && playerReady) {
      setPlaying(true);
    } else if (!shouldPlay) {
      setPlaying(false);
    }
  }, [shouldPlay, playerReady]);

  const onStateChange = useCallback(
    (event: string) => {
      // event: 'unstarted', 'playing', 'paused', 'ended', 'buffering', 'cued'
      if (event === 'ended') {
        setPlaying(false);
        onPlaybackEnd?.();
      }
    },
    [onPlaybackEnd]
  );

  const onReady = useCallback(() => {
    setPlayerReady(true);
  }, []);

  const onError = useCallback((error: string) => {
    console.warn('[YT] Error:', error);
  }, []);

  if (!videoId) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🎵</Text>
        <View style={styles.songInfo}>
          {songTitle ? (
            <>
              <Text style={styles.songTitle}>{songTitle}</Text>
              {songArtist && <Text style={styles.songArtist}>{songArtist}</Text>}
            </>
          ) : (
            <Text style={styles.nowPlaying}>🔊 Now Playing</Text>
          )}
        </View>
      </View>

      {/* YouTube Player */}
      <View style={styles.playerWrapper}>
        <YoutubeIframe
          videoId={videoId}
          height={PLAYER_HEIGHT}
          play={playing}
          onChangeState={onStateChange}
          onReady={onReady}
          onError={onError}
          volume={100}
          webViewStyle={styles.webview}
        />
      </View>

      {/* Playback hint */}
      {!playing && playerReady && (
        <Text style={styles.hint}>Tap the video to play</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1A73E820',
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  headerIcon: {
    fontSize: 24,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  songArtist: {
    color: '#8B949E',
    fontSize: 13,
    marginTop: 1,
  },
  nowPlaying: {
    color: '#58A6FF',
    fontSize: 14,
    fontWeight: '700',
  },
  playerWrapper: {
    height: PLAYER_HEIGHT,
    backgroundColor: '#0D1117',
  },
  webview: {
    backgroundColor: '#0D1117',
    opacity: 0.99,
  },
  hint: {
    color: '#484F58',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 6,
  },
});
