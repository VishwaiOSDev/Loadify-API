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

app.get("/download/mp3", async (req, res) => {
  const youtuble_url = req.query.url;
  const audio = ytdl(youtuble_url, { format: "mp3", filter: "audioonly" });
  audio.pipe(fs.createWriteStream("audio.mp3"));
});

app.get("/download/mp4", async (req, res) => {
  let video_title = null;
  const video_url = req.query.url;
  const video_id = req.query.url.split("v=")[1];
  const info = await ytdl.getInfo(req.query.url);
  video_title = info.videoDetails.title;
  res.json(info.videoDetails.title);
  const video = ytdl(video_url);
  video.pipe(fs.createWriteStream(`${video_title}.mp4`));
});

app.get("/download", async (req, res) => {
  const v_id = req.query.url.split("v=")[1];
  const info = await ytdl.getInfo(req.query.url);
  // console.log(info);
  // console.log(info.formats[4]);
  console.log(info.formats[1]);
});

app.listen(PORT, function () {
  console.log(`Server is running on ${PORT}`);
});
