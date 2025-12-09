// app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import dotenv from "dotenv";
import mysql from "mysql2/promise";   // MySQL
import multer from "multer";

// Load .env
dotenv.config();

// Resolve directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Parse POST form data
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultSecret",
    resave: false,
    saveUninitialized: false,
  })
);

// Make login flags available in all EJS views
app.use((req, res, next) => {
  res.locals.isAdmin = !!(req.session && req.session.isAdmin);
  res.locals.canEdit = !!(req.session && req.session.canEdit); // for edit/delete password
  next();
});

// Middleware: require password specifically for edit/delete
function requireEditAccess(req, res, next) {
  if (req.session && req.session.canEdit) {
    return next();
  }
  const redirectTo = encodeURIComponent(req.originalUrl);
  return res.redirect(`/admin/check-password?go=${redirectTo}`);
}

// MySQL Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Multer upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

// Accept ANY uploaded files (unlimited & dynamic names)
const upload = multer({ storage: storage }).any();

// Middleware: Admin-only pages (for create project)
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect("/admin/login");
}

// ===============================
// PUBLIC ROUTES
// ===============================

// Home
app.get("/", (req, res) => {
  res.render("index", { pageTitle: "Home" });
});

// Show all projects
app.get("/projects", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT project_id,
             project_name,
             project_short_description,
             project_type,
             cover_image
      FROM projects
      ORDER BY created_at DESC
    `);

    res.render("projects", {
      pageTitle: "Projects",
      projects: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading projects");
  }
});

// About
app.get("/about", (req, res) => {
  res.render("about", { pageTitle: "About" });
});

// Contact
app.get("/contact", (req, res) => {
  res.render("contact", { pageTitle: "Contact" });
});

// ===============================
// PROJECT DETAIL PAGE
// ===============================
app.get("/projects/:id", async (req, res) => {
  const projectId = req.params.id;

  try {
    const [projectRows] = await pool.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [projectId]
    );

    if (projectRows.length === 0) {
      return res.status(404).send("Project not found");
    }

    const project = projectRows[0];

    const [mediaRows] = await pool.query(
      `SELECT * FROM project_media 
       WHERE project_id = ? 
       ORDER BY sort_order, created_at, media_id`,
      [projectId]
    );

    res.render("project-detail", {
      pageTitle: project.project_name,
      project,
      mediaList: mediaRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading project details");
  }
});

// ===============================
// EDIT / DELETE PASSWORD CHECK
// (uses the same ADMIN_PASSWORD)
// ===============================
app.get("/admin/check-password", (req, res) => {
  res.render("admin-check-password", {
    pageTitle: "Enter Password",
    error: null,
    go: req.query.go || "/projects",
  });
});

app.post("/admin/check-password", (req, res) => {
  const { password, go } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    req.session.canEdit = true; // allow edit/delete in this session
    return res.redirect(go || "/projects");
  }

  return res.status(401).render("admin-check-password", {
    pageTitle: "Enter Password",
    error: "Incorrect password",
    go: go || "/projects",
  });
});

// ===============================
// ADMIN: EDIT / DELETE PROJECT
// ===============================

// Edit form
app.get("/admin/projects/:id/edit", requireEditAccess, async (req, res) => {
  const projectId = req.params.id;

  try {
    const [projectRows] = await pool.query(
      "SELECT project_id, project_name, project_short_description, project_type, cover_image FROM projects WHERE project_id = ?",
      [projectId]
    );

    if (projectRows.length === 0) {
      return res.status(404).send("Project not found");
    }

    const project = projectRows[0];

    const [mediaRows] = await pool.query(
      "SELECT media_id, media_type, media_path, media_description, sort_order FROM project_media WHERE project_id = ? ORDER BY sort_order, created_at, media_id",
      [projectId]
    );

    res.render("admin-edit-project", {
      pageTitle: `Edit: ${project.project_name}`,
      project,
      mediaList: mediaRows,
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading edit form");
  }
});

// Save edits
app.post("/admin/projects/:id/edit", requireEditAccess, async (req, res) => {
  const projectId = req.params.id;
  const { project_name, project_short_description, project_type } = req.body;

  if (!project_name || !project_short_description || !project_type) {
    const [projectRows] = await pool.query(
      "SELECT project_id, project_name, project_short_description, project_type, cover_image FROM projects WHERE project_id = ?",
      [projectId]
    );
    const [mediaRows] = await pool.query(
      "SELECT media_id, media_type, media_path, media_description, sort_order FROM project_media WHERE project_id = ? ORDER BY sort_order, created_at, media_id",
      [projectId]
    );

    return res.status(400).render("admin-edit-project", {
      pageTitle: `Edit: ${projectRows[0]?.project_name || "Project"}`,
      project: projectRows[0],
      mediaList: mediaRows,
      error: "Please fill in all required fields.",
    });
  }

  try {
    // 1) Update main project info
    await pool.query(
      "UPDATE projects SET project_name = ?, project_short_description = ?, project_type = ? WHERE project_id = ?",
      [project_name, project_short_description, project_type, projectId]
    );

    // 2) Update media descriptions
    let { media_id, media_desc } = req.body;

    if (media_id && !Array.isArray(media_id)) media_id = [media_id];
    if (media_desc && !Array.isArray(media_desc)) media_desc = [media_desc];

    if (media_id && media_desc) {
      for (let i = 0; i < media_id.length; i++) {
        await pool.query(
          "UPDATE project_media SET media_description = ? WHERE media_id = ?",
          [media_desc[i] || "", media_id[i]]
        );
      }
    }

    res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating project");
  }
});

// Delete project
app.post("/admin/projects/:id/delete", requireEditAccess, async (req, res) => {
  const projectId = req.params.id;

  try {
    await pool.query("DELETE FROM projects WHERE project_id = ?", [projectId]);
    res.redirect("/projects");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting project");
  }
});

// ===============================
// SET COVER IMAGE FOR PROJECT
// ===============================
app.post("/admin/projects/:projectId/set-cover/:mediaId", requireEditAccess, async (req, res) => {
  const { projectId, mediaId } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT media_path FROM project_media WHERE media_id = ? AND project_id = ?",
      [mediaId, projectId]
    );

    if (rows.length === 0) {
      return res.status(404).send("Media not found.");
    }

    const coverPath = rows[0].media_path;

    await pool.query(
      "UPDATE projects SET cover_image = ? WHERE project_id = ?",
      [coverPath, projectId]
    );

    res.redirect(`/projects/${projectId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error setting cover image");
  }
});

// ===============================
// ADMIN LOGIN (for CREATE PROJECT)
// ===============================
app.get("/admin/login", (req, res) => {
  res.render("admin-login", { pageTitle: "Admin Login", error: null });
});

app.post("/admin/login", (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect("/admin/projects/new");
  }

  res.status(401).render("admin-login", {
    pageTitle: "Admin Login",
    error: "Incorrect password",
  });
});

app.post("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/projects"));
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

app.post("/admin/projects/new", requireAdmin, upload, async (req, res) => {
  const { project_name, project_short_description, project_type } = req.body;

  if (!project_name || !project_short_description || !project_type) {
    return res.status(400).render("admin-new-project", {
      pageTitle: "Add Project",
      error: "Please fill in all required fields.",
    });
  }

  try {
    // 1) Insert project
    const [result] = await pool.query(
      `INSERT INTO projects (project_name, project_short_description, project_type)
       VALUES (?, ?, ?)`,
      [project_name, project_short_description, project_type]
    );

    const projectId = result.insertId;

    // 2) Insert all uploaded media
    req.files.forEach(async (file, index) => {
      await pool.query(
        `INSERT INTO project_media 
         (project_id, media_type, media_path, media_description, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          projectId,
          file.mimetype.startsWith("video") ? "video" : "image",
          "/uploads/" + file.filename,
          req.body[`media_desc_${index + 1}`] || "",
          index + 1,
        ]
      );
    });

    res.redirect("/projects");
  } catch (err) {
    console.error(err);
    res.status(500).render("admin-new-project", {
      pageTitle: "Add Project",
      error: "Error saving project.",
    });
  }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
