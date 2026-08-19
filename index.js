const express = require("express");
const cors = require("cors");
const ytDlp = require("yt-dlp-exec");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: true, message: "Personal AutoDL API is running!" });
});

app.get("/downloader/alldl", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "URL parameter is required"
    });
  }

  try {
    const output = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      addHeader: [
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      ],
      extractorArgs: "youtube:player_client=mweb,android"
    });

    let directUrl = output.url;

    if (!directUrl && output.formats && output.formats.length > 0) {
      const combined = output.formats.filter(
        (f) => f.vcodec !== "none" && f.acodec !== "none"
      );
      directUrl = combined.length > 0 
        ? combined[combined.length - 1].url 
        : output.formats[output.formats.length - 1].url;
    }

    if (!directUrl) {
      return res.status(404).json({
        status: false,
        message: "Could not extract direct video URL"
      });
    }

    return res.json({
      status: true,
      result: {
        title: output.title || output.fulltitle || "Untitled",
        author: output.uploader || output.channel || output.creator || "N/A",
        high_quality: directUrl,
        video: directUrl,
        url: directUrl
      }
    });

  } catch (error) {
    console.error("yt-dlp error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to extract video",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
