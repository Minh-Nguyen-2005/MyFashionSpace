// server/routes.js

const multer = require('multer');
const path = require('path');

function sanitizeFileBase(value) {
  return String(value || 'item')
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '');
}

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

const itemStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = sanitizeFileBase(req.body.name);
    cb(null, `item_${base}_${timestamp}${ext}`);
  }
});

const itemUpload = multer({ storage: itemStorage });

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
    const { first, last, email, password } = req.body;
    if (!first || !last || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    db.get(
      `SELECT * FROM users WHERE first = ? AND last = ? AND email = ? AND password = ?`,
      [first, last, email, password],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ success: false, message: "Invalid credentials" });

        req.session.userId = row.id;
        db.run(`UPDATE users SET online = 1 WHERE id = ?`, [row.id], (updateErr) => {
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          res.json({ success: true, profileUrl: `/profile.html?id=${row.id}` });
        });
      }
    );
  });

  // CURRENT USER
  app.get("/me", (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    db.get(
      `SELECT * FROM users WHERE id = ?`,
      [req.session.userId],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
      }
    );
  });

  // SIGN UP
  app.post("/signup", upload.single('image'), (req, res) => {
    const { first, last, about, interests, email, password } = req.body;
    let imagePath = null;

    if (!first || !last || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (req.file) {
      // store file path relative to public
      imagePath = `/uploads/${req.file.filename}`;
    }

    db.run(
      `INSERT INTO users (first, last, about, interests, image, email, password, online) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [first, last, about, interests, imagePath, email, password],
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

  // LOGOUT
  app.post("/logout", (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.json({ success: true });
    }
    db.run(`UPDATE users SET online = 0 WHERE id = ?`, [userId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      req.session.destroy(() => {
        res.json({ success: true });
      });
    });
  });

  // UPLOAD ITEM
  app.post("/upload-item", itemUpload.single('image'), (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    const { name } = req.body;
    if (!name || !req.file) {
      return res.status(400).json({ success: false, message: "Missing item name or image" });
    }
    const imagePath = `/uploads/${req.file.filename}`;
    db.run(
      `INSERT INTO items (owner_id, name, image) VALUES (?, ?, ?)`,
      [userId, name, imagePath],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, itemId: this.lastID });
      }
    );
  });

  // LIST USER ITEMS
  app.get("/my-items", (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    db.all(
      `SELECT * FROM items WHERE owner_id = ? ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      }
    );
  });

  // CREATE SALE
  app.post("/sell-item", (req, res) => {
    const userId = req.session.userId;
    const { itemId, floorPrice } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    if (!itemId || !floorPrice) {
      return res.status(400).json({ success: false, message: "Missing itemId or floorPrice" });
    }
    db.get(
      `SELECT * FROM items WHERE id = ? AND owner_id = ?`,
      [itemId, userId],
      (err, item) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!item) return res.status(403).json({ success: false, message: "Not item owner" });
        db.get(
          `SELECT * FROM sales WHERE item_id = ? AND status = 'active'`,
          [itemId],
          (saleErr, sale) => {
            if (saleErr) return res.status(500).json({ error: saleErr.message });
            if (sale) return res.status(400).json({ success: false, message: "Item already for sale" });
            db.run(
              `INSERT INTO sales (item_id, seller_id, floor_price, status) VALUES (?, ?, ?, 'active')`,
              [itemId, userId, Number(floorPrice)],
              function (runErr) {
                if (runErr) return res.status(500).json({ error: runErr.message });
                res.json({ success: true, saleId: this.lastID });
              }
            );
          }
        );
      }
    );
  });

  // LIST MARKET ITEMS
  app.get("/market", (req, res) => {
    db.all(
      `
      SELECT s.id AS sale_id, s.floor_price, s.status,
             i.id AS item_id, i.name, i.image, i.owner_id
      FROM sales s
      JOIN items i ON s.item_id = i.id
      WHERE s.status = 'active'
      ORDER BY s.created_at DESC
      `,
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      }
    );
  });

  // LIST USER SALES
  app.get("/my-sales", (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    db.all(
      `
      SELECT s.id AS sale_id, s.floor_price, s.status,
             i.id AS item_id, i.name, i.image
      FROM sales s
      JOIN items i ON s.item_id = i.id
      WHERE s.seller_id = ? AND s.status = 'active'
      ORDER BY s.created_at DESC
      `,
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      }
    );
  });

  // SALE DETAILS
  app.get("/sale/:id", (req, res) => {
    db.get(
      `
      SELECT s.id AS sale_id, s.floor_price, s.status, s.seller_id,
             i.id AS item_id, i.name, i.image
      FROM sales s
      JOIN items i ON s.item_id = i.id
      WHERE s.id = ?
      `,
      [req.params.id],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
      }
    );
  });

  // LIST BIDS FOR SALE
  app.get("/bids/:saleId", (req, res) => {
    db.all(
      `
      SELECT b.id, b.bid_price, b.created_at,
             u.id AS user_id, u.first, u.last, u.image
      FROM bids b
      JOIN users u ON b.bidder_id = u.id
      WHERE b.sale_id = ?
      ORDER BY b.bid_price DESC, b.created_at DESC
      `,
      [req.params.saleId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      }
    );
  });

  // PLACE BID
  app.post("/bid", (req, res) => {
    const userId = req.session.userId;
    const { saleId, bidPrice } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    if (!saleId || !bidPrice) {
      return res.status(400).json({ success: false, message: "Missing saleId or bidPrice" });
    }
    db.get(
      `SELECT * FROM sales WHERE id = ? AND status = 'active'`,
      [saleId],
      (err, sale) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });
        if (String(sale.seller_id) === String(userId)) {
          return res.status(400).json({ success: false, message: "Cannot bid on your own item" });
        }
        const price = Number(bidPrice);
        if (!(price > Number(sale.floor_price))) {
          return res.status(400).json({ success: false, message: "Bid must be higher than floor price" });
        }
        db.get(
          `SELECT * FROM bids WHERE sale_id = ? AND bidder_id = ?`,
          [saleId, userId],
          (bidErr, existingBid) => {
            if (bidErr) return res.status(500).json({ error: bidErr.message });
            if (existingBid) {
              if (!(price > Number(existingBid.bid_price))) {
                return res.status(400).json({ success: false, message: "New bid must be higher than your current bid" });
              }
              db.run(
                `UPDATE bids SET bid_price = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [price, existingBid.id],
                function (updateErr) {
                  if (updateErr) return res.status(500).json({ error: updateErr.message });
                  res.json({ success: true, bidId: existingBid.id });
                }
              );
            } else {
              db.run(
                `INSERT INTO bids (sale_id, bidder_id, bid_price) VALUES (?, ?, ?)`,
                [saleId, userId, price],
                function (runErr) {
                  if (runErr) return res.status(500).json({ error: runErr.message });
                  res.json({ success: true, bidId: this.lastID });
                }
              );
            }
          }
        );
      }
    );
  });

  // ACCEPT BID
  app.post("/accept-bid", (req, res) => {
    const userId = req.session.userId;
    const { bidId } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    if (!bidId) {
      return res.status(400).json({ success: false, message: "Missing bidId" });
    }
    db.get(
      `
      SELECT b.id AS bid_id, b.bid_price, b.bidder_id, s.id AS sale_id, s.item_id, s.seller_id
      FROM bids b
      JOIN sales s ON b.sale_id = s.id
      WHERE b.id = ? AND s.status = 'active'
      `,
      [bidId],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ success: false, message: "Bid not found" });
        if (String(row.seller_id) !== String(userId)) {
          return res.status(403).json({ success: false, message: "Not sale owner" });
        }
        db.run(
          `UPDATE items SET owner_id = ? WHERE id = ?`,
          [row.bidder_id, row.item_id],
          (itemErr) => {
            if (itemErr) return res.status(500).json({ error: itemErr.message });
            db.run(
              `UPDATE sales SET status = 'sold' WHERE id = ?`,
              [row.sale_id],
              (saleErr) => {
                if (saleErr) return res.status(500).json({ error: saleErr.message });
                res.json({ success: true });
              }
            );
          }
        );
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
    db.get(
      `
      SELECT * FROM friends
      WHERE (user_id = ? AND friend_id = ?)
         OR (user_id = ? AND friend_id = ?)
      `,
      [userId, friendId, friendId, userId],
      (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existing) {
          if (existing.status === "accepted") {
            return res.status(400).json({ success: false, message: "Already friends" });
          }
          if (String(existing.user_id) === String(userId)) {
            return res.status(400).json({ success: false, message: "Friend request already sent" });
          }
          return res.status(400).json({ success: false, message: "You already have a pending request from them" });
        }
        db.run(
          `INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')`,
          [userId, friendId],
          function (runErr) {
            if (runErr) return res.status(500).json({ error: runErr.message });
            res.json({ success: true });
          }
        );
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
      `
      DELETE FROM friends
      WHERE (user_id = ? AND friend_id = ?)
         OR (user_id = ? AND friend_id = ?)
      `,
      [userId, friendId, friendId, userId],
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

  // UPDATE PROFILE BLURBS
  app.post("/update-profile", (req, res) => {
    const userId = req.session.userId;
    const { about, interests } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    if (typeof about !== "string" && typeof interests !== "string") {
      return res.status(400).json({ success: false, message: "No updates provided" });
    }
    const updates = [];
    const params = [];
    if (typeof about === "string") {
      updates.push("about = ?");
      params.push(about);
    }
    if (typeof interests === "string") {
      updates.push("interests = ?");
      params.push(interests);
    }
    params.push(userId);
    db.run(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      params,
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
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
      SELECT DISTINCT u.*
      FROM friends f
      JOIN users u ON u.id = CASE
        WHEN f.user_id = ? THEN f.friend_id
        ELSE f.user_id
      END
      WHERE (f.user_id = ? OR f.friend_id = ?)
        AND f.status = 'accepted'
      `,
      [req.params.id, req.params.id, req.params.id],
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
      SELECT DISTINCT u.*
      FROM friends f
      JOIN users u ON u.id = CASE
        WHEN f.user_id = ? THEN f.friend_id
        ELSE f.user_id
      END
      WHERE (f.user_id = ? OR f.friend_id = ?)
        AND f.status = 'accepted'
      `,
      [userId, userId, userId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      }
    );
  });

  // GET FRIEND REQUESTS FOR LOGGED-IN USER
  app.get("/friend-requests", (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    db.all(
      `
      SELECT u.*
      FROM friends f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ? AND f.status = 'pending'
      `,
      [userId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      }
    );
  });

  // ACCEPT FRIEND REQUEST
  app.post("/accept-friend", (req, res) => {
    const userId = req.session.userId;
    const { friendId } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    if (!friendId) {
      return res.status(400).json({ success: false, message: "Missing friendId" });
    }
    db.run(
      `
      UPDATE friends
      SET status = 'accepted'
      WHERE user_id = ? AND friend_id = ? AND status = 'pending'
      `,
      [friendId, userId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run(
          `DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'`,
          [userId, friendId],
          (cleanErr) => {
            if (cleanErr) return res.status(500).json({ error: cleanErr.message });
            res.json({ success: true });
          }
        );
      }
    );
  });

  // DECLINE FRIEND REQUEST
  app.post("/decline-friend", (req, res) => {
    const userId = req.session.userId;
    const { friendId } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    if (!friendId) {
      return res.status(400).json({ success: false, message: "Missing friendId" });
    }
    db.run(
      `DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'`,
      [friendId, userId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  });

  // LIST PEOPLE WITH RELATIONSHIP STATUS
  app.get("/people", (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }
    db.all(
      `
      SELECT u.*, f.status, f.user_id AS from_id, f.friend_id AS to_id
      FROM users u
      LEFT JOIN friends f
        ON ((f.user_id = ? AND f.friend_id = u.id)
         OR (f.friend_id = ? AND f.user_id = u.id))
      WHERE u.id != ?
      ORDER BY u.id DESC
      `,
      [userId, userId, userId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const byId = new Map();
        (rows || []).forEach((row) => {
          const existing = byId.get(row.id);
          const status = row.status
            ? (row.status === "accepted"
              ? "friends"
              : (String(row.from_id) === String(userId) ? "pending_out" : "pending_in"))
            : "none";
          if (!existing || existing.relationship === "none") {
            byId.set(row.id, { ...row, relationship: status });
          }
        });
        res.json(Array.from(byId.values()));
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
