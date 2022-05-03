const router = require("express").Router();

const constants = require("../lib/constants");
const getVideoDetailsOf = require("../lib/get_video_details");
const extractDetailsFrom = require("../lib/extract_details");

router.get("/", async (req, res) => {
  const video_id = req.query.url.split("v=")[1];
  try {
    const video_details = await getVideoDetailsOf(video_id);
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
