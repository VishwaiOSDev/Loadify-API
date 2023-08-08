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

ffmpeg_fluent.setFfmpegPath(ffmpegPath);

const getVideo = async (request, response) => {
    request.setTimeout(900000);
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

    const info = await getVideoDetailsOf(video_url);
    const video_details = info.videoDetails;

    download(video_quality);

    function download() {
        switch (video_quality) {
            case constants.QUALITY.LOW:
                sendVideoToClient();
                break;
            case constants.QUALITY.MEDIUM:
                const isMediumQualityAvailable =
                    checkWhetherQualityIsAvailableToDownload(136);
                if (isMediumQualityAvailable) {
                    audioAndVideoMuxer("136");
                } else {
                    showUnableToDownloadRequestedQuality();
                }
                break;
            case constants.QUALITY.HIGH:
                const isHighQualityAvailable =
                    checkWhetherQualityIsAvailableToDownload(137);
                if (isHighQualityAvailable) {
                    audioAndVideoMuxer("137");
                } else {
                    showUnableToDownloadRequestedQuality();
                }
                break;
            default:
                response.status(400).json({
                    message: "Quality of the video is not specified",
                    status: 400,
                });
        }
    }

    function sendVideoToClient() {
        const video = ytdl(video_url);
        video.pipe(response);
        video.on("error", () => {
            response.status(400);
            response.json({
                message: "Something went wrong",
                status: 400,
            });
        });
    }

    function checkWhetherQualityIsAvailableToDownload(receivedITag) {
        const video_fomarts = info.formats;
        return video_fomarts.find(({ itag }) => itag == Number(receivedITag));
    }

    function showUnableToDownloadRequestedQuality() {
        response.status(400).json({
            message: `The requested quality is not supported`,
            status: 400,
        });
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
            response
                .json({
                    message: "Failed to update the records",
                    status: 400,
                })
                .status(400);
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
        streamVideoToClient();
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

        const filePath = `${video_details.videoId}.mp4`;

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
                // Overwrite the file
                "-y",
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
                filePath,
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

        video.on("close", () => {
            console.log("Closed Video...");
        });

        ffmpegProcess.on("close", () => {
            streamVideoToClientNow();
        });

        ffmpegProcess.on("error", () => {
            response.status(400);
            response.json({
                message: "Something went wrong",
                status: 400,
            });
        });
    }

    function streamVideoToClientNow() {
        const filePath = `${video_details.videoId}.mp4`;

        var readOpts = { highWaterMark: 1000 };
        const stream = fs.createReadStream(
            `${video_details.videoId}.mp4`,
            readOpts
        );
        response.header("Content-Type", "video/mp4");
        response.header(
            "Content-Disposition",
            "attachment; filename=" + video_details.videoId + ".mp4"
        );
        response.header(
            "Content-Length",
            fs.statSync(`${video_details.videoId}.mp4`).size
        );
        stream.on("close", () => {
            console.log("Closed...");
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                }
            });
        });
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
                steam.on("end", () => {
                    console.log("Downloaded...");
                });
                return steam.pipe(response);
            })
            .on("error", () => {
                return response.status(400).json({
                    message: "Something went wrong",
                    status: 400,
                });
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
        const info = await getVideoDetailsOf(video_url);
        const details = extractDetailsFrom(
            info.videoDetails,
            constants.YOUTUBE_DETAILS
        );
        response.status(200);
        response.json(details);
    } catch (err) {
        response.status(400);
        response.json({
            message: `${err}`,
            status: 400,
        });
    }
};

module.exports = {
    getVideo,
    getAudio,
    getDetails,
};
