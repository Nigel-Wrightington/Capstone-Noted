// db/seed.js
import db from "./client.js";
import bcrypt from "bcrypt";



async function seed() {
  await db.connect();

  console.log("Seeding Database");

// Reset Everything -- TO DO
  await db.query(`
    TRUNCATE users, albums, reviews RESTART IDENTITY CASCADE;
  `);
   const hashedPassword = await bcrypt.hash("password1", 10);

  // Insert 1 User
  const {
    rows: [user],
  } = await db.query(`
    INSERT INTO users (first_name, last_name, username, password)
    VALUES ('jane', 'doe', 'user1', $1)
    RETURNING *;
  `, [hashedPassword]);

  // Insert 3 Albums -- TO DO
  const albums = [
    ["Lover", "Taylor Swift", "Pop", "https://example.com/lover.jpg"],
    ["Encore", "Eminem", "Rap", "https://example.com/encore.jpg"],
    ["I Got A Name", "Jim Croce", "Rock", "https://example.com/jim.jpg"]
  ];

  for (const [title, artist, genre, img] of albums) {
      await db.query(
        `INSERT INTO albums (title, artist, genre, img)
         VALUES ($1, $2, $3, $4)`,
        [title, artist, genre, img]
      );
    }
  // Insert 3 Reviews -- TO DO
  const reviews = [
    [5, "A great record", user.id],
    [4, "A good album", user.id],
    [5, "Not one bad song", user.id]
  ];

    for (const [rating, review, user_id] of reviews) {
      await db.query(
        `INSERT INTO reviews (rating, review, user_id)
         VALUES ($1, $2, $3)`,
        [rating, review, user_id]
      );
    }

  console.log("Seeding Complete");
  await db.end();
}

seed();