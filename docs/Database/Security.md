# Database Security & Performance
Version: 1.0.1
Last Updated: 2024-02-04

## Security Rules Overview
Our Firestore security rules (defined in `firestore.rules`) implement the following access patterns:

### Store Access Patterns
- Public read access for store information and products
- Store owners can only modify their own store data
- Admin users have full access to all stores
- Rate limiting applied to prevent abuse

### Wishlist Access Patterns
- Anonymous users can create and manage wishlists
- Purchase information is hidden from wishlist owners
- Shared viewers can see purchase status
- Rate limiting: 10 wishlists per hour per user

### Gift Ideas Access Patterns
- Public read access for all gift ideas
- Store owners can create/edit based on subscription limits
- Admin users can manage all gift ideas

## Indexing Strategy
Our composite indexes (defined in `firestore.indexes.json`) support these common queries:

### Store Queries
- Filter by physical/webshop presence
- Filter by subscription plan
- Search by categories and brands
- Sort by store name

### Product Queries
- Filter by category and price
- Search across all store products

For implementation details, see:
- Security Rules: `firestore.rules`
- Indexes: `firestore.indexes.json`
- Access Patterns: `docs/Api Guidelines.md` 