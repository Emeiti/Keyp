# Development Guidelines
> Version: 1.0.0 (Last updated: 2025-02-01)

## Overview
This document defines the **development standards** for all subdomains under `keyp.fo`, ensuring consistency across services like **Ynskilisti, Gávuhugskot, Tilboð, Innkeypslisti**, and others. By following these guidelines, we ensure a scalable, modular, and efficient development process, even when using AI-assisted coding.

📌 **For API structure, database models, and security policies, refer to the [API Guidelines for `api.keyp.fo`](#).**

## Project Structure
Each subdomain follows the same folder structure:
```
project-root/
│── src/
│   ├── components/   # UI components (imported from @keyp/ui)
│   ├── pages/        # Page-specific components
│   ├── hooks/        # Custom React hooks
│   ├── services/     # API interaction & Firebase calls
│   ├── utils/        # Helper functions
│   ├── styles/       # Tailwind custom styles & themes
│── public/
│── docs/            # Development Guidelines and Cursor Rules
│── .env.local        # Environment variables
│── package.json
│── next.config.js
```

## Core Technologies
- **Frontend:**
  - Next.js 15.1.4 (App Router + Server Components)
  - React 18.2.0 (Hooks, Context API)
  - TypeScript (type safety & maintainability)
  - Tailwind CSS (consistent styling & responsive utilities)
  - **ShadCN UI** for standardized UI components
  - **Lucide.dev icons (included via ShadCN UI)** for a consistent icon set
- **Backend:**
  - Firebase (Firestore, Authentication, Storage, Hosting)
  - Firestore for **initial search implementation** (cost-efficient, free-tier friendly)
  - Firebase Cloud Messaging (Push notifications for sales & alerts)
  - Google Analytics (User tracking & insights)
- **Data Processing & AI:**
  - Papaparse (CSV/Excel handling for bulk uploads)
  - Cheerio (Web scraping for gift ideas & sales listings)
  - TensorFlow.js (AI-driven image recommendations)
- **Social Media Integration:**
  - React-Share (Sharing products, sales, & events)
  - Social Media APIs (Facebook, Instagram, Twitter integration)

## Code Style & Best Practices
- **TypeScript:**
  - Use strict typing (`strict` mode enabled in `tsconfig.json`).
  - Define reusable interfaces and types in `src/types/`.
- **React & Next.js:**
  - Prefer function components with hooks (`useState`, `useEffect`, `useReducer`).
  - Use `useContext` for global state management.
  - Avoid unnecessary re-renders by memoizing with `useMemo` and `useCallback`.
- **Styling:**
  - Use Tailwind CSS utility classes.
  - Keep styles consistent with the **ShadCN UI theme**.
- **Performance Optimization:**
  - Lazy load images (`next/image` with `priority` where necessary).
  - Use **code splitting** and dynamic imports (`import('...')`).
  - Optimize database queries to reduce Firestore reads.
- **Error Handling:**
  - Wrap components in error boundaries where needed.
  - Use Firebase security rules to restrict access properly.
  - Handle API errors gracefully with user-friendly messages.

## Mobile-Friendly Design
- **Mobile-first approach:** Design should prioritize smaller screens first, then scale up.
- **Responsive Grid System:** Use Tailwind CSS utilities like `grid`, `flex`, `w-full`, `max-w`, and `container` for responsive layouts.
- **Media Queries:** Use Tailwind breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`) to adapt layouts.
- **Touch-Friendly Elements:**
  - Buttons and clickable areas should be at least **48px** in height for accessibility.
  - Use proper spacing (`p-4`, `m-2`) to prevent accidental taps.
- **Navigation Adjustments:**
  - Mobile-friendly navigation bars (hamburger menus or bottom navbars when appropriate).
  - Avoid hover-dependent interactions; ensure all features are **tap-friendly**.
- **Image Optimization:**
  - Use responsive image sizes (`w-full sm:w-1/2 lg:w-1/3`).
  - Prefer WebP format for better performance.
- **Testing on Multiple Devices:**
  - Ensure smooth UX on **iOS, Android, tablets, and desktops**.
  - Test using Chrome DevTools' device simulator and real mobile devices.

## Documentation Sync Across Subdomains
- The **Development Guidelines and Cursor Rules** are stored in the **`/docs` folder of the main repository (`keyp.git`)** and used as an **NPM package (`@keyp/docs`)** in all subdomains.
- Each subdomain must install the documentation package:
  ```bash
  npm install @keyp/docs
  ```
- To update the documentation package:
  ```bash
  npm update @keyp/docs
  ```
- This ensures **all subdomains have the latest development standards**.

---
🚀 **For any changes, update this document in GitHub or Notion for reference.**

---
## Version History
- **1.0.0** (2024-03-XX)
  - Initial documentation
  - Core architecture defined
  - Development standards established
  - API structure outlined

Future versions should follow [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality
- PATCH version for backwards-compatible bug fixes