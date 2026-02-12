// ===============================
// app.js (FINAL – FULL FILE)
// ===============================

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import session from "express-session";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import multer from "multer";
import nodemailer from "nodemailer";

dotenv.config();

// ===============================
// BASIC SETUP
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===============================
// ENSURE UPLOADS FOLDER EXISTS
// ===============================
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ===============================
// VIEW ENGINE
// ===============================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===============================
// MIDDLEWARE
// ===============================
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Make admin flags available in all views
app.use((req, res, next) => {
  res.locals.isAdmin = !!req.session.isAdmin;
  res.locals.canEdit = !!req.session.canEdit;
  next();
});

// ===============================
// DATABASE
// ===============================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// ===============================
// MULTER (MULTIPLE FILES SAFE)
// ===============================
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({ storage }).any();

// ===============================
// AUTH HELPERS
// ===============================
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  return res.redirect("/admin/login");
}

// ===============================
// PUBLIC ROUTES
// ===============================

// Home
app.get("/", (req, res) => {
  res.render("index", { pageTitle: "Home" });
});

// Projects list
app.get("/projects", async (req, res) => {
  try {
    const [projects] = await pool.query(`
      SELECT project_id, project_name, project_short_description,
             project_type, cover_image
      FROM projects
      ORDER BY created_at DESC
    `);

    res.render("projects", {
      pageTitle: "Projects",
      projects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading projects");
  }
});

// Project detail
app.get("/projects/:id", async (req, res) => {
  const projectId = req.params.id;

  try {
    const [[project]] = await pool.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [projectId]
    );

    if (!project) {
      return res.status(404).send("Project not found");
    }

    const [mediaList] = await pool.query(
      `SELECT * FROM project_media
       WHERE project_id = ?
       ORDER BY sort_order, created_at`,
      [projectId]
    );

    res.render("project-detail", {
      pageTitle: project.project_name,
      project,
      mediaList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading project");
  }
});

// About
app.get("/about", (req, res) => {
  res.render("about", { pageTitle: "About" });
});

// ===============================
// CONTACT (GET)
// ===============================
app.get("/contact", (req, res) => {
  res.render("contact", {
    pageTitle: "Contact",
    query: req.query,
  });
});

// ===============================
// CONTACT (POST)
// ===============================
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      family: 4, // ✅ FORCE IPv4 (fixes ENETUNREACH)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"Portfolio Contact" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: `New message from ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `,
    });

    res.redirect("/contact?success=true");
  } catch (err) {
    console.error(err);
    res.redirect("/contact?error=true");
  }
});

// ===============================
// ADMIN AUTH
// ===============================
app.get("/admin/login", (req, res) => {
  res.render("admin-login", { pageTitle: "Admin Login", error: null });
});

app.post("/admin/login", (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect("/admin/projects/new");
  }

  res.render("admin-login", {
    pageTitle: "Admin Login",
    error: "Incorrect password",
  });
});

app.post("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ===============================
// ADMIN: ADD PROJECT
// ===============================
app.get("/admin/projects/new", requireAdmin, (req, res) => {
  res.render("admin-new-project", {
    pageTitle: "Add Project",
    error: null,
  });
});

app.post(
  "/admin/projects/new",
  requireAdmin,
  upload,
  async (req, res) => {
    const {
      project_name,
      project_short_description,
      project_type,
    } = req.body;

    if (!project_name || !project_short_description || !project_type) {
      return res.render("admin-new-project", {
        pageTitle: "Add Project",
        error: "All fields are required",
      });
    }

    try {
      const [result] = await pool.query(
        `INSERT INTO projects
         (project_name, project_short_description, project_type)
         VALUES (?, ?, ?)`,
        [project_name, project_short_description, project_type]
      );

      const projectId = result.insertId;

      const media_type = [].concat(req.body.media_type || []);
      const media_desc = [].concat(req.body.media_desc || []);
      const media_youtube = [].concat(req.body.media_youtube || []);
      const files = req.files || [];

      let fileIndex = 0;
      let sortOrder = 1;

      for (let i = 0; i < media_type.length; i++) {
        const type = media_type[i];
        const caption = media_desc[i] || "";

        if (type === "file") {
          const file = files[fileIndex];
          if (!file) continue;

          const kind = file.mimetype.startsWith("video")
            ? "video"
            : "image";

          await pool.query(
            `INSERT INTO project_media
             (project_id, media_type, media_path, media_description, sort_order)
             VALUES (?, ?, ?, ?, ?)`,
            [
              projectId,
              kind,
              "/uploads/" + file.filename,
              caption,
              sortOrder++,
            ]
          );

          fileIndex++;
        }

        if (type === "youtube") {
          const link = media_youtube[i];
          if (!link || !link.trim()) continue;

          await pool.query(
            `INSERT INTO project_media
             (project_id, media_type, media_path, media_description, sort_order)
             VALUES (?, ?, ?, ?, ?)`,
            [
              projectId,
              "youtube",
              link.trim(),
              caption,
              sortOrder++,
            ]
          );
        }
      }

      res.redirect("/projects");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error saving project");
    }
  }
);

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
