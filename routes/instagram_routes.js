const router = require("express").Router();

const {
    getInstaVideo,
} = require("../controllers/instagram/instagram_controller");

router.get("/details", getInstaVideo);

module.exports = router;
