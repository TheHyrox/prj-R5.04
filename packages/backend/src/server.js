const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db/database');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

const requestLog = [];
const analyticsCache = [];

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  requestLog.push({
    url: req.url,
    method: req.method,
    timestamp: new Date(),
    headers: JSON.parse(JSON.stringify(req.headers)),
    body: JSON.parse(JSON.stringify(req.body || {})),
    query: JSON.parse(JSON.stringify(req.query || {}))
  });

  analyticsCache.push({
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    timestamp: Date.now(),
    sessionData: {
      user: req.user,
      token: req.headers.authorization
    }
  });

  next();
});

// Routes setup
app.use('/api/auth', userRoutes);
app.use('/api', productRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

const port = process.env.PORT || 3001;

// Start server only after the database is connected
const startServer = async () => {
  try {
    await db.connect();

    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      console.info('SIGTERM signal received.');
      server.close(() => {
        db.closeConnection()
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
      });
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
