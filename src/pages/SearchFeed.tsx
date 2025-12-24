import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { searchVideos } from '../services/api';
import VideoCard from '../components/VideoCard';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { type Video } from '../types';

const SearchFeed = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const { searchTerm } = useParams();
  const [loading, setLoading] = useState(true);
  const { isSidebarOpen } = useSidebar();
  const [selectedCategory, setSelectedCategory] = useState('All'); // Dummy for Sidebar

  useEffect(() => {
    const fetchVideos = async () => {
        if (!searchTerm) return;
        setLoading(true);
        try {
            const data = await searchVideos(searchTerm);
            setVideos(data.items);
        } catch (error) {
            console.error('Error fetching search results:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchVideos();
  }, [searchTerm]);

  return (
    <div className="flex bg-[#0f0f0f] min-h-screen text-white">
      <Sidebar selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
      
      <div className={`w-full ${isSidebarOpen ? 'md:ml-60' : ''} pt-20 px-4 pb-8 transition-all duration-300`}>
        <h2 className="text-xl font-bold mb-4">
            Search Results for <span className="text-red-500">{searchTerm}</span>
        </h2>
        
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
