import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Feed from './pages/Feed';
import VideoDetails from './pages/VideoDetails';
import SearchFeed from './pages/SearchFeed';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import History from './pages/History';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import { SidebarProvider } from './context/SidebarContext';

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="bg-white dark:bg-[#0f0f0f] min-h-screen text-black dark:text-white transition-colors duration-200">
          <Header />
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/video/:id" element={<VideoDetails />} />
            <Route path="/search/:searchTerm" element={<SearchFeed />} />
            <Route path="/login" element={<Login />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<History />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlist/:id" element={<PlaylistDetail />} />
          </Routes>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
