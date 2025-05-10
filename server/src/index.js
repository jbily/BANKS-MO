const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database configuration
const { testConnection, initializeDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
// const userRoutes = require('./routes/users');
// const transactionRoutes = require('./routes/transactions');
// const transferRoutes = require('./routes/transfers');
// const cardRoutes = require('./routes/cards');
// const merchantRoutes = require('./routes/merchants');
// const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());
app.use(morgan('combined')); // Logging

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Initialize database connection
testConnection()
  .then(() => initializeDatabase())
  .catch(err => {
    console.error('Database initialization error:', err);
    process.exit(1);
  });

// Routes
app.get('/', (req, res) => {
  res.send('BANKS-MO API is running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/transactions', transactionRoutes);
// app.use('/api/transfers', transferRoutes);
// app.use('/api/cards', cardRoutes);
// app.use('/api/merchants', merchantRoutes);
// app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something went wrong!', error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes 