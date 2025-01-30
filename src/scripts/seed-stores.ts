import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

const stores = [
  {
    name: "Fashion Boutique",
    url: "https://fashionboutique.fo",
    active: true,
    metadata: {
      logo: "https://via.placeholder.com/150",
      hasWebshop: true,
      hasPhysicalShop: true,
      categories: ["Women's Fashion", "Accessories", "Shoes"],
      brands: ["Gucci", "Prada", "Louis Vuitton"],
    },
    contact: {
      email: "info@fashionboutique.fo",
      phone: "+298 123456",
      address: {
        street: "Niels Finsensgøta 15",
        city: "Tórshavn",
        postalCode: "100",
      },
      social: {
        facebook: "https://facebook.com/fashionboutique",
        instagram: "https://instagram.com/fashionboutique",
      },
    },
    subscription: {
      plan: "premium",
      status: "active",
      features: {
        wishlist: true,
        giftIdeas: true,
        giftCards: true,
      },
      limits: {
        giftIdeasCount: 100,
      },
    },
  },
  {
    name: "Tech Haven",
    url: "https://techhaven.fo",
    active: true,
    metadata: {
      logo: "https://via.placeholder.com/150",
      hasWebshop: true,
      hasPhysicalShop: false,
      categories: ["Electronics", "Computers", "Gadgets"],
      brands: ["Apple", "Samsung", "Sony"],
    },
    contact: {
      email: "support@techhaven.fo",
      phone: "+298 234567",
      address: {
        street: "Hoyvíksvegur 51",
        city: "Tórshavn",
        postalCode: "100",
      },
      social: {
        facebook: "https://facebook.com/techhaven",
        instagram: "https://instagram.com/techhaven",
      },
    },
    subscription: {
      plan: "basic",
      status: "active",
      features: {
        wishlist: true,
        giftIdeas: true,
        giftCards: false,
      },
      limits: {
        giftIdeasCount: 50,
      },
    },
  },
  {
    name: "Home & Living",
    url: "https://homeandliving.fo",
    active: true,
    metadata: {
      logo: "https://via.placeholder.com/150",
      hasWebshop: true,
      hasPhysicalShop: true,
      categories: ["Furniture", "Decor", "Kitchen", "Bedding"],
      brands: ["IKEA", "Royal Copenhagen", "Georg Jensen"],
    },
    contact: {
      email: "info@homeandliving.fo",
      phone: "+298 345678",
      address: {
        street: "Sverrisgøta 20",
        city: "Tórshavn",
        postalCode: "100",
      },
      social: {
        facebook: "https://facebook.com/homeandliving",
      },
    },
    subscription: {
      plan: "premium",
      status: "active",
      features: {
        wishlist: true,
        giftIdeas: true,
        giftCards: true,
      },
      limits: {
        giftIdeasCount: 100,
      },
    },
  },
];

async function seedStores() {
  try {
    // Add each store to the database
    for (const store of stores) {
      await db.collection('stores').add(store);
    }
    console.log('Successfully seeded stores to the database');
  } catch (error) {
    console.error('Error seeding stores:', error);
  }
  process.exit(0);
}

// Run the seed function
seedStores(); 