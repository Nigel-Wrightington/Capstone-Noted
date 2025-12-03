// server/db/albums.js

// Import our shared query helper from db/client.js
const { query } = require("./client");

// Get ALL albums, including their average rating + how many reviews each one has
async function getAllAlbums() {
  // Run a SQL query to join albums and reviews
  const { rows } = await query(`
    SELECT
      a.*,  -- all album columns: id, title, artist, etc.
      ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,  -- average rating to 1 decimal
      COUNT(r.id) AS review_count                      -- how many reviews per album
    FROM albums a
    LEFT JOIN reviews r ON r.album_id = a.id           -- include albums even with no reviews
    GROUP BY a.id                                      -- group results by album
    ORDER BY a.title;                                  -- sort alphabetically by title
  `);

  // rows will be an array of album objects
  return rows;
}

// Get a single album by id, with its average rating + review count
async function getAlbumById(id) {
  const { rows } = await query(
    `
    SELECT
      a.*,
      ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
      COUNT(r.id) AS review_count
    FROM albums a
    LEFT JOIN reviews r ON r.album_id = a.id
    WHERE a.id = $1              -- only the album we are asking for
    GROUP BY a.id;
  `,
    [id] // $1 value
  );

  // rows[0] is the one album (or undefined if not found)
  return rows[0];
}

// Get a single album by id, PLUS all of its reviews and the users who wrote them
async function getAlbumWithReviews(id) {
  const { rows } = await query(
    `
    SELECT
      a.id,
      a.title,
      a.artist,
      a.genre,
      a.image_url,
      a.created_at,
      ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
      COUNT(r.id) AS review_count,
      -- Build an array of review objects as JSON
      COALESCE(
        json_agg(
          json_build_object(
            'id', r.id,
            'rating', r.rating,
            'comment', r.comment,
            'created_at', r.created_at,
            'user', json_build_object(
              'id', u.id,
              'username', u.username
            )
          )
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) AS reviews
    FROM albums a
    LEFT JOIN reviews r ON r.album_id = a.id
    LEFT JOIN users u ON r.user_id = u.id
    WHERE a.id = $1
    GROUP BY a.id;
  `,
    [id]
  );

  // Single album object that already includes a "reviews" array
  return rows[0];
}

// Export the functions so routes/albums.js can import and use them
module.exports = {
  getAllAlbums,
  getAlbumById,
  getAlbumWithReviews,
};
