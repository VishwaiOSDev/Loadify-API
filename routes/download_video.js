const router = require("express").Router();
const { getVideo } = require("../controllers/youtube/youtube_controller");

router.get("/mp4", getVideo);

module.exports = router;
