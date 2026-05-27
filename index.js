const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import the database pool we just created
const db = require('./config/db'); // Update path if placed inside a folder like ./config/db

const authRoutes = require('./routes/authRoutes');
const messRoutes = require('./routes/messRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:3000',
    'https://grub-ui.vercel.app' // Corrected CORS origin
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Base/Utility Routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Welcome to the GrubSpot API!' });
});

// Updated health check route to also verify Database Connectivity
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT NOW()'); // Simple query to test DB connection
    res.json({ 
      status: 'ok', 
      message: 'GrubSpot API is running.', 
      database: 'connected' 
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: 'GrubSpot API is up, but Database connection failed.',
      error: err.message 
    });
  }
});

// Specific API Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

// Generic / Base API Routes
app.use('/api', authRoutes);
app.use('/api', messRoutes);
app.use('/api', ticketRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.url} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ status: 'error', message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 GrubSpot backend running on http://localhost:${PORT}`);

  // Verify database connectivity at startup
  try {
    const result = await db.query('SELECT NOW()');
    console.log(`✅ Database connected — server time: ${result.rows[0].now}`);
  } catch (err) {
    console.error('❌ Database connection FAILED:', err.message);
  }
});