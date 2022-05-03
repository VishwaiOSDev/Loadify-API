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
  await mongoose.connect("mongodb://localhost/YouTube_Downloader");
}

app.listen(PORT, function () {
  console.log(`Server is running on ${PORT}`);
});

// TODO:- Completed MP3 later
// app.get("/download/mp3", async (req, res) => {
//   const youtuble_url = req.query.url;
//   const audio = ytdl(youtuble_url, { format: "mp3", filter: "audioonly" });
//   audio.pipe(fs.createWriteStream("audio.mp3"));
// });
