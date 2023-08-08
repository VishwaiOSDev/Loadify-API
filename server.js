const express = require("express");
const app = express();
const PORT = 3200;

// Middleware
app.use(express.json());

// Routes
app.use("/api/yt/", require("./routes/youtube_routes"));

app.listen(PORT, function () {
    console.log(`Server is running on ${PORT}`);
});
