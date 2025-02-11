# Keyp Wishlist API Implementation Guide

## Step 1: Authentication
All requests to the API require a valid authentication token. Include it in the Authorization header:

```bash
Authorization: Bearer your_token_here
```

## Step 2: Base URL
All requests should be made to:

```bash
https://api.keyp.fo/v1
```

## Step 3: Available Endpoints

### Wishlists
- **GET** `/wishlists` - Get all wishlists
- **GET** `/wishlists?id={wishlistId}` - Get single wishlist
- **POST** `/wishlists` - Create wishlist
- **PUT** `/wishlists?id={wishlistId}` - Update wishlist
- **DELETE** `/wishlists?id={wishlistId}` - Delete wishlist

### Wishlist Items
- **GET** `/wishlistItems?wishlistId={wishlistId}` - Get all items in wishlist
- **GET** `/wishlistItems?wishlistId={wishlistId}&itemId={itemId}` - Get single item
- **POST** `/wishlistItems?wishlistId={wishlistId}` - Add item to wishlist
- **PUT** `/wishlistItems?wishlistId={wishlistId}&itemId={itemId}` - Update item
- **DELETE** `/wishlistItems?wishlistId={wishlistId}&itemId={itemId}` - Delete item

## Step 4: Request/Response Examples

### Create Wishlist
```bash
POST /wishlists
Content-Type: application/json
{
"name": "My Wishlist",
"description": "Birthday wishlist",
"visibility": "private"
}
```

Validation:
- name: Required, max 100 characters
- visibility: Optional, defaults to "private"

#### Get Wishlists
```bash
GET /wishlists # Get all wishlists
GET /wishlists?id={wishlistId} # Get single wishlist
```

### Add Item to Wishlist
```bash
POST /wishlistItems?wishlistId={wishlistId}
Content-Type: application/json
{
"name": "Item Name",
"description": "Item description",
"priority": 2,
"price": 99.99,
"url": "https://example.com/item",
"note": "Preferred color: blue"
}
```

Validation:
- name: Required
- priority: 1-5
- price: Optional, numeric
- url: Optional, valid URL
- note: Optional, string

### Update Item
```bash
PUT /wishlistItems?wishlistId={wishlistId}&itemId={itemId}
Content-Type: application/json
{
"name": "Updated Item Name",
"priority": 1,
"note": "Changed color preference to red"
}
```

#### Get Items
```bash
GET /wishlistItems?wishlistId={wishlistId} # Get all items
GET /wishlistItems?wishlistId={wishlistId}&itemId={itemId} # Get single item
```

#### Delete Item
```bash
DELETE /wishlistItems?wishlistId={wishlistId}&itemId={itemId}
```

## Step 4: Response Format
All responses follow this structure:
```json
json
{
"success": true,
"data": {
// Response data
}
}
```

Error responses:
```json
{
"success": false,
"error": "Error message"
}

## Step 5: TypeScript Types:
```typescript
interface WishlistItem {
itemId: string;
name: string;
description?: string;
price?: number;
url?: string;
priority: number;
note?: string;
createdAt: string;
updatedAt: string;
}
interface Wishlist {
wishlistId: string;
name: string;
description?: string;
visibility: 'private' | 'shared' | 'public';
items: WishlistItem[];
createdAt: string;
updatedAt: string;
}
```

## Step 6: Error Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 405: Method Not Allowed
- 500: Internal Server Error

## Best Practices
1. Always include the Authorization header
2. Validate input before sending requests
3. Handle all possible error responses
4. Use TypeScript types for type safety
5. Implement proper error handling
6. Keep wishlist items under 100 per list