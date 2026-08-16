import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, IconButton, MediaCard, Pill } from '@/components/MediaUI';
import { useColors } from '@/hooks/useColors';
import { useMediaFlow } from '@/state/MediaFlowProvider';

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { media, playlists, toggleSaved, createPlaylist } = useMediaFlow();
  const [newPlaylistOpen, setNewPlaylistOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const saved = useMemo(() => media.filter((item) => item.isSaved || item.isDownloaded), [media]);
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const submitPlaylist = () => {
    if (!playlistName.trim()) return;
    createPlaylist(playlistName);
    setPlaylistName('');
    setNewPlaylistOpen(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 18, paddingBottom: insets.bottom + 104 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR COLLECTION</Text><Text style={[styles.title, { color: colors.foreground }]}>Library</Text></View><IconButton name="plus" label="Create playlist" filled onPress={() => setNewPlaylistOpen(true)} /></View>
        <View style={[styles.summary, { backgroundColor: colors.secondary }]}><View><Text style={[styles.summaryNumber, { color: colors.foreground }]}>{saved.length}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>saved moments</Text></View><View style={[styles.summaryDivider, { backgroundColor: colors.border }]} /><View><Text style={[styles.summaryNumber, { color: colors.accent }]}>{playlists.length}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>playlists</Text></View><View style={[styles.summaryArt, { backgroundColor: colors.muted }]}><Feather name="bookmark" size={24} color={colors.primary} /></View></View>
        <View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved media</Text><Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>The things worth returning to</Text></View>{saved.length ? <Pill tone="accent">{saved.length} items</Pill> : null}</View>
        {saved.length ? saved.map((item) => <MediaCard compact key={item.id} item={item} onPress={() => router.push(`/player?mediaId=${item.id}`)} onSave={() => toggleSaved(item.id)} />) : <EmptyState icon="bookmark" title="Make this shelf yours" body="Tap the bookmark on any discovery to keep it here. Approved offline saves will land here too." />}
        <View style={[styles.playlistHeading, { borderTopColor: colors.border }]}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Playlists</Text><Pressable onPress={() => setNewPlaylistOpen(true)}><Text style={[styles.addText, { color: colors.accent }]}>New playlist</Text></Pressable></View>
        {playlists.length ? playlists.map((playlist) => <View key={playlist.id} style={[styles.playlistRow, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.playlistIcon, { backgroundColor: `${colors.primary}20` }]}><Feather name="list" size={18} color={colors.primary} /></View><View style={styles.playlistCopy}><Text style={[styles.playlistName, { color: colors.foreground }]}>{playlist.name}</Text><Text style={[styles.playlistMeta, { color: colors.mutedForeground }]}>{playlist.count} saved items</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></View>) : <View style={styles.playlistEmpty}><Feather name="layers" size={17} color={colors.mutedForeground} /><Text style={[styles.playlistEmptyText, { color: colors.mutedForeground }]}>Group saved media into a playlist when the mood arrives.</Text></View>}
      </ScrollView>
      <Modal visible={newPlaylistOpen} transparent animationType="slide" onRequestClose={() => setNewPlaylistOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.modalBackdrop, { backgroundColor: `${colors.background}CC` }]}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}><View style={[styles.modalHandle, { backgroundColor: colors.mutedForeground }]} /><View style={styles.modalHeading}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>NEW PLAYLIST</Text><Text style={[styles.modalTitle, { color: colors.foreground }]}>Name the feeling</Text></View><IconButton name="x" label="Close playlist form" onPress={() => setNewPlaylistOpen(false)} /></View><TextInput autoFocus value={playlistName} onChangeText={setPlaylistName} placeholder="Late afternoon, deep focus..." placeholderTextColor={colors.mutedForeground} style={[styles.playlistInput, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]} /><Pressable disabled={!playlistName.trim()} onPress={submitPlaylist} style={[styles.primaryButton, { backgroundColor: playlistName.trim() ? colors.primary : colors.muted }]}><Text style={[styles.primaryButtonText, { color: playlistName.trim() ? colors.primaryForeground : colors.mutedForeground }]}>Create playlist</Text></Pressable></View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 20 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginBottom: 5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -0.8 },
  summary: { borderRadius: 19, padding: 17, flexDirection: 'row', alignItems: 'center', marginBottom: 28, overflow: 'hidden' },
  summaryNumber: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.6 },
  summaryLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 35, marginHorizontal: 23 },
  summaryArt: { marginLeft: 'auto', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '12deg' }] },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.3 },
  sectionBody: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  playlistHeading: { borderTopWidth: 1, paddingTop: 24, marginTop: 18, marginBottom: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  playlistRow: { borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  playlistIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  playlistCopy: { flex: 1 },
  playlistName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 4 },
  playlistMeta: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  playlistEmpty: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  playlistEmptyText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginLeft: 9, flex: 1 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 27, borderTopRightRadius: 27, padding: 20, paddingBottom: 30 },
  modalHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, letterSpacing: -0.5 },
  playlistInput: { height: 52, borderRadius: 13, borderWidth: 1, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 14, marginBottom: 13 },
  primaryButton: { minHeight: 51, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});