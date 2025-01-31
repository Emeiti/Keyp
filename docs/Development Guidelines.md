# Development Guidelines

## Overview
This document defines the **development standards** for all subdomains under `keyp.fo`, ensuring consistency across services like **Ynskilisti, Gávuhugskot, Tilboð, Innkeypslisti**, and others. By following these guidelines, we ensure a scalable, modular, and efficient development process, even when using AI-assisted coding.

📌 **For API structure, database models, and security policies, refer to the [API Guidelines for `api.keyp.fo`](#).**

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
  - Cheerio (Web scraping for gift ideas & sales listings)
- **Social Media Integration:**
  - React-Share (Sharing products, sales, & events)
  - Social Media APIs (Facebook, Instagram, Twitter integration)

## UI Component Management (Using NPM Package for UI)
To ensure a **consistent UI across all subdomains**, UI components are stored in a **separate repository (`Keyp-ui.git`)** and used as an **NPM package (`@keyp/ui`)** in all subdomains.

### **How to Use the Shared UI Package (`@keyp/ui`):**
1. Install the UI package in your subdomain project:
   ```bash
   npm install @keyp/ui
   ```
2. Import components in your code:
   ```tsx
   import { Button } from "@keyp/ui";
   ```
3. When `Keyp-ui.git` is updated, update the package in your subdomain:
   ```bash
   npm update @keyp/ui
   ```
4. Restart your development server:
   ```bash
   npm run dev
   ```

📌 **UI updates are managed in `Keyp-ui.git`. Subdomains only reference the latest version via NPM, avoiding direct UI file changes.**

## Project Structure
Each subdomain follows the same folder structure:
```
project-root/
│── src/
│   ├── components/   # Reusable UI components (imported from @keyp/ui)
│   ├── pages/        # Page-specific components
│   ├── hooks/        # Custom React hooks
│   ├── services/     # API interaction & Firebase calls
│   ├── utils/        # Helper functions
│   ├── styles/       # Tailwind custom styles & themes
│── public/
│── .env.local        # Environment variables
│── package.json
│── next.config.js
```

## Subdomains & Their Functions
- `keyp.fo` → **Main hub** (global search, service navigation, store discovery)
- `ynskilisti.keyp.fo` → **Wishlists & gift registries**
- `gavuhugskot.keyp.fo` → **Gift ideas & recommendations**
- `tilbod.keyp.fo` → **Sales, promotions, & discounts**
- `innkeypslisti.keyp.fo` → **Shopping list & in-store navigation**

## State Management
- **Global state:** React Context for authentication & user data.
- **Local state:** `useState` & `useReducer` for component-specific data.
- **Search state:** Initially managed via **Firestore queries**, expandable to Algolia.
- **Real-time updates:** Firestore listeners for live updates in the UI.

## Performance & Optimization
- **Start with Firestore for search** (minimizing costs at the start).
- **Lazy Loading & Code Splitting** (Dynamic Imports for UI components).
- **Image Optimization with Sharp** (Automatic resizing & compression).
- **Aggressive Caching Strategies** (Firestore reads optimization).
- **Progressive Web App (PWA) Capabilities**.

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

## Security Best Practices
- **Firestore Security Rules**:
  - Restrict read/write access based on authentication roles.
- **Environment Variables Management**:
  - Store API keys securely in `.env.local`.
- **Data Protection & GDPR Compliance**:
  - Provide users with data export & deletion options.

## Final Notes
This guideline ensures that **all subdomains remain modular, scalable, and cost-efficient**. We prioritize **Firestore-based search first**, with an **optional transition to Algolia** if needed.

Additionally, all services will use **a single Firebase Storage instance** to store images in a compressed format, ensuring **cost efficiency** while keeping performance high. Future scaling options include splitting storage if needed.

📌 **For API structure, database models, and security policies, refer to the [API Guidelines for `api.keyp.fo`](#).**

---
🚀 **For any changes, update this document in GitHub or Notion for reference.**
