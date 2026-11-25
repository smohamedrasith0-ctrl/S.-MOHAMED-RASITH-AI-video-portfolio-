import express, { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Setup database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    filename TEXT NOT NULL,
    thumbnail TEXT,
    duration TEXT,
    is_published INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default settings if not exists
const defaultSettings = {
  site_name: 'Nexus Portfolio',
  owner_name: 'Alex Morgan',
  owner_title: 'Senior Film Director & Creative Technologist',
  owner_bio: 'Crafting immersive visual stories, cinematic motion pictures, and high-performance digital experiences across global screens.',
  profile_photo: '',
  whatsapp: '+15550198',
  instagram: 'alexmorgan.studio',
  email: 'alex@morganstudio.dev',
  admin_password_hash: bcrypt.hashSync('admin123', 10)
};

const getSettingStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
const setSettingStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

for (const [key, val] of Object.entries(defaultSettings)) {
  const row = getSettingStmt.get(key) as { value: string } | undefined;
  if (!row) {
    setSettingStmt.run(key, val);
  }
}

// Helper to get all settings as an object
function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return settings;
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

// Rate limiting map for login attempts
const loginAttempts = new Map<string, { count: number; lockoutUntil: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return true;
  if (record.lockoutUntil > now) return false;
  if (record.count >= 5) {
    record.lockoutUntil = now + 15 * 60 * 1000; // 15 min lockout
    return false;
  }
  return true;
}

function recordFailedLogin(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lockoutUntil: 0 };
  record.count += 1;
  loginAttempts.set(ip, record);
}

function clearLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// Middleware: Authenticate Admin token from Cookie or Authorization header
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No session token provided' });
  }

  const session = db.prepare('SELECT * FROM admin_sessions WHERE token = ?').get(token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }

  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Parse cookies helper middleware
  app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie;
    const cookies: Record<string, string> = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        cookies[parts[0].trim()] = decodeURIComponent(parts[1]?.trim() || '');
      });
    }
    req.cookies = cookies;
    next();
  });

  // Serve uploads folder statically
  app.use('/uploads', express.static(uploadsDir));

  // --- Public API Routes ---

  // Get public site settings (excluding password hash)
  app.get('/api/settings', (req, res) => {
    const settings = getAllSettings();
    delete settings.admin_password_hash;
    res.json(settings);
  });

  // Get public published videos
  app.get('/api/videos', (req, res) => {
    const videos = db.prepare(
      'SELECT * FROM videos WHERE is_published = 1 AND is_deleted = 0 ORDER BY display_order ASC, created_at DESC'
    ).all();
    res.json(videos);
  });

  // --- Admin Auth Routes ---

  app.post('/api/admin/login', (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many failed login attempts. Please try again in 15 minutes.' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const settings = getAllSettings();
    const match = bcrypt.compareSync(password, settings.admin_password_hash);

    if (!match) {
      recordFailedLogin(ip);
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    clearLoginAttempts(ip);
    const token = uuidv4();
    db.prepare('INSERT INTO admin_sessions (token) VALUES (?)').run(token);

    // Set cookie
    res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
    res.json({ success: true, token });
  });

  app.post('/api/admin/logout', requireAdmin, (req, res) => {
    const authHeader = req.headers.authorization;
    let token = authHeader ? authHeader.substring(7) : req.cookies?.admin_token;
    if (token) {
      db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
    }
    res.setHeader('Set-Cookie', 'admin_token=; Path=/; HttpOnly; Max-Age=0');
    res.json({ success: true });
  });

  app.get('/api/admin/verify', requireAdmin, (req, res) => {
    res.json({ authenticated: true });
  });

  // --- Admin Settings & Profile Routes ---

  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const { site_name, owner_name, owner_title, owner_bio, whatsapp, instagram, email } = req.body;

    const update = db.transaction(() => {
      if (site_name !== undefined) setSettingStmt.run('site_name', site_name);
      if (owner_name !== undefined) setSettingStmt.run('owner_name', owner_name);
      if (owner_title !== undefined) setSettingStmt.run('owner_title', owner_title);
      if (owner_bio !== undefined) setSettingStmt.run('owner_bio', owner_bio);
      if (whatsapp !== undefined) setSettingStmt.run('whatsapp', whatsapp);
      if (instagram !== undefined) setSettingStmt.run('instagram', instagram);
      if (email !== undefined) setSettingStmt.run('email', email);
    });

    update();
    const settings = getAllSettings();
    delete settings.admin_password_hash;
    res.json({ success: true, settings });
  });

  // Upload Profile Photo
  app.post('/api/admin/profile-photo', requireAdmin, upload.single('photo'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file uploaded' });
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    setSettingStmt.run('profile_photo', photoUrl);
    res.json({ success: true, profile_photo: photoUrl });
  });

  // Change Admin Password
  app.put('/api/admin/password', requireAdmin, (req, res) => {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const settings = getAllSettings();
    const match = bcrypt.compareSync(current_password, settings.admin_password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    setSettingStmt.run('admin_password_hash', newHash);
    res.json({ success: true, message: 'Password successfully updated' });
  });

  // --- Admin Video Management Routes ---

  // Get all videos for admin (both active and deleted/trash)
  app.get('/api/admin/videos', requireAdmin, (req, res) => {
    const videos = db.prepare('SELECT * FROM videos ORDER BY display_order ASC, created_at DESC').all();
    res.json(videos);
  });

  // Upload a new video
  app.post('/api/admin/videos', requireAdmin, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), (req, res) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files || !files.video || !files.video[0]) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail ? files.thumbnail[0] : null;

    const { title, description, is_published, display_order } = req.body;
    const id = uuidv4();
    const filename = `/uploads/${videoFile.filename}`;
    const thumbnail = thumbnailFile ? `/uploads/${thumbnailFile.filename}` : '';
    const pub = is_published !== undefined ? parseInt(is_published, 10) : 1;
    const order = display_order !== undefined ? parseInt(display_order, 10) : 0;

    db.prepare(`
      INSERT INTO videos (id, title, description, filename, thumbnail, is_published, display_order, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(id, title || 'Untitled Project', description || '', filename, thumbnail, pub, order);

    const newVideo = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
    res.json({ success: true, video: newVideo });
  });

  // Edit video metadata / status / order
  app.put('/api/admin/videos/:id', requireAdmin, upload.single('thumbnail'), (req, res) => {
    const { id } = req.params;
    const { title, description, is_published, display_order } = req.body;

    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as any;
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    let thumbnail = video.thumbnail;
    if (req.file) {
      thumbnail = `/uploads/${req.file.filename}`;
    }

    const newTitle = title !== undefined ? title : video.title;
    const newDesc = description !== undefined ? description : video.description;
    const newPub = is_published !== undefined ? parseInt(is_published, 10) : video.is_published;
    const newOrder = display_order !== undefined ? parseInt(display_order, 10) : video.display_order;

    db.prepare(`
      UPDATE videos SET title = ?, description = ?, thumbnail = ?, is_published = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(newTitle, newDesc, thumbnail, newPub, newOrder, id);

    const updated = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
    res.json({ success: true, video: updated });
  });

  // Soft delete video (move to trash)
  app.delete('/api/admin/videos/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    db.prepare(`
      UPDATE videos SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, is_published = 0 WHERE id = ?
    `).run(id);

    res.json({ success: true, message: 'Video moved to trash' });
  });

  // Restore deleted video from trash
  app.post('/api/admin/videos/:id/restore', requireAdmin, (req, res) => {
    const { id } = req.params;
    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    db.prepare(`
      UPDATE videos SET is_deleted = 0, deleted_at = NULL, is_published = 1 WHERE id = ?
    `).run(id);

    res.json({ success: true, message: 'Video restored successfully' });
  });

  // Permanently delete video (removes files from disk and record from DB)
  app.delete('/api/admin/videos/:id/permanent', requireAdmin, (req, res) => {
    const { id } = req.params;
    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as any;
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Remove video file from disk
    if (video.filename) {
      const videoPath = path.join(__dirname, video.filename);
      if (fs.existsSync(videoPath)) {
        try { fs.unlinkSync(videoPath); } catch (e) { console.error(e); }
      }
    }

    // Remove thumbnail file from disk if exists
    if (video.thumbnail && video.thumbnail.startsWith('/uploads/')) {
      const thumbPath = path.join(__dirname, video.thumbnail);
      if (fs.existsSync(thumbPath)) {
        try { fs.unlinkSync(thumbPath); } catch (e) { console.error(e); }
      }
    }

    db.prepare('DELETE FROM videos WHERE id = ?').run(id);
    res.json({ success: true, message: 'Video permanently deleted from storage and database' });
  });

  // --- Vite Dev Integration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
