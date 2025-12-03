//post and delete reviews into database using API.
//NEED TO ADD /GET and /PUT endpoints
//the ability to get reviews to read, and update reviews that have already been posted.

import express from "express";
import multer from "multer";
import db from "../db.js";

const router = express.Router();

// Multer Setup for Album Cover Uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// POST /reviews
// Create: album (if needed) + review referencing album_id
router.post("/", upload.single("cover"), async (req, res) => {
  try {
    const { artist, album, genre, rating, description, user_id } = req.body;

    //Validate required fields
    //this throws 400 error if nothing matches
    if (!artist || !album || !genre || !rating || !user_id) {
      return res.status(400).json({
        error: "artist, album, genre, rating, and user_id are required",
      });
    }

    const parsedRating = Number(rating);

    if (parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5",
      });
    }

    // Album cover image
    const img = req.file ? req.file.filename : null;

    // 1. Check if album already exists
    const existingAlbum = await db.query(
      `
        SELECT id FROM albums
        WHERE title = $1 AND artist = $2
      `,
      [album, artist]
    );

    let albumId;

    // 2. Create album if it does NOT exist
    if (existingAlbum.rows.length === 0) {
      const newAlbum = await db.query(
        `
          INSERT INTO albums (title, artist, genre, img)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
        [album, artist, genre, img]
      );

      albumId = newAlbum.rows[0].id;
    } else {
      albumId = existingAlbum.rows[0].id;
    }

    // 3. Insert Review
    const newReview = await db.query(
      `
        INSERT INTO reviews (rating, review, user_id, album_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [parsedRating, description, user_id, albumId]
    );

    res.json({
      message: "Review posted successfully",
      review: newReview.rows[0],
    });
  } catch (err) {
    console.error("Error posting review:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await db.query(
      `
        SELECT reviews.*, albums.title, albums.artist, albums.genre, albums.img
        FROM reviews
        JOIN albums ON albums.id = reviews.album_id
        ORDER BY reviews.id DESC
      `
    );
    res.json(reviews.rows);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /reviews/:id
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT reviews.*, albums.title, albums.artist, albums.genre, albums.img
        FROM reviews
        JOIN albums ON albums.id = reviews.album_id
        WHERE reviews.id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching review:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
