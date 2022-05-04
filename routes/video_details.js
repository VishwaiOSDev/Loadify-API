const router = require("express").Router();

const constants = require("../lib/constants");
const getVideoDetailsOf = require("../lib/get_video_details");
const extractDetailsFrom = require("../lib/extract_details");
const ytdl = require("ytdl-core");

router.get("/", async (req, res) => {
  const video_url = req.query.url;
  try {
    const video_details = await getVideoDetailsOf(video_url);
    const details = extractDetailsFrom(
      video_details,
      constants.YOUTUBE_DETAILS
    );
    // Check the usage if the details needed YouTube URL
    res.json(details);
  } catch (err) {
    console.log(`Error getting info ${err}`);
    res.json({ message: "Something went wrong" + err });
  }
});

module.exports = router;
