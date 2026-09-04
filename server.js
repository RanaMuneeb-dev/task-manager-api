const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorMiddleware');
require('dotenv').config();

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Body Parser Size Limit
app.use(express.json({ limit: '10kb' }));

// 3. Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.', code: 'TOO_MANY_REQUESTS' },
});
app.use('/api/', limiter);

// 4. Swagger Documentation Setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API (Production Grade)',
      version: '2.0.0',
      description: 'REST API with Authentication, Role-based Authorization, Caching-ready Architecture, and Documentation',
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Root Endpoint Redirect
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Production Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date(),
  });
});

// Routes Configuration
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/tasks', require('./src/routes/tasks'));

// 5. Centralized Error Handling Middleware (Must be registered last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/testdb';

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      logger.info('MongoDB Connected successfully!');
      app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
    })
    .catch((err) => logger.error('Database connection error:', err));
}

module.exports = app;