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
