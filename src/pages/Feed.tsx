import { useEffect, useState, useCallback } from 'react';
import { fetchTrendingVideos, searchVideos } from '../services/api';
import VideoCard from '../components/VideoCard';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { type Video } from '../types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { supabase } from '../supabaseClient';
import { useTheme } from '../context/ThemeContext';

const Feed = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isSidebarOpen } = useSidebar();
  const { theme } = useTheme();

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      let youtubeVideos = [];
      let supabaseVideos: Video[] = [];

      // 1. Fetch from Supabase (our "server" videos)
      if (selectedCategory === 'All') {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          supabaseVideos = data.map((v: any) => ({
            kind: 'youtube#video',
            id: v.id, // Keep UUID for internal videos
            snippet: {
              publishedAt: v.created_at,
              channelId: v.user_id,
              title: v.title,
              description: v.description,
              thumbnails: {
                default: { url: v.thumbnail_url, width: 120, height: 90 },
                medium: { url: v.thumbnail_url, width: 320, height: 180 },
                high: { url: v.thumbnail_url, width: 480, height: 360 }
              },
              channelTitle: v.user_name,
            },
            statistics: {
              viewCount: v.views?.toString() || '0',
              likeCount: v.likes?.toString() || '0',
              favoriteCount: '0',
              commentCount: '0'
            },
            isLocal: true,
            videoUrl: v.video_url
          } as Video));
        }
      }

      // 2. Fetch from YouTube API
      if (selectedCategory === 'All') {
        const data = await fetchTrendingVideos();
        // Ensure statistics are present
        youtubeVideos = data.items.map((item: any) => ({
             ...item,
             statistics: item.statistics || { viewCount: '0', likeCount: '0', commentCount: '0' }
        }));
      } else {
        const data = await searchVideos(selectedCategory);
        // Search API often doesn't return statistics, so we might need to fetch details
        // But to save quota, we can try to rely on what's there or fetch details for ids
        // For now, let's map what we have.
        youtubeVideos = data.items.map((item: any) => ({
            ...item,
             // Search API result items don't have statistics usually, unless we fetch video details.
             // If "0 views" is the issue, it's likely because search API results lack 'statistics'.
             // We need to fetch video details for these IDs to get view counts.
             id: item.id?.videoId || item.id
        }));
        
        // Fetch details for search results to get view counts
        const videoIds = youtubeVideos.map((v: any) => v.id).join(',');
        if (videoIds) {
             const { fetchVideoDetails } = await import('../services/api');
             const detailsData = await fetchVideoDetails(videoIds);
             // Merge details back
             youtubeVideos = youtubeVideos.map((v: any) => {
                 const detail = detailsData.items.find((d: any) => d.id === v.id);
                 return detail ? detail : v;
             });
        }
      }

      // Combine: Supabase videos first
      setVideos([...supabaseVideos, ...youtubeVideos]);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, setLoading]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return (
    <div className="flex bg-white dark:bg-[#0f0f0f] min-h-screen text-black dark:text-white transition-colors duration-200">
      <Sidebar selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
      
      <div className={`w-full ${isSidebarOpen ? 'md:ml-60' : ''} pt-20 px-4 pb-8 transition-all duration-300`}>
        {/* Categories Pills (Horizontal Scroll) - Optional but good for UX */}
        
        {loading && (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <Skeleton 
                            height={180} 
                            baseColor={theme === 'dark' ? "#202020" : "#e0e0e0"} 
                            highlightColor={theme === 'dark' ? "#444" : "#f0f0f0"} 
                        />
                        <div className="flex gap-2">
                             <Skeleton 
                                circle 
                                width={40} 
                                height={40} 
                                baseColor={theme === 'dark' ? "#202020" : "#e0e0e0"} 
                                highlightColor={theme === 'dark' ? "#444" : "#f0f0f0"} 
                            />
                             <div className="w-[80%]">
                                <Skeleton 
                                    count={2} 
                                    baseColor={theme === 'dark' ? "#202020" : "#e0e0e0"} 
                                    highlightColor={theme === 'dark' ? "#444" : "#f0f0f0"} 
                                />
                             </div>
                        </div>
                    </div>
                ))}
             </div>
        )}

        {!loading && error && (
            <div className="text-center mt-10">
                <h2 className="text-xl text-red-500">Something went wrong. Please try again later.</h2>
            </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {videos.map((video: any) => (
                // Handle different ID structures between search results and video lists
               <VideoCard key={video.id?.videoId || video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
