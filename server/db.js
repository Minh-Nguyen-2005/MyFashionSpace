const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./site.db");

function ensureUsersColumns() {
  db.all(`PRAGMA table_info(users)`, (err, columns) => {
    if (err) {
      console.error("Failed to read users table info:", err.message);
      return;
    }
    const names = new Set((columns || []).map((col) => col.name));
    const addColumn = (name, type) => {
      if (names.has(name)) return;
      db.run(`ALTER TABLE users ADD COLUMN ${name} ${type}`, (alterErr) => {
        if (alterErr) {
          console.error(`Failed to add ${name} column:`, alterErr.message);
        }
      });
    };
    addColumn("image", "TEXT");
    addColumn("email", "TEXT");
    addColumn("password", "TEXT");
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
      password TEXT
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

  ensureUsersColumns();
});

module.exports = db;
