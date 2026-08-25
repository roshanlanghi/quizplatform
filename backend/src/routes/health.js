const healthRouter = require('express').Router();

/**
 * GET /api/health
 * Public health-check endpoint.
 * Returns server status, timestamp, and environment.
 */
healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MPSC Prep AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

module.exports = healthRouter;
