import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categories } from '../utils/constants';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { FaHistory } from 'react-icons/fa';
import { MdPlaylistPlay, MdWatchLater } from 'react-icons/md';

interface SidebarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

interface Subscription {
  id: string;
  subscribed_to_id: string;
  channel_name: string;
  channel_avatar: string;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedCategory, setSelectedCategory }) => {
  const { isSidebarOpen } = useSidebar();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [watchLaterId, setWatchLaterId] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any;

    if (currentUser) {
      const fetchSubscriptions = async () => {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('subscriber_id', currentUser.id);
        
        if (data && !error) {
          setSubscriptions(data);
        }
      };
      
      const fetchWatchLater = async () => {
        const { data } = await supabase
            .from('playlists')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('is_system', true)
            .eq('name', 'Watch Later')
            .maybeSingle();
        if (data) setWatchLaterId(data.id);
      };

      fetchSubscriptions();
      fetchWatchLater();

      // Subscribe to realtime changes
      subscription = supabase
        .channel('subscriptions_channel')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'subscriptions',
          filter: `subscriber_id=eq.${currentUser.id}`
        }, (payload) => {
            console.log('Subscription change received!', payload);
            fetchSubscriptions();
        })
        .subscribe();

    } else {
      setSubscriptions([]);
    }

    return () => {
        if (subscription) {
            supabase.removeChannel(subscription);
        }
    };
  }, [currentUser]);

  if (!isSidebarOpen) return null;

  return (
    <div className="fixed top-14 left-0 w-60 h-[calc(100vh-56px)] bg-white dark:bg-[#0f0f0f] overflow-y-auto pb-4 custom-scrollbar hidden md:block z-40 transition-colors duration-200">
      <div className="flex flex-col px-3 mt-4">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => {
                if (category.name === 'History') {
                    navigate('/history');
                } else {
                    setSelectedCategory(category.name);
                    navigate('/');
                }
            }}
            className={`flex items-center gap-5 px-3 py-2 rounded-lg mb-1 transition-colors ${
              selectedCategory === category.name
                ? 'bg-gray-200 dark:bg-[#272727] text-black dark:text-white font-medium'
                : 'text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#272727]'
            }`}
          >
            <span className="text-xl">{category.icon}</span>
            <span className="text-sm truncate">{category.name}</span>
          </button>
        ))}
        {currentUser && (
            <>
                <button
                    onClick={() => navigate('/history')}
                    className="flex items-center gap-5 px-3 py-2 rounded-lg mb-1 transition-colors text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#272727]"
                >
                    <span className="text-xl"><FaHistory /></span>
                    <span className="text-sm truncate">History</span>
                </button>
                <button
                    onClick={() => navigate('/playlists')}
                    className="flex items-center gap-5 px-3 py-2 rounded-lg mb-1 transition-colors text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#272727]"
                >
                    <span className="text-xl"><MdPlaylistPlay /></span>
                    <span className="text-sm truncate">Playlists</span>
                </button>
                <button
                    onClick={() => watchLaterId ? navigate(`/playlist/${watchLaterId}`) : navigate('/playlists')}
                    className="flex items-center gap-5 px-3 py-2 rounded-lg mb-1 transition-colors text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#272727]"
                >
                    <span className="text-xl"><MdWatchLater /></span>
                    <span className="text-sm truncate">Watch Later</span>
                </button>
            </>
        )}
      </div>
      <div className="border-t border-gray-200 dark:border-[#303030] my-3 mx-4 transition-colors" />

      {currentUser && subscriptions.length > 0 && (
        <>
          <div className="px-4 py-2">
            <h3 className="text-base font-bold mb-2 px-2 text-black dark:text-white">Subscriptions</h3>
            {subscriptions.map((sub) => (
              <div 
                key={sub.id} 
                className="flex items-center gap-4 px-2 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#272727] cursor-pointer transition-colors"
              >
                <img 
                  src={sub.channel_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.subscribed_to_id}`} 
                  alt={sub.channel_name} 
                  className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"
                />
                <span className="text-sm truncate text-black dark:text-white">{sub.channel_name}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-[#303030] my-3 mx-4 transition-colors" />
        </>
      )}

      <div className="px-6 py-2">
        <p className="text-xs text-[#606060] dark:text-[#AAAAAA]">
          About Press Copyright Contact us Creators Advertise Developers
        </p>
        <p className="text-xs text-[#606060] dark:text-[#AAAAAA] mt-2">
          Terms Privacy Policy & Safety How Utube works Test new features
        </p>
        <p className="text-xs text-[#606060] dark:text-[#717171] mt-4">
          © 2025 Utube LLC Made with ❤️ by suvo
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
