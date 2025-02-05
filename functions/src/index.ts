/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { Request, Response } from 'express';
import { onRequest } from 'firebase-functions/v2/https';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

// Initialize Firebase Admin
admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));

// Middleware to verify Firebase token
const auth = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        }
      });
      return;
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (error) {
    res.status(401).json({ 
      error: { 
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing authentication token'
      }
    });
    return;
  }
};

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// Define types for our store data
interface StoreAddress {
  street: string;
  city: string;
  postalCode: string;
}

interface StoreSocial {
  facebook?: string;
  instagram?: string;
}

interface StoreContact {
  email: string;
  phone: string;
  address: StoreAddress;
  social: StoreSocial;
}

interface StoreMetadata {
  logo: string;
  hasWebshop: boolean;
  hasPhysicalShop: boolean;
  categories: string[];
  brands: string[];
}

interface StoreSubscription {
  plan: string;
  status: string;
  features: {
    wishlist: boolean;
    giftIdeas: boolean;
  };
  limits: {
    giftIdeasCount: number;
  };
}

interface Store {
  name: string;
  url: string;
  active: boolean;
  metadata: StoreMetadata;
  contact: StoreContact;
  subscription: StoreSubscription;
}

// Create separate Express apps for each endpoint
const productsApp = express();
productsApp.use(cors({ origin: true }));

const storesApp = express();
storesApp.use(cors({ origin: true }));

const setupApp = express();
setupApp.use(cors({ origin: true }));

const searchApp = express();
searchApp.use(cors({ origin: true }));

const statsApp = express();
statsApp.use(cors({ origin: true }));

const detailedStatsApp = express();
detailedStatsApp.use(cors({ origin: true }));

const listFunctionsApp = express();
listFunctionsApp.use(cors({ origin: true }));

const wishlistsApp = express();
wishlistsApp.use(cors({ origin: true }));

const giftIdeasApp = express();
giftIdeasApp.use(cors({ origin: true }));

// Products endpoint
productsApp.get('*', async (req: Request, res: Response) => {
  try {
    const { category, maxPrice, storeId } = req.query;
    const products: any[] = [];

    // Get all stores if no specific store is requested
    const storesRef = admin.firestore().collection('stores');
    
    if (storeId) {
      // Single store case
      const storeDoc = await storesRef.doc(storeId as string).get();
      if (!storeDoc.exists) {
        return res.status(404).json({
          error: {
            code: 'STORE_NOT_FOUND',
            message: 'Store not found'
          }
        });
      }
      const productsSnapshot = await storeDoc.ref.collection('products').get();
      productsSnapshot.docs.forEach(doc => {
        products.push({
          id: doc.id,
          storeId: storeId,
          ...doc.data()
        });
      });
    } else {
      // All stores case
      const storesSnapshot = await storesRef.get();
      for (const storeDoc of storesSnapshot.docs) {
        const productsSnapshot = await storeDoc.ref.collection('products').get();
        productsSnapshot.docs.forEach(doc => {
          products.push({
            id: doc.id,
            storeId: storeDoc.id,
            ...doc.data()
          });
        });
      }
    }

    // Apply filters
    let filteredProducts = products;
    
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category?.toLowerCase() === (category as string).toLowerCase()
      );
    }

    if (maxPrice) {
      const price = parseFloat(maxPrice as string);
      if (!isNaN(price)) {
        filteredProducts = filteredProducts.filter(product => 
          product.price <= price
        );
      }
    }

    return res.json({
      count: filteredProducts.length,
      products: filteredProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch products'
      }
    });
  }
});

// Setup test data endpoint
setupApp.post('/', async (req: Request, res: Response) => {
  try {
    // Add stores
    const stores = [
      {
        id: 'sms',
        name: 'SMS',
        address: 'Tórshavn',
        phone: '123456',
        type: 'grocery',
        openingHours: {
          mon_fri: '9:00-22:00',
          sat: '10:00-22:00',
          sun: '13:00-22:00'
        }
      },
      {
        id: 'miklagarður',
        name: 'Miklagarður',
        address: 'Klaksvík',
        phone: '234567',
        type: 'grocery',
        openingHours: {
          mon_fri: '9:00-22:00',
          sat: '10:00-22:00',
          sun: '13:00-22:00'
        }
      },
      {
        id: 'effo',
        name: 'Effo',
        address: 'Tórshavn',
        phone: '345678',
        type: 'gas_station',
        openingHours: {
          mon_sun: '24/7'
        }
      }
    ];

    // Add each store
    for (const store of stores) {
      const { id, ...storeData } = store;
      await admin.firestore().collection('stores').doc(id).set(storeData);
    }

    // Add some products for each store
    const products = {
      sms: [
        { name: 'Milk', price: 11.95, category: 'dairy' },
        { name: 'Bread', price: 19.95, category: 'bakery' },
        { name: 'Eggs', price: 39.95, category: 'dairy' }
      ],
      miklagarður: [
        { name: 'Milk', price: 11.95, category: 'dairy' },
        { name: 'Bread', price: 18.95, category: 'bakery' },
        { name: 'Coffee', price: 89.95, category: 'beverages' }
      ],
      effo: [
        { name: 'Coffee', price: 25, category: 'beverages' },
        { name: 'Hot Dog', price: 35, category: 'food' },
        { name: 'Diesel', price: 8.95, category: 'fuel' }
      ]
    };

    // Add products for each store
    for (const [storeId, storeProducts] of Object.entries(products)) {
      const productsRef = admin.firestore()
        .collection('stores')
        .doc(storeId)
        .collection('products');
      
      for (const product of storeProducts) {
        await productsRef.add(product);
      }
    }

    return res.json({ message: 'Test data created successfully' });
  } catch (error) {
    console.error('Error creating test data:', error);
    return res.status(500).json({ error: 'Failed to create test data' });
  }
});

// Store endpoints
storesApp.get('/', async (req: Request, res: Response) => {
  try {
    const storesRef = admin.firestore().collection('stores');
    const snapshot = await storesRef.get();
    const stores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(stores);
  } catch (error) {
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch stores'
      }
    });
  }
});

// Wishlist endpoints (require authentication)
app.get('/wishlists', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) throw new Error('User not authenticated');
    
    const wishlistsRef = admin.firestore().collection('wishlists');
    const query = wishlistsRef.where('userId', '==', req.user.uid);
    const snapshot = await query.get();
    const wishlists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(wishlists);
  } catch (error) {
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch wishlists'
      }
    });
  }
});

// Gift ideas endpoints
app.get('/giftideas', async (req: Request, res: Response) => {
  try {
    const { occasion, maxPrice } = req.query;
    let giftIdeasRef = admin.firestore().collection('giftIdeas');
    
    if (occasion) {
      giftIdeasRef = giftIdeasRef.where('occasions', 'array-contains', occasion) as admin.firestore.CollectionReference;
    }
    if (maxPrice) {
      giftIdeasRef = giftIdeasRef.where('price', '<=', Number(maxPrice)) as admin.firestore.CollectionReference;
    }
    
    const snapshot = await giftIdeasRef.get();
    const ideas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch gift ideas'
      }
    });
  }
});

// Get store statistics
app.get('/getStoreStats', async (req, res) => {
  try {
    const storesSnapshot = await admin.firestore()
      .collection('stores')
      .get();

    const stats: {
      totalStores: number;
      metadata: {
        hasPhysicalShop: number;
        hasWebshop: number;
        active: number;
      };
      sampleStore?: {
        id: string;
        data: Store;
        fields: string[];
      };
    } = {
      totalStores: 0,
      metadata: {
        hasPhysicalShop: 0,
        hasWebshop: 0,
        active: 0
      }
    };

    storesSnapshot.forEach(doc => {
      const data = doc.data() as Store;
      stats.totalStores++;
      
      if (data.metadata) {
        if (data.metadata.hasPhysicalShop) stats.metadata.hasPhysicalShop++;
        if (data.metadata.hasWebshop) stats.metadata.hasWebshop++;
      }
      if (data.active) stats.metadata.active++;

      if (!stats.sampleStore) {
        stats.sampleStore = {
          id: doc.id,
          data: data,
          fields: Object.keys(data)
        };
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Search stores with filters
app.get('/searchStores', async (req, res) => {
  try {
    const {
      category,
      brand,
      city,
      hasWebshop,
      hasPhysicalShop,
      active = 'true'
    } = req.query as { [key: string]: string };

    let query: admin.firestore.Query = admin.firestore().collection('stores');

    // Filter by active status
    if (active === 'true') {
      query = query.where('active', '==', true);
    }

    // Filter by physical/web shop
    if (hasPhysicalShop === 'true') {
      query = query.where('metadata.hasPhysicalShop', '==', true);
    }
    if (hasWebshop === 'true') {
      query = query.where('metadata.hasWebshop', '==', true);
    }

    // Get results
    const snapshot = await query.get();
    
    // Post-query filtering (for arrays and nested fields)
    let results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (Store & { id: string })[];

    // Filter by category
    if (category) {
      results = results.filter(store => 
        store.metadata?.categories?.includes(category)
      );
    }

    // Filter by brand
    if (brand) {
      results = results.filter(store => 
        store.metadata?.brands?.includes(brand)
      );
    }

    // Filter by city
    if (city) {
      results = results.filter(store => 
        store.contact?.address?.city?.toLowerCase() === city.toLowerCase()
      );
    }

    res.json({
      count: results.length,
      stores: results
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Advanced search stores endpoint
app.get('/advancedSearch', async (req, res) => {
  try {
    const {
      // Basic filters
      name,
      city,
      postalCode,
      
      // Shop type filters
      hasWebshop,
      hasPhysicalShop,
      active = 'true',
      
      // Category and brand filters
      category,
      brand,
      
      // Subscription filters
      plan,
      
      // Feature filters
      hasWishlist,
      
      // Sorting
      sortBy = 'name',
      sortDirection = 'asc'
    } = req.query as { [key: string]: string };

    let query: admin.firestore.Query = admin.firestore().collection('stores');

    // Base filters
    if (active === 'true') {
      query = query.where('active', '==', true);
    }

    // Shop type filters
    if (hasPhysicalShop === 'true') {
      query = query.where('metadata.hasPhysicalShop', '==', true);
    }
    if (hasWebshop === 'true') {
      query = query.where('metadata.hasWebshop', '==', true);
    }

    // Subscription plan filter
    if (plan) {
      query = query.where('subscription.plan', '==', plan);
    }

    // Get results
    const snapshot = await query.get();
    
    // Post-query filtering and sorting
    let results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (Store & { id: string })[];

    // Apply filters that can't be done in the query
    if (name) {
      const searchName = name.toLowerCase();
      results = results.filter(store => 
        store.name.toLowerCase().includes(searchName)
      );
    }

    if (city) {
      const searchCity = city.toLowerCase();
      results = results.filter(store => 
        store.contact?.address?.city?.toLowerCase().includes(searchCity)
      );
    }

    if (postalCode) {
      results = results.filter(store => 
        store.contact?.address?.postalCode === postalCode
      );
    }

    if (category) {
      results = results.filter(store => 
        store.metadata?.categories?.includes(category)
      );
    }

    if (brand) {
      results = results.filter(store => 
        store.metadata?.brands?.includes(brand)
      );
    }

    if (hasWishlist === 'true') {
      results = results.filter(store => 
        store.subscription?.features?.wishlist === true
      );
    }

    // Sort results
    results.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

    // Return results with metadata
    res.json({
      count: results.length,
      filters: {
        name,
        city,
        postalCode,
        hasWebshop,
        hasPhysicalShop,
        active,
        category,
        brand,
        plan,
        hasWishlist,
      },
      sorting: {
        by: sortBy,
        direction: sortDirection
      },
      stores: results
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get detailed store statistics
app.get('/getDetailedStats', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('stores')
      .get();

    const stats = {
      totalStores: 0,
      categories: {} as Record<string, number>,
      cities: {} as Record<string, number>,
      brands: {} as Record<string, number>,
      metadata: {
        hasPhysicalShop: 0,
        hasWebshop: 0,
        active: 0
      },
      subscriptionPlans: {} as Record<string, number>,
      postalCodes: {} as Record<string, number>
    };

    snapshot.forEach(doc => {
      const store = doc.data() as Store;
      stats.totalStores++;

      // Count metadata
      if (store.metadata) {
        if (store.metadata.hasPhysicalShop) stats.metadata.hasPhysicalShop++;
        if (store.metadata.hasWebshop) stats.metadata.hasWebshop++;
        
        // Count categories
        store.metadata.categories?.forEach(category => {
          stats.categories[category] = (stats.categories[category] || 0) + 1;
        });

        // Count brands
        store.metadata.brands?.forEach(brand => {
          stats.brands[brand] = (stats.brands[brand] || 0) + 1;
        });
      }

      // Count active stores
      if (store.active) stats.metadata.active++;

      // Count cities and postal codes
      if (store.contact?.address) {
        const { city, postalCode } = store.contact.address;
        if (city) {
          stats.cities[city] = (stats.cities[city] || 0) + 1;
        }
        if (postalCode) {
          stats.postalCodes[postalCode] = (stats.postalCodes[postalCode] || 0) + 1;
        }
      }

      // Count subscription plans
      if (store.subscription?.plan) {
        const plan = store.subscription.plan;
        stats.subscriptionPlans[plan] = (stats.subscriptionPlans[plan] || 0) + 1;
      }
    });

    // Sort all the count objects by value (descending)
    const sortCounts = (obj: Record<string, number>) => {
      return Object.entries(obj)
        .sort(([,a], [,b]) => b - a)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    };

    res.json({
      totalStores: stats.totalStores,
      metadata: stats.metadata,
      categories: sortCounts(stats.categories),
      cities: sortCounts(stats.cities),
      brands: sortCounts(stats.brands),
      subscriptionPlans: sortCounts(stats.subscriptionPlans),
      postalCodes: sortCounts(stats.postalCodes)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// List functions endpoint
listFunctionsApp.get('/', async (req, res) => {
  try {
    const projectId = process.env.GCLOUD_PROJECT;
    
    return res.json({
      projectId,
      region: 'europe-west1',
      availableFunctions: [
        'getStores',
        'getStoreStats',
        'searchStores',
        'advancedSearch',
        'getDetailedStats',
        'getProducts',
        'setupTestData'
      ],
      baseUrl: `https://europe-west1-${projectId}.cloudfunctions.net/`
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Export the Express apps as Firebase Functions
export const getProducts = onRequest({ region: 'europe-west1' }, productsApp);
export const getStores = onRequest({ region: 'europe-west1' }, storesApp);
export const searchStores = onRequest({ region: 'europe-west1' }, searchApp);
export const getStoreStats = onRequest({ region: 'europe-west1' }, statsApp);
export const advancedSearch = onRequest({ region: 'europe-west1' }, searchApp);
export const getDetailedStats = onRequest({ region: 'europe-west1' }, detailedStatsApp);
export const listFunctions = onRequest({ region: 'europe-west1' }, listFunctionsApp);
export const setupTestData = onRequest({ region: 'europe-west1' }, setupApp);
export const wishlists = onRequest({ region: 'europe-west1' }, wishlistsApp);
export const giftIdeas = onRequest({ region: 'europe-west1' }, giftIdeasApp);
