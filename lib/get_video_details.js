const ytdl = require("ytdl-core");

module.exports = async function getVideoDetails(video_id) {
  try {
    const info = await ytdl.getInfo(video_id);
    return info.videoDetails;
  } catch (err) {
    console.log(`Error geting info ${err}`);
  }
};
