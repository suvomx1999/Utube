import axios from 'axios';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('YouTube API Key is missing or invalid. Please check your .env file.');
}

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const api = axios.create({
  baseURL: BASE_URL,
  params: {
    key: API_KEY,
  },
});

export const fetchTrendingVideos = async (pageToken: string = '') => {
  const response = await api.get('/videos', {
    params: {
      part: 'snippet,contentDetails,statistics',
      chart: 'mostPopular',
      regionCode: 'US',
      maxResults: 20,
      pageToken,
    },
  });
  return response.data;
};

export const fetchVideosByCategory = async (categoryId: string, pageToken: string = '') => {
    const response = await api.get('/videos', {
      params: {
        part: 'snippet,contentDetails,statistics',
        chart: 'mostPopular',
        regionCode: 'US',
        videoCategoryId: categoryId,
        maxResults: 20,
        pageToken,
      },
    });
    return response.data;
  };

export const searchVideos = async (query: string, pageToken: string = '') => {
  const response = await api.get('/search', {
    params: {
      part: 'snippet',
      q: query,
      maxResults: 20,
      pageToken,
      type: 'video',
    },
  });
  return response.data;
};

export const fetchVideoDetails = async (id: string) => {
  const response = await api.get('/videos', {
    params: {
      part: 'snippet,contentDetails,statistics',
      id,
    },
  });
  return response.data;
};

export const fetchChannelDetails = async (id: string) => {
  const response = await api.get('/channels', {
    params: {
      part: 'snippet,statistics',
      id,
    },
  });
  return response.data;
};

export const fetchVideoComments = async (id: string) => {
    const response = await api.get('/commentThreads', {
        params: {
            part: 'snippet',
            videoId: id,
            maxResults: 20,
        }
    })
    return response.data
}
