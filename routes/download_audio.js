const router = require("express").Router();
const { getVideo, getAudio } = require("../controllers/youtube/youtube_controller");

router.get("/mp3", getAudio);

module.exports = router;
