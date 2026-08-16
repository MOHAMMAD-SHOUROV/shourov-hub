import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, ToggleRow } from '@/components/MediaUI';
import { useColors } from '@/hooks/useColors';
import { useMediaFlow } from '@/state/MediaFlowProvider';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preferences, updatePreferences } = useMediaFlow();
  const topInset = insets.top + (Platform.OS === 'web' ? 67 : 0);
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 18, paddingBottom: insets.bottom + 104 }]} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="MAKE IT YOURS" title="Settings" />
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.accent }]}>PLAYBACK</Text>
          <ToggleRow icon="headphones" title="Background play" body="Keep audio going when you leave the player." value={preferences.backgroundPlay} onChange={() => updatePreferences({ backgroundPlay: !preferences.backgroundPlay })} />
          <ToggleRow icon="volume-1" title="Prefer audio-only" body="Start saved listening sessions without video." value={preferences.audioOnly} onChange={() => updatePreferences({ audioOnly: !preferences.audioOnly })} />
        </View>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.accent }]}>DOWNLOADS</Text>
          <ToggleRow icon="wifi" title="Wi-Fi only" body="Wait for a Wi-Fi connection before local saves." value={preferences.wifiOnly} onChange={() => updatePreferences({ wifiOnly: !preferences.wifiOnly })} />
          <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>STORAGE LIMIT</Text>
          <View style={styles.limitRow}>{[4, 8, 16].map((limit) => <Pressable key={limit} testID={`storage-limit-${limit}`} onPress={() => updatePreferences({ storageLimitGb: limit })} style={[styles.limitOption, { backgroundColor: preferences.storageLimitGb === limit ? colors.primary : colors.secondary }]}><Text style={[styles.limitText, { color: preferences.storageLimitGb === limit ? colors.primaryForeground : colors.mutedForeground }]}>{limit} GB</Text></Pressable>)}</View>
        </View>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.accent }]}>NOTIFICATIONS</Text>
          <ToggleRow icon="bell" title="Download notifications" body="Show a quiet confirmation when a save is ready." value={preferences.notificationsEnabled} onChange={() => updatePreferences({ notificationsEnabled: !preferences.notificationsEnabled })} />
        </View>
        <View style={[styles.trustCard, { backgroundColor: colors.secondary }]}>
          <View style={[styles.trustIcon, { backgroundColor: `${colors.accent}22` }]}>
            <Feather name="shield" size={18} color={colors.accent} />
          </View>
          <View style={styles.trustCopy}>
            <Text style={[styles.trustTitle, { color: colors.foreground }]}>Ali Ahsan Shourov</Text>
            <Text style={[styles.trustBody, { color: colors.mutedForeground }]}>
              Shourov Hub is your personal media companion. Developed with passion for the best experience.
            </Text>
            <Pressable
              onPress={() => Linking.openURL('https://wa.me/8801709281334')}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 5 }}
            >
              <Feather name="message-circle" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Contact on WhatsApp</Text>
            </Pressable>
          </View>
        </View>
        <Text style={[styles.version, { color: colors.mutedForeground }]}>Shourov Hub v1.0 • Developed by Ali Ahsan Shourov</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18 },
  sectionCard: { borderWidth: 1, borderRadius: 19, paddingHorizontal: 15, paddingTop: 16, paddingBottom: 5, marginBottom: 13 },
  sectionLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginBottom: 2 },
  subLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, marginTop: 7, marginBottom: 9 },
  limitRow: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  limitOption: { flex: 1, borderRadius: 10, minHeight: 37, alignItems: 'center', justifyContent: 'center' },
  limitText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  trustCard: { borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  trustIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  trustCopy: { flex: 1 },
  trustTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginBottom: 5 },
  trustBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  version: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 24 },
});