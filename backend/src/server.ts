import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { connectDatabase } from './config/database';
import { redis } from './config/redis';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import router from './routes';
import { startJobs } from './jobs';

const app = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
  })
);

// Body parsing & compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Swagger API docs
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quantum Kairoz API',
      version: '1.0.0',
      description: 'Quality + Lab + Partner Intelligence Platform API — Forge Quantum Solution',
      contact: { name: 'Forge Quantum Solution', email: 'api@forgequantum.com' },
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `.swagger-ui .topbar { background: #071616; } .swagger-ui .topbar-wrapper .link span { color: #14B8A6; }`,
  customSiteTitle: 'Quantum Kairoz API Docs',
}));

// API Routes
app.use('/api/v1', router);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'quantum-kairoz-api',
  });
});

// 404 + Error handling
app.use(notFound);
app.use(errorHandler);

async function start(): Promise<void> {
  try {
    await connectDatabase();

    try {
      await redis.connect();
    } catch {
      logger.warn('Redis unavailable — proceeding without cache');
    }

    startJobs();

    app.listen(config.port, () => {
      logger.info(`🚀 Quantum Kairoz API running on port ${config.port} [${config.nodeEnv}]`);
      logger.info(`📚 Swagger docs: http://localhost:${config.port}/api/docs`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;
