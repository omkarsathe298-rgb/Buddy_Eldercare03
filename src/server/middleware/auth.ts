import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db, User } from '../db.js';

let inMemoryDevSecret: string | null = null;

/**
 * Retrieves the JWT secret from environment variables.
 * In production: strictly enforces that process.env.JWT_SECRET is set.
 * In development: generates a cryptographically random in-memory ephemeral secret
 * if the environment variable is not yet configured, preventing any hardcoded secrets.
 */
export function getJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET;
  if (envSecret && envSecret.trim().length > 0) {
    return envSecret.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production! ' +
      'Please configure JWT_SECRET in your production environment settings before starting.'
    );
  }

  // Development ephemeral fallback
  if (!inMemoryDevSecret) {
    inMemoryDevSecret = crypto.randomBytes(32).toString('hex');
    console.warn(
      '\n⚠️  [JWT SECURITY NOTICE]: JWT_SECRET environment variable is not set.\n' +
      '   A secure in-memory ephemeral secret has been generated for development.\n' +
      '   Configure JWT_SECRET in your Google AI Studio Secrets panel or .env file to persist sessions across restarts.\n'
    );
  }

  return inMemoryDevSecret;
}

/**
 * Validates JWT configuration at server startup
 */
export function validateJwtSecretAtStartup(): { isConfigured: boolean; warning?: string } {
  const envSecret = process.env.JWT_SECRET;
  if (!envSecret || envSecret.trim().length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is missing in production.');
    }
    return {
      isConfigured: false,
      warning: 'JWT_SECRET is not set in environment variables. Ephemeral random secret active for dev.'
    };
  }

  if (envSecret.trim().length < 32) {
    console.warn(
      '⚠️  [JWT SECURITY WARNING]: JWT_SECRET is shorter than 32 characters. A 256-bit secret (32+ characters) is recommended.'
    );
  }

  return { isConfigured: true };
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Validate and sanitize token expiry (must be valid timespan format like "7d", "24h", "60m" or number of seconds)
export function getTokenExpiry(): string {
  const envVal = process.env.JWT_EXPIRES_IN?.trim();
  if (envVal && /^(\d+[smhdwy]|\d+)$/i.test(envVal)) {
    return envVal;
  }
  return '7d';
}

/**
 * Generates a signed JWT token with standard payload
 */
export function generateToken(user: User): string {
  const secret = getJwtSecret();
  const expiry = getTokenExpiry();

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    secret,
    {
      expiresIn: expiry as any,
      algorithm: 'HS256'
    }
  );
}

/**
 * Middleware: Strictly requires valid JWT token in Authorization Bearer header
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in to continue.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret) as { id: string; email?: string; role?: string };
    const user = db.findUserById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'User account not found or has been deactivated.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Your session has expired. Please log in again.' });
      return;
    }
    res.status(401).json({ error: 'Invalid authentication token. Please log in.' });
  }
}

/**
 * Middleware: Parses JWT token if present, but allows guest access if absent
 */
export function optionalAuthenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = getJwtSecret();

    try {
      const decoded = jwt.verify(token, secret) as { id: string };
      const user = db.findUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore token parse error for optional auth
    }
  }
  next();
}

/**
 * Middleware: Enforces role-based authorization (ELDER, CAREGIVER, ADMIN)
 */
export function requireRole(allowedRoles: ('ELDER' | 'CAREGIVER' | 'ADMIN')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied: insufficient permissions for this action.' });
      return;
    }
    next();
  };
}
