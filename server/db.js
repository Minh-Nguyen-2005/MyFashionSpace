const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./site.db");

function ensureUsersImageColumn() {
  db.all(`PRAGMA table_info(users)`, (err, columns) => {
    if (err) {
      console.error("Failed to read users table info:", err.message);
      return;
    }
    const hasImage = Array.isArray(columns) && columns.some((col) => col.name === "image");
    if (!hasImage) {
      db.run(`ALTER TABLE users ADD COLUMN image TEXT`, (alterErr) => {
        if (alterErr) {
          console.error("Failed to add image column:", alterErr.message);
        }
      });
    }
  });
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      first TEXT,
      last TEXT,
      about TEXT,
      interests TEXT,
      image TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      friend_id INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  ensureUsersImageColumn();
});

module.exports = db;
