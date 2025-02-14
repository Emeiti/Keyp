import fetch from 'node-fetch';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(readFileSync('./temp-key.json', 'utf8'));
const app = initializeApp({
  credential: cert(serviceAccount)
});

const testUpload = async () => {
  try {
    // Create a custom token and exchange it for an ID token
    const customToken = await getAuth().createCustomToken('service-account');
    const idTokenResponse = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyDhc_8KQZR3aaQhGZlCgzr8YSahQlqx96Y', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true
      })
    });

    const tokenData = await idTokenResponse.json();
    const idToken = tokenData.idToken;

    const payload = {
      imageData: 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
      storeName: 'TestStore',
      productId: 'test123'
    };

    console.log('Sending payload:', payload);
    console.log('Sending request to:', 'https://uploadimage-eqrcnqz5hq-uc.a.run.app');

    const response = await fetch('https://uploadimage-eqrcnqz5hq-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed response:', data);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
    }
  } catch (error) {
    console.error('Network error:', error.message);
    if (error.response) {
      const text = await error.response.text();
      console.error('Error response text:', text);
    }
  }
};

testUpload(); 