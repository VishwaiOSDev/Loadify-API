const express = require("express");
const app = express();
const mongoose = require("mongoose");
const fs = require("fs");
const PORT = 3200;

const ytdl = require("ytdl-core");

// Middleware
app.use(express.json());

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://localhost/YouTube_Downloader");
}

app.get("/view", async (req, res) => {
  const video_url = req.query.url;
  const video = ytdl(video_url, { quality: 137 });

  video.on("progress", function (info) {
    console.log("Downloading...");
  });

  video.on("end", function (info) {
    console.log("Downloaded...");
  });

  video.pipe(fs.createWriteStream("video1.mp4"));
});

app.get("/download", async (req, res) => {
  const v_id = req.query.url.split("v=")[1];
  const info = await ytdl.getInfo(req.query.url);
  console.log(info);
  console.log(info.formats[4]);
  console.log(info.formats[1]);
});

app.listen(PORT, function () {
  console.log(`Server is running on ${PORT}`);
});
