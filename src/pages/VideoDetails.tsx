import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { AiOutlineLike, AiFillLike, AiFillDelete } from 'react-icons/ai';
import { RiShareForwardLine, RiPlayListAddLine } from "react-icons/ri";
import moment from 'moment';
import numeral from 'numeral';

import { fetchVideoDetails, searchVideos, fetchChannelDetails } from '../services/api';
import VideoCard from '../components/VideoCard';
import { type Video, type Comment } from '../types';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import SaveToPlaylistModal from '../components/SaveToPlaylistModal';

const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [videoDetail, setVideoDetail] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [channelSubscriberCount, setChannelSubscriberCount] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const onPlayerEnd = () => {
    if (relatedVideos.length > 0) {
      setCountdown(5);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      if (relatedVideos.length > 0) {
        const nextVideo = relatedVideos[0];
        const nextVideoId = typeof nextVideo.id === 'object' ? (nextVideo.id as any).videoId : nextVideo.id;
        if (nextVideoId) {
          navigate(`/video/${nextVideoId}`);
          setCountdown(null);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [countdown, relatedVideos, navigate]);

  const toggleLike = async () => {
    if (!currentUser) {
      alert("Please sign in to like videos");
      return;
    }
    if (!videoDetail?.isLocal) {
      alert("Liking YouTube videos is not supported yet (requires YouTube API OAuth)");
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('video_id', videoDetail.id);

        if (!error) {
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: currentUser.id,
            video_id: videoDetail.id
          });

        if (!error) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const toggleSubscribe = async () => {
    if (!currentUser) {
      alert("Please sign in to subscribe");
      return;
    }
    
    if (!videoDetail?.snippet?.channelId) return;

    try {
      if (isSubscribed) {
        // Unsubscribe
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('subscriber_id', currentUser.id)
          .eq('subscribed_to_id', videoDetail.snippet.channelId);

        if (!error) {
          setIsSubscribed(false);
        }
      } else {
        // Subscribe
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            subscriber_id: currentUser.id,
            subscribed_to_id: videoDetail.snippet.channelId,
            channel_name: videoDetail.snippet.channelTitle,
            channel_avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${videoDetail.snippet.channelId}`
          });

        if (!error) {
          setIsSubscribed(true);
        }
      }
    } catch (err) {
      console.error("Error toggling subscription:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        setCountdown(null); // Reset countdown on new video load
        try {
            // Check if it's a Supabase video
            const { data: supabaseData, error } = await supabase
                .from('videos')
                .select('*')
                .eq('id', id)
                .single();

            if (supabaseData && !error) {
                const video: Video = {
                    kind: 'youtube#video',
                    id: supabaseData.id,
                    snippet: {
                        publishedAt: supabaseData.created_at,
                        channelId: supabaseData.user_id,
                        title: supabaseData.title,
                        description: supabaseData.description,
                        thumbnails: {
                             default: { url: supabaseData.thumbnail_url, width: 120, height: 90 },
                             medium: { url: supabaseData.thumbnail_url, width: 320, height: 180 },
                             high: { url: supabaseData.thumbnail_url, width: 480, height: 360 }
                         },
                         channelTitle: supabaseData.user_name,
                     },
                     statistics: {
                         viewCount: supabaseData.views?.toString() || '0',
                         likeCount: supabaseData.likes?.toString() || '0',
                         favoriteCount: '0',
                          commentCount: '0'
                      },
                      isLocal: true,
                      videoUrl: supabaseData.video_url
                  } as Video;
                  setVideoDetail(video);
                  setLikeCount(parseInt(video.statistics?.likeCount || '0'));
                  
                  // Check if user liked this video
                  if (currentUser) {
                    const { data: likeData } = await supabase
                      .from('likes')
                      .select('*')
                      .eq('user_id', currentUser.id)
                      .eq('video_id', supabaseData.id)
                      .maybeSingle();
                    setIsLiked(!!likeData);

                    // Check if user is subscribed
                    const { data: subData } = await supabase
                      .from('subscriptions')
                      .select('*')
                      .eq('subscriber_id', currentUser.id)
                      .eq('subscribed_to_id', supabaseData.user_id)
                      .maybeSingle();
                    setIsSubscribed(!!subData);
                  }

                // Get channel subscriber count
                const { count: subCount, error: subError } = await supabase
                    .from('subscriptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('subscribed_to_id', supabaseData.user_id);
                
                if (subError) console.error("Error fetching subscriber count:", subError);
                
                // If subCount is 0, it returns 0 which is falsy in some checks, but we want '0' string
                setChannelSubscriberCount(subCount !== null ? subCount.toString() : '0');

                // Check if current user is subscribed
                if (currentUser) {
                    const { data: subData } = await supabase
                        .from('subscriptions')
                        .select('*')
                        .eq('subscriber_id', currentUser.id)
                        .eq('subscribed_to_id', supabaseData.user_id)
                        .maybeSingle();
                    setIsSubscribed(!!subData);
                }

                // Check if current user liked
                if (currentUser) {
                    const { data: likeData } = await supabase
                        .from('likes')
                        .select('*')
                        .eq('user_id', currentUser.id)
                        .eq('video_id', supabaseData.id)
                        .maybeSingle();
                    setIsLiked(!!likeData);
                }
                
                setLikeCount(supabaseData.likes || 0);

                // Handle View Count (Unique Views Only)
                let shouldIncrementView = false;

                if (!authLoading) {
                    if (currentUser) {
                        // Authenticated User: Check DB
                        const { data: viewData, error: viewError } = await supabase
                            .from('video_views')
                            .select('id')
                            .eq('user_id', currentUser.id)
                            .eq('video_id', supabaseData.id)
                            .maybeSingle();
                        
                        if (viewError) {
                            console.error("Error checking views:", viewError);
                        } else if (!viewData) {
                            // Try to log the view
                            const { error: insertError } = await supabase.from('video_views').insert({
                                user_id: currentUser.id,
                                video_id: supabaseData.id
                            });
                            
                            if (!insertError) {
                                // Only increment if insert succeeded (meaning it was truly unique)
                                shouldIncrementView = true;
                            } else {
                                console.error("Error inserting view:", insertError);
                            }
                        }
                    } else {
                        // Guest User: Check LocalStorage
                        const viewedVideos = JSON.parse(localStorage.getItem('viewed_videos') || '[]');
                        if (!viewedVideos.includes(supabaseData.id)) {
                            shouldIncrementView = true;
                            viewedVideos.push(supabaseData.id);
                            localStorage.setItem('viewed_videos', JSON.stringify(viewedVideos));
                        }
                    }
                }

                // Increment view count if unique
                if (shouldIncrementView) {
                    const { data: currentVideo } = await supabase
                        .from('videos')
                        .select('views')
                        .eq('id', supabaseData.id)
                        .single();

                    if (currentVideo) {
                        const newViewCount = (currentVideo.views || 0) + 1;
                        await supabase
                            .from('videos')
                            .update({ views: newViewCount })
                            .eq('id', supabaseData.id);

                        // Update local state
                        setVideoDetail(prev => {
                            if (!prev) return null;
                            return {
                                ...prev,
                                statistics: {
                                    ...(prev.statistics || {}),
                                    viewCount: newViewCount.toString(),
                                    likeCount: (prev.statistics?.likeCount || '0').toString()
                                }
                            } as Video;
                        });
                    }
                }

                setRelatedVideos([]);
                setLoading(false);
                return;
            }

            // Try fetching from YouTube
            const videoData = await fetchVideoDetails(id);
            if (videoData?.items?.length > 0) {
                const video = videoData.items[0];
                setVideoDetail(video);
                
                // Initialize local view count for YouTube video
                // We use local storage or just the API value
                // For the purpose of "dashboard" (VideoDetails page), we show the API value
                // But if you meant "dashboard" as in "Feed", that's handled in Feed.tsx
                
                setLikeCount(parseInt(video.statistics?.likeCount || '0'));
                setIsLiked(false);

                // Get YouTube channel stats
                if (video.snippet.channelId) {
                    try {
                        const channelData = await fetchChannelDetails(video.snippet.channelId);
                        if (channelData?.items?.length > 0) {
                            setChannelSubscriberCount(channelData.items[0].statistics.subscriberCount);
                        }
                    } catch (err) {
                        console.error("Error fetching channel details:", err);
                    }
                }

                // Check subscription for YouTube video
                if (currentUser && video.snippet.channelId) {
                    const { data: subData } = await supabase
                      .from('subscriptions')
                      .select('*')
                      .eq('subscriber_id', currentUser.id)
                      .eq('subscribed_to_id', video.snippet.channelId)
                      .maybeSingle();
                    setIsSubscribed(!!subData);
                }

                if (video?.snippet?.title) {
                    const relatedData = await searchVideos(video.snippet.title);
                    const filteredVideos = relatedData.items.filter((item: any) => {
                        const itemId = item.id?.videoId || item.id;
                        return itemId !== id;
                    });
                    setRelatedVideos(filteredVideos);
                }
            } else {
                setVideoDetail(null);
            }
        } catch (error) {
            console.error('Error fetching video details:', error);
            setVideoDetail(null);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id, currentUser, authLoading]);

  const fetchComments = async () => {
    try {
      // Fetch all comments for this video
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', id)
        .order('created_at', { ascending: true }); // Oldest first for thread flow

      if (error) throw error;

      if (data) {
        // Nest comments
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        // Initialize map
        data.forEach((c: any) => {
          commentMap.set(c.id, { ...c, replies: [] });
        });

        // Build tree
        data.forEach((c: any) => {
          if (c.parent_id) {
            const parent = commentMap.get(c.parent_id);
            if (parent) {
              parent.replies?.push(commentMap.get(c.id)!);
            } else {
              // Parent might have been deleted, treat as root or orphan (here root)
              rootComments.push(commentMap.get(c.id)!);
            }
          } else {
            rootComments.push(commentMap.get(c.id)!);
          }
        });

        // Reverse root comments to show newest first at top level if desired
        // But usually we want pinned first, then newest. For now just reverse.
        setComments(rootComments.reverse());
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    if (videoDetail?.id) {
        fetchComments();
    }
  }, [videoDetail?.id]);

  const handleAddComment = async (e?: React.FormEvent, parentId?: string) => {
    if (e) e.preventDefault();
    if (!currentUser) return alert("Please sign in to comment");
    if (!videoDetail) return;

    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: content,
          video_id: videoDetail.id,
          user_id: currentUser.id,
          user_name: currentUser.user_metadata.full_name || currentUser.email?.split('@')[0],
          user_avatar: currentUser.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`,
          parent_id: parentId || null
        });

      if (!error) {
        if (parentId) {
          setReplyContent("");
          setReplyingTo(null);
        } else {
          setNewComment("");
        }
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment. You might not have permission.');
        } else {
            fetchComments();
        }
    } catch (err) { 
        console.error(err);
        alert('An unexpected error occurred.');
    }
  };

  if (loading) return <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white pt-20 flex justify-center">Loading...</div>;

  if (!videoDetail) return <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white pt-20 flex justify-center">Video not found</div>;

  const {
    snippet: { title, channelTitle, description, publishedAt },
    statistics: { viewCount } = { viewCount: '0' },
  } = videoDetail;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-black dark:text-white pt-20 px-4 flex flex-col lg:flex-row gap-6 transition-colors duration-200">
      <div className="flex-1">
        <div className="w-full h-[50vh] md:h-[60vh] lg:h-[70vh] bg-gray-100 dark:bg-black relative">
          {videoDetail.videoUrl ? (
            <video 
                src={videoDetail.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
                onEnded={onPlayerEnd}
            />
          ) : (
            <YouTube
                videoId={id}
                className="w-full h-full"
                iframeClassName="w-full h-full"
                opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: 1,
                },
                }}
                onEnd={onPlayerEnd}
            />
          )}
          {countdown !== null && (
            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center text-black dark:text-white z-10 transition-colors duration-200">
              <p className="text-xl md:text-2xl font-bold mb-4">Up Next in {countdown}...</p>
              {relatedVideos.length > 0 && (
                <div className="mb-6 text-center px-4 max-w-lg">
                  <p className="text-lg font-semibold line-clamp-1">{relatedVideos[0].snippet.title}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{relatedVideos[0].snippet.channelTitle}</p>
                </div>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setCountdown(null);
                    // Optionally play the current video again or just stay here?
                    // Usually "Cancel" just hides the overlay and lets user decide.
                  }}
                  className="bg-gray-200 dark:bg-gray-600 text-black dark:text-white px-6 py-2 rounded-full font-bold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                   onClick={() => setCountdown(0)}
                   className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                   Play Now
                </button>
              </div>
            </div>
          )}
        </div>
        
        <h1 className="text-black dark:text-white text-xl md:text-2xl font-bold py-3 transition-colors duration-200">
            {title}
        </h1>

        <div className="flex justify-between flex-col md:flex-row gap-4 items-start md:items-center py-2">
            <div className="flex items-center gap-2">
                <div className="bg-gray-200 dark:bg-gray-700 w-10 h-10 rounded-full"></div>
                <div>
                    <h3 className="text-black dark:text-white font-bold flex items-center gap-1 transition-colors duration-200">
                        {channelTitle}
                        <BsFillCheckCircleFill className="text-gray-500 dark:text-gray-400 text-xs" />
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs transition-colors duration-200">
                        {channelSubscriberCount !== null ? `${numeral(channelSubscriberCount).format('0.0a').toUpperCase()} subscribers` : 'Subscriber count N/A'}
                    </p>
                </div>
                <button 
                    onClick={toggleSubscribe}
                    className={`px-4 py-2 rounded-full font-bold ml-4 transition-colors ${
                        isSubscribed 
                        ? 'bg-gray-200 dark:bg-[#272727] text-black dark:text-white hover:bg-gray-300 dark:hover:bg-[#3f3f3f]' 
                        : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                    }`}
                >
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
            </div>

            <div className="flex gap-2">
                <div 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-colors ${
                    isLiked 
                    ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' 
                    : 'bg-gray-100 dark:bg-[#222222] hover:bg-gray-200 dark:hover:bg-[#303030]'
                  }`}
                  onClick={toggleLike}
                >
                    {isLiked ? <AiFillLike size={20} /> : <AiOutlineLike size={20} />}
                    <span className="font-semibold text-sm">
                        {numeral(likeCount).format('0.0a').toUpperCase()}
                    </span>
                    <span className="border-l border-gray-400 dark:border-gray-600 pl-2 ml-1">
                        Dislike
                    </span>
                </div>
                
                <div 
                    className="bg-gray-100 dark:bg-[#222222] px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#303030] cursor-pointer font-semibold text-sm flex items-center gap-2 transition-colors duration-200"
                >
                    <RiShareForwardLine size={20} />
                    Share
                </div>

                <div 
                    onClick={() => setShowSaveModal(true)}
                    className="bg-gray-100 dark:bg-[#222222] px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#303030] cursor-pointer font-semibold text-sm flex items-center gap-2 transition-colors duration-200"
                >
                    <RiPlayListAddLine size={20} />
                    Save
                </div>
            </div>
        </div>

        <div className="bg-gray-100 dark:bg-[#222222] p-4 rounded-xl mt-4 transition-colors duration-200">
            <div className="flex gap-2 font-bold text-sm mb-2">
                <span>{numeral(viewCount).format('0,0')} views</span>
                <span>{moment(publishedAt).fromNow()}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {description}
            </p>
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">{comments.length} Comments</h3>
          
          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-4 mb-8">
            <img 
              src={currentUser?.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id || 'guest'}`} 
              alt="User" 
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"
            />
            <div className="flex-1">
              <input 
                type="text" 
                placeholder="Add a comment..." 
                className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white outline-none pb-1 text-black dark:text-white transition-colors duration-200"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                 <button 
                   type="submit" 
                   disabled={!newComment.trim()}
                   className="bg-[#3ea6ff] text-white px-4 py-2 rounded-full font-bold text-sm disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors duration-200"
                 >
                   Comment
                 </button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="flex flex-col gap-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <img 
                  src={comment.user_avatar} 
                  alt={comment.user_name} 
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-sm mr-2 text-black dark:text-white transition-colors duration-200">{comment.user_name}</span>
                      <span className="text-gray-600 dark:text-gray-400 text-xs transition-colors duration-200">{moment(comment.created_at).fromNow()}</span>
                    </div>
                    {(currentUser?.id === comment.user_id || (videoDetail?.isLocal && currentUser?.id === videoDetail.snippet.channelId)) && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-400 hover:text-red-500">
                        <AiFillDelete size={18} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm mt-1 text-black dark:text-white transition-colors duration-200">{comment.content}</p>
                  
                  {/* Reply Button */}
                  <div className="mt-2 flex items-center gap-2">
                      <button 
                        onClick={() => {
                            if (!currentUser) {
                                alert("Please sign in to reply");
                                return;
                            }
                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        }}
                        className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white uppercase transition-colors duration-200"
                      >
                        Reply
                      </button>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                      <div className="mt-3 flex gap-3">
                          <img 
                            src={currentUser?.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id}`}
                            alt="User"
                            className="w-6 h-6 rounded-full"
                          />
                          <div className="flex-1">
                              <input 
                                type="text"
                                placeholder="Add a reply..."
                                className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white outline-none pb-1 text-sm text-black dark:text-white transition-colors duration-200"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                  <button 
                                    onClick={() => setReplyingTo(null)}
                                    className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white uppercase transition-colors duration-200"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => handleAddComment(undefined, comment.id)}
                                    disabled={!replyContent.trim()}
                                    className="bg-[#3ea6ff] text-white px-3 py-1 rounded-full font-bold text-xs disabled:opacity-50"
                                  >
                                    Reply
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 space-y-4">
                          {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                  <img 
                                    src={reply.user_avatar} 
                                    alt={reply.user_name} 
                                    className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"
                                  />
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <span className="font-bold text-xs mr-2 text-black dark:text-white transition-colors duration-200">{reply.user_name}</span>
                                              <span className="text-gray-600 dark:text-gray-400 text-[10px] transition-colors duration-200">{moment(reply.created_at).fromNow()}</span>
                                          </div>
                                          {(currentUser?.id === reply.user_id || (videoDetail?.isLocal && currentUser?.id === videoDetail.snippet.channelId)) && (
                                              <button onClick={() => handleDeleteComment(reply.id)} className="text-gray-400 hover:text-red-500">
                                                  <AiFillDelete size={14} />
                                              </button>
                                          )}
                                      </div>
                                      <p className="text-sm mt-0.5 text-black dark:text-white transition-colors duration-200">{reply.content}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:w-[350px] flex flex-col gap-4">
        {relatedVideos.map((item: any) => (
             <VideoCard key={item.id.videoId || item.id} video={item} />
        ))}
      </div>

      <SaveToPlaylistModal 
        isOpen={showSaveModal} 
        onClose={() => setShowSaveModal(false)}
        video={videoDetail}
      />
    </div>
  );
};

export default VideoDetails;
