import { Router } from 'express';
import { auth } from '../middleware/auth';
import { db } from '../config/firebase';
import { Query, DocumentData, CollectionReference } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

const router = Router();

// Get user's wishlists with filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      q, // search query
      status,
      visibility,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let wishlistsRef = db.collection('wishlists') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = wishlistsRef.where('userId', '==', req.user?.uid);

    // Build query based on filters
    if (q) {
      query = query.where('searchTokens', 'array-contains', q.toString().toLowerCase());
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (visibility) {
      query = query.where('visibility', '==', visibility);
    }

    // Apply sorting
    query = query.orderBy(sortBy.toString(), sortOrder === 'desc' ? 'desc' : 'asc');

    // Apply pagination
    const pageSize = Number(limit);
    const skip = (Number(page) - 1) * pageSize;

    const snapshot = await query.limit(pageSize).offset(skip).get();
    
    const wishlists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get total count
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    res.json({
      wishlists,
      pagination: {
        page: Number(page),
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    console.error('Wishlist fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlists' });
  }
});

// Search within a specific wishlist's items
router.get('/:id/items/search', auth, async (req, res) => {
  try {
    const wishlistId = req.params.id;
    const {
      q,
      category,
      priceMin,
      priceMax,
      priority,
      status,
      sortBy = 'addedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Verify wishlist exists and user has access
    const wishlistRef = db.collection('wishlists').doc(wishlistId);
    const wishlist = await wishlistRef.get();
    
    if (!wishlist.exists) {
      res.status(404).json({ error: 'Wishlist not found' });
      return;
    }
    
    if (wishlist.data()?.userId !== req.user?.uid) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    let itemsRef = wishlistRef.collection('items') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = itemsRef;

    // Build query based on filters
    if (q) {
      query = query.where('searchTokens', 'array-contains', q.toString().toLowerCase());
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    if (priority) {
      query = query.where('priority', '==', priority);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (priceMin || priceMax) {
      if (priceMin) {
        query = query.where('price', '>=', Number(priceMin));
      }
      if (priceMax) {
        query = query.where('price', '<=', Number(priceMax));
      }
    }

    // Apply sorting
    query = query.orderBy(sortBy.toString(), sortOrder === 'desc' ? 'desc' : 'asc');

    // Apply pagination
    const pageSize = Number(limit);
    const skip = (Number(page) - 1) * pageSize;

    const snapshot = await query.limit(pageSize).offset(skip).get();
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get total count
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    res.json({
      items,
      pagination: {
        page: Number(page),
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    console.error('Wishlist items search error:', error);
    res.status(500).json({ error: 'Failed to search wishlist items' });
  }
});

// User wishlist operations
router.get('/:id', auth, async (req, res) => {
  // Get specific wishlist
});

router.post('/', auth, async (req, res) => {
  // Create new wishlist
});

router.put('/:id', auth, async (req, res) => {
  // Update wishlist
});

router.delete('/:id', auth, async (req, res) => {
  // Delete wishlist
});

// Wishlist items
router.post('/:id/items', auth, async (req, res) => {
  // Add item to wishlist
});

router.delete('/:id/items/:itemId', auth, async (req, res) => {
  // Remove item from wishlist
});

router.put('/:id/items/:itemId', auth, async (req, res) => {
  // Update item in wishlist
});

// Update the count endpoint to ensure it always returns a value
router.get('/:id/count', auth, async (req, res) => {
  try {
    const wishlistId = req.params.id;
    const snapshot = await db.collection('wishlists')
      .doc(wishlistId)
      .collection('items')
      .count()
      .get();
    
    res.json({ count: snapshot.data()?.count || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get wishlist count' });
  }
});

// Share wishlist
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility, sharedWith = [] } = req.body;

    const wishlistRef = db.collection('wishlists').doc(id);
    const wishlist = await wishlistRef.get();

    if (!wishlist.exists) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    if (wishlist.data()?.userId !== req.user?.uid) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const shareData = {
      visibility, // 'private', 'shared', 'public'
      sharedWith, // array of email addresses or user IDs
      shareLink: visibility === 'public' ? generateShareLink(id) : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await wishlistRef.update(shareData);

    return res.json({ message: 'Wishlist shared successfully', shareData });
  } catch (error) {
    console.error('Share wishlist error:', error);
    return res.status(500).json({ error: 'Failed to share wishlist' });
  }
});

// Update gift purchase status
router.patch('/:wishlistId/items/:itemId/status', auth, async (req, res) => {
  try {
    const { wishlistId, itemId } = req.params;
    const { status } = req.body; // 'available' or 'purchased'

    if (!['available', 'purchased'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const wishlistRef = db.collection('wishlists').doc(wishlistId);
    const itemRef = wishlistRef.collection('items').doc(itemId);
    
    const [wishlist, item] = await Promise.all([
      wishlistRef.get(),
      itemRef.get()
    ]);

    if (!wishlist.exists || !item.exists) {
      return res.status(404).json({ error: 'Wishlist or item not found' });
    }

    // Only allow status update if user is not the wishlist owner
    if (wishlist.data()?.userId === req.user?.uid) {
      return res.status(403).json({ error: 'Wishlist owner cannot mark items as purchased' });
    }

    await itemRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      purchasedBy: status === 'purchased' ? req.user?.uid : null
    });

    return res.json({ message: 'Gift status updated successfully' });
  } catch (error) {
    console.error('Update gift status error:', error);
    return res.status(500).json({ error: 'Failed to update gift status' });
  }
});

// Helper function to generate share link
function generateShareLink(wishlistId: string): string {
  // In production, this should use a proper URL with your domain
  return `https://keyp.fo/wishlists/${wishlistId}`;
}

export default router; 