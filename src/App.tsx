import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Feed from './pages/Feed';
import VideoDetails from './pages/VideoDetails';
import SearchFeed from './pages/SearchFeed';
import { SidebarProvider } from './context/SidebarContext';

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="bg-[#0f0f0f] min-h-screen text-white">
          <Header />
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/video/:id" element={<VideoDetails />} />
            <Route path="/search/:searchTerm" element={<SearchFeed />} />
          </Routes>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
