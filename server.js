const express = require("express");
const app = express();
const mongoose = require("mongoose");
const PORT = 3200;

// Routers
const videoRoute = require("./routes/download_video");
const audioRoute = require("./routes/download_audio");
const detailsRoute = require("./routes/video_details");

// Middleware
app.use(express.json());

// Routes
app.use("/api/details", detailsRoute);
app.use("/api/download/video", videoRoute);
app.use("/api/download/audio", audioRoute);

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://localhost:27017/Loadify");
}

app.listen(PORT, function () {
  console.log(`Server is running on ${PORT}`);
});
