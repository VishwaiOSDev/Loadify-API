const mongoose = require("mongoose");

const thumbnailSchema = mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
});

const fileSchema = mongoose.Schema({
  id: {
    type: String,
  },
  video_title: {
    type: String,
    required: true,
  },
  video_description: {
    type: String,
    required: true,
  },
  published_date: {
    type: String,
    required: true,
  },
  owner_channel_name: {
    type: String,
    required: true,
  },
  video_id: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    required: true,
  },
  thumbnails: {
    type: [thumbnailSchema],
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
});

module.exports = mongoose.model("Files", fileSchema);
