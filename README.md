# YouTube Trending Videos Scraper 📹

A FullStack Web Application that scrapes trending YouTube videos in India,
stores them in MongoDB, and presents the data dynamically using Express and EJS.

## Setup Instructions

Prerequisites:

- Node.js
- MongoDB API Key
- YouTube API Key

Steps:

1. Clone the repository:
   $ git clone <repository-url>
   $ cd <repository-folder>

2. Install dependencies:
   $ npm install

3. Configure .env file:
   DB_URL=your_mongodb_connection_string
   YOUTUBE_API_KEY=your_youtube_api_key

4. Start the server:
   $ node app.js

5. Open in the browser:
   http://localhost:3000

## Workflow 🔍

1. **Scraping**: The `/scrape` endpoint fetches trending YouTube videos
   via the YouTube Data API and saves them to MongoDB.

2. **Serving Data**: The `/` route displays the videos,
   and `/video/:videoId` shows detailed video info.

3. **Refreshing**: Trigger data refresh on demand to update the trending videos.

Made with ❤️ by [Riya Yadav](https://www.linkedin.com/in/riya-yadav-20447523b/)
