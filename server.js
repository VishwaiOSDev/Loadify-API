const express = require("express");
const app = express();
const mongoose = require("mongoose");
const PORT = 3201;

// Middleware
app.use(express.json());

// Routes
app.use("/api/yt/", require("./routes/youtube_routes"));

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://localhost:27017/Loadify");
}

app.listen(PORT, function () {
    console.log(`Server is running on ${PORT}`);
});
