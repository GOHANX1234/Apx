import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'xgram-secret-key-2024-production';
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));
app.use(compression());
app.use(morgan('combined'));

// CORS configuration
if (NODE_ENV === 'development') {
  app.use(cors());
} else {
  app.use(cors({
    origin: false, // Same domain only in production
    credentials: true
  }));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React app in production
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp3|wav|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Database helper functions
async function readDatabase(filename) {
  try {
    const data = await fs.readFile(path.join(__dirname, 'database', filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeDatabase(filename, data) {
  try {
    await fs.writeFile(path.join(__dirname, 'database', filename), JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filename}:`, error);
  }
}

// Initialize database files
async function initializeDatabase() {
  const dbDir = path.join(__dirname, 'database');
  const uploadsDir = path.join(__dirname, 'uploads');
  
  try {
    await fs.access(dbDir);
  } catch {
    await fs.mkdir(dbDir, { recursive: true });
  }
  
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }

  const files = ['users.json', 'messages.json', 'groups.json'];
  for (const file of files) {
    try {
      await fs.access(path.join(dbDir, file));
    } catch {
      await writeDatabase(file, []);
    }
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: NODE_ENV === 'production' ? 'Something went wrong!' : err.message 
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV 
  });
});

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;
    
    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const users = await readDatabase('users.json');
    
    if (users.find(u => u.username === username || u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      name,
      bio: '',
      avatar: '',
      banner: '',
      links: [],
      createdAt: new Date().toISOString(),
      isOnline: false,
      lastSeen: new Date().toISOString()
    };

    users.push(user);
    await writeDatabase('users.json', users);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = await readDatabase('users.json');
    
    const user = users.find(u => u.username === username || u.email === username);
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    user.isOnline = true;
    user.lastSeen = new Date().toISOString();
    await writeDatabase('users.json', users);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await readDatabase('users.json');
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    const users = await readDatabase('users.json');
    const filtered = users
      .filter(u => 
        (u.username.toLowerCase().includes(q.toLowerCase()) || 
         u.name.toLowerCase().includes(q.toLowerCase())) && 
        u.id !== req.user.id
      )
      .map(({ password, ...user }) => user);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const users = await readDatabase('users.json');
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const users = await readDatabase('users.json');
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex] = { ...users[userIndex], ...req.body };
    await writeDatabase('users.json', users);
    
    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Messages routes
app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await readDatabase('messages.json');
    
    const conversation = messages.filter(m => 
      (m.senderId === req.user.id && m.receiverId === userId) ||
      (m.senderId === userId && m.receiverId === req.user.id)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const messages = await readDatabase('messages.json');
    const users = await readDatabase('users.json');
    
    const userMessages = messages.filter(m => 
      m.senderId === req.user.id || m.receiverId === req.user.id
    );
    
    const conversations = {};
    userMessages.forEach(message => {
      const otherUserId = message.senderId === req.user.id ? message.receiverId : message.senderId;
      if (!conversations[otherUserId] || new Date(message.createdAt) > new Date(conversations[otherUserId].createdAt)) {
        conversations[otherUserId] = message;
      }
    });
    
    const conversationList = Object.values(conversations).map(message => {
      const otherUserId = message.senderId === req.user.id ? message.receiverId : message.senderId;
      const otherUser = users.find(u => u.id === otherUserId);
      return {
        ...message,
        user: otherUser ? { ...otherUser, password: undefined } : null,
        unreadCount: 0
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(conversationList);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Groups routes
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const groups = await readDatabase('groups.json');
    const userGroups = groups.filter(g => 
      g.members.includes(req.user.id) || g.createdBy === req.user.id
    );
    res.json(userGroups);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { name, members } = req.body;
    
    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ error: 'Group name and members are required' });
    }

    const groups = await readDatabase('groups.json');
    const group = {
      id: uuidv4(),
      name,
      description: '',
      avatar: '',
      members: [...new Set([req.user.id, ...members])],
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    groups.push(group);
    await writeDatabase('groups.json', groups);
    
    res.json(group);
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/groups/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const groups = await readDatabase('groups.json');
    
    const groupIndex = groups.findIndex(g => g.id === id);
    if (groupIndex === -1) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (groups[groupIndex].createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Only group creator can delete the group' });
    }
    
    groups.splice(groupIndex, 1);
    await writeDatabase('groups.json', groups);
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Group messages routes
app.get('/api/groups/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await readDatabase('messages.json');
    
    const groupMessages = messages.filter(m => m.groupId === groupId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    res.json(groupMessages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// File upload
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({ 
      url: `/uploads/${req.file.filename}`,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', async (userId) => {
    socket.userId = userId;
    socket.join(userId);
    connectedUsers.set(userId, socket.id);
    
    const users = await readDatabase('users.json');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].isOnline = true;
      users[userIndex].lastSeen = new Date().toISOString();
      await writeDatabase('users.json', users);
      
      socket.broadcast.emit('user_online', userId);
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const messages = await readDatabase('messages.json');
      const message = {
        id: uuidv4(),
        senderId: data.senderId,
        receiverId: data.receiverId,
        groupId: data.groupId,
        content: data.content,
        type: data.type || 'text',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reactions: [],
        replies: [],
        isEdited: false
      };

      messages.push(message);
      await writeDatabase('messages.json', messages);

      if (data.groupId) {
        const groups = await readDatabase('groups.json');
        const group = groups.find(g => g.id === data.groupId);
        if (group) {
          group.members.forEach(memberId => {
            io.to(memberId).emit('receive_message', message);
          });
        }
      } else {
        io.to(data.receiverId).emit('receive_message', message);
        socket.emit('message_sent', message);
      }
    } catch (error) {
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('message_reaction', async (data) => {
    try {
      const messages = await readDatabase('messages.json');
      const messageIndex = messages.findIndex(m => m.id === data.messageId);
      
      if (messageIndex !== -1) {
        const message = messages[messageIndex];
        const existingReaction = message.reactions.find(r => r.userId === data.userId);
        
        if (existingReaction) {
          if (existingReaction.emoji === data.emoji) {
            message.reactions = message.reactions.filter(r => r.userId !== data.userId);
          } else {
            existingReaction.emoji = data.emoji;
          }
        } else {
          message.reactions.push({
            userId: data.userId,
            emoji: data.emoji,
            createdAt: new Date().toISOString()
          });
        }

        message.updatedAt = new Date().toISOString();
        await writeDatabase('messages.json', messages);

        if (message.groupId) {
          const groups = await readDatabase('groups.json');
          const group = groups.find(g => g.id === message.groupId);
          if (group) {
            group.members.forEach(memberId => {
              io.to(memberId).emit('message_updated', message);
            });
          }
        } else {
          io.to(message.senderId).to(message.receiverId).emit('message_updated', message);
        }
      }
    } catch (error) {
      socket.emit('reaction_error', { error: 'Failed to add reaction' });
    }
  });

  socket.on('typing', (data) => {
    if (data.groupId) {
      socket.to(data.groupId).emit('user_typing', { userId: data.senderId, isTyping: data.isTyping });
    } else {
      socket.to(data.receiverId).emit('user_typing', { userId: data.senderId, isTyping: data.isTyping });
    }
  });

  socket.on('join_group', (groupId) => {
    socket.join(groupId);
  });

  socket.on('leave_group', (groupId) => {
    socket.leave(groupId);
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      
      const users = await readDatabase('users.json');
      const userIndex = users.findIndex(u => u.id === socket.userId);
      if (userIndex !== -1) {
        users[userIndex].isOnline = false;
        users[userIndex].lastSeen = new Date().toISOString();
        await writeDatabase('users.json', users);
        
        socket.broadcast.emit('user_offline', socket.userId);
      }
    }
  });
});

// Serve React app for all non-API routes in production
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Initialize database and start server
initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Xgram server running on port ${PORT}`);
    console.log(`📱 Environment: ${NODE_ENV}`);
    if (NODE_ENV === 'production') {
      console.log(`🌐 Production app available at: http://localhost:${PORT}`);
    } else {
      console.log(`🔧 Development mode - Frontend: http://localhost:5173`);
    }
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});