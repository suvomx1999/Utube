# Utube - Full Stack YouTube Clone

A fully functional, full-stack YouTube clone built with React, TypeScript, Tailwind CSS, and powered by Supabase for backend services (Auth, Database, Storage).

## 🚀 Features

### Core Experience
-   **Video Playback**: Watch videos with a custom player interface.
-   **Infinite Feed**: Browse trending videos with infinite scrolling.
-   **Search**: Search for videos by title or keywords.
-   **Related Videos**: Smart recommendations based on current video.
-   **Responsive Design**: Fully responsive layout for desktop, tablet, and mobile.
-   **Dark/Light Mode**: Seamless theme switching with persistence.

### User & Authentication
-   **Authentication**: Secure Google Login and Email/Password auth via Supabase.
-   **User Profile**: dedicated profile page to manage your channel.
-   **Channel Customization**: Update your channel avatar and banner.

### Content Creation
-   **Video Upload**: Upload video files and thumbnails directly to Supabase Storage.
-   **Video Management**: Edit video details or delete your uploaded videos.
-   **View Tracking**: Unique view counting system (1 view per user per video).

### Interactions
-   **Like/Dislike System**: Real-time like and dislike functionality.
-   **Subscriptions**: Subscribe to channels and see their content in your feed.
-   **Comments**: Post comments on videos. Video owners can delete any comment on their videos.
-   **Playlists**: Create and manage custom playlists.
-   **Watch Later**: Save videos to watch later.
-   **Watch History**: Automatically tracks your viewing history.

## 🛠 Tech Stack

-   **Frontend**: React 18, Vite, TypeScript
-   **Styling**: Tailwind CSS, React Icons
-   **Backend**: Supabase (PostgreSQL)
-   **Auth**: Supabase Auth (OAuth & JWT)
-   **Storage**: Supabase Storage (Videos & Images)
-   **Database**: PostgreSQL with Row Level Security (RLS)
-   **Routing**: React Router DOM v6
-   **State Management**: React Context API

## 📋 Prerequisites

-   Node.js (v16 or higher)
-   npm or yarn
-   A Supabase project (Free tier works perfectly)
-   YouTube Data API Key (for fetching external content if enabled)

## ⚙️ Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/suvomx1999/Utube.git
    cd Utube
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory and add your keys:
    ```env
    VITE_YOUTUBE_API_KEY=your_youtube_api_key
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup:**
    Run the SQL scripts provided in the repository (or via Supabase dashboard) to set up tables for:
    -   `videos`
    -   `profiles`
    -   `comments`
    -   `likes`
    -   `subscriptions`
    -   `playlists`
    -   `video_views`

5.  **Run the application:**
    ```bash
    npm run dev
    ```

## 🚀 Deployment (Vercel)

This project is optimized for deployment on Vercel.

1.  Push your code to GitHub.
2.  Import the project in Vercel.
3.  Add the Environment Variables in Vercel Project Settings:
    -   `VITE_YOUTUBE_API_KEY`
    -   `VITE_SUPABASE_URL`
    -   `VITE_SUPABASE_ANON_KEY`
4.  Deploy!

## 📂 Project Structure

```
src/
├── components/       # UI Components (Sidebar, VideoCard, Modals, etc.)
├── context/          # Global State (AuthContext, ThemeContext)
├── pages/            # App Pages (Feed, VideoDetails, Upload, Profile, etc.)
├── services/         # API & Supabase Service functions
├── types/            # TypeScript Interfaces
├── utils/            # Helper functions
├── App.tsx           # Main Router Setup
└── main.tsx          # Entry Point
```

## 📄 License

MIT
