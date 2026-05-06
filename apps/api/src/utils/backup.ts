import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../../../../dev.db');
const BACKUP_DIR = path.resolve(__dirname, '../../../../backups');
const MAX_BACKUP_DAYS = 14;

export const performDatabaseBackup = () => {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Check if database exists before backing up
    if (!fs.existsSync(DB_PATH)) {
      console.log('⚠️ [Backup] No database found to backup.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const backupFileName = `dev-${dateStr}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Copy the file
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`✅ [Backup] Database backed up successfully: ${backupFileName}`);

    // Clean up old backups
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAgeMs = MAX_BACKUP_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`🧹 [Backup] Cleaned up ${deletedCount} old backup(s).`);
    }

  } catch (error) {
    console.error('❌ [Backup] Failed to perform database backup:', error);
  }
};
