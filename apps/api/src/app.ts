import express from 'express';
import cors from 'cors';
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
import { analyticsRouter } from './routes/analytics';
import enquiryRoutes from './routes/enquiries';
import expenseRoutes from './routes/expenses';
import templateRoutes from './routes/templates';

const app = express();

// ─── SECURITY (Simplified for Hugging Face) ──────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});



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
app.get('/', (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>GDK Gym API</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
          .container { text-align: center; padding: 2rem; border-radius: 1rem; background: #1e293b; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
          h1 { color: #38bdf8; margin-bottom: 0.5rem; }
          p { color: #94a3b8; }
          .status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; background: #10b981; color: white; font-size: 0.875rem; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>GDK Gym API</h1>
          <p>The backend service is running successfully.</p>
          <div class="status">● Active</div>
          <p style="margin-top: 2rem; font-size: 0.75rem;">Base URL: <code>/api/v1</code></p>
        </div>
      </body>
    </html>
  `);
});

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
