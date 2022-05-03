const router = require("express").Router();
const ytdl = require("ytdl-core");
const fs = require("fs");
const ffmpeg = require("ffmpeg-static");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg_fluent = require("fluent-ffmpeg");
ffmpeg_fluent.setFfmpegPath(ffmpegPath);
const cp = require("child_process");
const readline = require("readline");
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
  const video = ytdl(video_url, { quality: 137 });
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
  const video = ytdl(video_url, { quality: "highestaudio" });
  if (!fs.existsSync("./audios/YouTube")) {
    fs.mkdirSync("./audios/YouTube", { recursive: true });
  }
  let start = Date.now();
  ffmpeg_fluent(video)
    .audioBitrate(128)
    .save(`./audios/YouTube/${video_details.title}.mp3`)
    .on("progress", (p) => {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${p.targetSize}kb downloaded`);
    })
    .on("end", () => {
      console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
      return res.status(200).json({ message: "Audio File Downloaded" });
    })
    .on("error", () => {
      return res.status(200).json({ message: "Something went wrong" });
    });
});

router.get("/mux", async (req, res) => {
  const ref = req.query.url;
  const tracker = {
    start: Date.now(),
    audio: { downloaded: 0, total: Infinity },
    video: { downloaded: 0, total: Infinity },
    merged: { frame: 0, speed: "0x", fps: 0 },
  };

  // Get audio and video streams
  const audio = ytdl(ref, { quality: "highestaudio" }).on(
    "progress",
    (_, downloaded, total) => {
      tracker.audio = { downloaded, total };
    }
  );
  const video = ytdl(ref, { quality: "137" }).on(
    "progress",
    (_, downloaded, total) => {
      tracker.video = { downloaded, total };
    }
  );

  // Start the ffmpeg child process
  const ffmpegProcess = cp.spawn(
    ffmpeg,
    [
      // Remove ffmpeg's console spamming
      "-loglevel",
      "8",
      "-hide_banner",
      // Redirect/Enable progress messages
      "-progress",
      "pipe:3",
      // Set inputs
      "-i",
      "pipe:4",
      "-i",
      "pipe:5",
      // Map audio & video from streams
      "-map",
      "0:a",
      "-map",
      "1:v",
      // Keep encoding
      "-c:v",
      "copy",
      // Define output file
      "./videos/YouTube/out.mp4",
    ],
    {
      windowsHide: true,
      stdio: [
        /* Standard: stdin, stdout, stderr */
        "inherit",
        "inherit",
        "inherit",
        /* Custom: pipe:3, pipe:4, pipe:5 */
        "pipe",
        "pipe",
        "pipe",
      ],
    }
  );
  ffmpegProcess.on("close", () => {
    console.log("done");
    // Cleanup
    process.stdout.write("\n\n\n\n");
    // clearInterval(progressbarHandle);
  });
  ffmpegProcess.stdio[3].on("data", (chunk) => {
    const lines = chunk.toString().trim().split("\n");
    const args = {};
    for (const l of lines) {
      const [key, value] = l.split("=");
      args[key.trim()] = value.trim();
    }
    tracker.merged = args;
  });
  audio.pipe(ffmpegProcess.stdio[4]);
  video.pipe(ffmpegProcess.stdio[5]);
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
