module.exports = function (app, db) {

  // LOGIN
  app.post("/login", (req, res) => {
    const { first, last } = req.body;
    db.get(
      `SELECT * FROM users WHERE first=? AND last=?`,
      [first, last],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "User not found" });

        req.session.userId = row.id;
        res.json({ success: true, profileUrl: `/profile.html?id=${row.id}` });
      }
    );
  });

  // SIGN UP
  app.post("/signup", (req, res) => {
    const { first, last, about, interests } = req.body;
    db.run(
      `INSERT INTO users (first, last, about, interests) VALUES (?, ?, ?, ?)`,
      [first, last, about, interests],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        req.session.userId = this.lastID;
        res.json({ success: true, profileUrl: `/profile.html?id=${this.lastID}` });
      }
    );
  });

  // ADD FRIEND
  app.post("/add-friend", (req, res) => {
    const { userId, friendId } = req.body;
    db.run(
      `INSERT INTO friends (user_id, friend_id) VALUES (?, ?)`,
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
    db.get("SELECT * FROM users WHERE id=?", [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || {});
    });
  });

  // GET FRIENDS
  app.get("/friends/:id", (req, res) => {
    db.all(
      `
      SELECT u.*
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id=?
      `,
      [req.params.id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  });

};
