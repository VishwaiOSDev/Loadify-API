const mongoose = require("mongoose");

const fileSchema = mongoose.Schema({
    id: {
        type: String,
    },
    video_id: {
        type: String,
        required: true,
    },
    qualities_available: {
        type: [String],
        required: true,
    },
    has_audio: {
        type: Boolean,
        default: false,
    },
    downloads: {
        type: Number,
        default: 1,
    },
});

module.exports = mongoose.model("Files", fileSchema);
