import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { AiOutlineClose, AiOutlinePlus, AiOutlineCheck } from 'react-icons/ai';
import type { Playlist, Video } from '../types';

interface SaveToPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: Video | null;
}

const SaveToPlaylistModal: React.FC<SaveToPlaylistModalProps> = ({ isOpen, onClose, video }) => {
    const { currentUser } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            fetchPlaylists();
        }
    }, [isOpen, currentUser]);

    useEffect(() => {
        if (isOpen && video && playlists.length > 0) {
            checkVideoInPlaylists();
        }
    }, [isOpen, video, playlists]);

    const fetchPlaylists = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // Check for "Watch Later" and create if not exists
            const { data: watchLater } = await supabase
                .from('playlists')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('is_system', true)
                .eq('name', 'Watch Later')
                .maybeSingle();

            if (!watchLater) {
                await supabase.from('playlists').insert({
                    user_id: currentUser.id,
                    name: 'Watch Later',
                    is_system: true,
                    description: 'Your Watch Later list'
                });
            }

            // Fetch all playlists
            const { data, error } = await supabase
                .from('playlists')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('is_system', { ascending: false }) // Watch Later first
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPlaylists(data || []);
        } catch (error) {
            console.error('Error fetching playlists:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkVideoInPlaylists = async () => {
        if (!currentUser || !video) return;
        try {
            const videoId = video.isLocal ? video.id : (typeof video.id === 'string' ? video.id : video.id);
            
            const { data, error } = await supabase
                .from('playlist_items')
                .select('playlist_id')
                .in('playlist_id', playlists.map(p => p.id))
                .eq('video_id', videoId);

            if (error) throw error;
            
            const selected = new Set<string>();
            data?.forEach((item: any) => selected.add(item.playlist_id));
            setSelectedPlaylists(selected);
        } catch (error) {
            console.error('Error checking playlists:', error);
        }
    };

    const handleCreatePlaylist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlaylistName.trim() || !currentUser) return;

        try {
            const { data, error } = await supabase
                .from('playlists')
                .insert({
                    user_id: currentUser.id,
                    name: newPlaylistName,
                    is_system: false
                })
                .select()
                .single();

            if (error) throw error;

            setPlaylists(prev => [data, ...prev]);
            setNewPlaylistName('');
            setShowCreateForm(false);
            
            // Auto select the new playlist
            if (video) {
                await togglePlaylist(data.id, true);
            }
        } catch (error: any) {
            console.error('Error creating playlist:', error);
            alert(`Failed to create playlist: ${error.message || 'Unknown error'}`);
        }
    };

    const togglePlaylist = async (playlistId: string, isSelected: boolean) => {
        if (!currentUser || !video) return;

        // Optimistic update
        const newSelected = new Set(selectedPlaylists);
        if (isSelected) {
            newSelected.add(playlistId);
        } else {
            newSelected.delete(playlistId);
        }
        setSelectedPlaylists(newSelected);

        const videoId = video.isLocal ? video.id : (typeof video.id === 'string' ? video.id : video.id);
        
        try {
            if (isSelected) {
                // Add to playlist
                const { error } = await supabase
                    .from('playlist_items')
                    .insert({
                        playlist_id: playlistId,
                        video_id: videoId,
                        video_source: video.isLocal ? 'local' : 'youtube',
                        metadata: {
                            title: video.snippet.title,
                            thumbnail_url: video.snippet.thumbnails.medium.url,
                            channel_title: video.snippet.channelTitle
                        }
                    });
                if (error) throw error;
            } else {
                // Remove from playlist
                const { error } = await supabase
                    .from('playlist_items')
                    .delete()
                    .eq('playlist_id', playlistId)
                    .eq('video_id', videoId);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error updating playlist:', error);
            // Revert on error
            setSelectedPlaylists(prev => {
                const reverted = new Set(prev);
                if (isSelected) reverted.delete(playlistId);
                else reverted.add(playlistId);
                return reverted;
            });
        }
    };

    if (!isOpen) return null;

    if (!currentUser) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-colors duration-200" onClick={onClose}>
                <div className="bg-white dark:bg-[#212121] rounded-xl w-full max-w-xs relative shadow-2xl border border-gray-200 dark:border-[#303030] p-6 text-center transition-colors duration-200" onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                        <AiOutlineClose size={20} />
                    </button>
                    <h3 className="text-black dark:text-white font-bold mb-2">Want to watch this again later?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Sign in to add this video to a playlist.</p>
                    <a href="/login" className="inline-block bg-[#3ea6ff] text-white px-6 py-2 rounded-full font-medium hover:bg-[#3ea6ff]/90">
                        Sign in
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-colors duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-[#212121] rounded-xl w-full max-w-xs relative shadow-2xl border border-gray-200 dark:border-[#303030] transition-colors duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-[#303030]">
                    <h3 className="text-black dark:text-white font-medium">Save to...</h3>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
                        <AiOutlineClose size={20} />
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto p-2">
                    {loading && playlists.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>
                    ) : (
                        playlists.map(playlist => (
                            <label key={playlist.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-[#303030] rounded cursor-pointer transition-colors">
                                <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center ${
                                    selectedPlaylists.has(playlist.id) 
                                        ? 'bg-[#3ea6ff] border-[#3ea6ff]' 
                                        : 'border-gray-400 dark:border-gray-500'
                                }`}>
                                    {selectedPlaylists.has(playlist.id) && <AiOutlineCheck className="text-white dark:text-black text-xs" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedPlaylists.has(playlist.id)}
                                    onChange={(e) => togglePlaylist(playlist.id, e.target.checked)}
                                />
                                <span className="text-black dark:text-white text-sm">{playlist.name}</span>
                                {playlist.is_system && <span className="text-xs text-gray-500 ml-auto">System</span>}
                            </label>
                        ))
                    )}
                </div>

                {!showCreateForm ? (
                    <div 
                        className="p-4 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#303030] border-t border-gray-200 dark:border-[#303030] rounded-b-xl transition-colors"
                        onClick={() => setShowCreateForm(true)}
                    >
                        <AiOutlinePlus className="text-gray-500 dark:text-gray-400" />
                        <span className="text-black dark:text-white text-sm font-medium">Create new playlist</span>
                    </div>
                ) : (
                    <form onSubmit={handleCreatePlaylist} className="p-4 border-t border-gray-200 dark:border-[#303030]">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Name</label>
                        <input
                            type="text"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#121212] border-b border-gray-400 dark:border-gray-500 text-black dark:text-white text-sm p-1 mb-4 focus:outline-none focus:border-[#3ea6ff]"
                            placeholder="Enter playlist name..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                             <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!newPlaylistName.trim()}
                                className="text-sm text-[#3ea6ff] font-medium disabled:opacity-50"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SaveToPlaylistModal;
