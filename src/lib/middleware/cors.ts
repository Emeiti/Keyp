import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://ynskilisti.keyp.fo',
  'https://gavuhugskot.keyp.fo',
  'https://tilbod.keyp.fo',
  'https://keyp.fo'
];

export async function cors(request: Request) {
  const origin = request.headers.get('origin');
  
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    throw new Error('Unauthorized origin');
  }

  return NextResponse.next({
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  });
} 