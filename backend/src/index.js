require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log('─────────────────────────────────────────');
  console.log('  MPSC Prep AI — Backend Server');
  console.log(`  Environment : ${NODE_ENV}`);
  console.log(`  Port        : ${PORT}`);
  console.log(`  Health      : http://localhost:${PORT}/api/health`);
  console.log('─────────────────────────────────────────');
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled rejections ─────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err);
  process.exit(1);
});
