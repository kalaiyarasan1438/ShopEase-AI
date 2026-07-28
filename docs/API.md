# 📡 ShopEasy — REST API Reference

Base URL: `https://shopeasy-api.onrender.com`  
All protected endpoints require: `Authorization: Bearer <accessToken>`

---

## Authentication

### POST /api/auth/register
Register a new user account.

**Request**
```json
{
  "firstName": "Alex",
  "lastName": "Morgan",
  "email": "alex@example.com",
  "password": "Password1",
  "phone": "+1-555-000-0000",
  "role": "USER"
}
```
**Response 201**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "firstName": "Alex",
    "lastName": "Morgan",
    "email": "alex@example.com",
    "roles": ["USER"],
    "createdAt": "2024-01-15T10:30:00"
  }
}
```

---

### POST /api/auth/login
```json
{ "email": "alex@example.com", "password": "Password1" }
```
**Response 200** — same as register response.

---

### POST /api/auth/refresh
```json
{ "refreshToken": "eyJ..." }
```
**Response 200**
```json
{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

---

### GET /api/auth/me 🔒
Returns the currently authenticated user.

---

## Products

### GET /api/products
List products with full filtering support.

**Query Params**
| Param       | Type    | Default     | Description                        |
|-------------|---------|-------------|------------------------------------|
| `page`      | int     | 0           | Page number (0-indexed)            |
| `size`      | int     | 12          | Items per page (max 50)            |
| `sortBy`    | string  | createdAt   | Field to sort by                   |
| `sortDir`   | string  | desc        | `asc` or `desc`                    |
| `search`    | string  | —           | Full-text search on name           |
| `categoryId`| long    | —           | Filter by category                 |
| `minPrice`  | decimal | —           | Minimum price filter               |
| `maxPrice`  | decimal | —           | Maximum price filter               |

**Response 200**
```json
{
  "content": [
    {
      "id": 1,
      "name": "Pro Wireless Headphones",
      "description": "Premium noise-cancelling headphones",
      "price": 149.99,
      "oldPrice": 199.99,
      "stockQty": 43,
      "categoryId": 1,
      "categoryName": "Electronics",
      "vendorId": 1,
      "vendorName": "TechWave",
      "imageUrl": "https://cdn.shopeasy.com/products/1.jpg",
      "badge": "Best Seller",
      "ratingAvg": 4.8,
      "ratingCount": 2847,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00"
    }
  ],
  "totalElements": 284,
  "totalPages": 24,
  "number": 0,
  "size": 12
}
```

---

### GET /api/products/{id}
Get single product with full details.

---

### POST /api/products 🔒 VENDOR/ADMIN
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "oldPrice": 129.99,
  "stockQty": 50,
  "categoryId": 1,
  "badge": "New"
}
```

---

### PUT /api/products/{id} 🔒 VENDOR/ADMIN
Same body as POST.

---

### DELETE /api/products/{id} 🔒 ADMIN
**Response 204** No Content

---

## Categories

### GET /api/categories
```json
[
  { "id": 1, "name": "Electronics", "slug": "electronics", "imageUrl": "..." },
  { "id": 2, "name": "Furniture",   "slug": "furniture",   "imageUrl": "..." }
]
```

---

## Cart 🔒

### GET /api/cart
```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Pro Wireless Headphones",
      "price": 149.99,
      "quantity": 1,
      "subtotal": 149.99,
      "imageUrl": "..."
    }
  ],
  "itemCount": 1,
  "subtotal": 149.99
}
```

### POST /api/cart/items
```json
{ "productId": 1, "quantity": 2 }
```

### PUT /api/cart/items/{itemId}
```json
{ "quantity": 3 }
```

### DELETE /api/cart/items/{itemId}
**Response 204**

### DELETE /api/cart
Clear entire cart. **Response 204**

---

## Wishlist 🔒

### GET /api/wishlist
Returns array of wishlisted products.

### POST /api/wishlist/{productId}
Add product to wishlist. **Response 201**

### DELETE /api/wishlist/{productId}
Remove from wishlist. **Response 204**

---

## Orders 🔒

### POST /api/orders
Place a new order.

```json
{
  "shippingName": "Alex Morgan",
  "shippingAddressLine1": "123 Main St",
  "shippingAddressLine2": "Apt 4B",
  "shippingCity": "New York",
  "shippingState": "NY",
  "shippingZip": "10001",
  "shippingCountry": "US",
  "paymentMethod": "CARD",
  "shippingOption": "STANDARD",
  "couponCode": "SAVE20",
  "items": [
    { "productId": 1, "quantity": 1 },
    { "productId": 4, "quantity": 2 }
  ]
}
```

**Response 201**
```json
{
  "id": 8473,
  "orderNumber": "ORD-8473",
  "status": "CONFIRMED",
  "totalAmount": 409.97,
  "shippingAmount": 0.00,
  "taxAmount": 32.80,
  "paymentStatus": "PAID",
  "estimatedDelivery": "2024-01-20",
  "items": [...],
  "createdAt": "2024-01-15T10:32:00"
}
```

### GET /api/orders
```
GET /api/orders?page=0&size=10&status=DELIVERED
```
Returns paginated list of the current user's orders.

### GET /api/orders/{id}
Returns full order details with tracking info.

### PATCH /api/orders/{id}/cancel
Cancel a PENDING order.

---

## Reviews 🔒

### GET /api/products/{productId}/reviews
```
GET /api/products/1/reviews?page=0&size=10&sort=createdAt,desc
```

### POST /api/products/{productId}/reviews 🔒 USER
```json
{
  "rating": 5,
  "title": "Amazing product!",
  "body": "Crystal clear audio. Best purchase this year."
}
```

---

## Admin Endpoints 🔒 ADMIN

### GET /api/admin/orders
All orders across all users. Supports `?status=PENDING&page=0&size=20`

### PATCH /api/admin/orders/{id}/status
```json
{ "status": "SHIPPED" }
```

### GET /api/admin/vendors
All vendor accounts.

### PUT /api/admin/vendors/{id}/approve
Approve a pending vendor. **Response 200**

### DELETE /api/admin/vendors/{id}
Suspend/remove a vendor. **Response 204**

### GET /api/admin/stats
```json
{
  "totalRevenue": 142580.00,
  "totalOrders": 3247,
  "activeVendors": 48,
  "totalProducts": 1284,
  "monthlyRevenue": [42000, 38000, 55000, ...],
  "topCategories": [...]
}
```

---

## Vendor Endpoints 🔒 VENDOR/ADMIN

### GET /api/vendor/products
The vendor's own products.

### GET /api/vendor/orders
Orders containing the vendor's products.

### GET /api/vendor/stats
```json
{
  "totalProducts": 24,
  "totalRevenue": 48750.00,
  "totalOrders": 312,
  "ratingAvg": 4.8
}
```

---

## AI Endpoints (FastAPI)

Base URL: `https://shopeasy-ai.onrender.com`

### POST /ai/chat
```json
{
  "message": "What headphones do you recommend?",
  "history": [
    { "role": "user",    "content": "I need good audio" },
    { "role": "bot",     "content": "What's your budget?" }
  ]
}
```
**Response 200**
```json
{
  "reply": "Based on your budget, I recommend the Pro Wireless Headphones at $149.99...",
  "intent": "recommendations",
  "suggestions": ["View headphones", "Compare products"]
}
```

### GET /ai/recommendations
```
GET /ai/recommendations?user_id=1&limit=8
GET /ai/recommendations?product_id=1&limit=6   (similar items)
```

### GET /ai/search
```
GET /ai/search?q=wireless+headphones&limit=10
```
Returns products ranked by semantic relevance score.

### GET /ai/suggestions
```
GET /ai/suggestions?q=head&limit=5
```
Returns autocomplete suggestions.

---

## Error Responses

All errors follow a consistent format:

```json
{
  "timestamp": "2024-01-15T10:32:00",
  "status": 404,
  "error": "Not Found",
  "message": "Product not found with id: 999",
  "path": "/api/products/999"
}
```

Validation errors:
```json
{
  "timestamp": "2024-01-15T10:32:00",
  "status": 400,
  "error": "Validation Failed",
  "errors": {
    "email": "Valid email required",
    "password": "Password must be at least 8 characters"
  },
  "path": "/api/auth/register"
}
```

| Status | Meaning                          |
|--------|----------------------------------|
| 200    | Success                          |
| 201    | Created                          |
| 204    | No Content (delete/clear)        |
| 400    | Bad Request / Validation Error   |
| 401    | Unauthorized (invalid/no token)  |
| 403    | Forbidden (insufficient role)    |
| 404    | Resource Not Found               |
| 409    | Conflict (duplicate email, etc.) |
| 500    | Internal Server Error            |

---

*Swagger UI available at: `https://shopeasy-api.onrender.com/swagger-ui.html`*
