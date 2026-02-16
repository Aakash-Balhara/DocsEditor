const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  console.log("Error loading .env file:", dotenvResult.error);
}

const authRoutes = require('./routes/auth.route');
const documentRoutes = require('./routes/document.routes');
const passwordResetRoutes = require('./routes/passwordReset.routes');


const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://docseditor-1.onrender.com', 'https://docseditor-cdrg.onrender.com'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

const PORT = process.env.PORT || 3300;


app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-document', async (documentId, user) => {
    socket.join(documentId);
    socket.data.user = user;
    socket.data.documentId = documentId;

    const sockets = await io.in(documentId).fetchSockets();
    const users = sockets.map(s => s.data.user).filter(u => u);
    io.to(documentId).emit('active-users', users);
  });

  socket.on('leave-document', (documentId) => {
    socket.leave(documentId);
    // Disconnect logic below handles the update, or we could emit here too
  });

  socket.on('send-changes', (documentId, changes) => {
    socket.broadcast.to(documentId).emit('receive-changes', changes);
  });

  socket.on('disconnect', async () => {
    const documentId = socket.data.documentId;
    if (documentId) {
      const sockets = await io.in(documentId).fetchSockets();
      const users = sockets.map(s => s.data.user).filter(u => u);
      io.to(documentId).emit('active-users', users);
    }
  });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
}).then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Connection Error", err));

// Routes
app.use('/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/password-reset', passwordResetRoutes);

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
