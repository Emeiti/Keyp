// temp_test_api.js
const admin = require('firebase-admin');

// Load your service account key
const serviceAccount = require('./secrets/keyp-51c12-ynskilisti.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'keyp-51c12'
});

(async () => {
  try {
    // Test Firestore access first
    const db = admin.firestore();
    
    // Create a test wishlist if none exists
    const wishlistRef = await db.collection('wishlists').add({
      name: "Test Wishlist",
      userId: "test-user",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      items: []
    });
    
    console.log('Created test wishlist:', wishlistRef.id);

    // Generate token for API testing
    const uid = 'test-user';
    const customToken = await admin.auth().createCustomToken(uid);
    console.log('\nUse this token in Postman:', customToken);

  } catch (err) {
    console.error("Error:", err);
  }
})();