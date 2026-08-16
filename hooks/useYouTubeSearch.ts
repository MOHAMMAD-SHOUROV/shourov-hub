import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { MediaItem } from '@/state/MediaFlowProvider';

export function useYouTubeSearch() {
  const [results, setResults] = useState<MediaItem[]>([]);
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [related, setRelated] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamically determine the server URL based on the Expo host or Cloud URL
  const getBaseUrl = useCallback(() => {
    if (Platform.OS === 'web') return '';

    // Replace this with your actual Cloud URL after deployment
    // Example: "https://shourov-hub-server.onrender.com"
    const cloudUrl = "";

    if (cloudUrl) return cloudUrl;

    // Fallback to local PC IP address
    const address = '192.168.230.234';
    return `http://${address}:3000`;
  }, []);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/trending`);
      if (!response.ok) throw new Error('Server unreachable');
      const data = await response.json();

      const mapped = data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        creator: item.snippet.channelTitle,
        duration: 'Trending',
        thumbnail: { uri: item.snippet.thumbnails.high.url },
        category: 'YouTube Popular',
        views: item.statistics?.viewCount ? `${(parseInt(item.statistics.viewCount) / 1000).toFixed(1)}K views` : 'Live',
        publishedLabel: new Date(item.snippet.publishedAt).toLocaleDateString(),
        sourceLabel: 'YouTube',
        sourceUrl: `https://www.youtube.com/watch?v=${item.id}`,
        isSaved: false,
        isDownloaded: false,
        mediaType: 'video',
      }));
      setTrending(mapped);
    } catch (err) {
      console.error('Trending Error:', err);
    } finally {
      setLoading(false);
    }
  }, [getBaseUrl]);

  const fetchRelated = useCallback(async (videoId: string) => {
    setLoading(true);
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/related?videoId=${videoId}`);
      const data = await response.json();
      const mapped = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        creator: item.snippet.channelTitle,
        duration: 'Related',
        thumbnail: { uri: item.snippet.thumbnails.high.url },
        category: 'YouTube Suggested',
        views: 'Live',
        publishedLabel: new Date(item.snippet.publishedAt).toLocaleDateString(),
        sourceLabel: 'YouTube',
        sourceUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        isSaved: false,
        isDownloaded: false,
        mediaType: 'video',
      }));
      setRelated(mapped);
    } catch (err) {
      console.error('Related Error:', err);
    } finally {
      setLoading(false);
    }
  }, [getBaseUrl]);

  const getVideoInfo = useCallback(async (videoId: string) => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/info?videoId=${videoId}`);
      const data = await response.json();
      if (data.items.length === 0) return null;
      const item = data.items[0];
      return {
        id: item.id,
        title: item.snippet.title,
        creator: item.snippet.channelTitle,
        duration: 'Video',
        thumbnail: { uri: item.snippet.thumbnails.high.url },
        category: 'YouTube Link',
        views: `${(parseInt(item.statistics.viewCount) / 1000).toFixed(1)}K views`,
        publishedLabel: new Date(item.snippet.publishedAt).toLocaleDateString(),
        sourceLabel: 'YouTube',
        sourceUrl: `https://www.youtube.com/watch?v=${item.id}`,
        isSaved: false,
        isDownloaded: false,
        mediaType: 'video',
      } as MediaItem;
    } catch (err) {
      console.error('Info Error:', err);
      return null;
    }
  }, [getBaseUrl]);

  const searchYouTube = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch YouTube results');
      }

      const data = await response.json();

      const mappedResults: MediaItem[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        creator: item.snippet.channelTitle,
        duration: 'YouTube',
        thumbnail: { uri: item.snippet.thumbnails.high.url },
        category: 'YouTube Search',
        views: 'Live',
        publishedLabel: new Date(item.snippet.publishedAt).toLocaleDateString(),
        sourceLabel: 'YouTube',
        sourceUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        isSaved: false,
        isDownloaded: false,
        mediaType: 'video',
      }));

      setResults(mappedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('YouTube Search Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, trending, related, loading, error, searchYouTube, fetchTrending, fetchRelated, getVideoInfo };
}
