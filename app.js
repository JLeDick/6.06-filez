import express from "express";
import db from "#db/client";
const app = express();
export default app;

// body parse
app.use(express.json());

// get files
app.get("/files", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `
      SELECT files.*, folders.name AS folder_name
      FROM files
      JOIN folders 
      ON files.folder_id = folders.id
      `,
    );
    res.send(rows);
  } catch (e) {
    next(e);
  }
});

// get folders
app.get("/folders", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `
    SELECT * FROM folders
    `,
    );
    res.send(rows);
  } catch (e) {
    next(e);
  }
});

// get folders by id
app.get("/folders/:id", async (req, res, next) => {
  try {
    const { rows: folders } = await db.query(
      `
    SELECT * FROM folders
    WHERE id = $1
    `,
      [req.params.id],
    );

    // 404 if no exist
    if (!folders.length) {
      return res.status(404).send({ message: "folder not found" });
    }

    const { rows: files } = await db.query(
      `
      SELECT * FROM files 
      WHERE folder_id = $1
      `,
      [req.params.id],
    );

    const folder = folders[0];
    folder.files = files;
    res.send(folder);
  } catch (e) {
    next(e);
  }
});

// update folder - this one was rough wtf - it's so ugly
// I needed help on this. I thought I had this right like 12 times
app.post("/folders/:id/files", async (req, res, next) => {
  try {
    // Check if folder exists
    const { rows: folders } = await db.query(
      `
      SELECT * FROM folders 
      WHERE id = $1
      `,
      [req.params.id],
    );

    if (!folders.length) {
      return res.status(404).send({ message: "folder not found" });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).send({ message: "Missing name and size" });
    }

    if (!req.body.name || !req.body.size) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const { rows } = await db.query(
      `
      INSERT INTO files (name, size, folder_id)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [req.body.name, req.body.size, req.params.id],
    );

    res.status(201).send(rows[0]);
  } catch (e) {
    next(e);
  }
});

// error handler => asyncHandlers make way more sense
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ mesage: err.message || "Internal Server Error" });
});
