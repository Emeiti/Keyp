# Keyp.fo API Guidelines

## Overview
The Keyp.fo API provides centralized access to store data, products, wishlists, and gift ideas across all Keyp.fo services.

## API Structure
### Base URL
`https://api.keyp.fo/v1/`

### Core Endpoints
#### Stores
- `/stores` → Store management
  - GET: List stores with filtering
  - POST: Create store (admin only)
  - PUT: Update store (store owner/admin)
- `/stores/{id}` → Single store operations
  - GET: Get store details
  - PUT: Update store
  - DELETE: Delete store
- `/stores/{id}/products` → Store product management
  - GET: List store products
  - POST: Add product (store owner/admin)
- `/stores/{id}/hours` → Store hours
  - GET: Get regular and special hours
- `/stores/{id}/reviews` → Store reviews
  - GET: List reviews
  - POST: Add review
- `/stores/nearby` → Location-based search
  - GET: Find stores by location

#### Products
- `/products` → Cross-store product management
  - GET: List products across all stores
  - POST: Create product (store owner/admin)
- `/products/{id}` → Product operations
  - GET: Get product details
  - PUT: Update product
  - DELETE: Delete product

#### Wishlists
- `/wishlists` → Wishlist management
  - GET: Get user wishlists
  - POST: Create wishlist
  - PUT: Update wishlist
- `/wishlists/{id}` → Single wishlist operations
  - GET: Get wishlist details
  - PUT: Update wishlist
  - DELETE: Delete wishlist
- `/wishlists/{id}/viewers` → Wishlist sharing
  - POST: Add viewer
  - DELETE: Remove viewer

#### Gift Ideas
- `/giftideas` → Gift ideas management
  - GET: List gift ideas with filtering
  - POST: Create gift idea (store owner)
- `/giftideas/recommendations` → Personalized recommendations
  - GET: Get personalized gift suggestions
- `/giftideas/seasonal` → Seasonal collections
  - GET: Get seasonal gift collections

#### Authentication
- `/auth/register` → User registration
- `/auth/login` → User login

#### Sales
- `/sales` → Store sales management
  - GET: List current sales
  - POST: Create sale (store owner)

#### Analytics
- `/analytics/funnels` → Conversion analytics
- `/analytics/journeys` → Customer journey tracking
- `/analytics/campaigns` → Campaign performance
- `/analytics/wishlists` → Wishlist analytics
- `/analytics/products` → Product performance

## Authentication & Security
### Authentication
- Uses Firebase Authentication (JWT-based tokens)
- Required header: `Authorization: Bearer <token>`

### User Roles
- `admin` → Full system access
- `store_owner` → Can manage store data
- `user` → Can create wishlists, add gift ideas, etc.

### Security Policies
- Firestore security rules restrict unauthorized access
- API rate limiting to prevent abuse
- CORS restrictions to whitelisted domains
- Geolocation validation for store searches
- Review spam prevention

## Rate Limits
- Standard Users: 1000 requests/hour
- Store Owners: 5000 requests/hour
- Admin: Unlimited

## Data Flow & Performance
1. **Request Flow**
   - Frontend queries `api.keyp.fo`
   - Firestore handles data retrieval
   - Optional Algolia integration for search

2. **Optimization**
   - Firestore for real-time operations
   - Algolia for fast, typo-tolerant search
   - Redis caching for heavy API calls

## Error Handling
All API errors follow this format:
```json
{
"error": {
"code": "string", // e.g., "PERMISSION_DENIED"
"message": "string", // Human readable message
"details": {
"field": "string",
"reason": "string"
}
}
}
```

### Common Error Codes
- 400: Invalid parameters or request body
- 401: Missing or invalid authentication
- 403: Insufficient permissions
- 404: Resource not found
- 429: Rate limit exceeded
- 500: Internal server error

## Support & Resources
- Documentation: https://api.keyp.fo/docs
- Support: support@keyp.fo
- Issues: github.com/keypfo/api/issues