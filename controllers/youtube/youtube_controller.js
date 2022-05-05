const fs = require("fs");
const ytdl = require("ytdl-core");
const readline = require("readline");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg_fluent = require("fluent-ffmpeg");
const getVideoDetailsOf = require("../../lib/get_video_details");

ffmpeg_fluent.setFfmpegPath(ffmpegPath);

const getVideo = async (request, response) => {
    const apex = request.params.apex;
    return response.send({
        message: `Hello ${apex}`,
    });
};

const getAudio = async (request, response) => {
    const video_url = request.query.url;
    const video_details = await getVideoDetailsOf(video_url);
    const video = ytdl(video_url, { quality: "highestaudio" });
    if (!fs.existsSync("./data/audios/YouTube")) {
        fs.mkdirSync("./data/audios/YouTube", { recursive: true });
    }
    ffmpeg_fluent(video)
        .audioBitrate(128)
        .save(`./data/audios/YouTube/${video_details.title}.mp3`)
        .on("progress", (p) => {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`${p.targetSize}kb downloaded`);
        })
        .on("end", () => {
            return response
                .status(200)
                .json({ message: "Audio File Downloaded" });
        })
        .on("error", () => {
            return response
                .status(200)
                .json({ message: "Something went wrong" });
        });
};

module.exports = {
    getVideo,
    getAudio,
};
