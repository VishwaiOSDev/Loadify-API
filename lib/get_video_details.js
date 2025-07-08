const ytdl = require("ytdl-core");

module.exports = async function getVideoDetails(url) {
    const video_id = ytdl.getVideoID(url);
    try {
        const info = await ytdl.getInfo(video_id);
        return info;
    } catch (err) {
        console.log("Failed to get from YTDL" + err);
        throw err;
    }
};
