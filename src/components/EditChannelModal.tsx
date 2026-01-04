import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { AiOutlineClose, AiOutlineCloudUpload } from 'react-icons/ai';

interface EditChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    currentName: string;
    currentDescription: string;
    currentAvatar: string;
    currentBanner: string;
}

const EditChannelModal: React.FC<EditChannelModalProps> = ({ 
    isOpen, onClose, onUpdate, currentName, currentDescription, currentAvatar, currentBanner 
}) => {
    const { currentUser } = useAuth();
    const [name, setName] = useState(currentName);
    const [description, setDescription] = useState(currentDescription);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !currentUser) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'avatar') setAvatarFile(e.target.files[0]);
            else setBannerFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file: File, bucket: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let avatarUrl = currentAvatar;
            let bannerUrl = currentBanner;

            if (avatarFile) {
                avatarUrl = await uploadFile(avatarFile, 'avatars');
            }

            if (bannerFile) {
                bannerUrl = await uploadFile(bannerFile, 'banners');
            }

            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: name,
                    description: description,
                    avatar_url: avatarUrl,
                    banner_url: bannerUrl
                }
            });

            if (error) throw error;

            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error updating channel:', error);
            alert(`Failed to update channel: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-colors duration-200" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#212121] rounded-xl w-full max-w-lg relative shadow-2xl border border-gray-200 dark:border-[#303030] flex flex-col max-h-[90vh] transition-colors duration-200" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#303030] transition-colors">
                    <h2 className="text-black dark:text-white text-xl font-bold transition-colors">Customize Channel</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                        <AiOutlineClose size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {/* Banner Upload */}
                        <div>
                            <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2 transition-colors">Channel Banner</label>
                            <div className="relative w-full h-32 bg-gray-50 dark:bg-[#121212] rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden group transition-colors">
                                {(bannerFile ? URL.createObjectURL(bannerFile) : currentBanner) ? (
                                    <img 
                                        src={bannerFile ? URL.createObjectURL(bannerFile) : currentBanner} 
                                        alt="Banner Preview" 
                                        className="w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity"
                                    />
                                ) : (
                                    <div className="text-gray-400 dark:text-gray-500 flex flex-col items-center transition-colors">
                                        <AiOutlineCloudUpload size={24} />
                                        <span className="text-xs mt-1">Upload Banner</span>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'banner')}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-black dark:text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                                        Change Banner
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Avatar Upload */}
                        <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 rounded-full bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-gray-600 overflow-hidden group flex-shrink-0 transition-colors">
                                <img 
                                    src={avatarFile ? URL.createObjectURL(avatarFile) : (currentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`)} 
                                    alt="Avatar Preview" 
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity"
                                />
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'avatar')}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <AiOutlineCloudUpload className="text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-black dark:text-white font-bold transition-colors">Profile Picture</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-xs transition-colors">Recommended: 98x98 px, PNG or GIF.</p>
                            </div>
                        </div>

                        {/* Text Inputs */}
                        <div>
                            <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2 transition-colors">Channel Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#303030] rounded p-2 text-black dark:text-white outline-none focus:border-[#3ea6ff] transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2 transition-colors">Description</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#303030] rounded p-2 text-black dark:text-white outline-none focus:border-[#3ea6ff] h-24 resize-none transition-colors"
                                placeholder="Tell viewers about your channel..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#303030] transition-colors">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="bg-[#3ea6ff] text-white px-6 py-2 rounded-full font-bold hover:bg-[#3ea6ff]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditChannelModal;
