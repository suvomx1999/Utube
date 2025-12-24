import { useEffect, useState, useCallback } from 'react';
import { fetchTrendingVideos, searchVideos } from '../services/api';
import VideoCard from '../components/VideoCard';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { type Video } from '../types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const Feed = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isSidebarOpen } = useSidebar();

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      let data;
      if (selectedCategory === 'All') {
        data = await fetchTrendingVideos();
      } else {
        data = await searchVideos(selectedCategory);
      }
      
      setVideos(data.items);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return (
    <div className="flex bg-[#0f0f0f] min-h-screen text-white">
      <Sidebar selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
      
      <div className={`w-full ${isSidebarOpen ? 'md:ml-60' : ''} pt-20 px-4 pb-8 transition-all duration-300`}>
        {/* Categories Pills (Horizontal Scroll) - Optional but good for UX */}
        
        {loading && (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <Skeleton height={180} baseColor="#202020" highlightColor="#444" />
                        <div className="flex gap-2">
                             <Skeleton circle width={40} height={40} baseColor="#202020" highlightColor="#444" />
                             <div className="w-[80%]">
                                <Skeleton count={2} baseColor="#202020" highlightColor="#444" />
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
