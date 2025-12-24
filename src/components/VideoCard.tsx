import React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import numeral from 'numeral';
import { type Video } from '../types';
import { RxAvatar } from 'react-icons/rx';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const {
    id,
    snippet: {
      channelId,
      channelTitle,
      title,
      publishedAt,
      thumbnails: { high },
    },
    statistics,
  } = video;

  const videoId = typeof id === 'object' ? (id as any).videoId : id;

  // If it's not a video (e.g. channel), we might want to skip or render differently
  // But for now let's assume we filter only videos or handle it
  if (!videoId) return null;

  return (
    <div className="flex flex-col gap-2 cursor-pointer">
      <Link to={`/video/${videoId}`}>
        <div className="relative rounded-xl overflow-hidden aspect-video">
          <img
            src={high.url}
            alt={title}
            className="h-full w-full object-cover hover:scale-105 transition-transform duration-200"
          />
        </div>
      </Link>
      
      <div className="flex gap-3 mt-2">
        <div className="flex-shrink-0">
             {/* We don't have channel avatar in video response usually, so using a placeholder or we'd need another API call. 
                 For list views, usually we don't fetch channel avatar for every video to save quota. */}
            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center">
                 <RxAvatar size={24} />
            </div>
        </div>
        
        <div className="flex flex-col">
          <Link to={`/video/${videoId}`}>
            <h3 className="text-white text-sm font-bold line-clamp-2 leading-tight">
              {title}
            </h3>
          </Link>
          
          <Link to={`/channel/${channelId}`} className="text-[#AAAAAA] text-xs mt-1 hover:text-white">
            {channelTitle}
          </Link>
          
          <div className="flex items-center text-[#AAAAAA] text-xs">
            <span>
              {statistics?.viewCount ? numeral(statistics.viewCount).format('0.0a').toUpperCase() : '0'} views
            </span>
            <span className="mx-1">•</span>
            <span>{moment(publishedAt).fromNow()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
