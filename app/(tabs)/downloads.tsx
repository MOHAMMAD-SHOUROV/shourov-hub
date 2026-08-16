import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DownloadRow, EmptyState, IconButton, Pill } from '@/components/MediaUI';
import { useColors } from '@/hooks/useColors';
import { useMediaFlow } from '@/state/MediaFlowProvider';

export default function DownloadsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { downloads, latestCompleted, dismissCompletion, pauseDownload, resumeDownload, deleteDownload, clearCompleted } = useMediaFlow();
  const active = useMemo(() => downloads.filter((task) => task.status !== 'completed'), [downloads]);
  const completed = useMemo(() => downloads.filter((task) => task.status === 'completed'), [downloads]);
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 18, paddingBottom: insets.bottom + 105 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>OFFLINE QUEUE</Text><Text style={[styles.title, { color: colors.foreground }]}>Downloads</Text></View>{completed.length ? <IconButton name="trash" label="Clear completed downloads" onPress={clearCompleted} /> : null}</View>
        <View style={[styles.storageCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}><View><Text style={[styles.storageLabel, { color: colors.mutedForeground }]}>LOCAL SHELF</Text><Text style={[styles.storageTitle, { color: colors.foreground }]}>{downloads.length ? `${downloads.length} item${downloads.length === 1 ? '' : 's'} in queue` : 'Ready for your first save'}</Text></View><View style={[styles.storageRing, { borderColor: colors.accent }]}><Feather name="download-cloud" size={19} color={colors.accent} /></View></View>
        {active.length ? <><View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>In progress</Text><Pill tone="primary">{active.length} active</Pill></View>{active.map((task) => <DownloadRow key={task.id} task={task} onPause={() => pauseDownload(task.id)} onResume={() => resumeDownload(task.id)} onDelete={() => deleteDownload(task.id)} />)}</> : null}
        {completed.length ? <><View style={[styles.sectionHeader, { marginTop: active.length ? 23 : 0 }]}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ready offline</Text><Pill tone="accent">{completed.length} saved</Pill></View>{completed.map((task) => <DownloadRow key={task.id} task={task} onPause={() => undefined} onResume={() => undefined} onDelete={() => deleteDownload(task.id)} />)}</> : null}
        {!downloads.length ? <EmptyState icon="download" title="Your queue is clear" body="Choose audio or video on any approved item and it will appear here. Downloads are simulated locally in this first build." action={<Pressable onPress={() => router.push('/')} style={[styles.browseButton, { backgroundColor: colors.primary }]}><Text style={[styles.browseButtonText, { color: colors.primaryForeground }]}>Find something good</Text></Pressable>} /> : null}
      </ScrollView>
      {latestCompleted ? <Pressable testID="completion-toast" onPress={dismissCompletion} style={[styles.toast, { backgroundColor: colors.accent }]}><Feather name="check-circle" size={18} color={colors.accentForeground} /><View style={styles.toastCopy}><Text style={[styles.toastTitle, { color: colors.accentForeground }]}>Ready offline</Text><Text numberOfLines={1} style={[styles.toastBody, { color: colors.accentForeground }]}>{latestCompleted}</Text></View><Feather name="x" size={17} color={colors.accentForeground} /></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 20 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginBottom: 5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -0.8 },
  storageCard: { borderRadius: 18, borderWidth: 1, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 27 },
  storageLabel: { fontFamily: 'Inter_700Bold', letterSpacing: 1.2, fontSize: 9, marginBottom: 7 },
  storageTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  storageRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.3 },
  browseButton: { marginTop: 18, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 12 },
  browseButtonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  toast: { position: 'absolute', left: 14, right: 14, bottom: 95, borderRadius: 15, padding: 13, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 },
  toastCopy: { flex: 1, marginHorizontal: 10 },
  toastTitle: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  toastBody: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
});