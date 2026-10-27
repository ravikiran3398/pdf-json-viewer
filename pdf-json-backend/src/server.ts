import { app } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log(' Connected to PostgreSQL database');

    const server = app.listen(config.port, () => {
      console.log(` PDF-to-JSON Backend running at http://localhost:${config.port}`);
      console.log(` Health check: http://localhost:${config.port}/health`);
      console.log(` API Base: http://localhost:${config.port}/api/v1`);
      console.log(` Swagger Docs: http://localhost:${config.port}/api-docs (or /swagger)`);
    });

    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Prisma disconnected, server exited.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
