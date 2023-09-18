import fs from "fs";
import ytdl from "ytdl-core";
import readline from "readline";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg_fluent from "fluent-ffmpeg";
import ffmpeg from "ffmpeg-static";
import cp from "child_process";
import getVideoDetails from "../../lib/get_video_details.js";
import {YOUTUBE_DETAILS,QUALITY} from "../../lib/constants.js";
import { extractDetailsFrom } from "../../lib/extract_details.js";
import express, { Request, Response } from "express";




ffmpeg_fluent.setFfmpegPath(`${ffmpegPath}`);

export const getVideo = async (request:Request, response:Response) => {
    const video_url:any = request.query.url;
    const video_quality:any = request.query.video_quality;

    if (!video_url && !video_quality) {
        response.status(400);
        return response.json({
            message:
                "Missing parameters, kindly provide video_url and video_quality",
            status: 400,
        });
    }

    const info = await getVideoDetails(video_url);
    const video_details = info.videoDetails;

    download(video_quality);

    function download(video_quality:string) {
        switch (video_quality) {
            case QUALITY.LOW:
                sendVideoToClient();
                break;
            case QUALITY.MEDIUM:
                const isMediumQualityAvailable =
                    checkWhetherQualityIsAvailableToDownload(136);
                if (isMediumQualityAvailable) {
                    audioAndVideoMuxer("136");
                } else {
                    showUnableToDownloadRequestedQuality();
                }
                break;
            case QUALITY.HIGH:
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
        const ffmpegProcess:any = cp.spawn(
            `${ffmpeg}`,
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
        const videoStats = fs.statSync(`${video_details.videoId}.mp4`);
        const contentLength = videoStats.size.toString();
        response.header(
            "Content-Length",
            contentLength
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

export const getAudio = async (request:Request, response:Response) => {
    const video_url:any = request.query.url;

    if (!video_url) {
        response.status(400);
        return response.json({
            message: "Missing parameters, kindly provide video_url",
            status: 400,
        });
    }

    const info = await getVideoDetails(video_url);
    const video_details = info.videoDetails;
    const filePath = `${video_details.videoId}.mp3`;
    const video = ytdl(video_url, { quality: "highestaudio" });

    downloadAudioFile();

    function downloadAudioFile() {
        ffmpeg_fluent(video)
            .audioBitrate(256)
            .save(filePath)
            .on("progress", () => {
                readline.cursorTo(process.stdout, 0);
            })
            .on("end", () => {
                const stream = fs.createReadStream(filePath);

                response.header("Content-Type", "video/mp3");
                response.header(
                    "Content-Disposition",
                    "attachment; filename=" + video_details.title + ".mp3"
                );
                const videoStats = fs.statSync(filePath);
                const contentLength = videoStats.size.toString();
                response.header("Content-Length", contentLength);

                stream.on("close", () => {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error("Error deleting file:", err);
                        }
                    });
                });

                return stream.pipe(response);
            })
            .on("error", () => {
                return response.status(400).json({
                    message: "Something went wrong",
                    status: 400,
                });
            });
    }
};

export const getDetails = async (request:Request, response:Response) => {
    const video_url:any = request.query.url;
    console.log("hello",video_url)
    if (!video_url) {
        response.status(400);
        return response.json({
            message: "Missing parameters, kindly provide url",
            status: 400,
        });
    }
    try {
        const info = await getVideoDetails(video_url);
        const details = extractDetailsFrom(
            info.videoDetails,
            YOUTUBE_DETAILS
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

