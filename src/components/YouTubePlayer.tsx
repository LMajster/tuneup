// ─── YouTube Player ────────────────────────────────
// Uses react-native-youtube-iframe for in-app YouTube playback.
// Two states:
//   1) roundActive=true: video plays hidden (audio only, no visual clues)
//   2) roundActive=false: video + song info revealed after round ends

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';

interface YouTubePlayerProps {
  videoId: string | null;
  songTitle?: string;
  songArtist?: string;
  roundActive: boolean;
}

export default function YouTubePlayer({
  videoId,
  songTitle,
  songArtist,
  roundActive,
}: YouTubePlayerProps) {
  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playInitiated = useRef(false);

  // Reset play state when video changes
  useEffect(() => {
    setPlayerReady(false);
    setPlaying(false);
    playInitiated.current = false;
  }, [videoId]);

  // Auto-play once player is ready
  useEffect(() => {
    if (playerReady && !playInitiated.current && videoId) {
      playInitiated.current = true;
      // Small delay to ensure player is fully initialized
      const t = setTimeout(() => setPlaying(true), 300);
      return () => clearTimeout(t);
    }
  }, [playerReady, videoId]);

  // Stop playback when round ends (optional — let it continue or stop)
  // Currently let it keep playing until next round

  const onReady = useCallback(() => {
    setPlayerReady(true);
  }, []);

  const onStateChange = useCallback((event: string) => {
    // 'unstarted', 'playing', 'paused', 'ended', 'buffering', 'cued'
    if (event === 'ended') {
      setPlaying(false);
    }
  }, []);

  const onError = useCallback((error: string) => {
    console.warn('[YT] Error:', error);
  }, []);

  if (!videoId) return null;

  return (
    <View style={styles.container}>
      {/* Round active: hide the player behind overlay, show minimal indicator */}
      {roundActive ? (
        <View style={styles.playingOverlay}>
          <Text style={styles.playingIcon}>🎵</Text>
          <Text style={styles.playingText}>Playing...</Text>
          {/* Tiny hidden player so audio keeps going */}
          <View style={styles.hiddenPlayer}>
            <YoutubeIframe
              key={videoId}
              videoId={videoId}
              height={1}
              play={playing}
              onChangeState={onStateChange}
              onReady={onReady}
              onError={onError}
              volume={100}
            />
          </View>
        </View>
      ) : (
        /* Round ended: reveal the song + video player */
        <>
          {/* Reveal header with song info */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🎵</Text>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{songTitle || 'Unknown'}</Text>
              {songArtist && <Text style={styles.songArtist}>{songArtist}</Text>}
            </View>
          </View>

          {/* Full YouTube player */}
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
              webViewStyle={styles.webview}
            />
          </View>
        </>
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
  // ── Hidden/Playing state ──
  playingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    backgroundColor: '#1A73E820',
  },
  playingIcon: {
    fontSize: 18,
  },
  playingText: {
    color: '#58A6FF',
    fontSize: 14,
    fontWeight: '600',
  },
  hiddenPlayer: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  // ── Revealed state ──
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
  playerWrapper: {
    height: 180,
    backgroundColor: '#0D1117',
  },
  webview: {
    backgroundColor: '#0D1117',
    opacity: 0.99,
  },
});
