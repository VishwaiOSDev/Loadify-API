const router = require("express").Router();

const {
    getVideo,
    getAudio,
    getDetails,
} = require("../controllers/youtube/youtube_controller");

router.get("/details", getDetails);
router.get("/download/video/mp4", getVideo);

module.exports = router;
