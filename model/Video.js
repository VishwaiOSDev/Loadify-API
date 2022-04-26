const mongoose = require("mongoose");

const videoSchema = mongoose.Schema({
  id: {
    type: String,
  },
  video_id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  thumbnail_image: {
    type: String,
    required: true,
  },
  video_quality: {
    type: [String],
    required: true,
  },
});

module.exports = mongoose.model("Video", videoSchema);
