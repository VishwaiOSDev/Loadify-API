const fs = require("fs");
const ytdl = require("ytdl-core");
const readline = require("readline");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg_fluent = require("fluent-ffmpeg");
const ffmpeg = require("ffmpeg-static");
const cp = require("child_process");
const { v4: uuid4 } = require("uuid");
const getVideoDetailsOf = require("../../lib/get_video_details");
const constants = require("../../lib/constants");
const extractDetailsFrom = require("../../lib/extract_details");
const YouTube = require("../../model/YouTube");

ffmpeg_fluent.setFfmpegPath(ffmpegPath);

const getVideo = async (request, response) => {
    const video_url = request.query.url;
    const video_quality = request.query.video_quality;
    if (!video_url && !video_quality) {
        response.status(400);
        return response.json({
            message:
                "Missing parameters, kindly provide video_url and video_quality",
            status: 400,
        });
    }
    const video_details = await getVideoDetailsOf(video_url);

    // Check that video is already downloaded or not in database
    const result = await YouTube.findOne({ video_id: video_details.videoId });

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
                response
                    .status(400)
                    .json({ message: "Quality of the video is not specified" });
        }
    }

    async function checkQualitiesAndUpdateDownloads() {
        try {
            if (result.qualities_available.indexOf(video_quality) == -1) {
                await YouTube.findByIdAndUpdate(
                    { _id: result._id },
                    {
                        $push: { qualities_available: video_quality },
                        $inc: { downloads: 1 },
                    }
                );
                streamVideoToClient();
            } else {
                await YouTube.findByIdAndUpdate(
                    { _id: result._id },
                    { $inc: { downloads: 1 } },
                    { new: true }
                );
                streamVideoToClient();
            }
        } catch (err) {
            response.json({ message: "Failed to update the records" }).status(400);
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
            video_id: video_details.videoId,
            qualities_available: [video_quality],
        };
        const file_document = new YouTube(document);
        file_document.save();
        streamVideoToClient()
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
            });
            video.on("error", () => {
                response.status(400);
                response.json({
                    message: "Something went wrong",
                });
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
        audio.pipe(ffmpegProcess.stdio[4]);
        video.pipe(ffmpegProcess.stdio[5]);
        ffmpegProcess.on("exit", () => {
            addFileToDatabase();
        });
        ffmpegProcess.on("error", () => {r
            response.status(400);
            response.json({ message: "Something went wrong" });
        });
    }

    function streamVideoToClient() {
        var readOpts = {highWaterMark: 1000};
        const stream = fs.createReadStream(
            `./data/videos/YouTube/${video_quality}/${video_details.videoId}.mp4`,
            readOpts
        );
        response.header("Content-Type", "video/mp4");
        response.header(
            "Content-Disposition",
            "attachment; filename=" + video_details.videoId + ".mp4"
        );
        response.header(
            "Content-Length",
            fs.statSync(
                `./data/videos/YouTube/${video_quality}/${video_details.videoId}.mp4`
            ).size
        );
        stream.on("end", () => { console.log("Video file downloaded.")} )
        return stream.pipe(response);
    }
};

const getAudio = async (request, response) => {
    const video_url = request.query.url;
    if (!video_url) {
        response.status(400);
        return response.json({
            message: "Missing parameters, kindly provide video_url",
            status: 400,
        });
    }
    const video_details = await getVideoDetailsOf(video_url);
    const video = ytdl(video_url, { quality: "highestaudio" });
    if (!fs.existsSync("./data/audios/YouTube")) {
        fs.mkdirSync("./data/audios/YouTube", { recursive: true });
    }

    const result = await YouTube.findOne({ video_id: video_details.videoId });

    if (result) {
        if (result.has_audio) {
            // Give file to client
            response.json({ message: "Give file to client" });
        } else {
            await YouTube.findByIdAndUpdate(
                { _id: result._id },
                { has_audio: true }
            );
            // Give file to client
        }
    } else {
        // Download the audio file and insert it in the database
        downloadAudioFile();
    }

    function insertNewItemToDatabase() {
        const document = {
            id: uuid4(),
            video_id: video_details.videoId,
            has_audio: true,
        };
        const file_document = new YouTube(document);
        file_document.save();
    }

    function downloadAudioFile() {
        ffmpeg_fluent(video)
            .audioBitrate(256)
            .save(`./data/audios/YouTube/${video_details.videoId}.mp3`)
            .on("progress", (p) => {
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`${p.targetSize}kb downloaded`);
            })
            .on("end", () => {
                const steam = fs.createReadStream(
                    `./data/audios/YouTube/${video_details.videoId}.mp3`
                );
                insertNewItemToDatabase();
                response.header("Content-Type", "video/mp4");
                response.header(
                    "Content-Disposition",
                    "attachment; filename=" + video_details.videoId + ".mp3"
                );
                response.header(
                    "Content-Length",
                    fs.statSync(
                        `./data/audios/YouTube/${video_details.videoId}.mp3`
                    ).size
                );
                steam.on("end", () => { console.log("Downloaded...") })
                return steam.pipe(response);
            })
            .on("error", () => {
                return response
                    .status(400)
                    .json({ message: "Something went wrong" });
            });
    }
};

const getDetails = async (request, response) => {
    const video_url = request.query.url;
    if (!video_url) {
        response.status(400);
        return response.json({
            message: "Missing parameters, kindly provide url",
            status: 400,
        });
    }
    try {
        const video_details = await getVideoDetailsOf(video_url);
        const details = extractDetailsFrom(
            video_details,
            constants.YOUTUBE_DETAILS
        );
        response.status(200);
        response.json(details);
    } catch (err) {
        response.status(400);
        response.json({
            message: `${err}`,
        });
    }
};

module.exports = {
    getVideo,
    getAudio,
    getDetails,
};
