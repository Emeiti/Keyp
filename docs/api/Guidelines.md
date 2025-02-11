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
  - GET: Get user wishlists (supports filtering and pagination)
  - POST: Create new wishlist
  - PUT: Update wishlist
  - DELETE: Delete wishlist

- `/wishlists/{id}` → Single wishlist operations
  - GET: Get specific wishlist (public or own)
  - PUT: Update wishlist (owner only)
  - DELETE: Delete wishlist (owner only)

- `/wishlists/{id}/items` → Wishlist items
  - POST: Add item to wishlist (owner only)
  - PUT: Update item (owner only)
  - DELETE: Remove item (owner only)

- `/wishlists/{id}/share` → Sharing
  - POST: Toggle wishlist public/private (owner only)
  Example:
  ```json
  {
    "isPublic": true
  }
  ```

- `/wishlists/{id}/bought` → Purchase tracking
  - POST: Mark/unmark item as bought (any authenticated user except owner)
  Example:
  ```json
  {
    "itemId": "123",
    "bought": true
  }
  ```
  - GET: View bought items (any authenticated user except owner)

Note: Purchase status is always hidden from the wishlist owner to keep gifts a surprise!

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

#### Wishlists API Limits & Validation

1. **Rate Limits**
   - Maximum 10 wishlists created per user per 24 hours
   - Maximum 20 items marked as bought per user per hour

2. **Wishlist Constraints**
   - Name: 1-100 characters (required)
   - Description: maximum 500 characters (optional)
   - Maximum 100 items per wishlist

3. **Item Constraints**
   - Name: 1-200 characters (required)
   - Notes: maximum 1000 characters (optional)
   - Priority: 1-5 (required)

4. **Error Responses**
   ```json
   // Rate limit exceeded
   {
     "error": "Too many wishlists created. Please try again tomorrow."
   }

   // Invalid data
   {
     "error": "Wishlist name must be between 1 and 100 characters"
   }

   // Item limit exceeded
   {
     "error": "Wishlist cannot exceed 100 items"
   }
   ```

5. **Purchase Tracking**
   - Only non-owners can mark items as bought
   - Purchase status is always hidden from wishlist owner
   - Items can be unmarked as bought by the same user who marked them

### Wishlist Endpoints
- `/wishlistItems` → Wishlist item management
  - GET: List items in wishlist (with wishlistId param)
  - GET: Get single item (with wishlistId and itemId params)
  - POST: Add item to wishlist (with wishlistId param)
  - PUT: Update item (with wishlistId and itemId params)
  - DELETE: Delete item (with wishlistId and itemId params)