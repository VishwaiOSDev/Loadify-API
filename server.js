const express = require("express");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const rateLimitMiddleware = require("./lib/rate_limiter");
const app = express();
const PORT = 3200;

app.set("trust proxy", true);

// Create a directory for log files (if it doesn't exist)
const logDirectory = path.join(__dirname, "logs");
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// Define the log file path
const logFilePath = path.join(logDirectory, "access.log");

// Create a write stream to log file
const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

// Define the log format for Morgan
const morganFormat =
    '[:date[clf]] :remote-addr ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Middleware configuration
app.use(express.json()); // Parse JSON request bodies
app.use(morgan(morganFormat)); // Log to console
app.use(morgan(morganFormat, { stream: logStream })); // Log to file
app.use(rateLimitMiddleware); // Rate Limter

// Serve static files from the "docs" folder
app.use(express.static(path.join(__dirname, "docs")));

// Define your routes
app.use("/api/yt/", require("./routes/youtube_routes"));
app.use("/api/ig/", require("./routes/instagram_routes"));
app.use("/api/tk/", require("./routes/tiktok_routes"));

app.get("/", (_, res) => {
    // Send the index.html file
    res.sendFile(path.join(__dirname, "docs", "index.html"));
});

// Start the Express server
app.listen(PORT, function () {
    console.log(`Server is running on ${PORT}`);
});
