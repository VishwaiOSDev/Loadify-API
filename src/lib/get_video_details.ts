import * as ytdl from "ytdl-core";

export default async function getVideoDetails(url: string): Promise<ytdl.videoInfo> {
    const video_id = ytdl.getVideoID(url);
    try {
        const info = await ytdl.getInfo(video_id);
        return info;
    } catch (err) {
        console.log("Failed to get from YTDL" + err);
        throw err;
    }
}
