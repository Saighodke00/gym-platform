import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

export const initMobileFeatures = async () => {
  if (!Capacitor.isNativePlatform()) return;

  console.log('📱 Initializing Mobile Features...');

  // ─── STATUS BAR ─────────────────────────────────────────────────────────────
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1A56A0' }); 
  } catch (e) {
    console.warn('StatusBar initialization skipped');
  }

  // ─── PUSH NOTIFICATIONS ─────────────────────────────────────────────────────
  // Safe check: Only try push if we are on a real device and have the plugin
  try {
    if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
      const perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt') {
        await PushNotifications.requestPermissions();
      }
      // Note: We are NOT calling register() yet to prevent crashes without Firebase config
    }
  } catch (e) {
    console.warn('Push Notifications initialization skipped (Missing Config?)');
  }

  // ─── LOCAL NOTIFICATIONS ────────────────────────────────────────────────────
  try {
    await LocalNotifications.requestPermissions();
  } catch (e) {
    console.warn('Local Notifications initialization skipped');
  }
};

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Ignore
    }
  }
};

export const scheduleLocalNotification = async (title: string, body: string, delayMs: number = 0) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 10000),
            schedule: { at: new Date(Date.now() + delayMs) },
            sound: 'default',
          },
        ],
      });
    } catch (e) {
      console.warn('Local Notifications fail', e);
    }
  } else {
    toast(body, { icon: '🔔' });
  }
};
