const path = require("path");
const fs = require("fs");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "comments.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Init DB
const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/public", express.static(PUBLIC_DIR));

// CORS only if needed during dev (same-origin in prod is fine)
app.use(cors());

// Simple admin token from env (optional)
// If unset, PUT/DELETE are open (for study)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;
function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return next(); // open mode
  const token = req.get("X-Admin-Token");
  if (token && token === ADMIN_TOKEN) return next();
  return res.status(403).json({ error: "Forbidden" });
}

// API
app.get("/api/comments", (req, res) => {
  db.all(
    `SELECT id, author, text, created_at, updated_at FROM comments ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "db_error" });
      res.json(rows || []);
    }
  );
});

app.post("/api/comments", (req, res) => {
  const author = (req.body.author || "").trim();
  const text = (req.body.text || "").trim();
  if (!author || !text) return res.status(400).json({ error: "bad_request" });
  if (author.length > 50 || text.length > 1000)
    return res.status(413).json({ error: "too_long" });
  const now = Date.now();
  db.run(
    `INSERT INTO comments (author, text, created_at, updated_at) VALUES (?,?,?,?)`,
    [author, text, now, now],
    function (err) {
      if (err) return res.status(500).json({ error: "db_error" });
      res.status(201).json({
        id: this.lastID,
        author,
        text,
        created_at: now,
        updated_at: now,
      });
    }
  );
});

app.put("/api/comments/:id", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const text = (req.body.text || "").trim();
  if (!Number.isFinite(id) || !text)
    return res.status(400).json({ error: "bad_request" });
  if (text.length > 1000) return res.status(413).json({ error: "too_long" });
  const now = Date.now();
  db.run(
    `UPDATE comments SET text=?, updated_at=? WHERE id=?`,
    [text, now, id],
    function (err) {
      if (err) return res.status(500).json({ error: "db_error" });
      if (this.changes === 0)
        return res.status(404).json({ error: "not_found" });
      db.get(
        `SELECT id, author, text, created_at, updated_at FROM comments WHERE id=?`,
        [id],
        (err, row) => {
          if (err || !row) return res.status(500).json({ error: "db_error" });
          res.json(row);
        }
      );
    }
  );
});

app.delete("/api/comments/:id", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id))
    return res.status(400).json({ error: "bad_request" });
  db.run(`DELETE FROM comments WHERE id=?`, [id], function (err) {
    if (err) return res.status(500).json({ error: "db_error" });
    if (this.changes === 0) return res.status(404).json({ error: "not_found" });
    res.status(204).end();
  });
});

// Serve the about page as an example entry point (adjust if your router differs)
app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT, "about.html"));
});

// start
const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
