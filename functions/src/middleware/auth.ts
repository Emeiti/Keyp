import { Request, Response, NextFunction } from 'express';
import { auth as firebaseAuth } from '../config/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (process.env.FUNCTIONS_EMULATOR) {
    // For emulator testing, create a full mock token
    const mockToken: DecodedIdToken = {
      uid: req.headers.authorization === 'Bearer test-token' ? 'test-user-id' : 'other-user-id',
      email: 'test@example.com',
      aud: 'keyp-51c12',
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      sub: 'test-user-id',
      firebase: {
        identities: {},
        sign_in_provider: 'custom'
      },
      iss: `https://securetoken.google.com/keyp-51c12`
    };
    req.user = mockToken;
    return next();
  }

  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await firebaseAuth.verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional auth middleware - doesn't require authentication but adds user if token present
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await firebaseAuth.verifyIdToken(token);
      req.user = decodedToken;
    } catch (error) {
      // Invalid token, but we'll continue without user
    }
    next();
  } catch (error) {
    next();
  }
}; 