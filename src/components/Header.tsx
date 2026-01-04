import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineMenu, AiOutlineSearch } from 'react-icons/ai';
import { BsYoutube, BsMicFill, BsBell, BsCameraVideo, BsMoon, BsSun } from 'react-icons/bs';
import { RxAvatar } from 'react-icons/rx';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search/${searchQuery}`);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-14 bg-white dark:bg-[#0f0f0f] flex items-center justify-between px-4 z-50 border-b border-gray-200 dark:border-transparent transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full cursor-pointer text-black dark:text-white transition-colors"
        >
          <AiOutlineMenu size={20} />
        </button>
        <div 
            className="flex items-center gap-1 cursor-pointer" 
            onClick={() => navigate('/')}
        >
          <BsYoutube size={30} className="text-red-600" />
          <span className="text-xl font-bold tracking-tighter text-black dark:text-white transition-colors">Utube</span>
        </div>
      </div>

      <form 
        onSubmit={handleSearch}
        className="hidden md:flex items-center w-[40%] max-w-[600px]"
      >
        <div className="flex w-full items-center">
            <div className="flex w-full items-center rounded-l-full border border-gray-300 dark:border-[#303030] bg-gray-100 dark:bg-[#121212] overflow-hidden focus-within:border-blue-500 ml-8 transition-colors">
                <input
                type="text"
                placeholder="Search"
                className="w-full bg-transparent px-4 py-2 outline-none text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button className="px-5 py-2 bg-gray-200 dark:bg-[#222222] border border-l-0 border-gray-300 dark:border-[#303030] rounded-r-full hover:bg-gray-300 dark:hover:bg-[#303030] text-black dark:text-white transition-colors">
            <AiOutlineSearch size={24} />
            </button>
        </div>
        <button type="button" className="ml-4 p-2 bg-gray-100 dark:bg-[#181818] rounded-full hover:bg-gray-200 dark:hover:bg-[#303030] text-black dark:text-white transition-colors">
            <BsMicFill size={20} />
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="md:hidden text-black dark:text-white transition-colors">
            <AiOutlineSearch size={24} />
        </div>

        <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full cursor-pointer text-black dark:text-white transition-colors"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
            {theme === 'dark' ? <BsSun size={20} /> : <BsMoon size={20} />}
        </button>
        
        {currentUser ? (
          <>
            <div 
              className="hidden md:block p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full cursor-pointer text-black dark:text-white transition-colors"
              onClick={() => navigate('/upload')}
              title="Upload Video"
            >
                <BsCameraVideo size={20} />
            </div>
            <div className="hidden md:block p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full cursor-pointer text-black dark:text-white transition-colors">
                <BsBell size={20} />
            </div>
            <div 
              className="p-1 cursor-pointer ml-2" 
              onClick={() => navigate('/profile')}
              title="Your Profile"
            >
                <img 
                  src={currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`} 
                  alt="User" 
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" 
                />
            </div>
          </>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-3 py-1.5 border border-[#3ea6ff] text-[#3ea6ff] rounded-full hover:bg-blue-50 dark:hover:bg-[#263850] ml-2 transition-colors"
          >
            <RxAvatar size={24} />
            <span className="font-medium text-sm">Sign in</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
