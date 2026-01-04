import { useState, useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

interface EditVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, title: string, description: string, thumbnail: string) => Promise<void>;
  video: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
  };
}

const EditVideoModal: React.FC<EditVideoModalProps> = ({ isOpen, onClose, onSave, video }) => {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [thumbnail, setThumbnail] = useState(video.thumbnail);
  const [saving, setSaving] = useState(false);

  // Update local state when video prop changes
  useEffect(() => {
    setTitle(video.title);
    setDescription(video.description);
    setThumbnail(video.thumbnail);
  }, [video]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(video.id, title, description, thumbnail);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl w-full max-w-lg p-6 relative shadow-2xl border border-gray-200 dark:border-[#303030] transition-colors duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <AiOutlineClose size={24} />
        </button>

        <h2 className="text-xl font-bold mb-6 text-black dark:text-white">Edit Video</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0f0f0f] border border-gray-300 dark:border-[#303030] rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-[#3ea6ff]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0f0f0f] border border-gray-300 dark:border-[#303030] rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-[#3ea6ff] h-32 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Thumbnail URL</label>
            <input
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0f0f0f] border border-gray-300 dark:border-[#303030] rounded-lg p-3 text-black dark:text-white focus:outline-none focus:border-[#3ea6ff]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#3ea6ff] hover:bg-[#3ea6ff]/90 text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVideoModal;
