# API Guidelines for `api.keyp.fo`

## Overview
`api.keyp.fo` serves as the **centralized backend** for all subdomains (`ynskilisti.keyp.fo`, `gavuhugskot.keyp.fo`, `tilbod.keyp.fo`, etc.), ensuring **data consistency, shared authentication, and fast search capabilities**.

This document outlines **how services should interact** with the API, best practices, and security measures.

📌 **For coding standards, frontend/backend structure, and best development practices, refer to the [Cursor AI Development Guidelines](#).**

## Core Technologies
- **Frontend:**
  - Next.js 15.1.4 (App Router + Server Components)
  - React 18.2.0 (Hooks, Context API)
  - TypeScript (type safety & maintainability)
  - Tailwind CSS (consistent styling & responsive utilities)
- **Backend:**
  - Firebase (Firestore, Authentication, Storage, Hosting)
  - Firestore for **initial search implementation** (cost-efficient, free-tier friendly)
  - Algolia **optional for later phases** (if needed for advanced search)
  - Google Analytics (User tracking & insights)
  - Firebase Cloud Messaging (Push notifications for sales & alerts)
- **Data Processing & AI:**
  - TensorFlow.js (AI-driven image recommendations)
  - Papaparse (CSV/Excel handling for bulk uploads)
  - Cheerio (Web scraping for sales listings)
- **Social Media Integration:**
  - React-Share (Sharing products, sales, & events)
  - Social Media APIs (Facebook, Instagram, Twitter integration)

## Database Structure
### **Firestore Collections & Documents**
- **Wishlists (`wishlists`)**
  - `id`: string
  - `userId`: string (Creator of the wishlist)
  - `title`: string
  - `createdAt`: timestamp
  - `expiresAt`: timestamp (Auto-delete after a period)
  - `shareableLink`: string (Publicly accessible link to view the wishlist)
  - `visibility`: 'private' | 'public'

- **Wishlist Items (`wishlist_items`)**
  - `id`: string
  - `wishlistId`: string (Reference to `wishlists` collection)
  - `productId`: string (Reference to `products` collection, optional for manually added items)
  - `name`: string
  - `description`: string
  - `image`: string (Stored in Firebase Storage)
  - `price`: number
  - `boughtBy`: string (Only visible to logged-in users who mark items as purchased)
  - `createdAt`: timestamp

- **Stores (`stores`)**
  - `id`: string
  - `name`: string
  - `url`: string
  - `active`: boolean
  - `metadata`: object
    - `logo`: string
    - `hasWebshop`: boolean
    - `hasPhysicalShop`: boolean
    - `categories`: string[]
    - `brands`: string[]
  - `contact`: object
    - `email`: string
    - `phone`: string
    - `address`: object
      - `street`: string
      - `city`: string
      - `postalCode`: string
    - `social`: object
      - `facebook`: string (optional)
      - `instagram`: string (optional)
  - `subscription`: object
    - `plan`: 'free' | 'basic' | 'premium'
    - `status`: 'active' | 'expired'
    - `features`: object
      - `wishlist`: boolean
      - `giftIdeas`: boolean
      - `giftCards`: boolean
    - `limits`: object
      - `giftIdeasCount`: number

## Wishlist Sharing & Purchase Tracking
- **Users can create multiple wishlists**.
- **A user must create an account to share a wishlist**.
- **Anyone with the shareable link can view the wishlist**.
- **Wishlist owners CANNOT see what has been purchased** (to maintain the element of surprise).
- **Logged-in users can see purchased items** and select what they buy.
- **Purchased items are only visible to other logged-in users who view the wishlist**.
- **Wishlist auto-deletes after a predefined period**.

## Subscription & Feature Access
- **Stores can have different subscription levels:**
  - `free`: Basic listing in store directory.
  - `basic`: Ability to list products & limited gift ideas.
  - `premium`: Full feature access, including adding multiple gift ideas and sales promotions.
- **Feature-based access control ensures that:**
  - Stores on free plans have limited visibility.
  - Premium stores appear higher in search results and recommendations.

## Authentication & Security
- **JWT-based authentication (Firebase Auth)** – Required for most endpoints.
- **Role-based access control (RBAC):**
  - **Admin** – Can modify all data.
  - **Store Owner** – Can edit their store & products.
  - **User** – Can create wishlists, view shared lists, and mark items as purchased.
- **API Rate Limits** – Prevent abuse by limiting requests per IP.
- **CORS Policy** – Allows only whitelisted domains (`keyp.fo`, subdomains).

## Performance Optimization
- **Lazy Loading & Code Splitting** (Dynamic Imports for UI components).
- **Image Optimization with Sharp** (Automatic resizing & compression).
- **Aggressive Caching Strategies** (Firestore reads optimization).
- **Progressive Web App (PWA) Capabilities).

## User Engagement Features
- **Email Marketing** (React-Email + Firebase Functions for scheduled newsletters).
- **Push Notifications** (FCM for store updates & sales alerts).
- **Social Sharing** (Pre-generated templates for sharing deals & events).

## Developer Workflow & AI Coding Assistance
1. **Use Cursor AI for AI-generated code** but follow these standards:
   - Review AI-generated code before committing.
   - Ensure consistency with TypeScript types.
   - Avoid duplicate or unnecessary components.
2. **Version Control (GitHub)**
   - Main branch: Stable releases.
   - Dev branch: Feature development.
   - Feature branches: Separate per subdomain.
3. **Deployment Process**
   - Use **Vercel for frontend deployment**.
   - Firebase Hosting for backend services.
   - Automate deployments via **GitHub Actions**.

## Final Notes
This guideline ensures that **all subdomains remain modular, scalable, and cost-efficient**. We prioritize **Firestore-based search first**, with an **optional transition to Algolia** if needed. Gift ideas are **initially limited to store-added products**, with potential expansion to user-generated content later. Stores are required to **narrow down their target audience** to improve product visibility and relevance in searches.

Additionally, all services will use **a single Firebase Storage instance** to store images in a compressed format, ensuring **cost efficiency** while keeping performance high. Future scaling options include splitting storage if needed.

📌 **For frontend and development standards, refer to the [Development Guidelines](#).**

---
🚀 **For any changes, update this document in GitHub or Notion for reference.**
