const fs = require("fs");
const ytdl = require("ytdl-core");
const router = require("express").Router();
const readline = require("readline");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg_fluent = require("fluent-ffmpeg");

const getVideoDetailsOf = require("../lib/get_video_details");

ffmpeg_fluent.setFfmpegPath(ffmpegPath);

router.get("/mp3", async (req, res) => {
  const video_url = req.query.url;
  const video_id = req.query.url.split("v=")[1];
  const video_details = await getVideoDetailsOf(video_id);
  const video = ytdl(video_url, { quality: "highestaudio" });
  if (!fs.existsSync("./audios/YouTube")) {
    fs.mkdirSync("./audios/YouTube", { recursive: true });
  }
  ffmpeg_fluent(video)
    .audioBitrate(128)
    .save(`./audios/YouTube/${video_details.title}.mp3`)
    .on("progress", (p) => {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${p.targetSize}kb downloaded`);
    })
    .on("end", () => {
      return res.status(200).json({ message: "Audio File Downloaded" });
    })
    .on("error", () => {
      return res.status(200).json({ message: "Something went wrong" });
    });
});

module.exports = router;
