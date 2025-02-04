import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { cors } from '../../../../lib/middleware/cors';
import { rateLimit } from '../../../../lib/middleware/rate-limit';

export async function GET(request: Request) {
  try {
    // Apply middleware
    await cors(request);
    await rateLimit(request);

    const storesSnapshot = await adminDb.collection('stores').get();
    const stores = storesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(stores);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 