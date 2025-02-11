import { Router } from 'express';
import { authMiddleware as auth } from '../middleware/auth';
import { db } from '../config/firebase';
import { Query, DocumentData, CollectionReference } from 'firebase-admin/firestore';

interface FunnelStep {
  name: string;
  count: number;
  conversionRate: number;
}

interface JourneyTouchpoint {
  type: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
}

const router = Router();

// Get page views analytics
router.get('/views', auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      storeId,
      productId,
      interval = 'daily', // daily, weekly, monthly
      page = 1,
      limit = 30
    } = req.query;

    let viewsRef = db.collection('analytics/views/records') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = viewsRef;

    // Basic filters
    if (storeId) {
      query = query.where('storeId', '==', storeId);
    }
    if (productId) {
      query = query.where('productId', '==', productId);
    }

    // Date range filter
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate.toString()));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate.toString()));
    }

    // Apply sorting
    query = query.orderBy('timestamp', 'desc');

    // Apply pagination
    const pageSize = Number(limit);
    const skip = (Number(page) - 1) * pageSize;
    
    const snapshot = await query.limit(pageSize).offset(skip).get();
    
    // Aggregate data based on interval
    const views = aggregateAnalytics(snapshot.docs, interval as string);

    // Get total count
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    res.json({
      views,
      pagination: {
        page: Number(page),
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    console.error('Views analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch views analytics' });
  }
});

// Get wishlist analytics
router.get('/wishlists', auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      storeId,
      productId,
      interval = 'daily',
      metric = 'additions' // additions, removals, conversions
    } = req.query;

    let wishlistsRef = db.collection('analytics/wishlists/records') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = wishlistsRef;

    if (storeId) {
      query = query.where('storeId', '==', storeId);
    }
    if (productId) {
      query = query.where('productId', '==', productId);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate.toString()));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate.toString()));
    }

    const snapshot = await query.get();
    const analytics = aggregateWishlistAnalytics(snapshot.docs, interval as string, metric as string);

    res.json(analytics);

  } catch (error) {
    console.error('Wishlist analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist analytics' });
  }
});

// Get product analytics
router.get('/products', auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      storeId,
      category,
      metric = 'views' // views, wishlists, conversions
    } = req.query;

    let productsRef = db.collection('analytics/products/records') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = productsRef;

    if (storeId) {
      query = query.where('storeId', '==', storeId);
    }
    if (category) {
      query = query.where('category', '==', category);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate.toString()));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate.toString()));
    }

    const snapshot = await query.get();
    const analytics = aggregateProductAnalytics(snapshot.docs, metric as string);

    res.json(analytics);

  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch product analytics' });
  }
});

// Get trending analytics
router.get('/trends', auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      storeId,
      category,
      limit = 10
    } = req.query;

    let trendsRef = db.collection('analytics/trends/records') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = trendsRef;

    if (storeId) {
      query = query.where('storeId', '==', storeId);
    }
    if (category) {
      query = query.where('category', '==', category);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate.toString()));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate.toString()));
    }

    query = query.orderBy('score', 'desc').limit(Number(limit));
    
    const snapshot = await query.get();
    const trends = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(trends);

  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch trends analytics' });
  }
});

// Conversion Funnels
router.get('/funnels', auth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      funnelId,
      storeId
    } = req.query;

    const funnelsRef = db.collection('analytics/funnels/records') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = funnelsRef;

    if (funnelId) {
      query = query.where('funnelId', '==', funnelId);
    }
    if (storeId) {
      query = query.where('storeId', '==', storeId);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate.toString()));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate.toString()));
    }

    const snapshot = await query.get();
    const funnelData = aggregateFunnelData(snapshot.docs);

    return res.json({
      funnels: funnelData,
      predefinedFunnels: [
        {
          id: 'wishlist_conversion',
          name: 'Wishlist to Purchase',
          steps: ['view', 'add_to_wishlist', 'share_wishlist', 'marked_as_purchased']
        },
        {
          id: 'store_engagement',
          name: 'Store Engagement',
          steps: ['view_store', 'view_product', 'add_to_wishlist', 'contact_store']
        }
      ]
    });
  } catch (error) {
    console.error('Funnel analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch funnel analytics' });
  }
});

// Customer Journey Tracking
router.get('/journeys', auth, async (req, res) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      storeId
    } = req.query;

    const journeysRef = db.collection('analytics/journeys/records') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = journeysRef;

    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (storeId) {
      query = query.where('storeId', '==', storeId);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate.toString()));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate.toString()));
    }

    const snapshot = await query.get();
    const journeyData = aggregateJourneyData(snapshot.docs);

    return res.json({
      journeys: journeyData,
      touchpoints: [
        'first_visit',
        'store_view',
        'product_view',
        'wishlist_creation',
        'wishlist_sharing',
        'store_contact',
        'purchase_intent'
      ]
    });
  } catch (error) {
    console.error('Journey analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch journey analytics' });
  }
});

// ROI & Campaign Analytics
router.get('/campaigns', auth, async (req, res) => {
  try {
    const {
      campaignId,
      startDate,
      endDate,
      storeId,
      metric = 'all'
    } = req.query;

    const campaignsRef = db.collection('analytics/campaigns/records') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = campaignsRef;

    if (campaignId) {
      query = query.where('campaignId', '==', campaignId);
    }
    if (storeId) {
      query = query.where('storeId', '==', storeId);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate.toString()));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate.toString()));
    }

    const snapshot = await query.get();
    const campaignData = aggregateCampaignData(snapshot.docs, metric as string);

    return res.json({
      campaigns: campaignData,
      metrics: {
        impressions: 'Total views of campaign',
        clicks: 'Interactions with campaign',
        conversions: 'Successful actions from campaign',
        roi: 'Return on investment calculation'
      }
    });
  } catch (error) {
    console.error('Campaign analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

// Helper functions for data aggregation
function aggregateAnalytics(docs: any[], interval: string) {
  // Implementation of analytics aggregation based on interval
  // This would group data by time periods and calculate metrics
  return docs.map(doc => doc.data());
}

function aggregateWishlistAnalytics(docs: any[], interval: string, metric: string) {
  // Implementation of wishlist-specific analytics aggregation
  return docs.map(doc => doc.data());
}

function aggregateProductAnalytics(docs: any[], metric: string) {
  // Implementation of product-specific analytics aggregation
  return docs.map(doc => doc.data());
}

function aggregateFunnelData(docs: FirebaseFirestore.QueryDocumentSnapshot[]): FunnelStep[] {
  const steps = new Map<string, number>();
  
  docs.forEach(doc => {
    const data = doc.data();
    steps.set(data.step, (steps.get(data.step) || 0) + 1);
  });

  let previousCount = 0;
  return Array.from(steps.entries()).map(([name, count], index) => {
    const conversionRate = index === 0 ? 100 : (count / previousCount) * 100;
    previousCount = count;
    return { name, count, conversionRate };
  });
}

function aggregateJourneyData(docs: FirebaseFirestore.QueryDocumentSnapshot[]): JourneyTouchpoint[] {
  return docs.map(doc => {
    const data = doc.data();
    return {
      type: data.type,
      timestamp: data.timestamp.toDate(),
      metadata: data.metadata || {}
    };
  }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function aggregateCampaignData(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  metric: string
): CampaignMetrics {
  const metrics = docs.reduce((acc, doc) => {
    const data = doc.data();
    return {
      impressions: acc.impressions + (data.impressions || 0),
      clicks: acc.clicks + (data.clicks || 0),
      conversions: acc.conversions + (data.conversions || 0),
      cost: acc.cost + (data.cost || 0),
      revenue: acc.revenue + (data.revenue || 0)
    };
  }, { impressions: 0, clicks: 0, conversions: 0, cost: 0, revenue: 0 });

  return {
    impressions: metrics.impressions,
    clicks: metrics.clicks,
    conversions: metrics.conversions,
    roi: metrics.cost > 0 ? ((metrics.revenue - metrics.cost) / metrics.cost) * 100 : 0
  };
}

export default router; 