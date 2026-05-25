import { Request, Response, NextFunction } from 'express';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['x-admin-password'] as string;
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD not configured' });
  }

  if (auth !== password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
