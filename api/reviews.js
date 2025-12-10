//post and delete reviews into database using API.
//NEED TO ADD /GET and /PUT endpoints
//the ability to get reviews to read, and update reviews that have already been posted.

import express from "express";
import multer from "multer";
import db from "#db/client";
import requireUser from "#middleware/requireUser";

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

async function updateReview({ id, userId, rating, comment }) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (rating !== undefined) {
    fields.push(`rating = $${idx++}`);
    values.push(rating);
  }
  if (comment !== undefined) {
    fields.push(`comment = $${idx++}`);
    values.push(comment);
  }

  if (fields.length === 0) {
    return null;
  }

  values.push(id);
  values.push(userId);

  const setClause = fields.join(", ");
  const { rows } = await client.query(
    `UPDATE reviews
     SET ${setClause}, updated_at = NOW()
     WHERE id = $${idx++} AND user_id = $${idx++}
     RETURNING *`,
    values
  );

  return rows[0];
}

// PUT /reviews/:id
router.put("/:id", requireUser, async (req, res, next) => {
  try {
    const reviewId = Number(req.params.id);
    if (!Number.isInteger(reviewId)) {
      return res.status(400).json({ error: "Invalid review id" });
    }

    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { rating, comment } = req.body;
    if (rating === undefined && comment === undefined) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    // Optionally check existence/ownership first (for clearer 404 vs 403)
    const updated = await updateReview({
      id: reviewId,
      userId,
      rating,
      comment,
    });

    if (!updated) {
      // Either review doesn't exist, or not owned by user (or nothing to update)
      return res
        .status(404)
        .json({ error: "Review not found or not owned by user" });
    }

    return res.json({ review: updated });
  } catch (err) {
    next(err);
  }
});

// get highest reviews for home page Lauren is working on this.






export default router;
