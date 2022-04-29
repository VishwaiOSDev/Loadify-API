const router = require("express").Router();
const ytdl = require("ytdl-core");
const fs = require("fs");

router.get("/details", async (req, res) => {
  const video_id = req.query.url.split("v=")[1];
  try {
    const info = await ytdl.getInfo(video_id);
    const details = extractDetailsFrom(info.videoDetails, [
      "videoId",
      "title",
      "description",
      "publishDate",
      "ownerChannelName",
      "likes",
      "thumbnails",
    ]);
    res.json(details);
  } catch (err) {
    console.log(`Error getting info ${err}`);
  }
});

router.get("/mp4", async (req, res) => {
  let video_title = null;
  const video_url = req.query.url;
  const video_id = req.query.url.split("v=")[1];
  const info = await ytdl.getInfo(video_id);
  video_title = info.videoDetails.title;
  const video = ytdl(video_url);
  video.pipe(fs.createWriteStream(`./videos/${video_title}.mp4`));
});

// Helper Functions
function extractDetailsFrom(object, keys) {
  return Object.keys(object)
    .filter(function (key) {
      return keys.indexOf(key) >= 0;
    })
    .reduce(function (acc, key) {
      acc[key] = object[key];
      return acc;
    }, {});
}

module.exports = router;
