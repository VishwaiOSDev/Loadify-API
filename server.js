const express = require("express");
const app = express();
const mongoose = require("mongoose");
const PORT = 3200;

// Middleware
app.use(express.json());

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://localhost/YouTube_Downloader");
}

app.listen(PORT, function () {
  console.log(`Server is running on ${PORT}`);
});
