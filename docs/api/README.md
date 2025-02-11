# api.keyp.fo Documentation

## Overview
The Keyp.fo API provides centralized access to wishlists, stores, products, and gift ideas across all Keyp.fo services.

## Base URL
https://api.keyp.fo/v1

## Authentication
All requests must include a Firebase JWT token in the Authorization header:
```bash
bash
Authorization: Bearer <token>
```


## Endpoints

### Wishlists
```bash
List items in wishlist
GET /wishlistItems?wishlistId={id}
Get single item
GET /wishlistItems?wishlistId={id}&itemId={id}
Add item to wishlist
POST /wishlistItems?wishlistId={id}
Content-Type: application/json
{
"name": "Item Name",
"description": "Item description",
"priority": 2,
"price": 99.99,
"url": "https://example.com/item",
"note": "Color preference: blue"
}
Update item
PUT /wishlistItems?wishlistId={id}&itemId={id}
Content-Type: application/json
{
"name": "Updated Item Name",
"priority": 1,
"note": "Changed color preference"
}
Delete item
DELETE /wishlistItems?wishlistId={id}&itemId={id}
```

### Response Format
All successful responses follow this structure:
```json
{
"success": true,
"data": {
"itemId": "string",
"name": "string",
"description": "string",
"price": number,
"url": "string",
"priority": number,
"note": "string",
"createdAt": "string",
"updatedAt": "string"
}
}
```

### Error Format
``` json
{
"success": false,
"error": "Error message"
}
```

## Error Codes
- 400: Invalid parameters or request body
- 401: Missing or invalid authentication
- 403: Insufficient permissions
- 404: Resource not found
- 429: Rate limit exceeded
- 500: Internal server error

## Rate Limits
- Maximum 10 wishlists created per user per 24 hours
- Maximum 100 items per wishlist
- Maximum 20 items marked as bought per user per hour

## Validation Rules
### Item Properties
- name: Required, 1-200 characters
- description: Optional, max 500 characters
- priority: Required, number 1-5
- price: Optional, number
- url: Optional, valid URL
- note: Optional, max 1000 characters

## Need Help?
- Implementation Guide: https://api.keyp.fo/docs
- Support: support@keyp.fo
- GitHub Issues: github.com/keypfo/api/issues