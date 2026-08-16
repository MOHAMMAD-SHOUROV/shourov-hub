import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Pill, haptic } from '@/components/MediaUI';
import { useColors } from '@/hooks/useColors';
import { useMediaFlow } from '@/state/MediaFlowProvider';

const formats = [
  { id: 'video-hd', kind: 'video' as const, label: 'Video · HD', detail: '1080p · best for larger screens', size: '482 MB', icon: 'film' as const },
  { id: 'video-standard', kind: 'video' as const, label: 'Video · Standard', detail: '720p · balanced picture and size', size: '218 MB', icon: 'video' as const },
  { id: 'audio-high', kind: 'audio' as const, label: 'Audio · High quality', detail: 'AAC · easy to take anywhere', size: '31 MB', icon: 'headphones' as const },
];

export default function DownloadScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { media, addDownload } = useMediaFlow();
  const { mediaId } = useLocalSearchParams<{ mediaId?: string }>();
  const item = media.find((entry) => entry.id === mediaId) ?? media[0];
  const [selected, setSelected] = useState('video-standard');
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  if (!item) return null;
  const chosen = formats.find((format) => format.id === selected) ?? formats[1];
  const startDownload = () => {
    haptic();
    addDownload(item.id, chosen.kind, chosen.kind === 'audio' ? 'AAC' : chosen.label.includes('HD') ? '1080p' : '720p', chosen.size);
    router.replace('/(tabs)/downloads');
  };
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 10, paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}><IconButton name="chevron-left" label="Back to player" onPress={() => router.back()} /><Pill tone="accent">AUTHORIZED MEDIA</Pill><View style={{ width: 38 }} /></View>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>PREPARE OFFLINE</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Choose your format.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>A local demo queue will simulate an honest approved-media save. Nothing is fetched from a third-party platform.</Text>
        <View style={[styles.itemPreview, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.previewIcon, { backgroundColor: `${colors.primary}22` }]}><Feather name="play-circle" size={19} color={colors.primary} /></View><View style={styles.previewCopy}><Text numberOfLines={2} style={[styles.previewTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.previewMeta, { color: colors.mutedForeground }]}>{item.creator} · {item.duration}</Text></View></View>
        <Text style={[styles.chooseLabel, { color: colors.mutedForeground }]}>FORMAT & QUALITY</Text>
        {formats.map((format) => { const active = selected === format.id; return <Pressable key={format.id} testID={`format-${format.id}`} onPress={() => { haptic(); setSelected(format.id); }} style={[styles.formatRow, { backgroundColor: active ? `${colors.primary}12` : colors.card, borderColor: active ? colors.primary : colors.border }]}><View style={[styles.radio, { borderColor: active ? colors.primary : colors.mutedForeground }]}>{active ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View><View style={[styles.formatIcon, { backgroundColor: active ? `${colors.primary}20` : colors.muted }]}><Feather name={format.icon} size={17} color={active ? colors.primary : colors.mutedForeground} /></View><View style={styles.formatCopy}><Text style={[styles.formatLabel, { color: colors.foreground }]}>{format.label}</Text><Text style={[styles.formatDetail, { color: colors.mutedForeground }]}>{format.detail}</Text></View><Text style={[styles.size, { color: active ? colors.primary : colors.mutedForeground }]}>{format.size}</Text></Pressable>; })}
        <View style={[styles.notice, { backgroundColor: colors.secondary }]}><Feather name="info" size={16} color={colors.accent} /><Text style={[styles.noticeText, { color: colors.mutedForeground }]}>Only save media you own, license, or that is explicitly offered for download by its source.</Text></View>
        <Pressable testID="start-download" onPress={startDownload} style={({ pressed }) => [styles.startButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.78 }]}><Feather name="download" size={18} color={colors.primaryForeground} /><Text style={[styles.startButtonText, { color: colors.primaryForeground }]}>Add to download queue</Text></Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 27 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginBottom: 7 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 31, letterSpacing: -1, marginBottom: 9 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginBottom: 20 },
  itemPreview: { borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  previewIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  previewCopy: { flex: 1 },
  previewTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18 },
  previewMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  chooseLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.3, marginBottom: 10 },
  formatRow: { minHeight: 76, borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  radio: { width: 19, height: 19, borderWidth: 1.5, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioDot: { width: 9, height: 9, borderRadius: 5 },
  formatIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  formatCopy: { flex: 1 },
  formatLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 4 },
  formatDetail: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  size: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginLeft: 5 },
  notice: { borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  noticeText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginLeft: 9 },
  startButton: { minHeight: 54, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  startButtonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
});