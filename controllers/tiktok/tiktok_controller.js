const { TiktokDL } = require("@tobyg74/tiktok-api-dl");

const isValidTikTokUrl = (url) => {
    const urlRegex =
        /^.*https:\/\/(?:m|www|vm)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video)\/|\?shareId=|\&item_id=)(\d+))|\w+)/;
    return urlRegex.test(url);
};

const getTikTokVideo = (request, response) => {
    try {
        const url = request.query.url;
        if (!url) {
            throw new Error("URL parameter is missing");
        }

        if (!isValidTikTokUrl(url)) {
            throw new Error("Invalid TikTok video URL");
        }

        TiktokDL(url, { version: "v1" })
            .then((result) => {
                response.json(result);
            })
            .catch((error) => {
                console.error(`Failed with error: ${error}`);
                response.status(500).json({ error: "Internal Server Error" });
            });
    } catch (error) {
        console.error(`Error: ${error.message}`);
        response.status(400).json({ error: error.message });
    }
};

module.exports = {
    getTikTokVideo,
    isValidTikTokUrl,
};
