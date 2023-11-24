const instagramDl = require("@sasmeee/igdl");

const isValidInstagramUrl = (url) => {
    // Validate Instagram URL for reels, stories, or photos
    const reelRegex = /https:\/\/www\.instagram\.com\/reel\/[a-zA-Z0-9_-]+\/?/;
    const storyRegex =
        /https:\/\/www\.instagram\.com\/stories\/[a-zA-Z0-9_-]+\/[0-9]+\/?/;
    const photoRegex = /https:\/\/www\.instagram\.com\/p\/[a-zA-Z0-9_-]+\/?/;
    // Check if the URL matches any of the other patterns
    return reelRegex.test(url) || storyRegex.test(url) || photoRegex.test(url);
};

const getInstaVideo = async (request, response) => {
    try {
        const url = request.query.url;

        // Validate the Instagram URL
        if (!isValidInstagramUrl(url)) {
            return response
                .status(400)
                .json({ error: "Invalid or unsupported Instagram URL" });
        }

        try {
            const dataList = await instagramDl(url);

            // Send the response with the data
            response.json(dataList);
        } catch (instagramDlError) {
            console.error("InstagramDl Error:", instagramDlError);

            // Determine the appropriate status code and message based on the error
            let statusCode = 500;
            let errorMessage = "Internal Server Error";

            // Customize error handling as needed
            if (
                instagramDlError.message.includes("Some specific error message")
            ) {
                statusCode = 400;
                errorMessage = "Bad Request";
            }

            // Send an error response
            response.status(statusCode).json({ error: errorMessage });
        }
    } catch (error) {
        // Handle other errors appropriately
        console.error("Error:", error);

        // Determine the appropriate status code and message based on the error
        let statusCode = 500;
        let errorMessage = "Internal Server Error";

        if (error instanceof SomeSpecificError) {
            statusCode = 400; // or any other appropriate status code
            errorMessage = "Bad Request";
        }

        // Send an error response
        response.status(statusCode).json({ error: errorMessage });
    }
};

module.exports = {
    getInstaVideo,
};
