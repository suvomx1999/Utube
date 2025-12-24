# Utube

A responsive YouTube clone built with React, TypeScript, Vite, and Tailwind CSS using the YouTube Data API v3.

## Features

- **Home Page**: Displays trending videos with infinite scrolling support (basic implementation).
- **Search**: Search for videos by keywords.
- **Video Player**: Watch videos, view details (title, description, likes, views), and see related videos.
- **Categories**: Filter videos by category (Music, Gaming, News, etc.).
- **Responsive Design**: Fully responsive layout for desktop and mobile.
- **Sidebar**: Toggleable sidebar.

## Tech Stack

- **Frontend**: React (Vite), TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Hooks (Context API for Sidebar)
- **API**: YouTube Data API v3
- **HTTP Client**: Axios
- **Icons**: React Icons
- **Utils**: Moment.js, Numeral.js

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- YouTube Data API Key

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Utube
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure API Key:**
    - Create a `.env` file in the root directory.
    - Add your YouTube Data API key:
      ```env
      VITE_YOUTUBE_API_KEY=your_api_key_here
      ```
    - You can get an API key from the [Google Cloud Console](https://console.cloud.google.com/).

4.  **Run the application:**
    ```bash
    npm run dev
    ```

5.  **Build for production:**
    ```bash
    npm run build
    ```

## Project Structure

```
src/
├── components/       # Reusable UI components (Header, Sidebar, VideoCard)
├── context/          # Context providers (SidebarContext)
├── pages/            # Page components (Feed, VideoDetails, SearchFeed)
├── services/         # API integration logic
├── types/            # TypeScript interfaces
├── utils/            # Utility functions and constants
├── App.tsx           # Main application component
└── main.tsx          # Entry point
```

## API Usage

This application uses the following YouTube Data API endpoints:
- `videos` (list): For trending videos and video details.
- `search` (list): For searching videos and related videos.
- `channels` (list): For channel details (implemented in logic but simplified in UI to save quota).

## License

MIT
