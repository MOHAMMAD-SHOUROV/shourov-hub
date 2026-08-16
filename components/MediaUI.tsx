import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { DownloadTask, MediaItem } from '@/state/MediaFlowProvider';

export function haptic() {
  void Haptics.selectionAsync();
}

export function ScreenHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text> : null}
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function IconButton({ name, onPress, label, filled = false }: { name: keyof typeof Feather.glyphMap; onPress: () => void; label: string; filled?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityLabel={label}
      testID={`icon-${label.toLowerCase().replaceAll(' ', '-')}`}
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: filled ? colors.primary : colors.secondary },
        pressed && styles.pressed,
      ]}
    >
      <Feather name={name} size={18} color={filled ? colors.primaryForeground : colors.foreground} />
    </Pressable>
  );
}

export function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'accent' | 'primary' }) {
  const colors = useColors();
  const backgroundColor = tone === 'accent' ? `${colors.accent}22` : tone === 'primary' ? `${colors.primary}22` : colors.muted;
  const color = tone === 'accent' ? colors.accent : tone === 'primary' ? colors.primary : colors.mutedForeground;
  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={[styles.pillText, { color }]}>{children}</Text>
    </View>
  );
}

export function MediaCard({ item, onPress, onSave, compact = false }: { item: MediaItem; onPress: () => void; onSave: () => void; compact?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      testID={`media-card-${item.id}`}
      onPress={() => {
        haptic();
        onPress();
      }}
      style={({ pressed }) => [styles.mediaCard, { backgroundColor: colors.card }, pressed && styles.cardPressed]}
    >
      <View style={[styles.thumbnailWrap, compact && styles.thumbnailCompact]}>
        <Image source={item.thumbnail} style={styles.thumbnail} />
        <View style={[styles.duration, { backgroundColor: `${colors.background}DD` }]}><Text style={[styles.durationText, { color: colors.foreground }]}>{item.duration}</Text></View>
        {item.isDownloaded ? <View style={[styles.offlineBadge, { backgroundColor: colors.accent }]}><Feather name="check" size={11} color={colors.accentForeground} /></View> : null}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardMetaRow}>
          <Pill tone="accent">{item.category}</Pill>
          <Pressable accessibilityLabel={item.isSaved ? 'Remove from saved' : 'Save media'} hitSlop={10} onPress={onSave}>
            <Feather name={item.isSaved ? 'bookmark' : 'bookmark'} size={18} color={item.isSaved ? colors.accent : colors.mutedForeground} />
          </Pressable>
        </View>
        <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
        <Text numberOfLines={1} style={[styles.cardCreator, { color: colors.mutedForeground }]}>{item.creator} · {item.views}</Text>
      </View>
    </Pressable>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: keyof typeof Feather.glyphMap; title: string; body: string; action?: ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={[styles.emptyIcon, { backgroundColor: `${colors.accent}18` }]}><Feather name={icon} size={24} color={colors.accent} /></View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{body}</Text>
      {action}
    </View>
  );
}

export function DownloadRow({ task, onPause, onResume, onDelete }: { task: DownloadTask; onPause: () => void; onResume: () => void; onDelete: () => void }) {
  const colors = useColors();
  const completed = task.status === 'completed';
  return (
    <View style={[styles.downloadRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.fileIcon, { backgroundColor: completed ? `${colors.accent}20` : `${colors.primary}20` }]}>
        <Feather name={task.kind === 'audio' ? 'headphones' : 'film'} size={18} color={completed ? colors.accent : colors.primary} />
      </View>
      <View style={styles.downloadContent}>
        <Text numberOfLines={1} style={[styles.downloadTitle, { color: colors.foreground }]}>{task.title}</Text>
        <Text style={[styles.downloadMeta, { color: colors.mutedForeground }]}>{task.kind === 'audio' ? 'Audio' : 'Video'} · {task.qualityLabel} · {task.sizeLabel}</Text>
        {!completed ? (
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}><View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.max(3, task.progress)}%` }]} /></View>
        ) : <Text style={[styles.downloadMeta, { color: colors.accent }]}>Ready offline</Text>}
      </View>
      <View style={styles.downloadActions}>
        {!completed ? <IconButton name={task.status === 'paused' ? 'play' : 'pause'} label={task.status === 'paused' ? 'Resume download' : 'Pause download'} onPress={task.status === 'paused' ? onResume : onPause} /> : null}
        <IconButton name="trash-2" label="Delete download" onPress={onDelete} />
      </View>
    </View>
  );
}

export function ToggleRow({ icon, title, body, value, onChange }: { icon: keyof typeof Feather.glyphMap; title: string; body: string; value: boolean; onChange: () => void }) {
  const colors = useColors();
  return (
    <Pressable testID={`toggle-${title.toLowerCase().replaceAll(' ', '-')}`} onPress={() => { haptic(); onChange(); }} style={styles.toggleRow}>
      <View style={[styles.settingIcon, { backgroundColor: colors.muted }]}><Feather name={icon} size={18} color={colors.accent} /></View>
      <View style={styles.toggleCopy}><Text style={[styles.toggleTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.toggleBody, { color: colors.mutedForeground }]}>{body}</Text></View>
      <View style={[styles.toggle, { backgroundColor: value ? colors.primary : colors.secondary }]}><View style={[styles.toggleKnob, { backgroundColor: value ? colors.primaryForeground : colors.mutedForeground, transform: [{ translateX: value ? 18 : 2 }] }]} /></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 18 },
  headerCopy: { flex: 1 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  screenTitle: { fontFamily: 'Inter_700Bold', fontSize: 30, letterSpacing: -0.8 },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.94 }] },
  mediaCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 14 },
  cardPressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  thumbnailWrap: { height: 196, position: 'relative' },
  thumbnailCompact: { height: 132 },
  thumbnail: { width: '100%', height: '100%' },
  duration: { position: 'absolute', bottom: 10, right: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  durationText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  offlineBadge: { position: 'absolute', top: 10, left: 10, width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14 },
  cardMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  pill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, alignSelf: 'flex-start' },
  pillText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22, marginBottom: 5 },
  cardCreator: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  empty: { minHeight: 270, borderWidth: 1, borderStyle: 'dashed', borderRadius: 20, padding: 25, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 7, textAlign: 'center' },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 280 },
  downloadRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 10 },
  fileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  downloadContent: { flex: 1, minWidth: 0 },
  downloadTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 4 },
  downloadMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 9 },
  progressFill: { height: '100%', borderRadius: 3 },
  downloadActions: { flexDirection: 'row', marginLeft: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  toggleCopy: { flex: 1, paddingRight: 10 },
  toggleTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 3 },
  toggleBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  toggle: { width: 42, height: 24, borderRadius: 14, justifyContent: 'center' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10 },
});