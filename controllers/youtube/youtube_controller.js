const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg_fluent = require("fluent-ffmpeg");
const ffmpeg = require("ffmpeg-static");
const cp = require("child_process");
const getVideoDetailsOf = require("../../lib/get_video_details");
const constants = require("../../lib/constants");
const extractDetailsFrom = require("../../lib/extract_details");

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

    const info = await getVideoDetailsOf(video_url);
    const video_details = info.videoDetails;

    download(video_quality);

    function checkWhetherQualityIsAvailableToDownload(formats, receivedITag) {
        return formats.some(({ itag }) => itag == Number(receivedITag));
    }

    function showUnableToDownloadRequestedQuality(response) {
        response.status(400).json({
            message: `The requested quality is not supported`,
            status: 400,
        });
    }

    function download() {
        let itag;

        switch (video_quality) {
            case constants.QUALITY.LOW:
                itag = "18";
                break;
            case constants.QUALITY.MEDIUM:
                itag = "136";
                break;
            case constants.QUALITY.HIGH:
                itag = "137";
                break;
            default:
                response.status(400).json({
                    message: "Quality of the video is not specified",
                    status: 400,
                });
                return;
        }

        const isQualityAvailable = checkWhetherQualityIsAvailableToDownload(
            info.formats,
            itag
        );

        if (!isQualityAvailable) {
            showUnableToDownloadRequestedQuality(response);
            return;
        }

        // Now proceed with the selected quality
        audioAndVideoMuxer(itag);
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
        var readOpts = { highWaterMark: 1000 };

        const filePath = `${video_details.videoId}.mp4`;
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
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                }
            });
        });

        return stream.pipe(response);
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

    const isInstagramURL = isInstagramVideoURL(video_url);

    try {
        if (isInstagramURL) {
            // Redirect to Instagram route
            return response.redirect(
                307,
                "/api/ig/details?url=" + encodeURIComponent(video_url)
            );
        }

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

const isInstagramVideoURL = (url) => {
    return url.startsWith("https://www.instagram.com/");
};

module.exports = {
    getVideo,
    getDetails,
};
