import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import * as fs from 'fs/promises';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

// Define interfaces we're actually using
interface WishlistItem {
    itemId: string;
    name: string;
    description?: string;
    price?: number;
    url?: string;
    priority: number;
    note?: string;
    createdAt: string;
    updatedAt: string;
}

interface Wishlist {
    id: string;
    name: string;
    userId: string;
    visibility: 'private' | 'shared' | 'public';
    sharedWith: string[];
    shareLink?: string;
    items: WishlistItem[];
    createdAt: Date;
    updatedAt: Date;
}

interface WishlistResponse {
    wishlistId: string;
    name: string;
    description?: string;
    visibility: 'private' | 'shared' | 'public';
    items: WishlistItem[];
    createdAt: any;
    updatedAt: any;
}

// Remove ALL other code and functions from this file
// Only keep this single export

export const getWishlists = onRequest({ region: 'europe-west1' }, async (req: Request, res: Response): Promise<void> => {
    const db = admin.firestore();
    
    switch (req.method) {
        case 'GET':
            try {
                const { id } = req.query;
                if (id) {
                    console.log('Getting wishlist:', id);
                    const wishlistDoc = await db.collection('wishlists').doc(id as string).get();
                    if (!wishlistDoc.exists) {
                        res.status(404).json({ error: 'Wishlist not found' });
                        return;
                    }
                    
                    // Get items subcollection
                    const itemsRef = db.collection('wishlists')
                        .doc(id as string)
                        .collection('items');
                    
                    console.log('Getting items from:', itemsRef.path);
                    const itemsSnapshot = await itemsRef.get();
                    console.log('Found items:', itemsSnapshot.size);
                    
                    const items: WishlistItem[] = itemsSnapshot.docs.map(doc => {
                        console.log('Item data:', doc.data());
                        return {
                            itemId: doc.id,
                            name: doc.data().name || '',
                            description: doc.data().description || '',
                            price: doc.data().price || 0,
                            url: doc.data().url || '',
                            priority: doc.data().priority || 1,
                            note: doc.data().note || '',
                            createdAt: doc.data().createdAt || '',
                            updatedAt: doc.data().updatedAt || ''
                        };
                    });

                    const response: WishlistResponse = {
                        wishlistId: wishlistDoc.id,
                        name: wishlistDoc.data()?.name || '',
                        description: wishlistDoc.data()?.description,
                        visibility: wishlistDoc.data()?.visibility || 'private',
                        items: items,
                        createdAt: wishlistDoc.data()?.createdAt,
                        updatedAt: wishlistDoc.data()?.updatedAt
                    };

                    console.log('Final response:', response);
                    res.json({ 
                        success: true, 
                        data: response 
                    });
                } else {
                    const wishlistsSnapshot = await db.collection('wishlists').get();
                    
                    const wishlists: WishlistResponse[] = await Promise.all(
                        wishlistsSnapshot.docs.map(async (doc) => {
                            const itemsSnapshot = await db.collection('wishlists')
                                .doc(doc.id)
                                .collection('items')
                                .get();

                            const items = itemsSnapshot.docs.map(itemDoc => ({
                                itemId: itemDoc.id,
                                name: itemDoc.data().name || '',
                                priority: itemDoc.data().priority || 1,
                                ...itemDoc.data()
                            })) as WishlistItem[];

                            return {
                                wishlistId: doc.id,
                                name: doc.data().name || '',
                                description: doc.data().description,
                                visibility: doc.data().visibility || 'private',
                                items: items,
                                createdAt: doc.data().createdAt,
                                updatedAt: doc.data().updatedAt
                            };
                        })
                    );
                    
                    res.json({ success: true, data: wishlists });
                }
            } catch (error: any) {
                console.error('GET Error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
            break;

        case 'POST':
            try {
                // Create new wishlist
                const newWishlist = {
                    name: req.body.name,
                    description: req.body.description,
                    visibility: req.body.visibility || 'private',
                    items: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const docRef = await db.collection('wishlists').add(newWishlist);
                
                res.status(201).json({
                    success: true,
                    data: {
                        id: docRef.id,
                        ...newWishlist
                    }
                });
            } catch (error: any) {
                console.error('POST Error:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message || 'Failed to create wishlist'
                });
            }
            break;

        case 'PUT':
            try {
                const { id } = req.query;
                if (!id) {
                    res.status(400).json({ success: false, error: 'Wishlist ID required' });
                    return;
                }
                const updates = {
                    ...req.body,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };
                await db.collection('wishlists').doc(id as string).update(updates);
                res.json({
                    success: true,
                    data: { wishlistId: id, ...updates }
                });
            } catch (error: any) {
                console.error('PUT Error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;
                if (!id) {
                    res.status(400).json({ success: false, error: 'Wishlist ID required' });
                    return;
                }
                // Delete all items in the wishlist
                const itemsSnapshot = await db.collection('wishlists').doc(id as string).collection('items').get();
                const batch = db.batch();
                itemsSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                
                // Delete the wishlist itself
                await db.collection('wishlists').doc(id as string).delete();
                res.json({ success: true });
            } catch (error: any) {
                console.error('DELETE Error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
            break;

        case 'PATCH':
            try {
                const { id } = req.query;
                if (!id) {
                    res.status(400).json({ success: false, error: 'Wishlist ID required' });
                    return;
                }
                const updates = {
                    ...req.body,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };
                await db.collection('wishlists').doc(id as string).set(updates, { merge: true });
                res.json({
                    success: true,
                    data: { wishlistId: id, ...updates }
                });
            } catch (error: any) {
                console.error('PATCH Error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
            break;

        default:
            res.status(405).json({ error: 'Method not allowed' });
    }
});

// Add new function for stores
export const getStores = onRequest({ region: 'europe-west1' }, async (req: Request, res: Response): Promise<void> => {
    const db = admin.firestore();

    switch (req.method) {
      case 'GET':
        try {
          const storesSnap = await db.collection('stores').get();
          const stores = storesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          res.json({
            success: true,
            data: stores
          });
        } catch (error: any) {
          console.error('GET Error:', error);
          res.status(500).json({
            success: false,
            error: error.message || 'Unknown error'
          });
        }
        break;

      case 'POST':
        try {
          const store = req.body;
          const docRef = await db.collection('stores').add(store);
          res.status(201).json({
            success: true,
            data: {
              id: docRef.id,
              ...store
            }
          });
        } catch (error: any) {
          console.error('POST Error:', error);
          res.status(500).json({
            success: false,
            error: error.message || 'Unknown error'
          });
        }
        break;

      case 'PUT':
        try {
          const { id } = req.query;
          if (!id) {
            res.status(400).json({
              success: false,
              error: 'Store ID is required'
            });
            return;
          }
          const store = req.body;
          await db.collection('stores').doc(id as string).set(store);
          res.json({
            success: true,
            data: {
              id,
              ...store
            }
          });
        } catch (error: any) {
          console.error('PUT Error:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
        break;

      case 'PATCH':
        try {
          const { id } = req.query;
          if (!id) {
            res.status(400).json({
              success: false,
              error: 'Store ID is required'
            });
            return;
          }
          const updates = req.body;
          await db.collection('stores').doc(id as string).update(updates);
          res.json({
            success: true,
            message: `Store ${id} updated successfully`
          });
        } catch (error: any) {
          console.error('PATCH Error:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
        break;

      case 'DELETE':
        try {
          const { id } = req.query;
          if (!id) {
            res.status(400).json({
              success: false,
              error: 'Store ID is required'
            });
            return;
          }
          await db.collection('stores').doc(id as string).delete();
          res.json({
            success: true,
            message: `Store ${id} deleted successfully`
          });
        } catch (error: any) {
          console.error('DELETE Error:', error);
          res.status(500).json({
            success: false,
            error: error.message || 'Unknown error'
          });
        }
        break;

      case 'HEAD':
        try {
          const { id } = req.query;
          if (!id) {
            res.status(400).end();
            return;
          }
          const doc = await db.collection('stores').doc(id as string).get();
          res.status(doc.exists ? 200 : 404).end();
        } catch (error: any) {
          console.error('HEAD Error:', error);
          res.status(500).end();
        }
        break;

      case 'OPTIONS':
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).end();
        break;

      default:
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
});

// Export the auth function
export const auth = onRequest({ region: 'europe-west1' }, async (req: Request, res: Response) => {
    const db = admin.firestore();
    const auth = admin.auth();

    try {
      if (req.path.endsWith('/register')) {
        if (req.method === 'POST') {
          const { email, password, displayName } = req.body;
          
          // Create user in Firebase Auth
          const userRecord = await auth.createUser({
            email,
            password,
            displayName
          });

          // Create user document in Firestore
          await db.collection('users').doc(userRecord.uid).set({
            email,
            displayName,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          res.status(201).json({
            success: true,
            data: {
              user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName
              }
            }
          });
        }
      }
      else if (req.path.endsWith('/login')) {
        if (req.method === 'POST') {
          const { email } = req.body;
          
          try {
            // Just verify the user exists
            const userRecord = await auth.getUserByEmail(email);
            
            // Get user data from Firestore
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            const userData = userDoc.data();
            
            // Return user data without creating a token
            res.json({
              success: true,
              data: {
                user: {
                  uid: userRecord.uid,
                  email: userRecord.email,
                  displayName: userRecord.displayName,
                  ...userData
                }
              }
            });
          } catch (error) {
            res.status(401).json({
              success: false,
              error: 'Invalid credentials'
            });
          }
        }
      }
      else if (req.path.endsWith('/share')) {
        if (req.method === 'POST') {
          const { wishlistId, isPublic } = req.body;
          await db.collection('wishlists').doc(wishlistId).update({
            isPublic
          });
          res.json({ success: true });
        }
      }
      else if (req.path.endsWith('/bought')) {
        if (req.method === 'POST') {
          const { wishlistId, itemId, boughtBy } = req.body;
          await db.collection('wishlists').doc(wishlistId)
            .collection('bought').doc(itemId).set({
              boughtBy,
              boughtAt: admin.firestore.FieldValue.serverTimestamp()
            });
          res.json({ success: true });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }
);

// Add this new function
export const createWishlist = onRequest({ region: 'europe-west1' }, async (req: Request, res: Response): Promise<void> => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const db = admin.firestore();
        const { name, description = '' } = req.body;

        if (!name) {
            res.status(400).json({ error: "Name is required" });
            return;
        }

        const wishlist = {
            name,
            description,
            userId: 'test-user-id',
            items: [],
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
            visibility: 'private',
            sharedWith: []
        };

        const docRef = await db.collection('wishlists').add(wishlist);
        
        res.status(201).json({
            success: true,
            data: {
                id: docRef.id,
                ...wishlist
            }
        });
    } catch (error: any) {
        console.error('Create wishlist error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message || "Failed to create wishlist" 
        });
    }
});

// Use the interface in our functions
export const wishlists = onRequest({ region: 'europe-west1' }, async (req: Request, res: Response): Promise<void> => {
    const db = admin.firestore();

    switch (req.method) {
        case 'GET':
            try {
                const { id } = req.query;
                if (id) {
                    const doc = await db.collection('wishlists').doc(id as string).get();
                    if (!doc.exists) {
                        res.status(404).json({ error: 'Wishlist not found' });
                        return;
                    }
                    const wishlist = { id: doc.id, ...doc.data() } as Wishlist;
                    res.json({ success: true, data: wishlist });
                } else {
                    // Get all wishlists
                    const snapshot = await db.collection('wishlists').get();
                    const wishlists = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    res.json({ success: true, data: wishlists });
                }
            } catch (error: any) {
                console.error('GET Error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
            break;

        case 'POST':
            try {
                const wishlistData = {
                    name: req.body.name,
                    description: req.body.description,
                    visibility: req.body.visibility || 'private',
                    items: [],
                    userId: req.body.userId, // You might want to get this from auth
                    createdAt: admin.firestore.Timestamp.now(),
                    updatedAt: admin.firestore.Timestamp.now()
                };

                const docRef = await db.collection('wishlists').add(wishlistData);
                
                res.status(201).json({
                    success: true,
                    data: {
                        id: docRef.id,
                        ...wishlistData
                    }
                });
            } catch (error: any) {
                console.error('POST Error:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
            break;

        case 'PUT':
            try {
                const { id } = req.query;
                if (!id) {
                    res.status(400).json({ error: 'Wishlist ID required' });
                    return;
                }

                const wishlistRef = db.collection('wishlists').doc(id as string);
                const wishlist = await wishlistRef.get();

                if (!wishlist.exists) {
                    res.status(404).json({ error: 'Wishlist not found' });
                    return;
                }

                const timestamp = new Date().toISOString();
                const updates = {
                    ...req.body,
                    updatedAt: timestamp
                };

                await wishlistRef.update(updates);
                
                const updatedDoc = await wishlistRef.get();
                res.json({
                    success: true,
                    data: {
                        wishlistId: updatedDoc.id,
                        ...updatedDoc.data()
                    }
                });
            } catch (error: any) {
                console.error('PUT Error:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message || 'Failed to update wishlist' 
                });
            }
            break;

        case 'DELETE':
            try {
                const { id } = req.query;
                if (!id) {
                    res.status(400).json({ success: false, error: 'Wishlist ID required' });
                    return;
                }
                await db.collection('wishlists').doc(id as string).delete();
                res.json({ success: true });
            } catch (error: any) {
                console.error('DELETE Error:', error);
                res.status(500).json({ success: false, error: error.message });
            }
            break;

        default:
            res.status(405).json({ error: 'Method not allowed' });
    }
});

// Item Operations
export const wishlistItems = onRequest({ region: 'europe-west1' }, async (req: Request, res: Response): Promise<void> => {
    const db = admin.firestore();
    const { wishlistId, itemId } = req.query;

    if (!wishlistId) {
        res.status(400).json({ error: 'Wishlist ID required' });
        return;
    }

    const wishlistRef = db.collection('wishlists').doc(wishlistId as string);
    const wishlistDoc = await wishlistRef.get();
    
    if (!wishlistDoc.exists) {
        res.status(404).json({ error: 'Wishlist not found' });
        return;
    }

    switch (req.method) {
        case 'GET':
            try {
                if (itemId) {
                    // Get single item
                    const itemRef = wishlistRef.collection('items').doc(itemId as string);
                    const itemDoc = await itemRef.get();

                    if (!itemDoc.exists) {
                        res.status(404).json({ 
                            success: false, 
                            error: 'Item not found' 
                        });
                        return;
                    }

                    res.json({
                        success: true,
                        data: {
                            itemId: itemDoc.id,
                            name: itemDoc.data()?.name || '',
                            description: itemDoc.data()?.description || '',
                            price: itemDoc.data()?.price || 0,
                            url: itemDoc.data()?.url || '',
                            priority: itemDoc.data()?.priority || 1,
                            note: itemDoc.data()?.note || '',
                            createdAt: itemDoc.data()?.createdAt || '',
                            updatedAt: itemDoc.data()?.updatedAt || ''
                        }
                    });
                } else {
                    // Get all items
                    const itemsRef = wishlistRef.collection('items');
                    const itemsSnapshot = await itemsRef.get();
                    
                    const items = itemsSnapshot.docs.map(doc => ({
                        itemId: doc.id,
                        name: doc.data().name || '',
                        description: doc.data().description || '',
                        price: doc.data().price || 0,
                        url: doc.data().url || '',
                        priority: doc.data().priority || 1,
                        note: doc.data().note || '',
                        createdAt: doc.data().createdAt || '',
                        updatedAt: doc.data().updatedAt || ''
                    }));

                    res.json({
                        success: true,
                        data: items
                    });
                }
            } catch (error: any) {
                console.error('GET Error:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message || 'Failed to get items' 
                });
            }
            break;

        case 'POST':
            try {
                const timestamp = new Date().toISOString();
                const itemData = {
                    ...req.body,
                    createdAt: timestamp,
                    updatedAt: timestamp
                };

                const itemRef = await db.collection('wishlists')
                    .doc(wishlistId as string)
                    .collection('items')
                    .add(itemData);

                res.status(201).json({
                    success: true,
                    data: {
                        itemId: itemRef.id,
                        ...itemData
                    }
                });
            } catch (error: any) {
                console.error('POST Error:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message || 'Failed to add item' 
                });
            }
            break;

        case 'PUT':
            try {
                if (!itemId) {
                    res.status(400).json({ error: 'Item ID required' });
                    return;
                }

                const itemRef = wishlistRef.collection('items').doc(itemId as string);
                const itemDoc = await itemRef.get();

                if (!itemDoc.exists) {
                    res.status(404).json({ error: 'Item not found' });
                    return;
                }

                const timestamp = new Date().toISOString();
                const updates = {
                    ...req.body,
                    updatedAt: timestamp
                };

                await itemRef.update(updates);
                
                const updatedDoc = await itemRef.get();
                res.json({
                    success: true,
                    data: {
                        itemId: updatedDoc.id,
                        ...updatedDoc.data()
                    }
                });
            } catch (error: any) {
                console.error('PUT Error:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message || 'Failed to update item' 
                });
            }
            break;

        case 'DELETE':
            try {
                if (!itemId) {
                    res.status(400).json({ error: 'Item ID required' });
                    return;
                }

                const itemRef = wishlistRef.collection('items').doc(itemId as string);
                const itemDoc = await itemRef.get();

                if (!itemDoc.exists) {
                    res.status(404).json({ error: 'Item not found' });
                    return;
                }

                await itemRef.delete();
                res.json({ 
                    success: true,
                    message: 'Item deleted successfully'
                });
            } catch (error: any) {
                console.error('DELETE Error:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message || 'Failed to delete item' 
                });
            }
            break;

        default:
            res.status(405).json({ error: 'Method not allowed' });
    }
});

export const getApiDocs = onRequest({ region: 'europe-west1' }, async (req: Request, res: Response): Promise<void> => {
    try {
        // Verify Firebase Auth token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Optional: Add additional access controls
        // For example, check if user's email domain matches your organization
        if (!decodedToken.email?.endsWith('@yourdomain.com')) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        // Serve the implementation guide from a secure location
        const guideContent = await fs.readFile('docs/api/implementation-guide.md', 'utf8');
        res.send(guideContent);

    } catch (error) {
        console.error('Documentation access error:', error);
        res.status(500).json({ error: 'Failed to load documentation' });
    }
});

export { uploadImage } from './routes/uploadImage';
