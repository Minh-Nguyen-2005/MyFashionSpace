// server/routes.js

const multer = require('multer');
const path = require('path');

// configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    // e.g. user-firstname_lastname_timestamp.jpg
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop();
    cb(null, `${req.body.first}_${req.body.last}_${timestamp}.${ext}`);
  }
});

const upload = multer({ storage: storage });


module.exports = function (app, db) {

  // PROFILE REDIRECT FOR LOGGED-IN USER
  app.get("/profile", (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect("/");
    }
    return res.redirect(`/profile.html?id=${userId}`);
  });

  // LOGIN
  app.post("/login", (req, res) => {
    const { first, last } = req.body;
    db.get(
      `SELECT * FROM users WHERE first = ? AND last = ?`,
      [first, last],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ success: false, message: "User not found" });

        req.session.userId = row.id;
        res.json({ success: true, profileUrl: `/profile.html?id=${row.id}` });
      }
    );
  });

  // SIGN UP
  app.post("/signup", upload.single('image'), (req, res) => {
    const { first, last, about, interests } = req.body;
    let imagePath = null;

    if (req.file) {
      // store file path relative to public
      imagePath = `/uploads/${req.file.filename}`;
    }

    db.run(
      `INSERT INTO users (first, last, about, interests, image) VALUES (?, ?, ?, ?, ?)`,
      [first, last, about, interests, imagePath],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        req.session.userId = this.lastID;
        res.json({
          success: true,
          profileUrl: `/profile.html?id=${this.lastID}`
        });
      }
    );
  });


  // ADD FRIEND
  app.post("/add-friend", (req, res) => {
    const { friendId } = req.body;
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    if (!friendId) {
      return res.status(400).json({ success: false, message: "Missing friendId" });
    }
    if (String(userId) === String(friendId)) {
      return res.status(400).json({ success: false, message: "Cannot add yourself as a friend" });
    }
    db.run(
      `INSERT INTO friends (user_id, friend_id) VALUES (?, ?)`,
      [userId, friendId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // REMOVE FRIEND
  app.post("/remove-friend", (req, res) => {
    const { friendId } = req.body;
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    if (!friendId) {
      return res.status(400).json({ success: false, message: "Missing friendId" });
    }
    db.run(
      `DELETE FROM friends WHERE user_id = ? AND friend_id = ?`,
      [userId, friendId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // ADD POST
  app.post("/post", (req, res) => {
    const { userId, content } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ success: false, message: "Missing userId or content" });
    }
    db.run(
      `INSERT INTO posts (user_id, content) VALUES (?, ?)`,
      [userId, content],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // GET USER
  app.get("/user/:id", (req, res) => {
    db.get(
      `SELECT * FROM users WHERE id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
      }
    );
  });

  // GET USERS (excluding current user if logged in)
  app.get("/users", (req, res) => {
    const userId = req.session.userId;
    const query = userId
      ? `SELECT * FROM users WHERE id != ? ORDER BY id DESC`
      : `SELECT * FROM users ORDER BY id DESC`;
    const params = userId ? [userId] : [];
    db.all(query, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    });
  });

  // GET FRIENDS BY USER ID
  app.get("/friends/:id", (req, res) => {
    db.all(
      `
      SELECT u.*
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ?
      `,
      [req.params.id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      }
    );
  });

  // GET FRIENDS FOR LOGGED-IN USER
  app.get("/friends", (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    db.all(
      `
      SELECT u.*
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ?
      `,
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      }
    );
  });

  // GET POSTS
  app.get("/posts/:id", (req, res) => {
    db.all(
      `SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC`,
      [req.params.id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      }
    );
  });

};
