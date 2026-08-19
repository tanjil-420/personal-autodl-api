const express = require("express");
const cors = require("cors");
const downloaderRoute = require("./routes/downloader");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root Route
app.get("/", (req, res) => {
  res.json({
    status: true,
    message: "Personal AutoDL API is running!"
  });
});

// Downloader Router Connection (/downloader/alldl)
app.use("/downloader", downloaderRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
