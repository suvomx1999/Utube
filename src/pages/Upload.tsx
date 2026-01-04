import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { AiOutlineCloudUpload } from 'react-icons/ai';

const Upload = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  // Fixed unused variables
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !title) {
      setError('Please select a video and add a title');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload Video to Supabase Storage
      const videoFileName = `videos/${Date.now()}_${videoFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (videoError) throw videoError;

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(videoFileName);

      // 2. Upload Thumbnail (if exists)
      let thumbnailUrl = 'https://via.placeholder.com/320x180?text=No+Thumbnail';
      if (thumbnailFile) {
        const thumbnailFileName = `thumbnails/${Date.now()}_${thumbnailFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const { error: thumbError } = await supabase.storage
          .from('videos') // reusing videos bucket or create 'thumbnails' bucket
          .upload(thumbnailFileName, thumbnailFile);
        
        if (thumbError) throw thumbError;

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(thumbnailFileName);
        
        thumbnailUrl = publicUrl;
      }

      // 3. Save Metadata to Supabase Database
      const { data: insertData, error: insertError } = await supabase
        .from('videos')
        .insert([
          {
            title,
            description,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            user_id: currentUser?.id,
            user_name: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User',
            user_avatar: currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture,
            views: 0,
            likes: 0
          }
        ])
        .select();

      if (insertError) throw insertError;

      setLoading(false);
      if (insertData && insertData[0]) {
        navigate(`/video/${insertData[0].id}`);
      } else {
        navigate('/');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center p-8 bg-gray-50 dark:bg-[#0f0f0f] min-h-[calc(100vh-56px)] transition-colors duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1e1e] p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-none transition-colors duration-200">
        <h1 className="text-2xl font-bold text-black dark:text-white mb-6">Upload Video</h1>
        
        {error && <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-gray-600 dark:text-gray-400 mb-2">Video File</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer relative bg-gray-50 dark:bg-transparent">
              <input 
                type="file" 
                accept="video/*" 
                onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <AiOutlineCloudUpload size={40} className="text-gray-400 mb-2" />
                <span className="text-gray-500 dark:text-gray-300">
                  {videoFile ? videoFile.name : 'Drag and drop or click to select video'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-600 dark:text-gray-400 mb-2">Thumbnail (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-gray-50 dark:bg-[#2a2a2a] text-black dark:text-white p-2 rounded border border-gray-300 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-600 dark:text-gray-400 mb-2">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title"
              className="w-full bg-gray-50 dark:bg-[#2a2a2a] text-black dark:text-white p-3 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 dark:text-gray-400 mb-2">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video"
              rows={4}
              className="w-full bg-gray-50 dark:bg-[#2a2a2a] text-black dark:text-white p-3 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {loading && (
            <div className="w-full text-center mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Uploading video... Please wait.</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-full font-medium ${loading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {loading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
