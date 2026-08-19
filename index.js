const express = require("express");
const cors = require("cors");
const { exec } = require("yt-dlp-exec");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DOWNLOAD_DIR = path.join(process.env.HOME, "storage", "downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Home
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Personal AutoDL API is running!"
  });
});

// Video info
app.get("/info", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "URL is required"
      });
    }

    const result = await exec(url, {
      dumpSingleJson: true,
      skipDownload: true,
      noPlaylist: true,
      jsRuntimes: "deno",
      extractorArgs: "youtube:player_client=web_embedded"
    });

    const formats = (result.formats || [])
      .filter(format => format.vcodec !== "none")
      .map(format => ({
        format_id: format.format_id,
        ext: format.ext,
        resolution: format.resolution,
        filesize: format.filesize || null,
        format: format.format
      }));

    res.json({
      status: true,
      title: result.title,
      uploader: result.uploader,
      duration: result.duration,
      thumbnail: result.thumbnail,
      formats
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to get video info",
      error: error.message
    });
  }
});

// Download
app.get("/download", async (req, res) => {
  try {
    const { url, quality = "360" } = req.query;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "URL is required"
      });
    }

    const height = parseInt(quality);

    if (![144, 240, 360, 480, 720, 1080].includes(height)) {
      return res.status(400).json({
        status: false,
        message: "Unsupported quality"
      });
    }

    console.log(`Downloading ${height}p: ${url}`);

    await exec(url, {
      jsRuntimes: "deno",
      extractorArgs: "youtube:player_client=web_embedded",
      format: `best[height<=${height}]`,
      noPlaylist: true,
      output: path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s"),
      mergeOutputFormat: "mp4"
    });

    res.json({
      status: true,
      message: "Download completed!",
      quality: `${height}p`,
      folder: DOWNLOAD_DIR
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: false,
      message: "Download failed",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});
