import { Router } from 'express';
import { authMiddleware as auth, optionalAuth } from '../middleware/auth';
import { db } from '../config/firebase';
import { Query, DocumentData, CollectionReference } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

const router = Router();

interface Store {
  id: string;
  isWebshop: boolean;
  hasPhysicalStore: boolean;
  location?: {
    geopoint: admin.firestore.GeoPoint;
  };
  [key: string]: any;
}

interface FeaturedStore extends Store {
  isFeatured: boolean;
}

// Helper function to ensure array has exactly two numbers
function ensureCoordinates(coords: number[]): [number, number] {
  if (coords.length !== 2) {
    return [0, 0];
  }
  return [coords[0], coords[1]];
}

// Public store search endpoint for keyp.fo
router.get('/public/search', optionalAuth, async (req, res) => {
  try {
    const {
      q, // search query
      category,
      brand,
      location,
      priceRange,
      isOpen,
      hasGiftWrapping,
      hasDelivery,
      hasPickup,
      storeType, // 'webshop' | 'physical' | 'both'
      onlyWebshops, // boolean for easy toggle
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      near, // coordinates for geo search
      radius // search radius in km
    } = req.query;

    let storesRef = db.collection('stores') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = storesRef.where('isPublished', '==', true);

    // Store type filtering
    if (onlyWebshops === 'true') {
      query = query.where('isWebshop', '==', true);
    } else if (storeType) {
      switch(storeType.toString()) {
        case 'webshop':
          query = query.where('isWebshop', '==', true);
          break;
        case 'physical':
          query = query.where('hasPhysicalStore', '==', true);
          break;
        case 'both':
          query = query.where('isWebshop', '==', true)
                      .where('hasPhysicalStore', '==', true);
          break;
      }
    }

    // Text search
    if (q) {
      query = query.where('searchTokens', 'array-contains', q.toString().toLowerCase());
    }

    // Basic filters
    if (category) {
      query = query.where('categories', 'array-contains', category);
    }

    if (brand) {
      query = query.where('brands', 'array-contains', brand);
    }

    // Location filter only for physical stores
    if (location && !onlyWebshops) {
      query = query.where('location', '==', location);
    }

    if (isOpen !== undefined) {
      query = query.where('isOpen', '==', isOpen === 'true');
    }

    // Service filters
    if (hasGiftWrapping) {
      query = query.where('services.giftWrapping', '==', true);
    }

    if (hasDelivery) {
      query = query.where('services.delivery', '==', true);
    }

    if (hasPickup) {
      query = query.where('services.pickup', '==', true);
    }

    // Price range filter
    if (priceRange) {
      query = query.where('priceRange', '==', priceRange);
    }

    // Geolocation search (only for physical stores)
    if (near && radius && !onlyWebshops) {
      const coordinates = typeof near === 'string' ? 
        ensureCoordinates(near.split(',').map(Number)) : 
        [0, 0] as [number, number];
      
      const [lat, lng] = coordinates;
      const radiusInM = Number(radius) * 1000;
      
      const center = new admin.firestore.GeoPoint(lat, lng);
      const bounds = calculateGeoBounds(center, radiusInM);
      
      query = query
        .where('location.geopoint', '>', bounds.southwest)
        .where('location.geopoint', '<', bounds.northeast);
    }

    // Apply sorting
    if (sortBy === 'distance' && near && !onlyWebshops) {
      query = query.orderBy('location.geopoint');
    } else {
      query = query.orderBy(sortBy.toString(), sortOrder === 'desc' ? 'desc' : 'asc');
    }

    // Apply pagination
    const pageSize = Number(limit);
    const skip = (Number(page) - 1) * pageSize;

    const snapshot = await query.limit(pageSize).offset(skip).get();

    let stores = snapshot.docs.map(doc => {
      const data = doc.data();
      const store: Store = {
        id: doc.id,
        isWebshop: data.isWebshop || false,
        hasPhysicalStore: data.hasPhysicalStore || false,
        location: data.location,
        ...data
      };

      if (near && !onlyWebshops) {
        const coordinates = typeof near === 'string' ? 
          ensureCoordinates(near.split(',').map(Number)) : 
          [0, 0] as [number, number];
        
        store.distance = calculateDistance(data.location?.geopoint.latitude, data.location?.geopoint.longitude, coordinates[0], coordinates[1]);
      }

      return store;
    });

    // If sorting by distance, sort the results
    if (sortBy === 'distance' && near && !onlyWebshops) {
      stores = stores.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    // Get total count
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data()?.count || 0;

    // Get featured stores (if on first page)
    let featured: FeaturedStore[] = [];
    if (Number(page) === 1) {
      const featuredQuery = storesRef
        .where('isPublished', '==', true)
        .where('isFeatured', '==', true);
        
      // Apply webshop filter to featured stores if needed
      if (onlyWebshops === 'true') {
        featuredQuery.where('isWebshop', '==', true);
      }
      
      const featuredSnapshot = await featuredQuery.limit(3).get();
      
      featured = featuredSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          isWebshop: data.isWebshop || false,
          hasPhysicalStore: data.hasPhysicalStore || false,
          location: data.location,
          isFeatured: true,
          ...data
        };
      });
    }

    res.json({
      stores,
      featured,
      pagination: {
        page: Number(page),
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      },
      filters: {
        categories: await getAvailableCategories(),
        brands: await getAvailableBrands(),
        locations: await getAvailableLocations(),
        priceRanges: await getAvailablePriceRanges(),
        storeTypes: [
          { id: 'all', label: 'All Stores' },
          { id: 'webshop', label: 'Online Stores Only' },
          { id: 'physical', label: 'Physical Stores Only' },
          { id: 'both', label: 'Stores with Both' }
        ]
      }
    });

  } catch (error) {
    console.error('Store search error:', error);
    res.status(500).json({ error: 'Failed to search stores' });
  }
});

// Location-based store search
router.get('/nearby', optionalAuth, async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 10, // radius in kilometers
      categories,
      isOpen,
      limit = 20
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const center = new admin.firestore.GeoPoint(Number(lat), Number(lng));
    const radiusInM = Number(radius) * 1000; // Convert to meters

    // Get stores within radius using geohash
    const nearbyStores = await findStoresNearLocation(center, radiusInM);

    // Apply additional filters
    let filteredStores = nearbyStores;
    
    if (categories) {
      const categoryList = Array.isArray(categories) ? categories : [categories];
      filteredStores = filteredStores.filter(store => 
        store.categories?.some((cat: string) => categoryList.includes(cat))
      );
    }

    if (isOpen === 'true') {
      filteredStores = filteredStores.filter(store => isStoreCurrentlyOpen(store));
    }

    // Sort by distance and limit results
    filteredStores.sort((a, b) => a.distance - b.distance);
    filteredStores = filteredStores.slice(0, Number(limit));

    return res.json({
      stores: filteredStores,
      total: filteredStores.length,
      center: { lat, lng },
      radius
    });
  } catch (error) {
    console.error('Nearby stores error:', error);
    return res.status(500).json({ error: 'Failed to fetch nearby stores' });
  }
});

// Helper function to find stores near location
async function findStoresNearLocation(
  center: admin.firestore.GeoPoint,
  radiusInM: number
): Promise<any[]> {
  const bounds = calculateGeoBounds(center, radiusInM);
  const storesRef = db.collection('stores');
  
  const snapshot = await storesRef
    .where('location.geopoint.latitude', '>=', bounds.south)
    .where('location.geopoint.latitude', '<=', bounds.north)
    .get();

  return snapshot.docs
    .map(doc => {
      const data = doc.data();
      const storeLocation = data.location?.geopoint;
      if (!storeLocation) return null;

      const distance = calculateDistance(
        center.latitude,
        center.longitude,
        storeLocation.latitude,
        storeLocation.longitude
      );

      if (distance <= radiusInM) {
        return {
          id: doc.id,
          ...data,
          distance // in meters
        };
      }
      return null;
    })
    .filter(store => store !== null);
}

// Helper function to calculate geohash bounds
function calculateGeoBounds(center: admin.firestore.GeoPoint, radiusInM: number): GeoBounds {
  const lat = center.latitude;
  const lng = center.longitude;
  const latChange = radiusInM / 111320;
  const lngChange = radiusInM / (111320 * Math.cos(lat * (Math.PI / 180)));

  return {
    north: lat + latChange,
    south: lat - latChange,
    east: lng + lngChange,
    west: lng - lngChange,
    northeast: { lat: lat + latChange, lng: lng + lngChange },
    southwest: { lat: lat - latChange, lng: lng - lngChange }
  };
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Enhanced search endpoint with filters
router.get('/search', async (req, res) => {
  try {
    const {
      q, // search query
      category,
      brand,
      location,
      minPrice,
      maxPrice,
      rating,
      isOpen,
      page = 1,
      limit = 20,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    let storesRef = db.collection('stores') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = storesRef;

    // Build query based on filters
    if (q) {
      query = query.where('searchTokens', 'array-contains', q.toString().toLowerCase());
    }
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    if (brand) {
      query = query.where('brand', '==', brand);
    }
    
    if (location) {
      query = query.where('location', '==', location);
    }
    
    if (rating) {
      query = query.where('rating', '>=', Number(rating));
    }
    
    if (isOpen !== undefined) {
      query = query.where('isOpen', '==', isOpen === 'true');
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      if (minPrice) {
        query = query.where('minPrice', '>=', Number(minPrice));
      }
      if (maxPrice) {
        query = query.where('maxPrice', '<=', Number(maxPrice));
      }
    }

    // Apply sorting
    query = query.orderBy(sortBy.toString(), sortOrder === 'desc' ? 'desc' : 'asc');

    // Apply pagination
    const pageSize = Number(limit);
    const skip = (Number(page) - 1) * pageSize;
    
    const snapshot = await query.limit(pageSize).offset(skip).get();
    
    const stores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get total count for pagination
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    res.json({
      stores,
      pagination: {
        page: Number(page),
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search stores' });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categoriesRef = db.collection('categories') as CollectionReference<DocumentData>;
    const snapshot = await categoriesRef.get();
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all brands
router.get('/brands', async (req, res) => {
  try {
    const brandsRef = db.collection('brands') as CollectionReference<DocumentData>;
    const snapshot = await brandsRef.get();
    const brands = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Basic store operations
router.get('/', async (req, res) => {
  // List all stores
});

router.get('/:id', async (req, res) => {
  // Get store details
});

router.get('/stats', async (req, res) => {
  // Get platform statistics
});

// Protected routes
router.post('/', auth, async (req, res) => {
  // Create new store
});

router.put('/:id', auth, async (req, res) => {
  // Update store
});

router.delete('/:id', auth, async (req, res) => {
  // Delete store
});

// Store reviews and ratings
router.get('/:storeId/reviews', optionalAuth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let reviewsRef = db.collection(`stores/${storeId}/reviews`) as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = reviewsRef;

    if (rating) {
      query = query.where('rating', '==', Number(rating));
    }

    query = query.orderBy(sortBy.toString(), sortOrder === 'desc' ? 'desc' : 'asc');

    const pageSize = Number(limit);
    const skip = (Number(page) - 1) * pageSize;
    const snapshot = await query.limit(pageSize).offset(skip).get();

    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get total count
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data()?.count || 0;

    // Get store rating summary
    const ratingSummary = await getRatingsSummary(storeId);

    return res.json({
      reviews,
      summary: ratingSummary,
      pagination: {
        page: Number(page),
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Store reviews fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch store reviews' });
  }
});

// Add a review (requires auth)
router.post('/:storeId/reviews', auth, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { rating, text } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' });
    }

    // Check if user has already reviewed
    const existingReview = await db.collection(`stores/${storeId}/reviews`)
      .where('userId', '==', req.user?.uid)
      .get();

    if (!existingReview.empty) {
      return res.status(400).json({ error: 'User has already reviewed this store' });
    }

    const reviewData = {
      userId: req.user?.uid,
      rating,
      text,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection(`stores/${storeId}/reviews`).add(reviewData);
    await updateStoreRating(storeId);

    return res.json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(500).json({ error: 'Failed to add review' });
  }
});

// Store opening hours
router.get('/:storeId/hours', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { date } = req.query;

    const storeDoc = await db.collection('stores').doc(storeId).get();
    if (!storeDoc.exists) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const storeData = storeDoc.data();
    const regularHours = storeData?.openingHours || {};
    
    // If specific date is provided, check for special hours
    if (date) {
      const specialHoursDoc = await db.collection(`stores/${storeId}/specialHours`)
        .where('date', '==', new Date(date.toString()))
        .get();

      if (!specialHoursDoc.empty) {
        const specialHours = specialHoursDoc.docs[0].data();
        return res.json({
          regular: regularHours,
          special: specialHours,
          isSpecialDay: true
        });
      }
    }

    return res.json({
      regular: regularHours,
      isSpecialDay: false
    });
  } catch (error) {
    console.error('Store hours fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch store hours' });
  }
});

// Helper functions
async function getRatingsSummary(storeId: string) {
  const snapshot = await db.collection(`stores/${storeId}/reviews`).get();
  const ratings = snapshot.docs.map(doc => doc.data().rating);
  
  return {
    average: ratings.reduce((a, b) => a + b, 0) / ratings.length || 0,
    total: ratings.length,
    distribution: {
      5: ratings.filter(r => r === 5).length,
      4: ratings.filter(r => r === 4).length,
      3: ratings.filter(r => r === 3).length,
      2: ratings.filter(r => r === 2).length,
      1: ratings.filter(r => r === 1).length
    }
  };
}

async function updateStoreRating(storeId: string) {
  const summary = await getRatingsSummary(storeId);
  await db.collection('stores').doc(storeId).update({
    rating: summary.average,
    totalReviews: summary.total
  });
}

// Helper functions for store operations
function isStoreCurrentlyOpen(store: any): boolean {
  const now = new Date();
  const day = now.getDay();
  const time = now.getHours() * 100 + now.getMinutes();

  const hours = store.openingHours?.[day];
  if (!hours) return false;

  return hours.some((period: any) => {
    const open = parseInt(period.open.replace(':', ''));
    const close = parseInt(period.close.replace(':', ''));
    return time >= open && time <= close;
  });
}

async function getAvailableCategories(): Promise<string[]> {
  const snapshot = await db.collection('categories').get();
  return snapshot.docs.map(doc => doc.data().name);
}

async function getAvailableBrands(): Promise<string[]> {
  const snapshot = await db.collection('brands').get();
  return snapshot.docs.map(doc => doc.data().name);
}

async function getAvailableLocations(): Promise<string[]> {
  const snapshot = await db.collection('locations').get();
  return snapshot.docs.map(doc => doc.data().name);
}

async function getAvailablePriceRanges(): Promise<Array<{min: number, max: number}>> {
  return [
    { min: 0, max: 100 },
    { min: 100, max: 500 },
    { min: 500, max: 1000 },
    { min: 1000, max: 5000 },
    { min: 5000, max: Infinity }
  ];
}

// Update the bounds interface
interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
}

export default router; 