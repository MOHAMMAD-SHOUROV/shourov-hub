import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ImageSourcePropType, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type MediaItem = {
  id: string;
  title: string;
  creator: string;
  duration: string;
  thumbnail: ImageSourcePropType;
  category: string;
  views: string;
  publishedLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  isSaved: boolean;
  isDownloaded: boolean;
  mediaType: 'video' | 'audio';
};

export type DownloadTask = {
  id: string;
  mediaId: string;
  title: string;
  kind: 'audio' | 'video';
  qualityLabel: string;
  sizeLabel: string;
  progress: number;
  status: 'queued' | 'downloading' | 'completed' | 'paused';
  localUri?: string;
  createdAt: number;
};

export type Playlist = { id: string; name: string; count: number; createdAt: number };
export type Preferences = {
  backgroundPlay: boolean;
  audioOnly: boolean;
  wifiOnly: boolean;
  storageLimitGb: number;
  notificationsEnabled: boolean;
};

const storageKeys = {
  saved: '@mediaflow/saved',
  downloads: '@mediaflow/downloads',
  playlists: '@mediaflow/playlists',
  preferences: '@mediaflow/preferences',
  imported: '@mediaflow/imported',
};

const catalog: MediaItem[] = [];

const defaultPreferences: Preferences = {
  backgroundPlay: true,
  audioOnly: false,
  wifiOnly: false,
  storageLimitGb: 8,
  notificationsEnabled: true,
};

type MediaFlowContextValue = {
  media: MediaItem[];
  downloads: DownloadTask[];
  playlists: Playlist[];
  preferences: Preferences;
  hydrated: boolean;
  latestCompleted: string | null;
  toggleSaved: (item: MediaItem) => void;
  importMediaUrl: (url: string) => MediaItem | null;
  addDownload: (mediaId: string, kind: 'audio' | 'video', qualityLabel: string, sizeLabel: string) => void;
  pauseDownload: (taskId: string) => void;
  resumeDownload: (taskId: string) => void;
  deleteDownload: (taskId: string) => void;
  clearCompleted: () => void;
  createPlaylist: (name: string) => void;
  updatePreferences: (patch: Partial<Preferences>) => void;
  dismissCompletion: () => void;
};

const MediaFlowContext = createContext<MediaFlowContextValue | null>(null);

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function MediaFlowProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [importedMedia, setImportedMedia] = useState<MediaItem[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [hydrated, setHydrated] = useState(false);
  const [latestCompleted, setLatestCompleted] = useState<string | null>(null);
  const previousStatuses = useRef<Record<string, DownloadTask['status']>>({});

  useEffect(() => {
    Promise.all([
      read<string[]>(storageKeys.saved, []),
      read<DownloadTask[]>(storageKeys.downloads, []),
      read<Playlist[]>(storageKeys.playlists, []),
      read<Preferences>(storageKeys.preferences, defaultPreferences),
      read<MediaItem[]>(storageKeys.imported, []),
    ]).then(([saved, storedDownloads, storedPlaylists, storedPreferences, storedImported]) => {
      setSavedIds(saved);
      setDownloads(storedDownloads);
      setPlaylists(storedPlaylists);
      setPreferences({ ...defaultPreferences, ...storedPreferences });
      setImportedMedia(storedImported);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(storageKeys.saved, JSON.stringify(savedIds));
  }, [savedIds, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(storageKeys.downloads, JSON.stringify(downloads));
    downloads.forEach((task) => {
      if (preferences.notificationsEnabled && task.status === 'completed' && previousStatuses.current[task.id] !== 'completed') {
        setLatestCompleted(task.title);
      }
      previousStatuses.current[task.id] = task.status;
    });
  }, [downloads, hydrated, preferences.notificationsEnabled]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(storageKeys.playlists, JSON.stringify(playlists));
  }, [playlists, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(storageKeys.preferences, JSON.stringify(preferences));
  }, [preferences, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(storageKeys.imported, JSON.stringify(importedMedia));
  }, [importedMedia, hydrated]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDownloads((current) =>
        current.map((task) => {
          if (task.status !== 'downloading') return task;
          const next = Math.min(100, task.progress + 13);
          return next === 100 ? { ...task, progress: next, status: 'completed', localUri: `demo://offline/${task.mediaId}` } : { ...task, progress: next };
        }),
      );
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  const media = useMemo(
    () =>
      [...catalog, ...importedMedia].map((item) => ({
        ...item,
        isSaved: savedIds.includes(item.id),
        isDownloaded: downloads.some((task) => task.mediaId === item.id && task.status === 'completed'),
      })),
    [savedIds, downloads, importedMedia],
  );

  const value = useMemo<MediaFlowContextValue>(
    () => ({
      media,
      downloads,
      playlists,
      preferences,
      hydrated,
      latestCompleted,
      toggleSaved: (item) => {
        const mediaId = item.id;
        const isCurrentlySaved = savedIds.includes(mediaId);

        if (isCurrentlySaved) {
          setSavedIds((ids) => ids.filter((id) => id !== mediaId));
        } else {
          // If it's a YouTube item or something not in catalog/imported, add it to imported
          const isKnown = [...catalog, ...importedMedia].some((m) => m.id === mediaId);
          if (!isKnown) {
            setImportedMedia((items) => [item, ...items]);
          }
          setSavedIds((ids) => [...ids, mediaId]);
        }
      },
      importMediaUrl: (rawUrl) => {
        const trimmed = rawUrl.trim();
        let parsed: URL;
        try {
          parsed = new URL(trimmed);
        } catch {
          return null;
        }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
        const host = parsed.hostname.replace(/^www\./, '');
        const imported: MediaItem = {
          id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: host || 'Imported media',
          creator: 'Authorized shared link',
          duration: 'Ready to inspect',
          thumbnail: require('@/assets/images/thumb-session.jpg'),
          category: 'Imported',
          views: 'Shared link',
          publishedLabel: 'Just now',
          sourceLabel: host || 'Shared source',
          sourceUrl: trimmed,
          isSaved: false,
          isDownloaded: false,
          mediaType: 'video',
        };
        setImportedMedia((items) => [imported, ...items]);
        return imported;
      },
      addDownload: async (mediaId, kind, qualityLabel, sizeLabel) => {
        const item = media.find((entry) => entry.id === mediaId);
        if (!item) return;

        const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        // Request Permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          alert('Storage permission required to download files.');
          return;
        }

        setDownloads((tasks) => [
          {
            id: taskId,
            mediaId,
            title: item.title,
            kind,
            qualityLabel,
            sizeLabel,
            progress: 0,
            status: 'downloading',
            createdAt: Date.now(),
          },
          ...tasks,
        ]);

        // Start real download simulation with notifications
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Downloading ${kind === 'audio' ? 'Audio' : 'Video'}`,
            body: item.title,
            data: { taskId },
          },
          trigger: null,
        });

        // Simulate Progress
        let progress = 0;
        const interval = setInterval(async () => {
          progress += 20;
          if (progress <= 100) {
            setDownloads(current => current.map(t => t.id === taskId ? { ...t, progress } : t));

            // Update Notification (Optional, some OS don't support rapid updates)
          }

          if (progress >= 100) {
            clearInterval(interval);

            // Move to ShourovHub Folder logic
            const folderName = kind === 'audio' ? 'ShourovHub/Audio' : 'ShourovHub/Videos';
            // In a real production app, we would use FileSystem.downloadAsync here.
            // For now, we simulate the success and notify the user.

            setDownloads(current => current.map(t => t.id === taskId ? { ...t, status: 'completed', progress: 100, localUri: `file://${folderName}/${item.title}` } : t));

            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Download Complete!',
                body: `${item.title} saved to ${folderName}`,
                data: { taskId, path: folderName },
              },
              trigger: null,
            });
          }
        }, 1500);
      },
      pauseDownload: (taskId) => setDownloads((tasks) => tasks.map((task) => (task.id === taskId && task.status === 'downloading' ? { ...task, status: 'paused' } : task))),
      resumeDownload: (taskId) => setDownloads((tasks) => tasks.map((task) => (task.id === taskId && task.status === 'paused' ? { ...task, status: 'downloading' } : task))),
      deleteDownload: (taskId) => setDownloads((tasks) => tasks.filter((task) => task.id !== taskId)),
      clearCompleted: () => setDownloads((tasks) => tasks.filter((task) => task.status !== 'completed')),
      createPlaylist: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        setPlaylists((items) => [{ id: `${Date.now()}`, name: trimmed, count: 0, createdAt: Date.now() }, ...items]);
      },
      updatePreferences: (patch) => setPreferences((current) => ({ ...current, ...patch })),
      dismissCompletion: () => setLatestCompleted(null),
    }),
    [media, downloads, playlists, preferences, hydrated, latestCompleted, importedMedia],
  );

  return <MediaFlowContext.Provider value={value}>{children}</MediaFlowContext.Provider>;
}

export function useMediaFlow() {
  const value = useContext(MediaFlowContext);
  if (!value) throw new Error('useMediaFlow must be used inside MediaFlowProvider');
  return value;
}