// db/seed.js
import db from "./client.js";

async function seed() {
  await db.connect();

  console.log("Seeding Database");

// Reset Everything -- TO DO
  await db.query(`
    TRUNCATE users, albums, reviews RESTART IDENTITY CASCADE;
  `);

  // Insert 1 User
  const {
    rows: [user],
  } = await db.query(`
    INSERT INTO users (username, password)
    VALUES ('user1', 'password1')
    RETURNING *;
  `);
  // Insert 3 Albums -- TO DO
  const albums = [
    ["Lover", "Taylor Swift", "Pop", Img],
    ["Encore", "Eminem", "Rap", Img],
    ["I Got A Name", "Jim Croce", "Rock", Img]
  ]

  // Insert 3 Reviews -- TO DO
  const reviews = [
    [5, "A great record", 1001],
    [4, "A good album", 1001],
    [5, "Not one bad song", 1001]
  ]

  console.log("Seeding Complete");
  await db.end();
}

seed();