const router = require("express").Router();
const ytdl = require("ytdl-core");
const fs = require("fs");

router.get("/mp4", async (req, res) => {
  let video_title = null;
  const video_url = req.query.url;
  const video_id = req.query.url.split("v=")[1];
  const info = await ytdl.getInfo(video_id);
  video_title = info.videoDetails.title;
  const video = ytdl(video_url);
  video.pipe(fs.createWriteStream(`./videos/${video_title}.mp4`));
});

module.exports = router;
