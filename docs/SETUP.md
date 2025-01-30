# Keyp.fo Store Database Setup Documentation

## Overview
We have set up a Firebase Firestore database for keyp.fo that will serve as the central store directory for all subdomains (wishlist.keyp.fo, giftideas.keyp.fo, etc.). The database contains store information, subscription status, and feature access controls.

## Database Structure

### Store Collection
Each store document contains:
- Basic info (name, URL, active status)
- Metadata (logo, categories, brands, webshop status)
- Contact information
- Subscription details and feature access

### Current Setup
- Firebase Project: keyp-51c12
- Database: Firestore
- Main Collection: 'stores'
- Security Rules: Basic read/write protection implemented

## Detailed Setup Instructions

### 1. Project Creation
bash
Create new project directory
mkdir keyp-fo
cd keyp-fo
Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --app
Install required dependencies
npm install firebase @firebase/auth
npm install react-firebase-hooks # Optional but recommended


### 2. Firebase Setup Files
Create these files in your project:

typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
const firebaseConfig = {
apiKey: "AIzaSyCKrRVx6ga_rNcge2UYi9_lZYu3yba_jTg",
authDomain: "keyp-51c12.firebaseapp.com",
projectId: "keyp-51c12",
storageBucket: "keyp-51c12.firebasestorage.app",
messagingSenderId: "242957419888",
appId: "1:242957419888:web:836510309028a859fbfbb5"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

typescript
// src/types/store.ts
export interface Store {
id: string;
name: string;
url: string;
active: boolean;
metadata: {
logo: string;
hasWebshop: boolean;
hasPhysicalShop: boolean;
categories: string[];
brands: string[];
};
contact: {
email: string;
phone: string;
address: {
street: string;
city: string;
postalCode: string;
};
social: {
facebook?: string;
instagram?: string;
};
};
subscription: {
plan: 'free' | 'basic' | 'premium';
status: 'active' | 'expired';
features: {
wishlist: boolean;
giftIdeas: boolean;
giftCards: boolean;
};
limits: {
giftIdeasCount: number;
};
};
}


### 3. Initial Pages Setup

typescript
// src/app/page.tsx
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Store } from '@/types/store';
export default async function HomePage() {
const storesSnapshot = await getDocs(collection(db, 'stores'));
const stores = storesSnapshot.docs.map(doc => doc.data() as Store);
return (
<main>
<h1>Keyp.fo Store Directory</h1>
<div>
{stores.map(store => (
<div key={store.id}>
<h2>{store.name}</h2>
{/ Add more store details as needed /}
</div>
))}
</div>
</main>
);
}


### 4. Project Structure
keyp-fo/
├── src/
│ ├── app/
│ │ ├── admin/ # Admin dashboard
│ │ │ └── page.tsx
│ │ ├── stores/ # Store directory
│ │ │ └── page.tsx
│ │ └── api/ # API routes
│ ├── lib/
│ │ └── firebase.ts # Firebase configuration
│ ├── types/
│ │ └── store.ts # Store type definitions
│ └── components/
│ ├── StoreCard.tsx
│ └── StoreList.tsx
├── public/
└── package.json


### 5. Environment Setup
Create a `.env.local` file:

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCKrRVx6ga_rNcge2UYi9_lZYu3yba_jTg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=keyp-51c12.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=keyp-51c12
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=keyp-51c12.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=242957419888
NEXT_PUBLIC_FIREBASE_APP_ID=1:242957419888:web:836510309028a859fbfbb5


### 6. Git Setup
bash
Initialize git repository
git init
Create .gitignore
echo "node_modules/
.next/
.env.local" > .gitignore
Initial commit
git add .
git commit -m "Initial commit with basic setup"


## Next Steps

1. **Admin Dashboard**
   - Create interface for managing stores
   - Implement store subscription management
   - Add feature toggle controls

2. **Store Management**
   - Create store owner dashboard
   - Add ability to update store information
   - Implement category and brand management

3. **API Development**
   - Create endpoints for other subdomains
   - Implement proper authentication
   - Set up data access patterns

## Security Considerations
- Keep Firebase config secure
- Implement proper authentication
- Use environment variables
- Follow Firebase security best practices

## Important Notes
1. The store data is now centralized in Firestore
2. All subdomains will access this central database
3. Store scraping configuration remains in JSON files
4. Each store has its own feature access based on subscription
5. The database is structured to allow easy expansion of features

## Resources
- Firebase Console: https://console.firebase.google.com/
- Project Documentation: [Add link to your project docs]
- GitHub Repository: https://github.com/Emeiti/Keyp.git