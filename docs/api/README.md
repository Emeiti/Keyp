# api.keyp.fo Documentation

## Overview
The Keyp.fo API provides centralized access to store data, products, wishlists, and gift ideas across all Keyp.fo services.

## Base URL
https://api.keyp.fo/v1

## Authentication
All requests must include a Firebase JWT token in the Authorization header:
`Authorization: Bearer <token>`

## Endpoints & Response Types

### Stores

```typescript
// List stores
GET /stores
Response:
{
stores: {
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
// ... other store fields as defined in Database Structure
}[]
}
// Get single store
GET /stores/{id}
Response matches store structure from Database Structure Documentation
```

### Products

```typescript
// List products
GET /products

Query params:

storeId: string
category: string
minPrice: number
maxPrice: number
inStock: boolean
// Get product details
GET /products/{id}
// Manage products (store_owner, admin)
POST /products
PUT /products/{id}
``` 

### Wishlists

```typescript
// Get wishlist
GET /wishlists/{id}

Response:
{
userId: string | null
name: string
shareableUrl: string
createdAt: string
lastUpdated: string
items: {
productId: string
storeId: string
addedAt: string
priority: number
notes?: string
productDetails: {
name: string
description: string
price: number
imageUrl: string
category: string
}
purchase?: { // Only visible to viewers
purchasedBy: string
purchasedAt: string
hidden: boolean
}
}[]
}
```

### Gift Ideas

```typescript
// List gift ideas
GET /giftideas
Query params:
occasion: string
targetAudience: string[]
maxPrice: number
storeId: string
Response:
{
giftIdeas: {
id: string
storeId: string
title: string
description: string
price: number
imageUrl: string
categories: string[]
targetAudience: string[]
occasions: string[]
createdAt: string
products: {
productId: string
storeId: string
required: boolean
}[]
}[]
}
```

// Create gift idea (store_owner)
POST /giftideas
Request body matches Database Structure Documentation


## Error Handling
All API errors follow this format:

```typescript
{
  error: {
    code: string     // e.g., "PERMISSION_DENIED"
    message: string  // Human readable message
    details?: {
      field?: string
      reason?: string
    }
  }
}
```

Common error codes:
- 400: Invalid parameters or request body
- 401: Missing or invalid authentication
- 403: Insufficient permissions
- 404: Resource not found
- 429: Rate limit exceeded
- 500: Internal server error

## Rate Limits
- Standard Users: 1000 requests/hour
- Store Owners: 5000 requests/hour
- Admin: Unlimited


## Need Help?
- Full API Documentation: https://api.keyp.fo/docs
- Support: support@keyp.fo
- GitHub Issues: github.com/keypfo/api/issues