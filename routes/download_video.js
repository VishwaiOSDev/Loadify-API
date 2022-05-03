const fs = require("fs");
const cp = require("child_process");
const ytdl = require("ytdl-core");
const router = require("express").Router();
const ffmpeg = require("ffmpeg-static");

const getVideoDetailsOf = require("../lib/get_video_details");

router.get("/mp4", async (req, res) => {
  let video = undefined;
  const video_url = req.query.url;
  const video_id = req.query.url.split("v=")[1];
  const video_quality = req.query.video_quality;
  const video_details = await getVideoDetailsOf(video_id);
  switch (video_quality) {
    case "Low":
      video = ytdl(video_url);
      break;
    case "Medium":
      video = ytdl(video_url, { quality: 136 });
      break;
    case "High":
      video = ytdl(video_url, { quality: 137 });
      break;
    default:
      res
        .status(400)
        .json({ message: "Quality of the video is not specified" });
  }
  video.pipe(
    fs.createWriteStream(
      `./videos/YouTube/${video_details.title} ?qty=${video_quality}.mp4`
    )
  );
  // Give the downloaded file to the client
  res.status(200).json({ message: "Video File Downloaded" });
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

module.exports = router;
