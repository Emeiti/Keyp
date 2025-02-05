# api.keyp.fo Documentation

## Overview
The Keyp.fo API provides centralized access to store data, products, wishlists, and gift ideas across all Keyp.fo services.

## Base URL
https://api.keyp.fo/v1

## Authentication
All requests must include a Firebase JWT token in the Authorization header:
`Authorization: Bearer <token>`

## Endpoints

### Stores

```http
List stores
GET /stores

Query Parameters
- active: boolean
- hasWebshop: boolean
- hasPhysicalShop: boolean
- category: string

Get single store
GET /stores/{id}
```

### Products

```http
List products
GET /products

Query Parameters
- storeId: string
- category: string
- minPrice: number
- maxPrice: number
- inStock: boolean

Get product details
GET /products/{id}

Create product (requires store_owner or admin role)
POST /products
Content-Type: application/json

Update product (requires store_owner or admin role)
PUT /products/{id}
Content-Type: application/json
```

### Wishlists

```http
List wishlists
GET /wishlists

Create wishlist
POST /wishlists
Content-Type: application/json

Get wishlist
GET /wishlists/{id}

Update wishlist
PUT /wishlists/{id}
Content-Type: application/json

Manage viewers
POST /wishlists/{id}/viewers
DELETE /wishlists/{id}/viewers/{userId}
```


### Gift Ideas

```http
List gift ideas
GET /giftideas

Query Parameters
- occasion: string
- targetAudience: string[]
- maxPrice: number
- storeId: string

Create gift idea (store_owner)
POST /giftideas
Content-Type: application/json
```

## Error Handling
All API errors follow this format:

```json
{
  "error": {
    "code": "string",     // e.g., "PERMISSION_DENIED"
    "message": "string",  // Human readable message
    "details": {
      "field": "string",
      "reason": "string"
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
- Full Documentation: https://api.keyp.fo/docs
- Support: support@keyp.fo
- GitHub Issues: github.com/keypfo/api/issues