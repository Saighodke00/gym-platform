import { Router } from 'express';
import os from 'os';
import { config } from '../config';
import { sendNotification } from '../utils/notifications';

const router = Router();

/**
 * Returns the server's local network IP address
 * Used by the kiosk view to generate valid QR codes for other devices
 */
router.get('/local-ip', (req, res) => {
  let ip = '127.0.0.1';
  
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Look for IPv4 addresses that are NOT internal (localhost)
      if (iface.family === 'IPv4' && !iface.internal) {
        ip = iface.address;
        break;
      }
    }
    if (ip !== '127.0.0.1') break;
  }

  res.json({
    success: true,
    data: {
      ip: ip || 'localhost',
      public_url: config.publicUrl,
      hostname: os.hostname(),
      platform: os.platform(),
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * Sends a test notification to verify Telegram/Email connectivity
 */
router.get('/test-notifications', async (req, res) => {
  // Show what values the server actually has loaded
  const diagnostics = {
    telegram: {
      tokenLoaded: !!config.telegram.botToken,
      tokenPreview: config.telegram.botToken ? config.telegram.botToken.substring(0, 15) + '...' : 'MISSING',
      chatId: config.telegram.adminChatId || 'MISSING',
    },
    email: {
      host: config.smtp.host,
      port: config.smtp.port,
      user: config.smtp.user || 'MISSING',
      passwordLoaded: !!config.smtp.password,
    }
  };

  try {
    const results = await sendNotification({
      email: config.smtp.user,
      telegramChatId: config.telegram.adminChatId,
      subject: 'GDK Gym Test',
      message: '🧪 This is a test notification from your GDK Gym Platform. If you received this, your system is correctly configured! 🚀',
      channel: 'both'
    });

    res.json({
      success: true,
      message: 'Test notifications triggered',
      diagnostics,
      results
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      diagnostics,
      error: error.message
    });
  }
});

export default router;
