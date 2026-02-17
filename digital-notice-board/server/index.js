// ...existing code...
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs').promises;
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept all image types
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|tiff|svg/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase().replace('.', ''));

    if (mimetype && extname) {
      return cb(null, true);
    }
    
    console.log('Rejected file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    cb(null, false); // Silently reject instead of throwing error
  }
});
// SIMULATED DATABASE (files instead of MongoDB)
const DB_FILE = 'database.json';

// Simple ID generator
function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialize database
async function initDB() {
  try {
    await fs.access(DB_FILE);
    console.log('✅ Database file exists');
  } catch {
    // Create initial database
    const initialData = {
      announcements: [],
      users: [
        {
          id: generateId(),
          email: 'admin@noticeboard.com',
          password: 'admin123',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ]
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
    console.log('✅ Default admin created: admin@noticeboard.com / admin123');
  }
}

// Read database
async function readDB() {
  const data = await fs.readFile(DB_FILE, 'utf8');
  const db = JSON.parse(data);
  if (!db.history) db.history = [];
  return db;
}

// Write to database
async function writeDB(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Simple auth middleware
const simpleAuth = (req, res, next) => {
  // Skip auth for testing
  next();
};

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('📡 New client connected');
  socket.on('disconnect', () => {
    console.log('📡 Client disconnected');
  });
});

// Initialize database on startup
initDB().then(() => {
  console.log('✅ Database initialized');
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.access(uploadsDir).catch(async () => {
  await fs.mkdir(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
});

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await readDB();
    
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = {
      id: generateId(),
      email,
      password,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    
    db.users.push(user);
    await writeDB(db);
    
    res.status(201).json({
      message: 'Admin user created',
      user: { email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await readDB();
    
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    res.json({
      message: 'Login successful',
      user: { email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ANNOUNCEMENT ROUTES
app.get('/api/announcements/public', async (req, res) => {
  try {
    const db = await readDB();
    const announcements = db.announcements
      .filter(a => a.isActive !== false)
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return (b.priority || 1) - (a.priority || 1);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/announcements', simpleAuth, async (req, res) => {
  try {
    const db = await readDB();
    const announcements = db.announcements.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE announcement with image upload
app.post('/api/announcements', simpleAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, content, priority = 1, duration = 7, isActive = true, category = '', startAt, endAt, userEmail } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const db = await readDB();
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    // Parse startAt and endAt, fallback to now and now+duration if not provided
    let startDate = startAt ? new Date(startAt) : new Date();
    let endDate = endAt ? new Date(endAt) : new Date(startDate.getTime() + parseInt(duration) * 24 * 60 * 60 * 1000);
    const announcement = {
      id: generateId(),
      title,
      content,
      priority: parseInt(priority),
      duration: parseInt(duration),
      isActive: isActive === 'true' || isActive === true,
      category: category || null,
      image: imagePath,
      type: imagePath ? (content ? 'mixed' : 'image') : 'text',
      createdAt: new Date().toISOString(),
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      expiresAt: endDate.toISOString()
    };
    db.announcements.push(announcement);
    // Add to history as created, with user info
    if (!db.history) db.history = [];
    db.history.unshift({
      ...announcement,
      action: 'created',
      actionAt: new Date().toISOString(),
      user: userEmail || (req.user && req.user.email) || null
    });
    await writeDB(db);
    io.emit('announcementUpdate', { 
      action: 'create', 
      announcement,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Created announcement: ${title}`);
    res.status(201).json(announcement);
  } catch (error) {
    console.error('❌ Error creating announcement:', error);
    res.status(400).json({ error: error.message });
  }
});

// UPDATE announcement with optional image upload
app.put('/api/announcements/:id', simpleAuth, upload.single('image'), async (req, res) => {
  try {
    const db = await readDB();
    const index = db.announcements.findIndex(a => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    const { title, content, priority, duration, isActive, category, startAt, endAt, userEmail } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : db.announcements[index].image;
    if (req.file && db.announcements[index].image) {
      const oldImagePath = path.join(__dirname, db.announcements[index].image);
      try {
        await fs.unlink(oldImagePath);
      } catch (err) {
        console.log('Note: Could not delete old image:', err.message);
      }
    }
    // Parse startAt and endAt, fallback to previous or recalculate
    let prevStart = db.announcements[index].startAt ? new Date(db.announcements[index].startAt) : new Date();
    let prevEnd = db.announcements[index].endAt ? new Date(db.announcements[index].endAt) : new Date();
    let newStart = startAt ? new Date(startAt) : prevStart;
    let newEnd = endAt ? new Date(endAt) : (duration ? new Date(newStart.getTime() + parseInt(duration) * 24 * 60 * 60 * 1000) : prevEnd);
    db.announcements[index] = {
      ...db.announcements[index],
      ...(title && { title }),
      ...(content && { content }),
      ...(priority && { priority: parseInt(priority) }),
      ...(duration && { duration: parseInt(duration) }),
      ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true }),
      ...(category !== undefined && { category: category || null }),
      image: imagePath,
      type: imagePath ? (content ? 'mixed' : 'image') : 'text',
      startAt: newStart.toISOString(),
      endAt: newEnd.toISOString(),
      expiresAt: newEnd.toISOString(),
      updatedAt: new Date().toISOString()
    };
    // Add to history as updated, with user info
    if (!db.history) db.history = [];
    db.history.unshift({
      ...db.announcements[index],
      action: 'updated',
      actionAt: new Date().toISOString(),
      user: userEmail || (req.user && req.user.email) || null
    });
    await writeDB(db);
    io.emit('announcementUpdate', { 
      action: 'update', 
      announcement: db.announcements[index],
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Updated announcement: ${db.announcements[index].title}`);
    res.json(db.announcements[index]);
  } catch (error) {
    console.error('❌ Error updating announcement:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE announcement
app.delete('/api/announcements/:id', simpleAuth, async (req, res) => {
  try {
    const db = await readDB();
    const index = db.announcements.findIndex(a => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    // Delete associated image file if exists
    if (db.announcements[index].image) {
      const imagePath = path.join(__dirname, db.announcements[index].image);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.log('Note: Could not delete image file:', err.message);
      }
    }
    const deletedAnnouncement = db.announcements[index];
    // Add to history as deleted, with user info
    const userEmail = req.body && req.body.userEmail;
    if (!db.history) db.history = [];
    db.history.unshift({
      ...deletedAnnouncement,
      action: 'deleted',
      actionAt: new Date().toISOString(),
      user: userEmail || (req.user && req.user.email) || null
    });
    db.announcements.splice(index, 1);
    await writeDB(db);
    // Emit real-time update
    io.emit('announcementUpdate', { 
      action: 'delete', 
      id: req.params.id,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ Deleted announcement: ${deletedAnnouncement.title}`);
    res.json({ 
      message: 'Announcement deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('❌ Error deleting announcement:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET notice history
app.get('/api/history', simpleAuth, async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.history || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single announcement
app.get('/api/announcements/:id', simpleAuth, async (req, res) => {
  try {
    const db = await readDB();
    const announcement = db.announcements.find(a => a.id === req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Server is running perfectly!',
    database: 'Using file-based database (no MongoDB needed)',
    port: 5001,
    features: ['Image upload', 'Real-time updates', 'File-based storage'],
    default_admin: 'admin@noticeboard.com / admin123'
  });
});

// LIVE control routes
app.get('/api/status', async (req, res) => {
  try {
    const db = await readDB();
    const live = db.live || { status: 'OFF', link: null };
    res.json({ status: live.status || 'OFF', link: live.link || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CATEGORY ROUTES
app.get('/api/categories', async (req, res) => {
  try {
    const db = await readDB();
    const categories = db.categories || [];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', simpleAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const db = await readDB();
    if (!db.categories) db.categories = [];

    // Check if category already exists
    if (db.categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString()
    };

    db.categories.push(category);
    await writeDB(db);

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', simpleAuth, async (req, res) => {
  try {
    const db = await readDB();
    const index = (db.categories || []).findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    db.categories.splice(index, 1);
    await writeDB(db);

    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    const db = await readDB();
    const live = db.live || { status: 'OFF', link: null };
    res.json({ status: live.status || 'OFF', link: live.link || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/start', async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) return res.status(400).json({ error: 'Link is required' });

    const db = await readDB();
    db.live = {
      status: 'ON',
      link,
      startedAt: new Date().toISOString()
    };
    await writeDB(db);

    // notify clients
    io.emit('liveUpdate', db.live);

    res.json(db.live);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stop', async (req, res) => {
  try {
    const db = await readDB();
    db.live = { status: 'OFF', link: null, stoppedAt: new Date().toISOString() };
    await writeDB(db);

    // notify clients
    io.emit('liveUpdate', db.live);

    res.json(db.live);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Home route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Digital Notice Board API',
    version: '2.0',
    features: [
      'Image upload support',
      'Real-time Socket.io updates',
      'Priority-based sorting',
      'File-based database'
    ],
    endpoints: {
      test: 'GET /api/test',
      login: 'POST /api/auth/login',
      announcements: {
        public: 'GET /api/announcements/public',
        all: 'GET /api/announcements',
        create: 'POST /api/announcements (with image)',
        update: 'PUT /api/announcements/:id',
        delete: 'DELETE /api/announcements/:id'
      }
    }
  });
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`📡 Socket.io ready for real-time updates`);
  console.log(`👤 Default admin: admin@noticeboard.com / admin123`);
  console.log(`🔗 Test: http://localhost:${PORT}/api/test`);
});

module.exports.io = io;