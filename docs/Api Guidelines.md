# API Guidelines for `api.keyp.fo`
> Version: 1.0.3 (Last updated: 2025-02-03)

## Overview
`api.keyp.fo` serves as the **centralized backend** for all subdomains (`ynskilisti.keyp.fo`, `gavuhugskot.keyp.fo`, `tilbod.keyp.fo`, etc.), ensuring **data consistency, shared authentication, and structured API access**.

📌 **For development standards and frontend architecture, refer to the [Development Guidelines](#).**

## Core Responsibilities
- **Store & Product Management:** Stores can add, edit, and update their product listings.
- **User Authentication & Permissions:** Manage users, roles, and access control.
- **Search & Data Retrieval:** Provide search results efficiently via Firestore (or Algolia if needed).
- **Real-time Updates:** Maintain real-time store/product updates.
- **Integration with Keyp Services:** Connects with `ynskilisti.keyp.fo`, `gavuhugskot.keyp.fo`, `tilbod.keyp.fo`, etc.

## API Structure
- **Base URL:** `https://api.keyp.fo/v1/`
- **Endpoints:**
  - `/stores` → Store management
    - GET: List stores with filtering
    - POST: Create store (admin only)
    - PUT: Update store (store owner/admin)
  - `/stores/{id}/products` → Product management
    - GET: List store products
    - POST: Add product (store owner/admin)
  - `/wishlists` → Wishlist management
    - GET: Get user wishlists
    - POST: Create wishlist
    - PUT: Update wishlist
  - `/wishlists/{id}/viewers` → Wishlist sharing
    - POST: Add viewer
    - DELETE: Remove viewer
  - `/giftideas` → Gift ideas management
    - GET: List gift ideas with filtering
    - POST: Create gift idea (store owner)

## Authentication & Security
- **Authentication:** Uses Firebase Authentication (JWT-based tokens).
- **User Roles:**
  - `admin` → Full system access.
  - `store_owner` → Can manage store data.
  - `user` → Can create wishlists, add gift ideas, etc.
- **Security Policies:**
  - Firestore security rules restrict unauthorized access.
  - API rate limiting to prevent abuse.
  - CORS restrictions to only allow whitelisted domains.

## Data Flow & Performance Optimization
1. **User Requests Data:** The frontend queries `api.keyp.fo`.
2. **Data Processing:** Firestore retrieves data, optionally filtered by Algolia.
3. **Optimized Search & Caching:**
   - Firestore used for real-time reads/writes.
   - Algolia for **fast, typo-tolerant search** (optional if needed).
   - Redis caching layer **if necessary** for heavy API calls.
4. **Response Delivery:** API returns results in JSON format.

## API Rate Limits
- **Standard Users:** 1000 requests per hour.
- **Store Owners:** 5000 requests per hour.
- **Admins:** Unlimited access.
- Rate limits reset every hour.

## Error Handling
- **400 Bad Request:** Invalid request parameters.
- **401 Unauthorized:** User authentication failed.
- **403 Forbidden:** User does not have permission.
- **404 Not Found:** Resource does not exist.
- **500 Internal Server Error:** Unexpected server failure.

## Future Enhancements
- **Webhook Support:** Notify stores when wishlist items are added.
- **GraphQL API Layer:** Allow flexible queries for optimized data retrieval.
- **AI Recommendations:** Suggest gift ideas based on purchase history.

---
🚀 **For updates, refer to GitHub or Notion documentation.**

## Version History
- **1.0.0** (2025-02-01)
  - Initial documentation
  - Core architecture defined
  - Development standards established
  - API structure outlined

Future versions should follow [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality
- PATCH version for backwards-compatible bug fixes