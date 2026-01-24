// Author: Minh Nguyen
// Database

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./site.db");

function ensureUsersColumns(done) {
  db.all(`PRAGMA table_info(users)`, (err, columns) => {
    if (err) {
      console.error("Failed to read users table info:", err.message);
      if (done) done();
      return;
    }
    const names = new Set((columns || []).map((col) => col.name));
    const columnsToAdd = [
      { name: "image", type: "TEXT" },
      { name: "email", type: "TEXT" },
      { name: "password", type: "TEXT" },
      { name: "online", type: "INTEGER" }
    ].filter((col) => !names.has(col.name));

    if (columnsToAdd.length === 0) {
      if (done) done();
      return;
    }

    let pending = columnsToAdd.length;
    columnsToAdd.forEach((col) => {
      db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`, (alterErr) => {
        if (alterErr) {
          console.error(`Failed to add ${col.name} column:`, alterErr.message);
        }
        pending -= 1;
        if (pending === 0 && done) done();
      });
    });
  });
}

function ensureFriendsColumns(done) {
  db.all(`PRAGMA table_info(friends)`, (err, columns) => {
    if (err) {
      console.error("Failed to read friends table info:", err.message);
      if (done) done();
      return;
    }
    const names = new Set((columns || []).map((col) => col.name));
    if (names.has("status")) {
      if (done) done();
      return;
    }
    db.run(`ALTER TABLE friends ADD COLUMN status TEXT`, (alterErr) => {
      if (alterErr) {
        console.error("Failed to add status column:", alterErr.message);
      }
      if (done) done();
    });
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
      image TEXT,
      email TEXT,
      password TEXT,
      online INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      friend_id INTEGER,
      status TEXT DEFAULT 'accepted'
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

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      owner_id INTEGER,
      name TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY,
      item_id INTEGER,
      seller_id INTEGER,
      floor_price REAL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY,
      sale_id INTEGER,
      bidder_id INTEGER,
      bid_price REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  ensureUsersColumns(() => {
    db.run(`UPDATE users SET online = 0`, (err) => {
      if (err) {
        console.error("Failed to reset online status:", err.message);
      }
    });
  });

  ensureFriendsColumns(() => {
    db.run(`UPDATE friends SET status = 'accepted' WHERE status IS NULL`, (err) => {
      if (err) {
        console.error("Failed to backfill friends status:", err.message);
      }
    });
  });
});

module.exports = db;
