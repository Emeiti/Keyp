import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import sharp from 'sharp';

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const uploadImage = onRequest({ 
  region: 'us-central1',
  minInstances: 0,
  maxInstances: 10,
  timeoutSeconds: 120,
  memory: '256MiB',
  invoker: 'private'  // Require authentication
}, async (req: Request, res: Response) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Allow only POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authentication token' });
    return;
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
    return;
  }
  
  // Extract payload
  const { imageData, storeName, productId } = req.body;
  if (!imageData || !storeName || !productId) {
    res.status(400).json({ error: 'Missing required fields: imageData, storeName, productId.' });
    return;
  }
  
  try {
    // Decode the base64-encoded processed image data provided by the client.
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Optionally validate the image data by reading metadata.
    try {
      await sharp(imageBuffer).metadata();
    } catch (err) {
      throw new Error('Invalid image data provided.');
    }

    // Define storage path
    const filePath = `product-images/${storeName}/${productId}.webp`;

    // Upload the client-processed image to Firebase Storage
    const bucket = admin.storage().bucket('keyp-51c12.firebasestorage.app');
    const file = bucket.file(filePath);
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/webp'
      },
      public: true
    });

    // Construct public URL for the uploaded image
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    res.json({ url: publicUrl });
    return;
  } catch (error: any) {
    console.error('Error in processing image:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
    return;
  }
}); 