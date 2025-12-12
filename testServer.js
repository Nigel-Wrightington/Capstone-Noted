import express from "express";

const app = express();

app.get("/test", (req, res) => {
  res.send("Server works!");
});

app.listen(3000, () => console.log("Listening on port 3000..."));
