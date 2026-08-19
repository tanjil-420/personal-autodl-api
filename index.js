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

// Helper: Bypass Datacenter IP block using Cobalt API Engine
async function getFromCobalt(targetUrl) {
  const instances = [
    "https://api.cobalt.tools/",
    "https://cobalt-api.kwippy.com/"
  ];

  for (const instance of instances) {
    try {
      const response = await fetch(instance, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0"
        },
        body: JSON.stringify({ url: targetUrl, videoQuality: "720" })
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data && (data.status === "stream" || data.status === "redirect") && data.url) {
        return {
          title: data.filename || "Downloaded Video",
          author: "AutoDL",
          url: data.url
        };
      } else if (data && data.status === "picker" && data.picker && data.picker.length > 0) {
        const media = data.picker.find((item) => item.type === "video") || data.picker[0];
        if (media && media.url) {
          return {
            title: data.filename || "Downloaded Video",
            author: "AutoDL",
            url: media.url
          };
        }
      }
    } catch (e) {
      // Continue to next instance
    }
  }
  return null;
}

app.get("/downloader/alldl", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "URL parameter is required"
    });
  }

  try {
    // 1. Try Bypass Engine First (Bypasses YouTube & FB Bot Check)
    const cobaltResult = await getFromCobalt(url);
    if (cobaltResult) {
      return res.json({
        status: true,
        result: {
          title: cobaltResult.title,
          author: cobaltResult.author,
          high_quality: cobaltResult.url,
          video: cobaltResult.url,
          url: cobaltResult.url
        }
      });
    }

    // 2. Fallback to Direct yt-dlp
    const output = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true
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
    console.error("Extraction error:", error);
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
