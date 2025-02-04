# Keyp.fo Database Structure
Version: 1.0.1
Last Updated: 2024-02-04

## Collections Overview

### 1. Stores Collection
Primary collection for all store data.

```typescript
stores: {
[storeId: string]: {
id: string
name: string
url: string
active: boolean
metadata: {
logo: string
hasWebshop: boolean
hasPhysicalShop: boolean
categories: string[]
brands: string[]
}
contact: {
email: string
phone: string
social: {
facebook?: string
instagram?: string
}
}
subscription: {
plan: 'free' | 'basic' | 'premium'
status: 'active' | 'expired'
features: {
wishlist: boolean
giftIdeas: boolean
}
limits: {
giftIdeasCount: number
}
}
locations: {
[locationId: string]: {
name?: string
address: {
street: string
city: string
postalCode: string
}
phone?: string
openingHours?: {
mon_fri?: string
sat?: string
sun?: string
mon_sun?: string
}
}
}
products: {
[productId: string]: {
name: string
price: number
category: string
description?: string
imageUrl?: string
inStock: boolean
}
}
}
}
```

### 2. Wishlists Collection
Independent collection for user wishlists.

```typescript
wishlists: {
[wishlistId: string]: {
userId: string | null // null for unregistered users
name: string // Wishlist name
shareableUrl: string // Unique sharing URL
createdAt: Timestamp
lastUpdated: Timestamp
items: {
productId: string
storeId: string
addedAt: Timestamp
priority: number
notes?: string
// Snapshot of product at time of adding
productDetails: {
name: string
description: string
price: number
imageUrl: string
category: string
}
purchase?: { // Hidden from wishlist owner
purchasedBy: string
purchasedAt: Timestamp
hidden: boolean
}
}[]
viewers: { // Subcollection
[userId: string]: {
accessedAt: Timestamp
isRegistered: boolean
canMarkPurchases: boolean
}
}
}
}
```

### 3. Gift Ideas Collection
Curated gift suggestions from stores.

```typescript
giftIdeas: {
[giftIdeaId: string]: {
storeId: string // Reference to store
title: string
description: string
price: number
imageUrl: string
categories: string[] // Gift categories
targetAudience: string[] // Target demographic
occasions: string[] // Suitable occasions
createdAt: Timestamp
products: {
productId: string
storeId: string
required: boolean
}[]
}
}
```

## Relationships & Access Patterns

### Store Access
- Store owners can only access their own store data
- Public can read basic store info
- Products are accessible to all users

### Wishlist Access
- Anonymous users can create wishlists
- Only shared users can see purchase status
- Wishlist owner cannot see purchase info

### Gift Ideas Access
- Stores can create gift ideas based on subscription
- Public can view all gift ideas
- Filtering by occasion, audience, and price

## Indexing Requirements
See `firestore.indexes.json` for current indexes.

