import { AiFillHome } from 'react-icons/ai';
import { MdOutlineExplore, MdOutlineSubscriptions, MdOutlineVideoLibrary } from 'react-icons/md';
import { IoGameControllerSharp } from 'react-icons/io5';
import { FaMusic } from 'react-icons/fa';
import { GiTrophyCup } from 'react-icons/gi';
import { BiNews } from 'react-icons/bi';

export const categories = [
  { name: 'All', icon: <AiFillHome /> },
  { name: 'Music', icon: <FaMusic /> },
  { name: 'Gaming', icon: <IoGameControllerSharp /> },
  { name: 'News', icon: <BiNews /> },
  { name: 'Sports', icon: <GiTrophyCup /> },
  { name: 'Learning', icon: <MdOutlineVideoLibrary /> },
  { name: 'Live', icon: <MdOutlineExplore /> },
  { name: 'Fashion', icon: <MdOutlineSubscriptions /> },
  { name: 'Beauty', icon: <MdOutlineSubscriptions /> },
  { name: 'Comedy', icon: <MdOutlineSubscriptions /> },
  { name: 'Gym', icon: <GiTrophyCup /> },
  { name: 'Crypto', icon: <MdOutlineVideoLibrary /> },
];
