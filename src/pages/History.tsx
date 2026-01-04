import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { type Video } from '../types';

const History = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchHistory();
  }, [currentUser, navigate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch from video_views joined with videos
      // Note: Supabase JS client handles basic joins if foreign keys exist.
      // We want to select * from video_views and the related video data.
      // NOTE: Supabase might not support deep selection without explicit alias or if the relation name is inferred.
      // Trying with explicit inner join alias if "videos" fails.
      
      const { data, error } = await supabase
        .from('video_views')
        .select(`
          created_at,
          video_id,
          video:videos!video_id (
            id,
            title,
            description,
            thumbnail_url,
            video_url,
            views,
            likes,
            created_at,
            user_id,
            user_name,
            user_avatar
          )
        `)
        .eq('user_id', currentUser?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      console.log("History Data:", data);

      if (data) {
        // Map Supabase data to Video type
        // Filter out any views where the video might have been deleted (video is null)
        const mappedVideos: Video[] = data
          .filter((item: any) => item.video) 
          .map((item: any) => {
            const v = item.video;
            return {
              kind: 'youtube#video',
              id: v.id,
              snippet: {
                publishedAt: v.created_at,
                channelId: v.user_id,
                title: v.title,
                description: v.description,
                thumbnails: {
                  default: { url: v.thumbnail_url, width: 120, height: 90 },
                  medium: { url: v.thumbnail_url, width: 320, height: 180 },
                  high: { url: v.thumbnail_url, width: 480, height: 360 },
                },
                channelTitle: v.user_name,
              },
              statistics: {
                viewCount: v.views?.toString() || '0',
                likeCount: v.likes?.toString() || '0',
                favoriteCount: '0',
                commentCount: '0',
              },
              isLocal: true,
              videoUrl: v.video_url,
            };
          });
        setVideos(mappedVideos);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire watch history?")) return;
    
    try {
        const { error } = await supabase
            .from('video_views')
            .delete()
            .eq('user_id', currentUser?.id);
        
        if (!error) {
            setVideos([]);
        }
    } catch (err) {
        console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white pt-20 flex justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white pt-20 px-4 md:px-8 transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Watch History</h1>
        {videos.length > 0 && (
            <button 
                onClick={clearHistory}
                className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm font-medium hover:underline"
            >
                Clear all watch history
            </button>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-20">
            <p className="text-lg">You haven't watched any videos yet.</p>
            <button 
                onClick={() => navigate('/')}
                className="mt-4 text-[#3ea6ff] hover:underline"
            >
                Start watching
            </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            {videos.map((video) => (
                <div key={video.id} className="flex gap-4 group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 p-2 rounded-xl transition-colors" onClick={() => navigate(`/video/${video.id}`)}>
                    {/* Thumbnail */}
                    <div className="relative min-w-[160px] w-[160px] md:min-w-[240px] md:w-[240px] aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
                        <img 
                            src={video.snippet.thumbnails.medium.url} 
                            alt={video.snippet.title} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {/* Info */}
                    <div className="flex-1">
                        <h3 className="font-bold text-base md:text-lg line-clamp-2 mb-1 group-hover:text-[#3ea6ff] transition-colors text-black dark:text-white">
                            {video.snippet.title}
                        </h3>
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 flex flex-col gap-1">
                            <p>{video.snippet.channelTitle}</p>
                            <p className="line-clamp-2">{video.snippet.description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default History;
