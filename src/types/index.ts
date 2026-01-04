export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

export interface Snippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: Thumbnail;
    medium: Thumbnail;
    high: Thumbnail;
    standard?: Thumbnail;
    maxres?: Thumbnail;
  };
  channelTitle: string;
  categoryId?: string;
  liveBroadcastContent?: string;
}

export interface VideoStatistics {
  viewCount: string;
  likeCount: string;
  favoriteCount: string;
  commentCount: string;
}

export interface Video {
  kind: string;
  id: string;
  snippet: Snippet;
  statistics?: VideoStatistics;
  videoUrl?: string;
  isLocal?: boolean;
}

export interface Comment {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  video_id: string;
  parent_id?: string | null;
  replies?: Comment[]; // For UI nesting
}

export interface SearchResult {
  kind: string;
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: Snippet;
}

export interface ChannelStatistics {
  viewCount: string;
  subscriberCount: string;
  hiddenSubscriberCount: boolean;
  videoCount: string;
}

export interface Channel {
  kind: string;
  id: string;
  snippet: Snippet;
  statistics: ChannelStatistics;
}

export interface VideoResponse {
  kind: string;
  etag: string;
  items: Video[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface SearchResponse {
  kind: string;
  etag: string;
  items: SearchResult[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  item_count?: number; // Optional count from join
  thumbnail_url?: string; // Optional thumbnail from first item
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  video_id: string;
  video_source: 'local' | 'youtube';
  added_at: string;
  metadata: {
    title: string;
    thumbnail_url: string;
    channel_title: string;
    duration?: string;
  };
}
