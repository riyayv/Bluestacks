const express = require("express");
const path = require("path");
const app = express();
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios"); 

app.set("view engine", "ejs");

const Schema = mongoose.Schema;
const noSchema = new Schema({ _id: String }, { strict: false });
let Trending = mongoose.model("youtube", noSchema);

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("Connected to MongoDB successfully.");

    app.use("/assets", express.static(__dirname + "/assets"));

    app.get("/", function (req, res) {
      console.log("Fetching trending videos from database...");
      Trending.aggregate([
        { $limit: 60 },
        { $sort: { published: -1 } },
        {
          $project: {
            timeText: 1,
            author: 1,
            title: 1,
            viewCount: 1,
            thumb: { $arrayElemAt: ["$videoThumbnails", 1] },
          },
        },
      ])
        .exec()
        .then((trending) => {
          console.log("Trending videos fetched successfully:", trending.length);
          res.render(path.join(__dirname, "./views/index"), {
            trending: trending,
          });
        })
        .catch((error) => {
          console.error("Error fetching trending videos:", error.message);
          res.status(500).send({ success: false, error: error.message });
        });
    });

    app.get("/video/:videoId", function (req, res) {
      console.log("Fetching details for video ID:", req.params.videoId);
      Trending.findOne({ _id: req.params.videoId })
        .lean()
        .exec()
        .then((video) => {
          if (!video) {
            console.error("Video not found for ID:", req.params.videoId);
            return res
              .status(404)
              .send({ success: false, error: "Video not found" });
          }
          console.log(
            "Video details fetched successfully for ID:",
            req.params.videoId
          );
          res.render(path.join(__dirname, "./views/details"), { video: video });
        })
        .catch((error) => {
          console.error("Error fetching video details:", error.message);
          res.status(500).send({ success: false, error: error.message });
        });
    });

    app.get("/scrape", async function (req, res) {
      try {
        console.log("Starting scraping of YouTube trending videos...");

        const API_KEY = process.env.YOUTUBE_API_KEY;
        if (!API_KEY) {
          throw new Error("YouTube API key not configured");
        }

        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos`,
          {
            params: {
              part: "snippet,statistics,contentDetails",
              chart: "mostPopular",
              regionCode: "IN",
              maxResults: 50,
              key: API_KEY,
            },
          }
        );

        if (!response.data || !response.data.items) {
          throw new Error("Invalid response from YouTube API");
        }

        const videos = response.data.items.map((item) => ({
          _id: item.id,
          videoId: item.id,
          title: item.snippet.title,
          author: item.snippet.channelTitle,
          authorId: item.snippet.channelId,
          published: item.snippet.publishedAt,
          description: item.snippet.description,
          viewCount: item.statistics.viewCount,
          likeCount: item.statistics.likeCount,
          duration: item.contentDetails.duration,
          timeText: item.contentDetails.duration,
          videoThumbnails: [
            {
              url: item.snippet.thumbnails.default.url,
              width: item.snippet.thumbnails.default.width,
              height: item.snippet.thumbnails.default.height,
            },
            {
              url: item.snippet.thumbnails.medium.url,
              width: item.snippet.thumbnails.medium.width,
              height: item.snippet.thumbnails.medium.height,
            },
            {
              url: item.snippet.thumbnails.high.url,
              width: item.snippet.thumbnails.high.width,
              height: item.snippet.thumbnails.high.height,
            },
          ],
        }));

        console.log(`Fetched ${videos.length} trending videos`);

        const savePromises = videos.map((video) =>
          Trending.findOneAndUpdate(
            { _id: video.videoId },
            { $set: video },
            { upsert: true, new: true }
          )
        );

        const savedVideos = await Promise.all(savePromises);
        console.log(
          `Successfully saved ${savedVideos.length} videos to database`
        );

        res.send({
          success: true,
          videosCount: videos.length,
          savedCount: savedVideos.length,
        });
      } catch (error) {
        console.error("Error during YouTube API fetch:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });

        res.status(500).send({
          success: false,
          error: error.message,
          errorType: error.name,
        });
      }
    });

    app.listen(3000, function () {
      console.log("Listening at port 3000...");
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  });
