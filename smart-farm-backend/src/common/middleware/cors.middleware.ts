import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    const origin = req.headers.origin;

    const defaultOrigins = [
      'https://feedin-agri-production.up.railway.app',
      'https://feedingreen.up.railway.app',
      'https://feedingreen.com',
      'http://localhost:4200',
      'http://127.0.0.1:4200',
    ];

    const isAllowed = (orig: string | undefined): boolean => {
      if (!orig) return true;
      if (defaultOrigins.includes(orig)) return true;
      if (corsOrigin && corsOrigin !== '*' && corsOrigin.split(',').map(o => o.trim()).includes(orig)) return true;
      if (orig.endsWith('.up.railway.app') || orig.endsWith('feedingreen.com')) return true;
      return false;
    };

    let allowedOrigin: string;

    if (corsOrigin === '*') {
      allowedOrigin = origin || '*';
    } else if (isAllowed(origin)) {
      allowedOrigin = origin!;
    } else {
      allowedOrigin = defaultOrigins[0];
    }

    // ALWAYS set CORS headers — critical for preventing CORS errors on 404s
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Accept, Origin, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie, X-CSRF-Token');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  }
}
