import { Router } from "express";
import {
    getVideo,
    getAudio,
    getDetails,
} from "../controllers/youtube/youtube_controller.js";

const router = Router();

router.get("/details", getDetails);
router.get("/download/video/mp4", getVideo);
router.get("/download/audio/mp3", getAudio);

export default router;