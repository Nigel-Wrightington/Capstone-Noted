//post and delete reviews into database using API.

import express from "express";
import multer from "multer"; //this will help store the image data for the cover art.
import path from "path";
import db from "../db.js"; // your database connection

const router = express.Router();

//multer (file upload) setup.
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// -----------------------------------------------------
// POST /reviews  — Create a new review
// -----------------------------------------------------
router.post("/", upload.single("cover"), async (req, res) => {
  try {
    const { artist, album, genre, rating, description } = req.body;

    // Validate required fields
    if (!artist || !album || !genre || !rating) {
      return res.status(400).json({
        error: "artist, album, genre, and rating are required.",
      });
    }

    const parsedRating = Number(rating);
    if (parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5.",
      });
    }

    // File path (optional)
    const imagePath = req.file ? req.file.filename : null;

    // Insert review into database
    const result = await db.query(
      `
      INSERT INTO reviews (artist, album, genre, rating, description, image_path)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [artist, album, genre, parsedRating, description, imagePath]
    );

    res.json({
      message: "Review created successfully!",
      review: result.rows[0],
    });
  } catch (err) {
    console.error("Error posting review:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -----------------------------------------------------
// GET /reviews — Fetch all reviews
// -----------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM reviews ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error loading reviews:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -----------------------------------------------------
// GET /reviews/:id — Fetch a single review
// -----------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM reviews WHERE id = $1`, [
      req.params.id,
    ]);

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
