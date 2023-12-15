const router = require("express").Router();

const { getTikTokVideo } = require("../controllers/tiktok/tiktok_controller");

router.get("/details", getTikTokVideo);

module.exports = router;
