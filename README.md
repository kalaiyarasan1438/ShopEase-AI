# 🛍️ ShopEasy — Premium Multi-Vendor E-Commerce Platform

> Production-ready full-stack e-commerce platform built with React, Spring Boot, and Python FastAPI.  
> Designed for software engineering interviews and GitHub portfolio projects.

![ShopEasy Banner](https://img.shields.io/badge/ShopEasy-v1.0.0-7c6ef7?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?style=flat-square&logo=springboot)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat-square&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│     React 18 + Vite + Redux Toolkit + Tailwind CSS          │
│     Deployed on Vercel                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌────────────────┐
│  Spring Boot │  │   Python FastAPI  │  │   PostgreSQL   │
│  (Port 8080) │  │   AI Service      │  │   Database     │
│  JWT Auth    │  │   (Port 8000)     │  │   (Port 5432)  │
│  REST APIs   │  │   Recommendations │  │                │
│  JPA/Hiber.  │  │   Smart Search    │  │                │
└──────────────┘  └──────────────────┘  └────────────────┘
     Render/Railway          Render             Render
```

---

## 🗂️ Full Project Structure

```
shopeasy/
├── frontend/                    # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Reusable UI components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Skeleton.jsx
│   │   │   │   ├── Toast.jsx
│   │   │   │   ├── Pagination.jsx
│   │   │   │   ├── Rating.jsx
│   │   │   │   └── Badge.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── product/
│   │   │   │   ├── ProductCard.jsx
│   │   │   │   ├── ProductGrid.jsx
│   │   │   │   ├── ProductDetail.jsx
│   │   │   │   ├── ProductFilters.jsx
│   │   │   │   ├── ReviewCard.jsx
│   │   │   │   └── ReviewForm.jsx
│   │   │   ├── cart/
│   │   │   │   ├── CartItem.jsx
│   │   │   │   └── CartSummary.jsx
│   │   │   ├── checkout/
│   │   │   │   ├── CheckoutStepper.jsx
│   │   │   │   ├── ShippingForm.jsx
│   │   │   │   ├── PaymentForm.jsx
│   │   │   │   └── OrderReview.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   ├── RevenueChart.jsx
│   │   │   │   ├── OrdersTable.jsx
│   │   │   │   └── CategoryDonut.jsx
│   │   │   ├── vendor/
│   │   │   │   ├── VendorCard.jsx
│   │   │   │   └── VendorTable.jsx
│   │   │   └── ai/
│   │   │       ├── ChatBot.jsx
│   │   │       └── AIRecommendations.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Wishlist.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── OrderTracking.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── VendorDashboard.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── store/
│   │   │   ├── index.js
│   │   │   └── slices/
│   │   │       ├── authSlice.js
│   │   │       ├── productSlice.js
│   │   │       ├── cartSlice.js
│   │   │       ├── wishlistSlice.js
│   │   │       └── orderSlice.js
│   │   ├── services/
│   │   │   ├── api.js            # Axios base config
│   │   │   ├── authService.js
│   │   │   ├── productService.js
│   │   │   ├── cartService.js
│   │   │   ├── orderService.js
│   │   │   └── aiService.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useCart.js
│   │   │   ├── useProducts.js
│   │   │   └── useToast.js
│   │   ├── utils/
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   └── constants.js
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── package.json
│
├── backend/                     # Spring Boot Backend
│   └── src/main/
│       ├── java/com/shopeasy/
│       │   ├── config/
│       │   │   ├── SecurityConfig.java
│       │   │   ├── JwtConfig.java
│       │   │   ├── CorsConfig.java
│       │   │   └── SwaggerConfig.java
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   ├── ProductController.java
│       │   │   ├── CartController.java
│       │   │   ├── OrderController.java
│       │   │   ├── WishlistController.java
│       │   │   ├── ReviewController.java
│       │   │   ├── VendorController.java
│       │   │   └── AdminController.java
│       │   ├── dto/
│       │   │   ├── request/     # LoginRequest, RegisterRequest, etc.
│       │   │   └── response/    # AuthResponse, ProductResponse, etc.
│       │   ├── entity/
│       │   │   ├── User.java
│       │   │   ├── Role.java
│       │   │   ├── Product.java
│       │   │   ├── Category.java
│       │   │   ├── Order.java
│       │   │   ├── OrderItem.java
│       │   │   ├── Cart.java
│       │   │   ├── CartItem.java
│       │   │   ├── Wishlist.java
│       │   │   ├── Review.java
│       │   │   ├── Vendor.java
│       │   │   └── Payment.java
│       │   ├── exception/
│       │   │   ├── GlobalExceptionHandler.java
│       │   │   ├── ResourceNotFoundException.java
│       │   │   └── UnauthorizedException.java
│       │   ├── repository/      # Spring Data JPA repositories
│       │   ├── security/
│       │   │   ├── JwtTokenProvider.java
│       │   │   ├── JwtAuthFilter.java
│       │   │   └── UserDetailsServiceImpl.java
│       │   └── service/
│       │       ├── AuthService.java
│       │       ├── ProductService.java
│       │       ├── CartService.java
│       │       ├── OrderService.java
│       │       └── impl/        # Service implementations
│       └── resources/
│           ├── application.yml
│           └── application-prod.yml
│
├── ai-service/                  # Python FastAPI AI Service
│   ├── main.py
│   ├── routers/
│   │   ├── chat.py
│   │   ├── recommendations.py
│   │   └── search.py
│   ├── services/
│   │   ├── recommendation_engine.py
│   │   ├── chat_service.py
│   │   └── search_service.py
│   ├── models/
│   │   └── schemas.py
│   ├── requirements.txt
│   └── Procfile
│
└── docs/
    ├── API.md                   # Full API documentation
    ├── DATABASE_SCHEMA.md       # Complete DB schema
    ├── JWT_FLOW.md              # Auth flow diagrams
    └── DEPLOYMENT.md            # Deployment guide
```

---

## 🗃️ Database Schema

```sql
-- Users & Auth
users          (id, name, email, password_hash, phone, avatar, created_at, updated_at)
roles          (id, name)                          -- USER, VENDOR, ADMIN
user_roles     (user_id, role_id)

-- Products & Categories
categories     (id, name, slug, image_url, parent_id)
products       (id, name, description, price, old_price, stock_qty, category_id,
                vendor_id, images[], rating_avg, rating_count, is_active, created_at)
product_images (id, product_id, image_url, is_primary)

-- Vendors
vendors        (id, user_id, business_name, gst_number, address, status,
                rating_avg, total_sales, created_at)

-- Shopping
carts          (id, user_id, created_at, updated_at)
cart_items     (id, cart_id, product_id, quantity, price_at_add)
wishlists      (id, user_id, product_id, added_at)

-- Orders
orders         (id, user_id, status, total_amount, shipping_address,
                payment_method, payment_status, tracking_number, created_at)
order_items    (id, order_id, product_id, vendor_id, quantity, unit_price, subtotal)

-- Reviews
reviews        (id, product_id, user_id, rating, title, body, is_verified, created_at)

-- Payments
payments       (id, order_id, amount, gateway, transaction_id, status, created_at)
```

---

## 🔐 JWT Authentication Flow

```
Client                    Spring Boot                  Database
  │                           │                            │
  │── POST /auth/login ───────▶│                            │
  │   {email, password}        │── findByEmail() ──────────▶│
  │                            │◀── User ──────────────────│
  │                            │── BCrypt.verify() ────────│
  │                            │── JWT.generate() ─────────│
  │◀── {accessToken,           │                            │
  │     refreshToken} ─────────│                            │
  │                            │                            │
  │── GET /api/products ───────▶│                            │
  │   Authorization: Bearer    │── JwtAuthFilter ───────────│
  │                            │── JWT.validate() ──────────│
  │                            │── SecurityContext.set() ───│
  │◀── products[] ─────────────│                            │
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+, Java 17+, Python 3.11+, PostgreSQL 15+

### 1. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local    # Set VITE_API_URL
npm run dev                   # http://localhost:5173
```

### 2. Backend
```bash
cd backend
# Set DB credentials in src/main/resources/application.yml
./mvnw spring-boot:run        # http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### 3. AI Service
```bash
cd ai-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload     # http://localhost:8000
# Docs: http://localhost:8000/docs
```

---

## 🌐 REST API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login & get JWT |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| GET | `/api/products` | ❌ | List products (paginated) |
| GET | `/api/products/{id}` | ❌ | Get product details |
| POST | `/api/products` | VENDOR | Create product |
| PUT | `/api/products/{id}` | VENDOR | Update product |
| DELETE | `/api/products/{id}` | ADMIN | Delete product |
| GET | `/api/cart` | USER | Get user cart |
| POST | `/api/cart/items` | USER | Add to cart |
| PUT | `/api/cart/items/{id}` | USER | Update cart item |
| DELETE | `/api/cart/items/{id}` | USER | Remove from cart |
| GET | `/api/wishlist` | USER | Get wishlist |
| POST | `/api/wishlist/{productId}` | USER | Add to wishlist |
| DELETE | `/api/wishlist/{productId}` | USER | Remove from wishlist |
| POST | `/api/orders` | USER | Place order |
| GET | `/api/orders` | USER | My orders |
| GET | `/api/orders/{id}` | USER | Order details |
| GET | `/api/admin/orders` | ADMIN | All orders |
| GET | `/api/admin/vendors` | ADMIN | All vendors |
| PUT | `/api/admin/vendors/{id}/approve` | ADMIN | Approve vendor |
| GET | `/api/vendor/products` | VENDOR | My products |
| GET | `/api/vendor/orders` | VENDOR | My orders |
| GET | `/api/ai/recommendations` | USER | AI product recs |
| POST | `/api/ai/chat` | USER | AI chatbot |
| GET | `/api/ai/search` | ❌ | Smart search |

---

## 🤖 AI Features

| Feature | Technology | Endpoint |
|---------|-----------|----------|
| AI Chatbot | FastAPI + OpenAI/Groq | `POST /ai/chat` |
| Product Recommendations | Collaborative Filtering | `GET /ai/recommendations` |
| Smart Search | Semantic Search + TF-IDF | `GET /ai/search?q=` |

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend && npm run build
# Connect GitHub repo to Vercel, set env vars, deploy
```

### Backend → Render/Railway
```bash
# Render: New Web Service → Connect repo → Set env vars
# Set: DB_URL, JWT_SECRET, ALLOWED_ORIGINS
```

### AI Service → Render
```bash
# Render: New Web Service → Python → ai-service/
# Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 🛡️ Roles & Permissions

| Feature | USER | VENDOR | ADMIN |
|---------|------|--------|-------|
| Browse products | ✅ | ✅ | ✅ |
| Cart & Checkout | ✅ | ✅ | ✅ |
| Write reviews | ✅ | ✅ | ✅ |
| Manage own products | ❌ | ✅ | ✅ |
| View sales analytics | ❌ | ✅ (own) | ✅ (all) |
| Manage all vendors | ❌ | ❌ | ✅ |
| Approve vendors | ❌ | ❌ | ✅ |
| Platform analytics | ❌ | ❌ | ✅ |

---

## 🧰 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + Vite |
| State Management | Redux Toolkit |
| Styling | Tailwind CSS + Framer Motion |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Backend Framework | Spring Boot 3.2 |
| Security | Spring Security + JWT |
| ORM | JPA / Hibernate |
| Database | PostgreSQL 15 |
| AI Service | Python FastAPI |
| API Docs | Swagger / OpenAPI |
| Frontend Deploy | Vercel |
| Backend Deploy | Render / Railway |

---

*Built with ❤️ for portfolio & interviews — ShopEasy v1.0*
