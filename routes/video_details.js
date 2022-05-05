const router = require("express").Router();
const { getDetails } = require("../controllers/youtube/youtube_controller");

router.get("/", getDetails);

module.exports = router;
