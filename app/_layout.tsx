import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Modal, Text, View, Pressable } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { MediaFlowProvider } from '@/state/MediaFlowProvider';
import { useYouTubeSearch } from '@/hooks/useYouTubeSearch';
import colors from '@/constants/colors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ShareHandler() {
  const url = Linking.useURL();
  const router = useRouter();
  const { getVideoInfo } = useYouTubeSearch();
  const [shareData, setShareData] = useState<any>(null);
  const [updateVisible, setUpdateVisible] = useState(false);

  // Version check (Simulated)
  useEffect(() => {
    const checkUpdate = async () => {
      // In real world, fetch from your server: https://your-server.com/version.json
      const currentVersion = "1.0.0";
      const remoteVersion = "1.0.0"; // Change this on server to force update

      if (remoteVersion !== currentVersion) {
        setUpdateVisible(true);
      }
    };
    checkUpdate();
  }, []);

  useEffect(() => {
    if (url) {
      const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        getVideoInfo(ytMatch[1]).then(info => {
          if (info) setShareData(info);
        });
      }
    }
  }, [url, getVideoInfo]);

  return (
    <>
      {/* Share Modal */}
      {shareData && (
        <Modal visible={true} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#1A1A1A', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Download Shared Video?</Text>
              <Text style={{ color: '#A0A0A0', marginBottom: 20 }}>{shareData.title}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => {
                    const params = new URLSearchParams({
                      mediaId: shareData.id,
                      source: 'youtube',
                      title: shareData.title,
                      creator: shareData.creator,
                      thumbnail: (shareData.thumbnail as any).uri,
                      sourceUrl: shareData.sourceUrl,
                    });
                    router.push(`/player?${params.toString()}`);
                    setShareData(null);
                  }}
                  style={{ flex: 1, backgroundColor: '#E11D48', padding: 15, borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Play & Download</Text>
                </Pressable>
                <Pressable
                  onPress={() => setShareData(null)}
                  style={{ flex: 1, backgroundColor: '#333333', padding: 15, borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFFFFF' }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Force Update Modal */}
      <Modal visible={updateVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <View style={{ backgroundColor: '#1A1A1A', padding: 30, borderRadius: 25, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: '#333' }}>
            <View style={{ backgroundColor: '#FF000022', padding: 20, borderRadius: 50, marginBottom: 20 }}>
              <Feather name="refresh-cw" size={40} color="#FF0000" />
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>New Version Available!</Text>
            <Text style={{ color: '#A0A0A0', textAlign: 'center', marginBottom: 25, lineHeight: 20 }}>
              Please update to the latest version of Shourov Hub to continue enjoying our services.
            </Text>

            <Pressable
              onPress={() => Linking.openURL('https://wa.me/8801709281334')}
              style={{ backgroundColor: '#E11D48', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 15 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>Update Now</Text>
            </Pressable>

            <View style={{ height: 1, backgroundColor: '#333', width: '100%', marginVertical: 10 }} />

            <Text style={{ color: '#666', fontSize: 12, marginTop: 10 }}>Developed by</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>Ali Ahsan Shourov</Text>

            <Pressable
              onPress={() => Linking.openURL('https://wa.me/8801709281334')}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 8, backgroundColor: '#25D36622', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}
            >
              <Feather name="message-circle" size={18} color="#25D366" />
              <Text style={{ color: '#25D366', fontWeight: '600' }}>Contact Support</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function RootLayoutNav() {
  return (
    <>
      <Stack screenOptions={{ headerBackTitle: 'Back', headerShown: false, contentStyle: { backgroundColor: colors.light.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="player" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="download" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
      <ShareHandler />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <MediaFlowProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </MediaFlowProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
