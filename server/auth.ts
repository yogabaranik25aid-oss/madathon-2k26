import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { User } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Hashes a plaintext password using PBKDF2 with a cryptographic salt.
 * Format: pbkdf2$<salt>$<hash>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$${salt}$${hash}`;
}

/**
 * Verifies a plaintext password against a stored hash or legacy plaintext password.
 */
export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
  if (!storedHashOrPlain || !password) return false;
  
  if (storedHashOrPlain.startsWith('pbkdf2$')) {
    const parts = storedHashOrPlain.split('$');
    if (parts.length !== 3) return false;
    const [, salt, originalHash] = parts;
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
  }

  // Backward compatibility with legacy initial plaintext seeds (will auto-upgrade on login)
  return password === storedHashOrPlain;
}

/**
 * Generates a high-entropy cryptographically secure session token.
 */
export function generateSessionToken(userId: string): string {
  const randomHex = crypto.randomBytes(32).toString('hex');
  return `sess_${userId}_${Date.now()}_${randomHex}`;
}

/**
 * Extracts and validates the authenticated user from the Authorization header or x-auth-token.
 * NEVER accepts fabricated user IDs or raw x-user-id headers.
 */
export function getAuthenticatedUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = (req.headers['x-auth-token'] as string).trim();
  }

  if (!token) {
    return null;
  }

  // Reject fabricated tokens or raw user IDs
  if (token.startsWith('usr-') || !token.includes('_')) {
    return null;
  }

  const user = db.getUserByToken(token);
  return user || null;
}

/**
 * Express middleware requiring a valid, authenticated session.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in with valid credentials.',
    });
  }
  (req as AuthenticatedRequest).user = user;
  next();
}

/**
 * Express middleware requiring one of the specified user roles.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user || getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access requires ${allowedRoles.join(' or ')} privileges.`,
      });
    }

    (req as AuthenticatedRequest).user = user;
    next();
  };
}

export const requireManager = requireRole('manager', 'admin');
export const requireHr = requireRole('hr');
export const requireAdmin = requireRole('admin');
export const requireHrOrManager = requireRole('manager', 'admin', 'hr');
