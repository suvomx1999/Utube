import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { searchVideos } from '../services/api';
import VideoCard from '../components/VideoCard';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { type Video } from '../types';
import { supabase } from '../supabaseClient';
import { AiOutlineFilter } from 'react-icons/ai';

const SearchFeed = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const { searchTerm } = useParams();
  const [loading, setLoading] = useState(true);
  const { isSidebarOpen } = useSidebar();
  const [selectedCategory, setSelectedCategory] = useState('All'); // Dummy for Sidebar
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance'); // relevance, date, viewCount, rating

  useEffect(() => {
    const fetchVideos = async () => {
        if (!searchTerm) return;
        setLoading(true);
        try {
            let supabaseVideos: Video[] = [];
            let youtubeVideos: any[] = [];

            // 1. Search Supabase (Local Videos)
            // Note: Supabase free tier doesn't have full-text search easily set up without extensions,
            // but we can use 'ilike' for simple title/description matching.
            let query = supabase
                .from('videos')
                .select('*')
                .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

            // Apply Sort to Supabase Query
            if (sortBy === 'date') {
                query = query.order('created_at', { ascending: false });
            } else if (sortBy === 'viewCount') {
                query = query.order('views', { ascending: false });
            } else if (sortBy === 'rating') {
                 query = query.order('likes', { ascending: false });
            } else {
                 // Relevance (default to created_at for now as we don't have search index ranking)
                 // or just leave it to default DB order
            }

            const { data: localData, error } = await query;

            if (localData && !error) {
                supabaseVideos = localData.map((v: any) => ({
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
                }));
            }

            // 2. Search YouTube API
            const data = await searchVideos(searchTerm, '', sortBy);
            youtubeVideos = data.items.map((item: any) => ({
                 ...item,
                 id: item.id?.videoId || item.id
            }));

            // Fetch details for YouTube results to get proper statistics (view counts)
            const videoIds = youtubeVideos.map((v: any) => v.id).join(',');
            if (videoIds) {
                const { fetchVideoDetails } = await import('../services/api');
                const detailsData = await fetchVideoDetails(videoIds);
                youtubeVideos = youtubeVideos.map((v: any) => {
                    const detail = detailsData.items.find((d: any) => d.id === v.id);
                    return detail ? detail : v;
                });
            }

            // Combine Results
            setVideos([...supabaseVideos, ...youtubeVideos]);

        } catch (error) {
            console.error('Error fetching search results:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchVideos();
  }, [searchTerm, sortBy]);

  return (
    <div className="flex bg-white dark:bg-[#0f0f0f] min-h-screen text-black dark:text-white transition-colors duration-200">
      <Sidebar selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
      
      <div className={`w-full ${isSidebarOpen ? 'md:ml-60' : ''} pt-20 px-4 pb-8 transition-all duration-300`}>
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                    Search Results for <span className="text-red-600 dark:text-red-500">{searchTerm}</span>
                </h2>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors font-medium"
                >
                    <AiOutlineFilter size={20} />
                    <span>Filters</span>
                </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
                <div className="bg-gray-100 dark:bg-[#1e1e1e] p-4 rounded-xl border border-gray-200 dark:border-[#303030] animate-fadeIn transition-colors duration-200">
                    <div className="flex flex-col sm:flex-row gap-8">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-300 dark:border-gray-600 pb-1 mb-1">Sort By</h3>
                            {['relevance', 'date', 'viewCount', 'rating'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSortBy(type)}
                                    className={`text-left text-sm ${sortBy === type ? 'text-black dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-gray-300'}`}
                                >
                                    {type === 'date' ? 'Upload date' : type === 'viewCount' ? 'View count' : type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        {loading && <div className="text-center">Loading...</div>}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((video: any) => (
               <VideoCard key={video.id.videoId || video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFeed;
