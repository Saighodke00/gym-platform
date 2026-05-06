import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export async function auditLog(
  req: Request,
  action: string,
  entityType: string,
  entityId?: string,
  beforeData?: unknown,
  afterData?: unknown
) {
  if (!req.user) return;
  try {
    await prisma.auditLog.create({
      data: {
        gym_id: req.user.gymId,
        user_id: req.user.sub,
        action,
        entity_type: entityType,
        entity_id: entityId,
        before_data: beforeData ? JSON.stringify(beforeData) : null,
        after_data: afterData ? JSON.stringify(afterData) : null,
        ip_address: req.ip,
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log', err);
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.sub || 'anonymous';
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms user=${userId}`);
  });
  next();
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    },
  });
}
