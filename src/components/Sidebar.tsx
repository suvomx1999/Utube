import React from 'react';
import { categories } from '../utils/constants';
import { useSidebar } from '../context/SidebarContext';

interface SidebarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedCategory, setSelectedCategory }) => {
  const { isSidebarOpen } = useSidebar();

  if (!isSidebarOpen) return null;

  return (
    <div className="fixed top-14 left-0 w-60 h-[calc(100vh-56px)] bg-[#0f0f0f] overflow-y-auto pb-4 custom-scrollbar hidden md:block z-40">
      <div className="flex flex-col px-3 mt-4">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`flex items-center gap-5 px-3 py-2 rounded-lg mb-1 transition-colors ${
              selectedCategory === category.name
                ? 'bg-[#272727] text-white font-medium'
                : 'text-white hover:bg-[#272727]'
            }`}
          >
            <span className="text-xl">{category.icon}</span>
            <span className="text-sm truncate">{category.name}</span>
          </button>
        ))}
      </div>
      <div className="border-t border-[#303030] my-3 mx-4" />
      <div className="px-6 py-2">
        <p className="text-xs text-[#AAAAAA]">
          About Press Copyright Contact us Creators Advertise Developers
        </p>
        <p className="text-xs text-[#AAAAAA] mt-2">
          Terms Privacy Policy & Safety How Utube works Test new features
        </p>
        <p className="text-xs text-[#717171] mt-4">
          © 2024 Utube LLC
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
