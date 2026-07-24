import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';

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
import { analyticsRouter } from './routes/analytics';
import enquiryRoutes from './routes/enquiries';
import expenseRoutes from './routes/expenses';
import templateRoutes from './routes/templates';

const app = express();

// ─── SECURITY (Hugging Face Compatibility) ───────────────────────────────────
app.use((_req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors *;");
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});




app.use(cors({
  origin: config.isDev ? true : [
    config.corsOrigin,
    'capacitor://localhost',
    'http://localhost',
    'https://localhost'
  ],
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

// Root route removed in favor of React static serving

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
app.use(`${API}/analytics`, analyticsRouter);
app.use(`${API}/enquiries`, enquiryRoutes);
app.use(`${API}/expenses`, expenseRoutes);
app.use(`${API}/templates`, templateRoutes);

// ─── SERVE REACT FRONTEND IN PRODUCTION ──────────────────────────────────────
if (!config.isDev) {
  const webDistPath = path.join(__dirname, '../../../web/dist');
  app.use(express.static(webDistPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(webDistPath, 'index.html'));
    } else {
      res.status(404).json({ success: false, error: 'Route not found' });
    }
  });
} else {
  // ─── 404 HANDLER FOR DEV ─────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });
}

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
