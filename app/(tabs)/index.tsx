import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, haptic, IconButton, MediaCard, Pill } from '@/components/MediaUI';
import { useColors } from '@/hooks/useColors';
import { useMediaFlow } from '@/state/MediaFlowProvider';
import { useYouTubeSearch } from '@/hooks/useYouTubeSearch';

function SkeletonFeed() {
  const colors = useColors();
  return (
    <View>
      {[1, 2, 3].map((item) => <View key={item} style={[styles.skeleton, { backgroundColor: colors.card }]}><View style={[styles.skeletonImage, { backgroundColor: colors.muted }]} /><View style={[styles.skeletonLine, { backgroundColor: colors.muted }]} /><View style={[styles.skeletonSmall, { backgroundColor: colors.muted }]} /></View>)}
    </View>
  );
}

export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { media, hydrated, toggleSaved, importMediaUrl } = useMediaFlow();
  const { results: youtubeResults, trending: ytTrending, loading: ytLoading, searchYouTube, fetchTrending, getVideoInfo } = useYouTubeSearch();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('YouTube');
  const [refreshing, setRefreshing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [importError, setImportError] = useState('');

  const filteredMedia = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return media;
    return media.filter((item) => `${item.title} ${item.creator} ${item.category}`.toLowerCase().includes(value));
  }, [media, query]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrending();
    setRefreshing(false);
  }, [fetchTrending]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (!text.trim()) return;

    // Detect YouTube link
    const ytMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      const videoId = ytMatch[1];
      const info = await getVideoInfo(videoId);
      if (info) {
        const params = new URLSearchParams({
          mediaId: info.id,
          source: 'youtube',
          title: info.title,
          creator: info.creator,
          thumbnail: (info.thumbnail as any).uri,
          sourceUrl: info.sourceUrl,
        });
        router.push(`/player?${params.toString()}`);
        setQuery('');
        return;
      }
    }
  }, [getVideoInfo, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2 && !query.includes('http')) {
        searchYouTube(query);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, searchYouTube]);

  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.topLine}>
          <View>
            <Text style={[styles.brand, { color: colors.foreground }]}>Shourov<Text style={{ color: colors.primary }}>Hub</Text></Text>
            <Text style={[styles.subBrand, { color: colors.mutedForeground }]}>Your ultimate media center.</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: colors.accent }]}><Feather name="wifi" size={14} color={colors.accentForeground} /></View>
        </View>

        <View style={styles.tabContainer}>
          {['YouTube', 'Music', 'Links'].map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary }]}>
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={19} color={colors.mutedForeground} />
          <TextInput
            testID="discover-search"
            value={query}
            onChangeText={handleSearch}
            placeholder="Search or paste YouTube link"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
          />
          {query ? <IconButton name="x" label="Clear search" onPress={() => setQuery('')} /> : <Text style={[styles.searchHint, { color: colors.mutedForeground }]}>⌘ K</Text>}
        </View>
          <View style={[styles.heroRow, { backgroundColor: colors.secondary }]}>
          <View style={styles.heroCopy}><Text style={[styles.heroKicker, { color: colors.accent }]}>CURATED FOR SLOW MOMENTS</Text><Text style={[styles.heroTitle, { color: colors.foreground }]}>Keep the good stuff close.</Text><Text style={[styles.heroBody, { color: colors.mutedForeground }]}>Save licensed, owned, and directly downloadable media for the moments between things.</Text></View>
          <View style={[styles.heroMark, { backgroundColor: colors.primary }]}><Feather name="arrow-down-left" size={25} color={colors.primaryForeground} /></View>
        </View>
        <View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fresh in your orbit</Text><Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>New picks are ready to explore</Text></View><Pill tone="accent">{filteredMedia.length} picks</Pill></View>
        {!hydrated ? <SkeletonFeed /> : filteredMedia.length ? filteredMedia.map((item) => <MediaCard key={item.id} item={item} onPress={() => router.push(`/player?mediaId=${item.id}`)} onSave={() => toggleSaved(item)} />) : <EmptyState icon="search" title="No matches yet" body="Try a title, creator, or category from your local shelf." action={<Pressable style={[styles.resetButton, { backgroundColor: colors.secondary }]} onPress={() => setQuery('')}><Text style={[styles.resetText, { color: colors.foreground }]}>Clear search</Text></Pressable>} />}

        {!query && ytTrending.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}><View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trending on YouTube</Text><Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>Fresh from the pulse of the web</Text></View></View>
            {ytTrending.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onPress={() => {
                  const params = new URLSearchParams({
                    mediaId: item.id,
                    source: 'youtube',
                    title: item.title,
                    creator: item.creator,
                    thumbnail: (item.thumbnail as any).uri,
                    sourceUrl: item.sourceUrl,
                  });
                  router.push(`/player?${params.toString()}`);
                }}
                onSave={() => toggleSaved(item)}
              />
            ))}
          </>
        )}

        {query.length > 2 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 20 }]}><View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>From YouTube</Text><Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>Live results for "{query}"</Text></View>{ytLoading && <ActivityIndicator color={colors.primary} />}</View>
            {youtubeResults.length > 0 ? (
              youtubeResults.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onPress={() => {
                    const params = new URLSearchParams({
                      mediaId: item.id,
                      source: 'youtube',
                      title: item.title,
                      creator: item.creator,
                      thumbnail: (item.thumbnail as any).uri,
                      sourceUrl: item.sourceUrl,
                    });
                    router.push(`/player?${params.toString()}`);
                  }}
                  onSave={() => toggleSaved(item)}
                />
              ))
            ) : !ytLoading && query.length > 2 && (
              <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginVertical: 20 }}>No YouTube results found</Text>
            )}
          </>
        )}

        <View style={[styles.importCard, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
          <View style={[styles.importIcon, { backgroundColor: `${colors.accent}22` }]}><Feather name="link-2" size={20} color={colors.accent} /></View>
          <View style={styles.importCopy}><Text style={[styles.importTitle, { color: colors.foreground }]}>Have a link?</Text><Text style={[styles.importBody, { color: colors.mutedForeground }]}>Open a shared link for media you own or have permission to save.</Text></View>
          <Pressable testID="open-import" onPress={() => { haptic(); setImportOpen(true); }} style={({ pressed }) => [styles.importButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.78 }]}><Feather name="plus" size={18} color={colors.primaryForeground} /></Pressable>
        </View>
      </ScrollView>
      <Modal visible={importOpen} transparent animationType="slide" onRequestClose={() => setImportOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.modalBackdrop, { backgroundColor: `${colors.background}CC` }]}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.mutedForeground }]} />
            <View style={styles.modalHeading}><View><Text style={[styles.modalEyebrow, { color: colors.accent }]}>AUTHORIZED IMPORT</Text>            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Open a shared link</Text></View><IconButton name="x" label="Close import" onPress={() => setImportOpen(false)} /></View>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>Shourov Hub helps you access and save media from authorized sources you own or have permission to use.</Text>
             <View style={[styles.urlField, { borderColor: importError ? colors.destructive : colors.border, backgroundColor: colors.secondary }]}><Feather name="globe" size={17} color={importError ? colors.destructive : colors.mutedForeground} /><TextInput value={url} onChangeText={(value) => { setUrl(value); if (importError) setImportError(''); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="go" onSubmitEditing={() => { const imported = importMediaUrl(url); if (!imported) { setImportError('Paste a complete http:// or https:// link.'); return; } haptic(); setImportOpen(false); setUrl(''); setImportError(''); router.push(`/player?mediaId=${encodeURIComponent(imported.id)}`); }} placeholder="Paste an authorized media URL" placeholderTextColor={colors.mutedForeground} style={[styles.urlInput, { color: colors.foreground }]} /></View>
             {importError ? <Text style={[styles.errorText, { color: colors.destructive }]}>{importError}</Text> : null}
             <Pressable testID="import-link" onPress={() => { const imported = importMediaUrl(url); if (!imported) { setImportError('Paste a complete http:// or https:// link.'); return; } haptic(); setImportOpen(false); setUrl(''); setImportError(''); router.push(`/player?mediaId=${encodeURIComponent(imported.id)}`); }} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.78 }]}><Feather name="arrow-right" size={17} color={colors.primaryForeground} /><Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Open this link</Text></Pressable>
             <Text style={[styles.demoNote, { color: colors.mutedForeground }]}>The link is added to your hub as an authorized import.</Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -1.2 },
  subBrand: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  statusDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  searchBox: { height: 52, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 15, paddingRight: 5, marginBottom: 20 },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, paddingHorizontal: 11 },
  searchHint: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginRight: 12 },
  tabContainer: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tab: { paddingVertical: 10, marginRight: 25, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  heroRow: { minHeight: 158, borderRadius: 22, padding: 19, flexDirection: 'row', overflow: 'hidden', marginBottom: 28 },
  heroCopy: { flex: 1, paddingRight: 12 },
  heroKicker: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.3, marginBottom: 10 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, lineHeight: 29, letterSpacing: -0.7, marginBottom: 9 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  heroMark: { width: 47, height: 47, borderRadius: 24, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-12deg' }], marginTop: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 13 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.4 },
  sectionBody: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  resetButton: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, marginTop: 18 },
  resetText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  importCard: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  importIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  importCopy: { flex: 1 },
  importTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 3 },
  importBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  importButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  skeleton: { height: 280, borderRadius: 18, overflow: 'hidden', marginBottom: 14, paddingBottom: 14 },
  skeletonImage: { height: 195, width: '100%', marginBottom: 15 },
  skeletonLine: { width: '75%', height: 15, borderRadius: 4, marginHorizontal: 14, marginBottom: 10 },
  skeletonSmall: { width: '42%', height: 10, borderRadius: 4, marginHorizontal: 14 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 27, borderTopRightRadius: 27, padding: 20, paddingBottom: 30 },
  modalHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, marginBottom: 5 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, letterSpacing: -0.5 },
  modalBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginBottom: 16 },
  urlField: { height: 51, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 13 },
  urlInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, marginLeft: 10 },
  primaryButton: { minHeight: 51, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  demoNote: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 12 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, marginTop: -5, marginBottom: 12 },
});