const fs = require("fs");
const cp = require("child_process");
const ytdl = require("ytdl-core");
const { v4: uuid4 } = require("uuid");
const router = require("express").Router();
const ffmpeg = require("ffmpeg-static");

const Files = require("../model/File");
const constants = require("../lib/constants");
const getVideoDetailsOf = require("../lib/get_video_details");

router.get("/mp4", async (req, res) => {
  const video_url = req.query.url;
  const video_quality = req.query.video_quality;
  const video_details = await getVideoDetailsOf(video_url);

  // Check that video is already downloaded or not in database
  const result = await Files.findOne({ video_id: video_details.videoId });

  if (result) {
    if (result.qualities_available.indexOf(video_quality) == -1) {
      // We don't have the video file just download that quality
      download(video_quality);
    } else {
      // Give the file to the client
      checkQualitiesAndUpdateDownloads();
    }
  } else {
    // Download the file from YTDL
    download(video_quality);
  }

  function download() {
    switch (video_quality) {
      case constants.QUALITY.LOW:
        downloadFromYTDL();
        break;
      case constants.QUALITY.MEDIUM:
        downloadFromYTDL("136");
        break;
      case constants.QUALITY.HIGH:
        downloadFromYTDL("137");
        break;
      default:
        res
          .status(400)
          .json({ message: "Quality of the video is not specified" });
    }
  }

  async function checkQualitiesAndUpdateDownloads() {
    try {
      if (result.qualities_available.indexOf(video_quality) == -1) {
        await Files.findByIdAndUpdate(
          { _id: result._id },
          {
            $push: { qualities_available: video_quality },
            $inc: { downloads: 1 },
          }
        );
      } else {
        await Files.findByIdAndUpdate(
          { _id: result._id },
          { $inc: { downloads: 1 } },
          { new: true }
        );
      }
    } catch (err) {
      res.json({ message: "Failed to update the records" });
    }
  }

  function addFileToDatabase() {
    if (result) {
      // File already present -> Update Qualities and Increment Downloads
      checkQualitiesAndUpdateDownloads();
    } else {
      // Insert New Record
      insertNewItemToDatabase();
    }
  }

  function insertNewItemToDatabase() {
    const document = {
      id: uuid4(),
      video_title: video_details.title,
      video_description: video_details.description,
      published_date: video_details.publishDate,
      owner_channel_name: video_details.ownerChannelName,
      video_id: video_details.videoId,
      likes: video_details.likes,
      length_seconds: video_details.lengthSeconds,
      thumbnails: video_details.thumbnails,
      qualities_available: [video_quality],
    };
    const file_document = new Files(document);
    file_document.save();
  }

  function downloadFromYTDL(iTag) {
    if (iTag) {
      audioAndVideoMuxer(iTag);
    } else {
      const video = ytdl(video_url);
      if (!fs.existsSync(`./data/videos/YouTube/${video_quality}`)) {
        fs.mkdirSync(`./data/videos/YouTube/${video_quality}`, {
          recursive: true,
        });
      }
      video.pipe(
        fs.createWriteStream(
          `./data/videos/YouTube/${video_quality}/${video_details.videoId}.mp4`
        )
      );
      video.on("end", () => {
        addFileToDatabase();
        res.status(200).json({ message: "Video File Downloaded" });
      });
      video.on("error", () => {
        res.json({ message: "Something went wrong" });
      });
    }
  }

  function audioAndVideoMuxer(iTag) {
    const tracker = {
      start: Date.now(),
      audio: { downloaded: 0, total: Infinity },
      video: { downloaded: 0, total: Infinity },
      merged: { frame: 0, speed: "0x", fps: 0 },
    };

    // Get audio and video streams
    const audio = ytdl(video_url, { quality: "highestaudio" }).on(
      "progress",
      (_, downloaded, total) => {
        tracker.audio = { downloaded, total };
      }
    );
    const video = ytdl(video_url, { quality: iTag }).on(
      "progress",
      (_, downloaded, total) => {
        tracker.video = { downloaded, total };
      }
    );
    // Check directory exists or not
    if (!fs.existsSync(`./data/videos/YouTube/${video_quality}`)) {
      fs.mkdirSync(`./data/videos/YouTube/${video_quality}`, {
        recursive: true,
      });
    }
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
        `./data/videos/YouTube/${video_quality}/${video_details.videoId}.mp4`,
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
      addFileToDatabase();
      res.json({ message: "Video file downloaded" });
    });
    ffmpegProcess.on("error", () => {
      res.json({ message: "Something when wrong" });
    });
    audio.pipe(ffmpegProcess.stdio[4]);
    video.pipe(ffmpegProcess.stdio[5]);
  }
});

module.exports = router;
