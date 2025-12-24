import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineMenu, AiOutlineSearch } from 'react-icons/ai';
import { BsYoutube, BsMicFill, BsBell, BsCameraVideo } from 'react-icons/bs';
import { RxAvatar } from 'react-icons/rx';
import { useSidebar } from '../context/SidebarContext';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search/${searchQuery}`);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-14 bg-[#0f0f0f] flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-zinc-800 rounded-full cursor-pointer"
        >
          <AiOutlineMenu size={20} />
        </button>
        <div 
            className="flex items-center gap-1 cursor-pointer" 
            onClick={() => navigate('/')}
        >
          <BsYoutube size={30} className="text-red-600" />
          <span className="text-xl font-bold tracking-tighter">Utube</span>
        </div>
      </div>

      <form 
        onSubmit={handleSearch}
        className="hidden md:flex items-center w-[40%] max-w-[600px]"
      >
        <div className="flex w-full items-center">
            <div className="flex w-full items-center rounded-l-full border border-[#303030] bg-[#121212] overflow-hidden focus-within:border-blue-500 ml-8">
                <input
                type="text"
                placeholder="Search"
                className="w-full bg-transparent px-4 py-2 outline-none text-white placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button className="px-5 py-2 bg-[#222222] border border-l-0 border-[#303030] rounded-r-full hover:bg-[#303030]">
            <AiOutlineSearch size={24} />
            </button>
        </div>
        <button type="button" className="ml-4 p-2 bg-[#181818] rounded-full hover:bg-[#303030]">
            <BsMicFill size={20} />
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="md:hidden">
            <AiOutlineSearch size={24} />
        </div>
        <div className="hidden md:block p-2 hover:bg-zinc-800 rounded-full cursor-pointer">
            <BsCameraVideo size={20} />
        </div>
        <div className="hidden md:block p-2 hover:bg-zinc-800 rounded-full cursor-pointer">
            <BsBell size={20} />
        </div>
        <div className="p-2 cursor-pointer">
            <RxAvatar size={30} />
        </div>
      </div>
    </div>
  );
};

export default Header;
