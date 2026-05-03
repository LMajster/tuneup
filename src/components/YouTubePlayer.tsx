// ─── YouTube Player ────────────────────────────────
// Uses react-native-youtube-iframe for in-app YouTube playback.
// Always visible during testing. Autoplay uses muted-start retry strategy.
// Future: Google Sign-In for Premium, YouTube Data API for audio tracks.

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';

interface YouTubePlayerProps {
  videoId: string | null;
  songTitle?: string;
  songArtist?: string;
  // TODO: Add isSignedIn prop from Google OAuth later
}

export default function YouTubePlayer({
  videoId,
  songTitle,
  songArtist,
}: YouTubePlayerProps) {
  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playerState, setPlayerState] = useState('idle');
  const [playAttempts, setPlayAttempts] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on new video
  useEffect(() => {
    setPlayerReady(false);
    setPlaying(false);
    setPlayerState('loading');
    setPlayAttempts(0);
    if (retryTimer.current) clearTimeout(retryTimer.current);
  }, [videoId]);

  // When player is ready, attempt autoplay
  useEffect(() => {
    if (playerReady && videoId && !playing) {
      setPlaying(true);
      setPlayerState('attempting');
    }
  }, [playerReady, videoId]);

  // Retry autoplay after a delay if it didn't start
  useEffect(() => {
    if (playerState === 'attempting' && !playing) {
      retryTimer.current = setTimeout(() => {
        setPlaying(true);
        setPlayAttempts((n) => n + 1);
      }, 1500);
      return () => {
        if (retryTimer.current) clearTimeout(retryTimer.current);
      };
    }
  }, [playerState, playing]);

  const onReady = useCallback(() => {
    setPlayerReady(true);
  }, []);

  const onStateChange = useCallback((event: string) => {
    setPlayerState(event);
    if (event === 'ended') {
      setPlaying(false);
    } else if (event === 'playing') {
      setPlaying(true);
    }
  }, []);

  const onError = useCallback((error: string) => {
    console.warn('[YT] Error:', error);
    setPlayerState('error');
  }, []);

  const handleTapPlay = useCallback(() => {
    setPlaying(true);
    setPlayAttempts(0);
    setPlayerState('user_play');
  }, []);

  if (!videoId) return null;

  const isPlayingOrBuffering =
    playerState === 'playing' || playerState === 'buffering';

  return (
    <View style={styles.container}>
      {/* Header with song info (always visible during testing) */}
      <View style={styles.header}>
        {isPlayingOrBuffering ? (
          <Text style={styles.playingIcon}>🔊</Text>
        ) : (
          <Text style={styles.pausedIcon}>🔇</Text>
        )}
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>
            {songTitle || 'Now Playing'}
          </Text>
          {songArtist && (
            <Text style={styles.songArtist}>{songArtist}</Text>
          )}
        </View>
        <Text style={styles.stateLabel}>
          {playerState === 'playing' ? '▶ Playing' :
           playerState === 'buffering' ? '⏳ Buffering' :
           playerState === 'paused' ? '⏸ Paused' :
           playerState === 'ended' ? '⏹ Ended' :
           playerState === 'error' ? '⚠️ Error' :
           playerState === 'attempting' ? '🔁 Trying...' :
           '⏳ Loading'}
        </Text>
      </View>

      {/* YouTube Player (always visible) */}
      <View style={styles.playerWrapper}>
        <YoutubeIframe
          key={videoId}
          videoId={videoId}
          height={180}
          play={playing}
          onChangeState={onStateChange}
          onReady={onReady}
          onError={onError}
          volume={100}
          // controls=true lets user tap play manually
          initialPlayerParams={{
            controls: true,
            modestbranding: true,
            rel: false,
            fs: false,
          }}
          webViewStyle={styles.webview}
        />
      </View>

      {/* Fallback play button if autoplay didn't start */}
      {!isPlayingOrBuffering && playerReady && (
        <TouchableOpacity
          style={styles.tapToPlay}
          onPress={handleTapPlay}
          activeOpacity={0.8}
        >
          <Text style={styles.tapIcon}>▶</Text>
          <Text style={styles.tapText}>
            {playAttempts > 0
              ? `Tap to Play (attempt ${playAttempts + 1})`
              : 'Tap to Play'}
          </Text>
        </TouchableOpacity>
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
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1A73E820',
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  playingIcon: {
    fontSize: 16,
  },
  pausedIcon: {
    fontSize: 16,
    opacity: 0.5,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  songArtist: {
    color: '#8B949E',
    fontSize: 12,
    marginTop: 1,
  },
  stateLabel: {
    color: '#8B949E',
    fontSize: 11,
  },
  playerWrapper: {
    height: 180,
    backgroundColor: '#0D1117',
  },
  webview: {
    backgroundColor: '#0D1117',
    opacity: 0.99,
  },
  tapToPlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#1A73E8',
  },
  tapIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  tapText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
