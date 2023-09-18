import express, { Application } from "express";
import youtubeRoutes from "./routes/youtube_routes.js";

const app: Application = express();
const PORT: number = 3200;

// Middleware
app.use(express.json());

// Routes
app.use("/api/yt/", youtubeRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
