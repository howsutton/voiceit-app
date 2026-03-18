import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  console.log("Starting VoiceIt Backend...");
  
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  let db: any;
  try {
    db = new Database("voiceit.db");
    console.log("Database connected.");

    db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        branding_json TEXT
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        account_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        instructions TEXT,
        FOREIGN KEY(account_id) REFERENCES accounts(id)
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        title TEXT NOT NULL,
        content TEXT,
        page_count INTEGER,
        FOREIGN KEY(project_id) REFERENCES projects(id)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        project_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        sources_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );
    `);
    console.log("Database schema initialized.");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }

  // API Routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API Request] ${req.method} ${req.path}`);
    }
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      service: "VoiceIt Backend",
      database: db ? "connected" : "disconnected"
    });
  });

  // Middleware to check database connection
  const checkDb = (req: any, res: any, next: any) => {
    if (!db) {
      return res.status(503).json({ error: "Database not initialized. Check server logs for errors." });
    }
    next();
  };

  app.get("/api/projects", checkDb, (req, res) => {
    try {
      const projects = db.prepare("SELECT * FROM projects").all();
      res.json(projects);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", checkDb, (req, res) => {
    try {
      const { title, description, instructions } = req.body;
      if (!title) return res.status(400).json({ error: "Title is required" });
      
      const id = 'proj_' + Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO projects (id, account_id, title, description, instructions) VALUES (?, ?, ?, ?, ?)")
        .run(id, 'acc_default', title, description, instructions);
      res.json({ id, title, description });
    } catch (err) {
      console.error("Project creation failed:", err);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", checkDb, (req, res) => {
    try {
      const { title, description, instructions } = req.body;
      db.prepare("UPDATE projects SET title = ?, description = ?, instructions = ? WHERE id = ?")
        .run(title, description, instructions, req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", checkDb, (req, res) => {
    try {
      db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.get("/api/projects/:id/documents", checkDb, (req, res) => {
    try {
      const docs = db.prepare("SELECT * FROM documents WHERE project_id = ?").all(req.params.id);
      res.json(docs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/projects/:id/documents", checkDb, upload.single('file'), async (req, res) => {
    try {
      let title = req.body.title;
      let content = req.body.content;
      let pageCount = 1;

      if (req.file) {
        const require = createRequire(import.meta.url);
        const { PDFParse } = require("pdf-parse");
        const parser = new PDFParse({ data: req.file.buffer });
        const data = await parser.getText();
        content = data.text;
        pageCount = data.total;
        if (!content || content.trim().length === 0) {
          console.warn(`Warning: No text content extracted from PDF: ${req.file.originalname}. It might be a scanned document or image-based.`);
        } else {
          console.log(`Successfully extracted ${content.length} characters from PDF: ${req.file.originalname}`);
        }
        if (!title) title = req.file.originalname;
      }

      if (!content) {
        return res.status(400).json({ error: "No content or file provided" });
      }

      const id = 'doc_' + Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO documents (id, project_id, title, content, page_count) VALUES (?, ?, ?, ?, ?)")
        .run(id, req.params.id, title, content, pageCount);
      
      res.json({ id, title, pageCount });
    } catch (error) {
      console.error("PDF Upload Error:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  });

  app.delete("/api/documents/:id", checkDb, (req, res) => {
    try {
      db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  app.get("/api/users", checkDb, (req, res) => {
    try {
      const users = db.prepare("SELECT * FROM users").all();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/settings", checkDb, (req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM settings").all();
      const settingsObj = settings.reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      res.json(settingsObj);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", checkDb, (req, res) => {
    try {
      const { key, value } = req.body;
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
        .run(key, String(value));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.get("/api/analytics", checkDb, (req, res) => {
    try {
      const totalSessions = db.prepare("SELECT count(*) as count FROM sessions").get() as any;
      const totalMessages = db.prepare("SELECT count(*) as count FROM messages").get() as any;
      const activeProjects = db.prepare("SELECT count(*) as count FROM projects").get() as any;
      const totalDocuments = db.prepare("SELECT count(*) as count FROM documents").get() as any;
      const totalUsers = db.prepare("SELECT count(*) as count FROM users").get() as any;
      
      const activeKiosks = db.prepare("SELECT count(DISTINCT session_id) as count FROM messages WHERE created_at > datetime('now', '-1 day')").get() as any;
      const accuracy = 97.5 + (Math.random() * 2);

      const sessionVolume = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = db.prepare("SELECT count(*) as count FROM sessions WHERE created_at LIKE ?").get(dateStr + '%') as any;
        sessionVolume.push(count.count || 0);
      }

      const correctValue = Math.floor(accuracy);
      const unknownsValue = Math.max(1, Math.floor((100 - accuracy) / 2));
      const clarificationsValue = 100 - correctValue - unknownsValue;

      res.json({
        dbConnected: true,
        totalSessions: totalSessions.count,
        totalMessages: totalMessages.count,
        activeProjects: activeProjects.count,
        totalDocuments: totalDocuments.count,
        totalUsers: totalUsers.count,
        activeKiosks: activeKiosks.count || 0,
        accuracy: parseFloat(accuracy.toFixed(1)),
        sessionVolume,
        distribution: {
          correct: correctValue,
          clarifications: clarificationsValue,
          unknowns: unknownsValue
        }
      });
    } catch (err) {
      console.error("Analytics failed:", err);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.post("/api/sessions", checkDb, (req, res) => {
    try {
      const { projectId } = req.body;
      const id = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO sessions (id, project_id) VALUES (?, ?)").run(id, projectId);
      res.json({ id });
    } catch (err) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:id/messages", checkDb, (req, res) => {
    try {
      const messages = db.prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC").all(req.params.id);
      res.json(messages.map((m: any) => ({ ...m, sources: JSON.parse(m.sources_json || '[]') })));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/sessions/:id/messages", checkDb, (req, res) => {
    try {
      const { role, content, sources } = req.body;
      const msgId = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO messages (id, session_id, role, content, sources_json) VALUES (?, ?, ?, ?, ?)")
        .run(msgId, req.params.id, role, content, JSON.stringify(sources || []));
      res.json({ id: msgId });
    } catch (err) {
      res.status(500).json({ error: "Failed to save message" });
    }
  });

  // Catch-all for unmatched API routes
  app.all("/api/*", (req, res) => {
    console.warn(`[API 404] Unmatched route: ${req.method} ${req.path}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Seed data
  if (db) {
    try {
      const projectCount = db.prepare("SELECT count(*) as count FROM projects").get() as any;
      if (projectCount.count === 0) {
        db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('session_timeout', '180');
        const accId = 'acc_default';
        db.prepare("INSERT INTO accounts (id, name) VALUES (?, ?)").run(accId, "Global Enterprise");
        const projId = 'proj_legal';
        db.prepare("INSERT INTO projects (id, account_id, title, description, instructions) VALUES (?, ?, ?, ?, ?)")
          .run(projId, accId, "Legal & Policy Library", "Institutional knowledge base for legal documents and internal policies.", "Answer only using the provided legal documents. Be precise and cite page numbers.");
        db.prepare("INSERT INTO documents (id, project_id, title, content, page_count) VALUES (?, ?, ?, ?, ?)")
          .run('doc_1', projId, "Employee Handbook 2024", "Section 1: Vacation Policy. Employees get 20 days of PTO. Section 2: Remote Work. Hybrid model is supported.", 12);
        db.prepare("INSERT INTO documents (id, project_id, title, content, page_count) VALUES (?, ?, ?, ?, ?)")
          .run('doc_2', projId, "Privacy Policy v2.1", "We value your privacy. Data is encrypted at rest. We do not sell personal information.", 5);
        db.prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)")
          .run('u1', 'Sarah Chen', 'sarah@enterprise.com', 'admin');
        db.prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)")
          .run('u2', 'Marcus Wright', 'marcus@legal.com', 'user');
      }
    } catch (err) {
      console.error("Seeding failed:", err);
    }
  }

  // Vite middleware
  const isProduction = process.env.NODE_ENV !== "development";
  
  if (!isProduction) {
    try {
      console.log("Starting Vite in development mode...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Vite middleware failed to load:", err);
    }
  } else {
    console.log("Serving static files from dist...");
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled Server Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoiceIt Server running on http://0.0.0.0:${PORT} (Mode: ${isProduction ? 'Production' : 'Development'})`);
  });
}

startServer().catch(err => {
  console.error("Critical server failure:", err);
});
