# 🔐 ShopEasy — JWT Authentication Flow

## Token Architecture

```
┌─────────────────────────────────────────────────────┐
│                   JWT Structure                      │
├──────────────┬──────────────────┬───────────────────┤
│   Header     │     Payload      │     Signature     │
│  algorithm   │  sub (email)     │  HMAC-SHA256      │
│  HS256       │  roles           │  signed with      │
│              │  type (access)   │  SECRET_KEY       │
│              │  iat / exp       │                   │
└──────────────┴──────────────────┴───────────────────┘

Access Token:  15 minutes
Refresh Token: 7 days
```

---

## Registration Flow

```
Client                       Spring Boot                  DB
  │                               │                        │
  │── POST /api/auth/register ───▶│                        │
  │   { firstName, lastName,      │── existsByEmail() ────▶│
  │     email, password, role }   │◀── false ─────────────│
  │                               │── BCrypt.encode(pwd)   │
  │                               │── new User(role) ─────▶│
  │                               │── save(user) ─────────▶│
  │                               │── generateAccessToken()│
  │                               │── generateRefreshToken()
  │◀── 201 { accessToken,         │                        │
  │          refreshToken,         │                        │
  │          user } ──────────────│                        │
  │                               │                        │
  │  store tokens in localStorage │                        │
```

---

## Login Flow

```
Client                       Spring Boot                  DB
  │                               │                        │
  │── POST /api/auth/login ──────▶│                        │
  │   { email, password }         │── findByEmail() ──────▶│
  │                               │◀── User ──────────────│
  │                               │── AuthManager          │
  │                               │   .authenticate()      │
  │                               │── BCrypt.matches()     │
  │                               │── generateAccessToken()│
  │                               │── generateRefreshToken()
  │◀── 200 { accessToken,         │                        │
  │          refreshToken,         │                        │
  │          user } ──────────────│                        │
```

---

## Authenticated Request Flow

```
Client                    JwtAuthFilter           Controller
  │                            │                       │
  │── GET /api/cart ──────────▶│                       │
  │   Authorization: Bearer    │                       │
  │   <accessToken>            │                       │
  │                            │── extractUsername()   │
  │                            │── loadUserByUsername()│
  │                            │── isTokenValid()      │
  │                            │── setAuthentication() │
  │                            │────────────────────────▶
  │                            │               business logic
  │◀── 200 { cart } ──────────────────────────────────│
```

---

## Token Refresh Flow

```
Client                    Axios Interceptor        Spring Boot
  │                            │                        │
  │── GET /api/orders ────────▶│                        │
  │   (expired accessToken)    │                        │
  │                            │◀── 401 Unauthorized ──│
  │                            │                        │
  │   isRefreshing = true      │                        │
  │                            │── POST /auth/refresh ─▶│
  │                            │   { refreshToken }     │
  │                            │                        │── validateToken()
  │                            │◀── { accessToken } ───│
  │                            │                        │
  │   store new accessToken    │                        │
  │   retry original request   │                        │
  │                            │── GET /api/orders ────▶│
  │◀── 200 { orders } ────────────────────────────────│
```

---

## Role-Based Access Control

```
Request → JwtAuthFilter → SecurityContextHolder
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
              ROLE_USER    ROLE_VENDOR    ROLE_ADMIN
                    │             │             │
              /api/cart     /api/vendor   /api/admin
              /api/orders   /api/products /api/vendors
              /api/wishlist /api/orders   (all routes)
              /api/profile  (own data)
```

---

## Security Config Endpoints

| Pattern              | Method | Auth Required | Roles         |
|----------------------|--------|---------------|---------------|
| `/api/auth/**`       | POST   | ❌ Public     | —             |
| `/api/products/**`   | GET    | ❌ Public     | —             |
| `/api/categories/**` | GET    | ❌ Public     | —             |
| `/api/cart/**`       | ALL    | ✅ JWT        | USER+         |
| `/api/wishlist/**`   | ALL    | ✅ JWT        | USER+         |
| `/api/orders/**`     | ALL    | ✅ JWT        | USER+         |
| `/api/vendor/**`     | ALL    | ✅ JWT        | VENDOR, ADMIN |
| `/api/admin/**`      | ALL    | ✅ JWT        | ADMIN only    |

---

## Token Payload Example

```json
{
  "sub": "alex@shopeasy.com",
  "roles": "ROLE_ADMIN",
  "type": "access",
  "iat": 1705315200,
  "exp": 1705316100
}
```

---

## Security Best Practices Implemented

- ✅ Passwords hashed with BCrypt (cost factor 12)
- ✅ Short-lived access tokens (15 min)
- ✅ Refresh token rotation on use
- ✅ Stateless — no server-side session storage
- ✅ JWT secret stored only in environment variable
- ✅ CORS restricted to known origins
- ✅ CSRF disabled (stateless JWT, not cookie-based)
- ✅ Method-level security with `@PreAuthorize`
- ✅ Global exception handler for auth errors
- ✅ Failed login attempts not revealing whether email exists
