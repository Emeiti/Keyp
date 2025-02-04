import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

type UserRole = 'user' | 'store_owner' | 'admin';

interface RateLimit {
  requests: number;
  window: number;
}

interface RequestLog {
  timestamp: Timestamp;
  path: string;
}

const RATE_LIMITS: Record<UserRole, RateLimit> = {
  user: { requests: 1000, window: 3600 }, // 1000 requests per hour
  store_owner: { requests: 5000, window: 3600 }, // 5000 requests per hour
  admin: { requests: Infinity, window: 3600 }
};

export async function rateLimit(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userRole = (decodedToken.role as UserRole) || 'user';

    // Skip rate limiting for admins
    if (userRole === 'admin') {
      return NextResponse.next();
    }

    const now = Timestamp.now();
    const windowStart = Timestamp.fromMillis(now.toMillis() - (RATE_LIMITS[userRole].window * 1000));

    // Get rate limit doc
    const rateLimitRef = adminDb.collection('rateLimits').doc(userId);
    
    // Start a transaction
    const result = await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      const data = doc.data() || { requests: [] };
      
      // Filter out old requests
      const recentRequests = (data.requests as RequestLog[]).filter(
        (req: RequestLog) => req.timestamp >= windowStart
      );
      
      // Check if user has exceeded rate limit
      if (recentRequests.length >= RATE_LIMITS[userRole].requests) {
        throw new Error('Rate limit exceeded');
      }

      // Add new request
      recentRequests.push({
        timestamp: now,
        path: request.url
      });

      // Update document
      transaction.set(rateLimitRef, { 
        requests: recentRequests,
        lastUpdated: now
      });

      return true;
    });

    return NextResponse.next();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Rate limit exceeded') {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
} 