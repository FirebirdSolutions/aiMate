/**
 * aiMate API Server
 *
 * Express server providing REST API + SSE streaming for chat.
 * Designed to work with the React frontend at /api/v1/*
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';

// Load environment variables
config();

// Import routes
import { conversationsRouter } from './routes/conversations.js';
import { messagesRouter } from './routes/messages.js';
import { chatRouter } from './routes/chat.js';
import { connectionsRouter } from './routes/connections.js';
import { modelsRouter } from './routes/models.js';
import { memoriesRouter } from './routes/memories.js';
import { workspacesRouter } from './routes/workspaces.js';
import { healthRouter } from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// Middleware
// ============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for SSE compatibility
}));

// CORS - allow frontend origins (permissive for development)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl, mobile apps, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development, allow any localhost origin
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// Routes
// ============================================================================

// Health check (no /api/v1 prefix for Docker health checks)
app.use('/health', healthRouter);

// API v1 routes
const apiV1 = express.Router();

apiV1.use('/conversations', conversationsRouter);
apiV1.use('/messages', messagesRouter);
apiV1.use('/chat', chatRouter);
apiV1.use('/connections', connectionsRouter);
apiV1.use('/models', modelsRouter);
apiV1.use('/memories', memoriesRouter);
apiV1.use('/workspaces', workspacesRouter);

app.use('/api/v1', apiV1);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);

  const isDev = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'An unexpected error occurred',
    ...(isDev && { stack: err.stack }),
  });
});

// ============================================================================
// Server Start
// ============================================================================

// Bind to 0.0.0.0 to accept connections from outside Docker container
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   aiMate API Server                                           ║
║   Running on http://0.0.0.0:${PORT}                             ║
║                                                               ║
║   Endpoints:                                                  ║
║   • GET  /health              - Health check                  ║
║   • GET  /api/v1/conversations - List conversations           ║
║   • POST /api/v1/chat/completions - Chat (SSE streaming)      ║
║   • ...and more                                               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
