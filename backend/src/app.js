import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { errorLoggingMiddleware, httpLogger } from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFound } from './middlewares/error.js';
import { authMiddleware } from './middlewares/auth.js';
import { generalLimiter } from './middlewares/rateLimit.js';
import { attachResponseMeta, requestContext } from './middlewares/requestContext.js';
import { requestMetadata } from './middlewares/requestMetadata.js';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import noteRoutes from './routes/note.routes.js';
import auditLogRoutes from './routes/audit-log.routes.js';
import voiceNoteRoutes from './routes/voice-note.routes.js';
import healthRoutes from './routes/health.routes.js';
import { sentryErrorMiddleware } from './lib/sentry.js';
import dashboardRoutes from './routes/dashboard.routes.js';

export const app = express();

const allowedOrigins = env.corsOrigin === '*'
  ? ['*']
  : env.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
app.use(requestContext);
app.use(requestMetadata);
app.use(attachResponseMeta);
app.use(httpLogger);
app.use(
  helmet({
    // Allow Swagger UI inline scripts/styles
    contentSecurityPolicy: env.nodeEnv === 'production' ? undefined : false,
  }),
);
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const err = new Error('CORS origin not allowed');
    err.status = 403;
    err.code = 'CORS_ORIGIN_BLOCKED';
    return callback(err);
  },
  credentials: !allowedOrigins.includes('*')
}));
app.use(generalLimiter);
app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRoutes);

// ─── Swagger UI ───────────────────────────────────────────────────────────────
if (env.enableSwagger) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'MedNote AI — API Docs',
    swaggerOptions: {
      persistAuthorization: env.nodeEnv !== 'production',
    },
  }));
  // Raw OpenAPI JSON (useful for tooling/import)
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/patients', authMiddleware, patientRoutes);
app.use('/api/notes', authMiddleware, noteRoutes);
app.use('/api/voice-notes', authMiddleware, voiceNoteRoutes);
app.use('/api/audit-logs', authMiddleware, auditLogRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

app.use(notFound);
app.use(sentryErrorMiddleware);
app.use(errorLoggingMiddleware);
app.use(errorHandler);
