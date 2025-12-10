import app from "#app";
import db from "#db/client";

const PORT = process.env.PORT ?? 3000;

await db.connect();

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});

//GET /api/albums
app.get("/api/albums", async (req, res) => {
  try {
    const result = await query(
      `
      SELECT
        id,
        title,
        artist,
        genre
      FROM albums
      ORDER BY title;
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching albums:", error);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

// GET /api/albums/:id
app.get("/api/albums/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Get album info
    const albumResult = await query(
      `
      SELECT
        id,
        title,
        artist,
        genre,
        year
      FROM albums
      WHERE id = $1;
      `,
      [id]
    );

    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: "Album not found" });
    }

    const album = albumResult.rows[0];
    
// Get reviews for this album
    const reviewsResult = await query(
      `
      SELECT
        reviews.id,
        reviews.rating,
        reviews.comment,
        reviews.created_at,
        json_build_object(
          'id', users.id,
          'username', users.username
        ) AS "user"
      FROM reviews
      JOIN users ON reviews.user_id = users.id
      WHERE reviews.album_id = $1
      ORDER BY reviews.created_at DESC;
      `,
      [id]
    );

    album.reviews = reviewsResult.rows;

    res.json(album);
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({ error: "Failed to fetch album" });
  }
});

// GET /api/users/:id
app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const userResult = await query(
      `
      SELECT id, username, email
      FROM users
      WHERE id = $1;
      `,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    const reviewsResult = await query(
      `
      SELECT
        reviews.id,
        reviews.rating,
        reviews.comment,
        reviews.created_at,
        json_build_object(
          'id', albums.id,
          'title', albums.title,
          'artist', albums.artist
        ) AS "album"
      FROM reviews
      JOIN albums ON reviews.album_id = albums.id
      WHERE reviews.user_id = $1
      ORDER BY reviews.created_at DESC;
      `,
      [id]
    );

    user.reviews = reviewsResult.rows;

    res.json(user);
  } catch (error) {
    console.error("Error fetching user account:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

