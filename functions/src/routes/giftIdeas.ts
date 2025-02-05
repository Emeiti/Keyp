import { Router } from 'express';
import { auth, optionalAuth } from '../middleware/auth';
import { db } from '../config/firebase';
import { Query, DocumentData, CollectionReference } from 'firebase-admin/firestore';

const router = Router();

interface GiftIdea {
  id: string;
  name: string;
  description?: string;
  price: number;
  [key: string]: any;
}

interface SeasonalCollection {
  id: string;
  season: string;
  name: string;
  startDate: Date;
  endDate: Date;
  giftIdeas: GiftIdea[];
  [key: string]: any;
}

// Get gift suggestions with filtering
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      q,
      category,
      occasion,
      priceMin,
      priceMax,
      age,
      gender,
      interests,
      sortBy = 'popularity',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let ideasRef = db.collection('giftIdeas') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = ideasRef;

    // Build query based on filters
    if (q) {
      query = query.where('searchTokens', 'array-contains', q.toString().toLowerCase());
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    if (occasion) {
      query = query.where('occasions', 'array-contains', occasion);
    }

    if (gender) {
      query = query.where('targetGender', '==', gender);
    }

    if (age) {
      query = query.where('ageRange', 'array-contains', age);
    }

    if (interests) {
      const interestsArray = Array.isArray(interests) 
        ? interests 
        : [interests];
      query = query.where('interests', 'array-contains-any', interestsArray);
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
    
    const ideas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get total count
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    res.json({
      ideas,
      pagination: {
        page: Number(page),
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    console.error('Gift ideas fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch gift ideas' });
  }
});

// Get trending gifts
router.get('/trending', async (req, res) => {
  try {
    const {
      timeframe = '7days', // 24h, 7days, 30days
      category,
      limit = 20
    } = req.query;

    let trendingRef = db.collection('giftIdeas') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = trendingRef;

    // Add timeframe-specific trending score field
    const trendingField = `trendingScore_${timeframe}`;
    
    if (category) {
      query = query.where('category', '==', category);
    }

    query = query
      .where(trendingField, '>', 0)
      .orderBy(trendingField, 'desc')
      .limit(Number(limit));

    const snapshot = await query.get();
    
    const trending = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(trending);

  } catch (error) {
    console.error('Trending gifts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch trending gifts' });
  }
});

// Get personalized suggestions
router.post('/suggest', auth, async (req, res) => {
  try {
    const {
      recipient = {},
      occasion,
      priceRange,
      limit = 20
    } = req.body;

    // Get user's preferences and past interactions
    const userRef = db.collection('users').doc(req.user!.uid);
    await userRef.get(); // We'll use this data later when implementing scoring

    let ideasRef = db.collection('giftIdeas') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = ideasRef;

    // Apply basic filters
    if (occasion) {
      query = query.where('occasions', 'array-contains', occasion);
    }

    if (priceRange) {
      if (priceRange.min) {
        query = query.where('price', '>=', priceRange.min);
      }
      if (priceRange.max) {
        query = query.where('price', '<=', priceRange.max);
      }
    }

    // Apply recipient-specific filters
    if (recipient.age) {
      query = query.where('ageRange', 'array-contains', recipient.age);
    }
    if (recipient.gender) {
      query = query.where('targetGender', '==', recipient.gender);
    }
    if (recipient.interests) {
      query = query.where('interests', 'array-contains-any', recipient.interests);
    }

    // Get initial results
    const snapshot = await query.limit(50).get(); // Get more results for scoring
    
    // Score and rank results based on user preferences and recipient
    let scoredIdeas = snapshot.docs.map(doc => {
      const idea = { id: doc.id, ...doc.data() };
      let score = 0;

      // Add scoring logic here based on:
      // - User's past successful gifts
      // - Recipient's preferences
      // - Occasion appropriateness
      // - Price point matching
      // - Trending score
      // - Similar users' successful gifts

      return { ...idea, score };
    });

    // Sort by score and take top results
    scoredIdeas.sort((a, b) => b.score - a.score);
    const suggestions = scoredIdeas.slice(0, Number(limit));

    res.json(suggestions);

  } catch (error) {
    console.error('Gift suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate gift suggestions' });
  }
});

// Get gift categories
router.get('/categories', async (req, res) => {
  try {
    const categoriesRef = db.collection('giftCategories') as CollectionReference<DocumentData>;
    const snapshot = await categoriesRef.get();
    
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch gift categories' });
  }
});

// Get seasonal collections
router.get('/seasonal', optionalAuth, async (req, res) => {
  try {
    const { 
      season,
      active = true,
      page = 1,
      limit = 20
    } = req.query;

    let collectionsRef = db.collection('seasonalCollections') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = collectionsRef;

    if (season) {
      query = query.where('season', '==', season);
    }

    if (active === 'true') {
      const now = new Date();
      query = query.where('startDate', '<=', now)
                  .where('endDate', '>=', now);
    }

    // Apply pagination
    const pageSize = Number(limit);
    const skip = (Number(page) - 1) * pageSize;
    const snapshot = await query.limit(pageSize).offset(skip).get();

    const collections: SeasonalCollection[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        season: data.season,
        name: data.name,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        giftIdeas: [],
        ...data
      };
    });

    // Get gift ideas for each collection
    await Promise.all(collections.map(async (collection) => {
      const giftIdeasSnapshot = await db.collection('giftIdeas')
        .where('collections', 'array-contains', collection.id)
        .limit(10)
        .get();

      collection.giftIdeas = giftIdeasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GiftIdea[];
    }));

    // Get total count
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data()?.count || 0;

    return res.json({
      collections,
      pagination: {
        page: Number(page),
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      },
      seasons: [
        { id: 'christmas', name: 'Christmas', startDate: '2024-12-01', endDate: '2024-12-24' },
        { id: 'olavsoka', name: 'Ólavsøka', startDate: '2024-07-28', endDate: '2024-07-29' },
        { id: 'blackfriday', name: 'Black Friday', startDate: '2024-11-29', endDate: '2024-11-29' }
      ]
    });
  } catch (error) {
    console.error('Seasonal collections fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch seasonal collections' });
  }
});

// Get personalized gift recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const {
      age,
      gender,
      interests,
      occasion,
      priceRange,
      excludeIds = []
    } = req.query;

    const giftIdeasRef = db.collection('giftIdeas') as CollectionReference<DocumentData>;
    let query: Query<DocumentData> = giftIdeasRef;

    // Apply filters based on user preferences
    if (age) {
      query = query.where('ageRange', 'array-contains', Number(age));
    }
    if (gender) {
      query = query.where('gender', '==', gender);
    }
    if (occasion) {
      query = query.where('occasions', 'array-contains', occasion);
    }
    if (priceRange) {
      const [min, max] = (priceRange as string).split('-').map(Number);
      query = query.where('price', '>=', min).where('price', '<=', max);
    }

    const snapshot = await query.limit(20).get();
    
    let recommendations = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        score: calculateRecommendationScore(doc.data(), {
          interests: interests as string[],
          age: Number(age),
          gender: gender as string
        })
      }))
      .filter(gift => !Array.isArray(excludeIds) ? true : !excludeIds.includes(gift.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.json({
      recommendations,
      metadata: {
        total: recommendations.length,
        filters: {
          age,
          gender,
          interests,
          occasion,
          priceRange
        }
      }
    });
  } catch (error) {
    console.error('Gift recommendations error:', error);
    return res.status(500).json({ error: 'Failed to fetch gift recommendations' });
  }
});

// Helper function to calculate recommendation score
function calculateRecommendationScore(
  gift: DocumentData,
  preferences: { interests: string[]; age: number; gender: string }
): number {
  let score = 0;

  // Interest matching
  if (gift.tags) {
    const matchingTags = gift.tags.filter((tag: string) => 
      preferences.interests.some(interest => 
        tag.toLowerCase().includes(interest.toLowerCase())
      )
    );
    score += matchingTags.length * 2;
  }

  // Age appropriateness
  if (gift.ageRange && gift.ageRange.includes(preferences.age)) {
    score += 3;
  }

  // Gender preference
  if (gift.gender === preferences.gender || gift.gender === 'any') {
    score += 2;
  }

  // Popularity factor
  if (gift.popularity) {
    score += Math.min(gift.popularity / 100, 3);
  }

  return score;
}

export default router; 