import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import session from "express-session";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------- ENSURE UPLOAD FOLDER ----------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ---------- VIEW ENGINE ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// ---------- DB ----------
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ---------- MULTER (CORRECT) ----------
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

const upload = multer({ storage }).array("media_files[]");

// ---------- ROUTES ----------
app.get("/admin/projects/new", (req, res) => {
  res.render("admin-new-project", {
    pageTitle: "Add Project",
    error: null,
  });
});

app.post("/admin/projects/new", upload, async (req, res) => {
  const { project_name, project_short_description, project_type } = req.body;

  if (!project_name || !project_short_description || !project_type) {
    return res.render("admin-new-project", {
      pageTitle: "Add Project",
      error: "All fields required",
    });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO projects (project_name, project_short_description, project_type)
       VALUES (?, ?, ?)`,
      [project_name, project_short_description, project_type]
    );

    const projectId = result.insertId;

    let media_type = req.body.media_type || [];
    let media_desc = req.body.media_desc || [];
    let media_youtube = req.body.media_youtube || [];

    if (!Array.isArray(media_type)) media_type = [media_type];
    if (!Array.isArray(media_desc)) media_desc = [media_desc];
    if (!Array.isArray(media_youtube)) media_youtube = [media_youtube];

    const files = req.files || [];
    let fileIndex = 0;
    let sortOrder = 1;

    for (let i = 0; i < media_type.length; i++) {
      if (media_type[i] === "file" && files[fileIndex]) {
        const file = files[fileIndex++];
        const kind = file.mimetype.startsWith("video") ? "video" : "image";

        await pool.query(
          `INSERT INTO project_media
           (project_id, media_type, media_path, media_description, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [
            projectId,
            kind,
            "/uploads/" + file.filename,
            media_desc[i] || "",
            sortOrder++,
          ]
        );
      }

      if (media_type[i] === "youtube" && media_youtube[i]) {
        await pool.query(
          `INSERT INTO project_media
           (project_id, media_type, media_path, media_description, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [
            projectId,
            "youtube",
            media_youtube[i],
            media_desc[i] || "",
            sortOrder++,
          ]
        );
      }
    }

    res.redirect("/projects");
  } catch (err) {
    console.error(err);
    res.status(500).send("ERROR");
  }
});

// ---------- START ----------
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
