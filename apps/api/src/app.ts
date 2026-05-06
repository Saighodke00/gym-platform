import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { requestLogger, errorHandler } from './middleware/audit';
import authRoutes from './routes/auth';
import memberRoutes from './routes/members';
import planRoutes from './routes/plans';
import attendanceRoutes from './routes/attendance';
import dashboardRoutes from './routes/dashboard';
import gymRoutes from './routes/gym';
import notificationRoutes from './routes/notifications';
import paymentRoutes from './routes/payments';
import exerciseRoutes from './routes/exercises';
import workoutRoutes from './routes/workouts';
import systemRoutes from './routes/system';

const app = express();

// ─── SECURITY ────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: config.isProd ? undefined : false,
}));

app.use(cors({
  origin: config.isDev ? true : config.corsOrigin, // Allow any origin in dev for mobile testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── BODY PARSING ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ─── LOGGING ─────────────────────────────────────────────────────────────────
if (config.isDev) app.use(morgan('dev'));
app.use(requestLogger);

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'GDK Gym Management API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// ─── API ROUTES ──────────────────────────────────────────────────────────────
const API = `/api/v1`;
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/members`, memberRoutes);
app.use(`${API}/plans`, planRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/gym`, gymRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/exercises`, exerciseRoutes);
app.use(`${API}/workouts`, workoutRoutes);
app.use(`${API}/system`, systemRoutes);

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
