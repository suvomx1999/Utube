import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import type { Playlist, PlaylistItem } from '../types';
import { AiFillDelete, AiOutlinePlaySquare } from 'react-icons/ai';
import moment from 'moment';

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && id) {
      fetchPlaylistDetails();
    }
  }, [currentUser, id]);

  const fetchPlaylistDetails = async () => {
    try {
      setLoading(true);

      // Fetch Playlist Info
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', id)
        .single();

      if (playlistError) throw playlistError;
      setPlaylist(playlistData);

      // Fetch Items
      const { data: itemsData, error: itemsError } = await supabase
        .from('playlist_items')
        .select('*')
        .eq('playlist_id', id)
        .order('added_at', { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

    } catch (error) {
      console.error('Error fetching playlist details:', error);
      navigate('/playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
       const { error } = await supabase
         .from('playlist_items')
         .delete()
         .eq('id', itemId);

        if (error) throw error;
        setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
        console.error('Error removing item:', error);
    }
  };

  const handleDeletePlaylist = async () => {
      if (!playlist || playlist.is_system) return;
      if (!window.confirm('Are you sure you want to delete this playlist?')) return;

      try {
          const { error } = await supabase
            .from('playlists')
            .delete()
            .eq('id', playlist?.id);
          
          if (error) throw error;
          navigate('/playlists');
      } catch (error) {
          console.error('Error deleting playlist:', error);
      }
  };

  if (loading) return <div className="p-6 text-black dark:text-white transition-colors">Loading...</div>;
  if (!playlist) return <div className="p-6 text-black dark:text-white transition-colors">Playlist not found</div>;

  return (
    <div className="flex flex-col lg:flex-row p-6 bg-white dark:bg-[#0f0f0f] text-black dark:text-white min-h-screen gap-6 transition-colors duration-200">
      {/* Left Sidebar (Playlist Info) */}
      <div className="lg:w-80 flex-shrink-0">
         <div className="bg-gray-100 dark:bg-gradient-to-b dark:from-[#303030] dark:to-[#121212] p-6 rounded-xl sticky top-24 h-auto min-h-[400px] flex flex-col transition-all duration-200">
            <div className="aspect-video bg-gray-200 dark:bg-[#000] rounded-xl overflow-hidden mb-4 shadow-xl">
                {items.length > 0 ? (
                    <img 
                        src={items[0].metadata.thumbnail_url} 
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <AiOutlinePlaySquare size={64} />
                    </div>
                )}
            </div>
            
            <h1 className="text-2xl font-bold mb-2 text-black dark:text-white transition-colors">{playlist.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 transition-colors">
                {playlist.user_id === currentUser?.id ? currentUser.email : 'Unknown User'}
            </p>
            
            <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4 transition-colors">
                <span>{items.length} videos</span>
                <span>•</span>
                <span>Updated {moment(items[0]?.added_at || playlist.created_at).fromNow()}</span>
            </div>

            {playlist.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-wrap transition-colors">
                    {playlist.description}
                </p>
            )}

            <div className="mt-auto flex gap-2">
                 {items.length > 0 && (
                     <Link 
                        to={`/video/${items[0].video_id}`}
                        className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2 rounded-full font-bold text-center hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                     >
                        Play All
                     </Link>
                 )}
                 {!playlist.is_system && (
                     <button 
                        onClick={handleDeletePlaylist}
                        className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-[#303030] hover:bg-gray-300 dark:hover:bg-[#404040] rounded-full transition-colors text-black dark:text-white"
                        title="Delete Playlist"
                     >
                        <AiFillDelete size={20} />
                     </button>
                 )}
            </div>
         </div>
      </div>

      {/* Right Content (Video List) */}
      <div className="flex-1">
         <div className="flex flex-col gap-2">
             {items.map((item, index) => (
                 <div key={item.id} className="flex gap-4 p-2 hover:bg-gray-100 dark:hover:bg-[#222222] rounded-xl group transition-colors">
                     <div className="w-6 flex items-center justify-center text-gray-500 font-medium text-sm">
                         {index + 1}
                     </div>
                     
                     <Link to={`/video/${item.video_id}`} className="flex-shrink-0 relative w-40 aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                         <img 
                            src={item.metadata.thumbnail_url} 
                            alt={item.metadata.title}
                            className="w-full h-full object-cover"
                         />
                     </Link>

                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <Link to={`/video/${item.video_id}`}>
                            <h3 className="font-bold text-black dark:text-white line-clamp-2 mb-1 group-hover:text-[#3ea6ff] transition-colors">
                                {item.metadata.title}
                            </h3>
                         </Link>
                         <p className="text-gray-600 dark:text-gray-400 text-xs transition-colors">
                            {item.metadata.channel_title}
                         </p>
                     </div>

                     <div className="flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-400 hover:text-red-500 p-2"
                            title="Remove from playlist"
                        >
                            <AiFillDelete size={20} />
                        </button>
                     </div>
                 </div>
             ))}

             {items.length === 0 && (
                 <div className="text-center text-gray-500 dark:text-gray-400 mt-10 transition-colors">
                     This playlist is empty.
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default PlaylistDetail;
