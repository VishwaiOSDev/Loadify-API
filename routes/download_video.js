const router = require("express").Router();
const ytdl = require("ytdl-core");
const fs = require("fs");
const constants = require("../lib/constants");

// Routers
router.get("/details", async (req, res) => {
  const video_id = req.query.url.split("v=")[1];
  try {
    const details = extractDetailsFrom(
      await getVideoDetails(video_id),
      constants.YOUTUBE_DETAILS
    );
    // Check the usage if the details needed YouTube URL
    res.json(details);
  } catch (err) {
    console.log(`Error getting info ${err}`);
  }
});

router.get("/mp4", async (req, res) => {
  const video_url = req.query.url;
  const video_id = req.query.url.split("v=")[1];
  const video_details = await getVideoDetails(video_id);
  const video = ytdl(video_url);
  video.pipe(
    fs.createWriteStream(`./videos/YouTube/${video_details.title}.mp4`)
  );
  // Give the downloaded file to the client
  res.status(200).json({ message: "Video File Downloaded" });
});

router.get("/mp3", async (req, res) => {
  const video_url = req.query.url;
  const video_id = req.query.url.split("v=")[1];
  const video_details = await getVideoDetails(video_id);
  const video = ytdl(video_url, { filter: "audioonly" });
  video.pipe(
    fs.createWriteStream(`./audios/YouTube/${video_details.title}.mp3`)
  );
  // Give the downloaded file to the client
  res.status(200).json({ message: "Audio File Downloaded" });
});

// Functions
async function getVideoDetails(video_id) {
  try {
    const info = await ytdl.getInfo(video_id);
    return info.videoDetails;
  } catch (err) {
    console.log(`Error geting info ${err}`);
  }
}

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
