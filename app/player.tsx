import React, { useState, useMemo, useCallback } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, Linking, Alert } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Pill, haptic } from '@/components/MediaUI';
import { useColors } from '@/hooks/useColors';
import { useMediaFlow } from '@/state/MediaFlowProvider';

export default function PlayerScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { media, preferences, toggleSaved } = useMediaFlow();
  const { related: ytRelated, fetchRelated } = useYouTubeSearch();
  const { mediaId, source, title, creator, thumbnail, sourceUrl } = useLocalSearchParams<{
    mediaId?: string;
    source?: string;
    title?: string;
    creator?: string;
    thumbnail?: string;
    sourceUrl?: string;
  }>();

  const item = useMemo(() => {
    // 1. Try to find in local library
    const local = media.find((entry) => entry.id === mediaId);
    if (local) return local;

    // 2. If it's a YouTube search result
    if (source === 'youtube' && title && sourceUrl) {
      return {
        id: mediaId || `yt-${Date.now()}`,
        title,
        creator: creator || 'YouTube Creator',
        duration: 'YouTube',
        thumbnail: { uri: thumbnail },
        category: 'YouTube Search',
        views: 'Live',
        publishedLabel: 'Recently searched',
        sourceLabel: 'YouTube',
        sourceUrl,
        isSaved: false,
        isDownloaded: false,
        mediaType: 'video',
      } as MediaItem;
    }

    return media[0];
  }, [media, mediaId, source, title, creator, thumbnail, sourceUrl]);

  const [playing, setPlaying] = useState(false);
  const isYouTube = item?.sourceLabel === 'YouTube' || item?.sourceUrl?.includes('youtube.com');

  // Extract YouTube Video ID
  const youtubeVideoId = useMemo(() => {
    if (!isYouTube || !item?.sourceUrl) return null;
    const url = item.sourceUrl;
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('be/')) {
      videoId = url.split('be/')[1].split('?')[0];
    }
    return videoId;
  }, [isYouTube, item]);

  useEffect(() => {
    if (youtubeVideoId) {
      fetchRelated(youtubeVideoId);
    }
  }, [youtubeVideoId, fetchRelated]);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
      Alert.alert('Video has finished playing!');
    }
  }, []);

  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);

  if (!item) return null;

  const handlePlayPress = useCallback(() => {
    haptic();
    setPlaying((prev) => !prev);
  }, []);

  const openInChrome = async () => {
    if (item.sourceUrl) {
      await WebBrowser.openBrowserAsync(item.sourceUrl, {
        toolbarColor: '#FF0000',
      });
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, { paddingTop: topInset + 10 }]}>
          <IconButton name="chevron-down" label="Close player" onPress={() => router.back()} />
          <Pill tone="primary">{isYouTube ? 'YouTube In-App' : (preferences.audioOnly ? 'Audio-first' : 'Now playing')}</Pill>
          <IconButton
            name={item.isSaved ? 'bookmark' : 'bookmark'}
            label={item.isSaved ? 'Remove from saved' : 'Save to library'}
            onPress={() => toggleSaved(item)}
            color={item.isSaved ? colors.primary : colors.foreground}
          />
        </View>

        <View style={[styles.artWrap, isYouTube && playing && { backgroundColor: '#000', justifyContent: 'center' }]}>
          {isYouTube && youtubeVideoId ? (
            <YoutubePlayer
              height={350}
              play={playing}
              videoId={youtubeVideoId}
              onChangeState={onStateChange}
              webViewProps={{
                allowsFullscreenVideo: true,
                allowsInlineMediaPlayback: true,
                mediaPlaybackRequiresUserAction: false,
              }}
            />
          ) : (
            <>
              <Image source={item.thumbnail} style={styles.art} />
              <View style={[styles.artShade, { backgroundColor: `${colors.background}55` }]} />
              <View style={[styles.playOrb, { backgroundColor: colors.primary + 'CC' }]}>
                <Feather name={playing ? 'pause' : 'play'} size={30} color="#FFFFFF" />
              </View>
              <Pressable accessibilityLabel="Play" onPress={handlePlayPress} style={StyleSheet.absoluteFill} />
            </>
          )}
        </View>

        <View style={styles.copy}>
          <Text style={[styles.category, { color: isYouTube ? '#FF0000' : colors.accent }]}>{item.category} · {item.duration}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
          <Text style={[styles.creator, { color: colors.mutedForeground }]}>{item.creator} · {item.sourceLabel}</Text>

          {!isYouTube && (
            <View style={styles.timeline}>
              <View style={[styles.timelineTrack, { backgroundColor: colors.muted }]}>
                <View style={[styles.timelineProgress, { backgroundColor: colors.primary, width: playing ? '21%' : '0%' }]} />
              </View>
              <View style={styles.timeLabels}>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>{playing ? '02:41' : '00:00'}</Text>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>{item.duration}</Text>
              </View>
            </View>
          )}

          <View style={styles.playerControls}>
            {isYouTube ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={handlePlayPress}
                  style={[styles.mainPlay, { backgroundColor: colors.primary, width: 'auto', paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', gap: 10 }]}
                >
                  <Feather name={playing ? 'pause' : 'play'} size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 13 }}>{playing ? 'Pause Video' : 'Play Video'}</Text>
                </Pressable>
                <IconButton name="chrome" label="Open Chrome" onPress={openInChrome} />
                <IconButton name="youtube" label="Open App" onPress={() => Linking.openURL(item.sourceUrl)} />
              </View>
            ) : (
              <>
                <IconButton name="skip-back" label="Skip back" onPress={() => undefined} />
                <Pressable accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={handlePlayPress} style={[styles.mainPlay, { backgroundColor: colors.primary }]}>
                  <Feather name={playing ? 'pause' : 'play'} size={22} color={colors.primaryForeground} />
                </Pressable>
                <IconButton name="skip-forward" label="Skip forward" onPress={() => undefined} />
              </>
            )}
          </View>

          <View style={[styles.modeCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={[styles.modeIcon, { backgroundColor: `${isYouTube ? '#FF0000' : colors.accent}22` }]}>
              <Feather name={isYouTube ? 'chrome' : (preferences.backgroundPlay ? 'headphones' : 'volume-2')} size={18} color={isYouTube ? '#FF0000' : colors.accent} />
            </View>
            <View style={styles.modeCopy}>
              <Text style={[styles.modeTitle, { color: colors.foreground }]}>{isYouTube ? 'Premium Experience' : (preferences.backgroundPlay ? 'Background audio is on' : 'Background audio is off')}</Text>
              <Text style={[styles.modeBody, { color: colors.mutedForeground }]}>{isYouTube ? 'Powered by Chrome Custom Tabs for the best playback and no errors.' : (preferences.audioOnly ? 'Audio-only preference is active for this session.' : 'Keep listening while you move through the app.')}</Text>
            </View>
          </View>

          <View style={[styles.modeCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={[styles.modeIcon, { backgroundColor: `${isYouTube ? '#FF0000' : colors.accent}22` }]}>
              <Feather name={isYouTube ? 'youtube' : (preferences.backgroundPlay ? 'headphones' : 'volume-2')} size={18} color={isYouTube ? '#FF0000' : colors.accent} />
            </View>
            <View style={styles.modeCopy}>
              <Text style={[styles.modeTitle, { color: colors.foreground }]}>{isYouTube ? 'External Playback' : (preferences.backgroundPlay ? 'Background audio is on' : 'Background audio is off')}</Text>
              <Text style={[styles.modeBody, { color: colors.mutedForeground }]}>{isYouTube ? 'This video will open in the YouTube app or browser.' : (preferences.audioOnly ? 'Audio-only preference is active for this session.' : 'Keep listening while you move through the app.')}</Text>
            </View>
          </View>

          {isYouTube && ytRelated.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Up Next</Text>
              {ytRelated.map((relatedItem) => (
                <MediaCard
                  key={relatedItem.id}
                  item={relatedItem}
                  onPress={() => {
                    const params = new URLSearchParams({
                      mediaId: relatedItem.id,
                      source: 'youtube',
                      title: relatedItem.title,
                      creator: relatedItem.creator,
                      thumbnail: (relatedItem.thumbnail as any).uri,
                      sourceUrl: relatedItem.sourceUrl,
                    });
                    router.push(`/player?${params.toString()}`);
                  }}
                  onSave={() => toggleSaved(relatedItem)}
                />
              ))}
            </View>
          )}

          <Text style={[styles.sourceNote, { color: colors.mutedForeground, marginTop: 30 }]}>Source: {item.sourceUrl} · authorized demo media</Text>
        </View>
      </ScrollView>

      <Pressable
        testID="open-download"
        onPress={() => { haptic(); router.push(`/download?mediaId=${item.id}`); }}
        style={({ pressed }) => [
          styles.floatingDownload,
          { backgroundColor: colors.primary, bottom: insets.bottom + 16 },
          pressed && { opacity: 0.8 }
        ]}
      >
        <Feather name="download" size={22} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  artWrap: { height: 350, marginHorizontal: 16, borderRadius: 23, overflow: 'hidden', position: 'relative' },
  art: { width: '100%', height: '100%' },
  artShade: { ...StyleSheet.absoluteFillObject },
  playOrb: { position: 'absolute', width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', top: '50%', left: '50%', marginLeft: -36, marginTop: -36 },
  copy: { paddingHorizontal: 20, paddingTop: 22 },
  category: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 9 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 27, lineHeight: 32, letterSpacing: -0.8, marginBottom: 8 },
  creator: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  timeline: { marginTop: 27 },
  timelineTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  timelineProgress: { height: '100%', borderRadius: 3 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 23, marginTop: 17 },
  mainPlay: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  modeCard: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', marginTop: 27 },
  modeIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  modeCopy: { flex: 1 },
  modeTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 3 },
  modeBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  floatingDownload: { position: 'absolute', right: 16, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.4 },
  sourceNote: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
