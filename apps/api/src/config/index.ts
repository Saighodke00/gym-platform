import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from either the app folder or the root folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  publicUrl: process.env.PUBLIC_URL || '', // For internet access (tunnels)
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback-dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-dev-refresh',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },


  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '', // For admin alerts
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'GDK Gym <noreply@gdkgym.com>',
  },

  gym: {
    name: process.env.GYM_NAME || 'GDK Gym',
    absenceThreshold: parseInt(process.env.GYM_DEFAULT_ABSENCE_THRESHOLD || '7'),
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },

  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',
};
