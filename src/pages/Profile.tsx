import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { type Video } from '../types';
import { AiFillDelete, AiFillEdit, AiOutlineCamera } from 'react-icons/ai';
import moment from 'moment';
import numeral from 'numeral';
import EditVideoModal from '../components/EditVideoModal';
import EditChannelModal from '../components/EditChannelModal';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingChannel, setEditingChannel] = useState(false);

  useEffect(() => {
    let subSubscription: any;
    let videoSubscription: any;

    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    fetchUserVideos();
    fetchSubscriptions();
    fetchSubscriberCount();

    // Realtime subscriptions
    subSubscription = supabase
        .channel('profile_subscriptions')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'subscriptions' 
        }, (payload: any) => {
            // Check if change affects me
            if (payload.new?.subscriber_id === currentUser.id || payload.old?.subscriber_id === currentUser.id) {
                fetchSubscriptions();
            }
            if (payload.new?.subscribed_to_id === currentUser.id || payload.old?.subscribed_to_id === currentUser.id) {
                fetchSubscriberCount();
            }
        })
        .subscribe();

    videoSubscription = supabase
        .channel('profile_videos')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'videos',
            filter: `user_id=eq.${currentUser.id}`
        }, () => {
            fetchUserVideos();
        })
        .subscribe();

    return () => {
        if (subSubscription) supabase.removeChannel(subSubscription);
        if (videoSubscription) supabase.removeChannel(videoSubscription);
    };
  }, [currentUser, navigate]);

  const fetchSubscriberCount = async () => {
    const { count } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed_to_id', currentUser?.id);
    
    setSubscriberCount(count || 0);
  };

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscriber_id', currentUser?.id);
    
    if (data && !error) {
      setSubscriptions(data);
    }
  };

  const fetchUserVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', currentUser?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Map Supabase data to Video type
        const mappedVideos: Video[] = data.map((v) => ({
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
        setVideos(mappedVideos);
      }
    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      return;
    }

    try {
      // 1. Delete from storage (optional, if we want to clean up files)
      // Ideally we should delete the thumbnail and video file from storage buckets 'videos' and 'thumbnails'
      // But we need the paths. For now, let's just delete the database record which is the main requirement.
      // Supabase policies should handle allowing deletion if user owns the record.

      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .eq('user_id', currentUser?.id); // Extra safety check

      if (error) throw error;

      // Remove from local state
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video');
    }
  };

  const handleUpdateVideo = async (id: string, title: string, description: string, thumbnail: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({
            title,
            description,
            thumbnail_url: thumbnail
        })
        .eq('id', id)
        .eq('user_id', currentUser?.id); // Extra safety

      if (error) throw error;

      // Update local state
      setVideos((prev) => prev.map((v) => {
          if (v.id === id) {
              return {
                  ...v,
                  snippet: {
                      ...v.snippet,
                      title,
                      description,
                      thumbnails: {
                          ...v.snippet.thumbnails,
                          default: { ...v.snippet.thumbnails.default, url: thumbnail },
                          medium: { ...v.snippet.thumbnails.medium, url: thumbnail },
                          high: { ...v.snippet.thumbnails.high, url: thumbnail },
                      }
                  }
              };
          }
          return v;
      }));

    } catch (error) {
        console.error('Error updating video:', error);
        alert('Failed to update video');
    }
  };

  const handleSignOut = async () => {
      if(window.confirm("Are you sure you want to sign out?")) {
          await logout();
          navigate('/');
      }
  }

  if (loading) return <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white pt-20 flex justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white pt-20 px-4 md:px-8 transition-colors duration-200">
      {/* Channel Banner */}
      {currentUser?.user_metadata?.banner_url && (
        <div className="w-full h-32 md:h-52 mb-6 rounded-xl overflow-hidden relative">
          <img 
            src={currentUser.user_metadata.banner_url} 
            alt="Channel Banner" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 border-b border-gray-200 dark:border-gray-800 pb-8 transition-colors duration-200">
        <div className="relative group">
            <img 
            src={currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id}`} 
            alt="Avatar" 
            className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 object-cover"
            />
            <button 
                onClick={() => setEditingChannel(true)}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
                <AiOutlineCamera size={24} className="text-white" />
            </button>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold">{currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0]}</h1>
          <p className="text-gray-600 dark:text-gray-400">{currentUser?.email}</p>
          {currentUser?.user_metadata?.description && (
            <p className="text-gray-700 dark:text-gray-300 mt-2 max-w-2xl">{currentUser.user_metadata.description}</p>
          )}
          <div className="flex gap-4 mt-4 justify-center md:justify-start">
            <div className="text-center">
                <span className="block font-bold text-lg">{videos.length}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Videos</span>
            </div>
            <div className="text-center">
                <span className="block font-bold text-lg">{subscriptions.length}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Subscriptions</span>
            </div>
            <div className="text-center">
                <span className="block font-bold text-lg">{numeral(subscriberCount).format('0a').toUpperCase()}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Subscribers</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setEditingChannel(true)}
                className="bg-[#3ea6ff] hover:bg-[#3085cc] text-white px-6 py-2 rounded-full font-bold transition-colors"
            >
                Customize Channel
            </button>
            <button 
                onClick={handleSignOut}
                className="bg-gray-100 dark:bg-[#222222] hover:bg-gray-200 dark:hover:bg-[#303030] text-black dark:text-white px-6 py-2 rounded-full font-medium transition-colors"
            >
                Sign Out
            </button>
        </div>
      </div>

      {/* Edit Channel Modal */}
      {editingChannel && (
        <EditChannelModal
            isOpen={editingChannel}
            onClose={() => setEditingChannel(false)}
            onUpdate={() => {
                // Force reload to ensure all data is fresh
                window.location.reload();
            }}
            currentName={currentUser?.user_metadata?.full_name || ''}
            currentDescription={currentUser?.user_metadata?.description || ''}
            currentAvatar={currentUser?.user_metadata?.avatar_url || ''}
            currentBanner={currentUser?.user_metadata?.banner_url || ''}
        />
      )}

      {/* Videos Grid */}
      <h2 className="text-xl font-bold mb-4">Your Videos</h2>
      
      {videos.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10 mb-10">
            <p>You haven't uploaded any videos yet.</p>
            <button 
                onClick={() => navigate('/upload')}
                className="mt-4 text-[#3ea6ff] hover:underline"
            >
                Upload your first video
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
            {videos.map((video) => (
                <div key={video.id} className="group relative bg-gray-100 dark:bg-[#1e1e1e] rounded-xl overflow-hidden hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors">
                    {/* Video Thumbnail */}
                    <div 
                        className="aspect-video relative cursor-pointer"
                        onClick={() => navigate(`/video/${video.id}`)}
                    >
                        <img 
                            src={video.snippet.thumbnails.high.url} 
                            alt={video.snippet.title} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>

                    {/* Video Info */}
                    <div className="p-3">
                        <h3 
                            className="font-bold text-sm line-clamp-2 mb-1 cursor-pointer hover:text-[#3ea6ff] text-black dark:text-white"
                            onClick={() => navigate(`/video/${video.id}`)}
                        >
                            {video.snippet.title}
                        </h3>
                        <div className="text-xs text-gray-600 dark:text-gray-400 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span>{numeral(video.statistics?.viewCount).format('0.0a').toUpperCase()} views</span>
                                <span>{moment(video.snippet.publishedAt).fromNow()}</span>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button 
                                    onClick={() => setEditingVideo(video)}
                                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                                    title="Edit Video"
                                >
                                    <AiFillEdit size={16} />
                                    <span>Edit</span>
                                </button>
                                <button 
                                    onClick={() => handleDeleteVideo(video.id)}
                                    className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                    title="Delete Video"
                                >
                                    <AiFillDelete size={16} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Edit Video Modal */}
      {editingVideo && (
        <EditVideoModal
            isOpen={!!editingVideo}
            onClose={() => setEditingVideo(null)}
            onSave={handleUpdateVideo}
            video={{
                id: editingVideo.id,
                title: editingVideo.snippet.title,
                description: editingVideo.snippet.description,
                thumbnail: editingVideo.snippet.thumbnails.high.url
            }}
        />
      )}

      {/* Subscriptions Grid */}
      <h2 className="text-xl font-bold mb-4">Your Subscriptions</h2>
      {subscriptions.length === 0 ? (
         <div className="text-center text-gray-500 dark:text-gray-400 py-10">
            <p>You haven't subscribed to any channels yet.</p>
         </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {subscriptions.map((sub) => (
                <div key={sub.id} className="flex flex-col items-center bg-gray-100 dark:bg-[#1e1e1e] p-4 rounded-xl hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                    <img 
                        src={sub.channel_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.subscribed_to_id}`} 
                        alt={sub.channel_name} 
                        className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 mb-3 object-cover"
                    />
                    <h3 className="font-bold text-center text-sm line-clamp-1 text-black dark:text-white">{sub.channel_name}</h3>
                    <button className="mt-3 text-xs bg-gray-300 dark:bg-[#272727] text-black dark:text-white px-3 py-1 rounded-full font-medium">Subscribed</button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
