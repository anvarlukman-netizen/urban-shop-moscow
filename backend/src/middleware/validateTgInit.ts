import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function validateTelegramInitData(req: Request, res: Response, next: NextFunction) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData) {
    req.telegramUser = { id: 0, first_name: 'Guest', username: 'guest' };
    return next();
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return res.status(401).json({ error: 'Missing hash' });

    params.delete('hash');
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN!)
      .digest();

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (expectedHash !== hash) {
      return res.status(401).json({ error: 'Invalid init data' });
    }

    const userParam = params.get('user');
    if (userParam) {
      req.telegramUser = JSON.parse(userParam);
    }

    next();
  } catch {
    res.status(401).json({ error: 'Failed to validate init data' });
  }
}

// Расширяем тип Request
declare global {
  namespace Express {
    interface Request {
      telegramUser?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
      };
    }
  }
}
