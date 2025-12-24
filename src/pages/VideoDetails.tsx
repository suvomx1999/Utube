import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { AiOutlineLike } from 'react-icons/ai';
import moment from 'moment';
import numeral from 'numeral';

import { fetchVideoDetails, searchVideos } from '../services/api';
import VideoCard from '../components/VideoCard';
import { type Video } from '../types';

const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [videoDetail, setVideoDetail] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        setCountdown(null); // Reset countdown on new video load
        try {
            const videoData = await fetchVideoDetails(id);
            const video = videoData.items[0];
            setVideoDetail(video);

            if (video?.snippet?.title) {
                const relatedData = await searchVideos(video.snippet.title);
                const filteredVideos = relatedData.items.filter((item: any) => {
                    const itemId = item.id?.videoId || item.id;
                    return itemId !== id;
                });
                setRelatedVideos(filteredVideos);
            }
        } catch (error) {
            console.error('Error fetching video details:', error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 flex justify-center">Loading...</div>;

  if (!videoDetail) return <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 flex justify-center">Video not found</div>;

  const {
    snippet: { title, channelTitle, description, publishedAt },
    statistics: { viewCount, likeCount } = { viewCount: '0', likeCount: '0' },
  } = videoDetail;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 px-4 flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div className="w-full h-[50vh] md:h-[60vh] lg:h-[70vh] bg-black relative">
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
          {countdown !== null && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-10">
              <p className="text-xl md:text-2xl font-bold mb-4">Up Next in {countdown}...</p>
              {relatedVideos.length > 0 && (
                <div className="mb-6 text-center px-4 max-w-lg">
                  <p className="text-lg font-semibold line-clamp-1">{relatedVideos[0].snippet.title}</p>
                  <p className="text-gray-400 text-sm">{relatedVideos[0].snippet.channelTitle}</p>
                </div>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setCountdown(null);
                    // Optionally play the current video again or just stay here?
                    // Usually "Cancel" just hides the overlay and lets user decide.
                  }}
                  className="bg-gray-600 text-white px-6 py-2 rounded-full font-bold hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                   onClick={() => setCountdown(0)}
                   className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors"
                >
                   Play Now
                </button>
              </div>
            </div>
          )}
        </div>
        
        <h1 className="text-white text-xl md:text-2xl font-bold py-3">
            {title}
        </h1>

        <div className="flex justify-between flex-col md:flex-row gap-4 items-start md:items-center py-2">
            <div className="flex items-center gap-2">
                <div className="bg-gray-700 w-10 h-10 rounded-full"></div>
                <div>
                    <h3 className="text-white font-bold flex items-center gap-1">
                        {channelTitle}
                        <BsFillCheckCircleFill className="text-gray-400 text-xs" />
                    </h3>
                    <p className="text-gray-400 text-xs">Subscriber count N/A</p>
                </div>
                <button className="bg-white text-black px-4 py-2 rounded-full font-bold ml-4 hover:bg-gray-200">
                    Subscribe
                </button>
            </div>

            <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-[#222222] px-4 py-2 rounded-full hover:bg-[#303030] cursor-pointer">
                    <AiOutlineLike size={20} />
                    <span className="font-semibold text-sm">
                        {numeral(likeCount).format('0.0a').toUpperCase()}
                    </span>
                    <span className="border-l border-gray-600 pl-2 ml-1">
                        Dislike
                    </span>
                </div>
                <div className="bg-[#222222] px-4 py-2 rounded-full hover:bg-[#303030] cursor-pointer font-semibold text-sm">
                    Share
                </div>
            </div>
        </div>

        <div className="bg-[#222222] p-4 rounded-xl mt-4">
            <div className="flex gap-2 font-bold text-sm mb-2">
                <span>{numeral(viewCount).format('0,0')} views</span>
                <span>{moment(publishedAt).fromNow()}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {description}
            </p>
        </div>

        {/* Comments Section could go here */}
      </div>

      <div className="lg:w-[350px] flex flex-col gap-4">
        {relatedVideos.map((item: any) => (
             <VideoCard key={item.id.videoId || item.id} video={item} />
        ))}
      </div>
    </div>
  );
};

export default VideoDetails;
