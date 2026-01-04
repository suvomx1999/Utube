import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import type { Playlist } from '../types';
import { AiOutlinePlaySquare } from 'react-icons/ai';
import moment from 'moment';

const Playlists = () => {
  const { currentUser } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchPlaylists();
    }
  }, [currentUser]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      
      // Fetch playlists
      const { data: playlistsData, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', currentUser?.id)
        .order('is_system', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each playlist, fetch the thumbnail of the first video and item count
      const playlistsWithMeta = await Promise.all(playlistsData.map(async (playlist) => {
        const { data: items, count } = await supabase
          .from('playlist_items')
          .select('metadata', { count: 'exact', head: false })
          .eq('playlist_id', playlist.id)
          .order('added_at', { ascending: false })
          .limit(1);

        return {
          ...playlist,
          item_count: count || 0,
          thumbnail_url: items?.[0]?.metadata?.thumbnail_url
        };
      }));

      setPlaylists(playlistsWithMeta);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
        <div className="flex justify-center items-center h-screen text-black dark:text-white">
            Please login to view your playlists.
        </div>
    );
  }

  return (
    <div className="flex flex-col p-6 text-black dark:text-white min-h-screen transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-6">Playlists</h1>

      {loading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {[1,2,3,4].map(n => (
                 <div key={n} className="bg-gray-200 dark:bg-[#1e1e1e] h-60 rounded-xl animate-pulse"></div>
             ))}
         </div>
      ) : playlists.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
            <p>No playlists found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="group">
              <div className="relative aspect-video bg-gray-100 dark:bg-[#1e1e1e] rounded-xl overflow-hidden mb-3 border border-gray-200 dark:border-[#303030] group-hover:border-[#3ea6ff] transition-colors">
                {playlist.thumbnail_url ? (
                  <img 
                    src={playlist.thumbnail_url} 
                    alt={playlist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <AiOutlinePlaySquare size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <AiOutlinePlaySquare /> Play All
                    </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {playlist.item_count} videos
                </div>
              </div>
              
              <h3 className="font-bold text-black dark:text-white group-hover:text-[#3ea6ff] transition-colors line-clamp-1">
                {playlist.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                {playlist.is_system ? 'System Playlist' : moment(playlist.created_at).format('MMM D, YYYY')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlists;
