# ShopEasy — Complete Full-Stack Setup & Deployment Guide

Welcome to the **ShopEasy** setup guide! ShopEasy is a premium, production-ready, AI-powered multi-vendor e-commerce platform. It features a modern React SPA frontend, a robust Spring Boot REST API backend with Spring Security (JWT authentication), and a high-performance FastAPI AI service for smart search, recommendations, and chatbots.

---

## 📂 Project Directory Structure

```text
shopeasy/
├── backend/                       # ☕ Spring Boot REST Backend
│   ├── src/main/java/com/shopeasy/
│   │   ├── config/                # App Configurations (Cors, Security, DataSourceConfig, DataSeeder)
│   │   ├── controller/            # REST API endpoints (Auth, Products, Cart, Orders, Admin, etc.)
│   │   ├── dto/                   # Data Transfer Objects (Requests & Responses)
│   │   ├── entity/                # JPA Database Entities (User, Role, Product, Category, Vendor, etc.)
│   │   ├── exception/             # Global Exception Handling
│   │   ├── repository/            # Spring Data JPA Repository Interfaces
│   │   ├── security/              # JWT Filters, token providers, user details
│   │   └── service/               # Business Logic interfaces & implementations
│   ├── src/main/resources/
│   │   └── application.yml        # Configurations & database connection settings
│   ├── pom.xml                    # Maven Dependency Manifest
│   └── Procfile                   # Cloud process execution descriptor
│
├── frontend/                      # ⚛️ React (Vite + Tailwind CSS + Redux Toolkit)
│   ├── src/
│   │   ├── components/            # Reusable UI widgets (Auth layouts, product cards, AI chatbot, common)
│   │   ├── pages/                 # Full app screens (Home, Login, AdminDashboard, Checkout, Wishlist, etc.)
│   │   ├── services/              # Axios API clients (auth, products, cart, AI)
│   │   ├── store/                 # Redux Toolkit State Store & Slices
│   │   ├── styles/                # CSS styling and Tailwind integrations
│   │   └── utils/                 # Form validators, currency formatters, constants
│   ├── package.json               # Node.js dependencies & run scripts
│   ├── tailwind.config.js         # Styling theme adjustments
│   ├── vite.config.js             # Bundling & Proxy config (Vite aliases `@store`, `@components`)
│   └── vercel.json                # Vercel deployment and SPA routing rules
│
├── ai-service/                    # 🤖 FastAPI AI Microservice
│   ├── routers/                   # Router declarations (chat, recommendations, search)
│   ├── services/                  # AI recommendation engine, TF-IDF smart search
│   ├── main.py                    # Service entrypoint
│   └── requirements.txt           # Python dependencies
```

---

## 🏗️ Part 1: Local Development Setup

To run ShopEasy locally, you will start the three components in order: Database, Backend, AI Service, and Frontend.

### 1. Database Setup
ShopEasy requires a **PostgreSQL** database.
- **Local PostgreSQL**:
  1. Create a database named `shopeasy` on your local instance.
  2. Ensure your PG server is active on `localhost:5432` with username `postgres` and password `password`.
- **Neon Cloud PostgreSQL** (Recommended):
  1. Create a free database at [Neon.tech](https://neon.tech).
  2. Keep your single connection string (`postgres://...`) handy as `DATABASE_URL`.

### 2. Backend Setup (Spring Boot)
Ensure you have **Java JDK 17** installed.
1. Open a terminal inside the `/backend` folder.
2. Build the project using Maven:
   ```bash
   mvn clean package -DskipTests
   ```
3. Run the application:
   ```bash
   java -jar target/shopeasy-backend-1.0.0.jar
   ```
   *Note: On startup, Spring JPA will automatically map the entity schemas into database tables. The `DataSeeder` will then initialize the roles and insert the default demo users, categories, and products!*

#### Backend Environment Variables (Optional fallbacks in `application.yml`):
- `PORT`: Server port (defaults to `8080`)
- `DATABASE_URL`: Full Neon PostgreSQL connection string (automatically parsed to support JDBC and SSL)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`: Individual fallbacks if `DATABASE_URL` is omitted
- `JWT_SECRET`: Random 256-bit key for JWT signing
- `ALLOWED_ORIGINS`: Comma-separated list of permitted frontend CORS origins

---

### 3. AI Service Setup (FastAPI Python)
Ensure you have **Python 3.9+** installed.
1. Open a terminal inside the `/ai-service` folder.
2. Create and activate a virtual environment:
   ```bash
   # On Windows
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI microservice:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   *Access API documentation at: `http://localhost:8000/docs`*

---

### 4. Frontend Setup (React SPA)
Ensure you have **Node.js (v18+)** installed.
1. Open a terminal inside the `/frontend` folder.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Copy `.env.example` into a local configuration file:
   ```bash
   cp .env.example .env.local
   ```
4. Start the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```
   *Open your browser to `http://localhost:5173` to explore the gorgeous UI!*

---

## 👥 Demo User Credentials

The database seeder automatically initializes the following accounts:

| Role | Email | Password | Permissions / Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@shopeasy.in` | `Admin@123` | Full dashboard access, category creation, analytics tracking. |
| **Vendor** | `vendor@gmail.com` | `Vendor@123` | Manage products, track active sales metrics, review orders. |
| **Customer** | Register via `/register` with any `@gmail.com` | Custom | Regular shopping, profile updates, add to cart/wishlist, checkout. |

> **Email Policy (enforced since v1.1):**
> - **Admin:** Only `admin@shopeasy.in` is permitted to log in.
> - **Vendor & Customer:** Only `@gmail.com` addresses are accepted for registration and login.

---

## 🚀 Part 2: Production Deployment Guide

ShopEasy is designed to be fully cloud-ready and deployable on free-tier services.

### 1. Database (Neon Serverless PostgreSQL)
1. In your [Neon Dashboard](https://neon.tech), create a new project and select **PostgreSQL 16**.
2. Under "Connection Details", select the **Transaction Pooled** or **Direct** connection string in URI format.
3. Make sure to copy the `postgresql://` connection string.

### 2. Backend (Render / Railway)
1. Connect your GitHub repository to **Render** or **Railway**.
2. Create a new Web Service pointing to the `backend/` root path.
3. **Build Command**: `mvn clean package -DskipTests`
4. **Start Command**: `java -jar target/shopeasy-backend-1.0.0.jar` (Railway/Render automatically reads the `Procfile` and binds this command).
5. **Environment Variables**:
   - `DATABASE_URL`: *Your Neon connection string* (Our programmatic `DataSourceConfig` will parse and append `sslmode=require` dynamically!).
   - `JWT_SECRET`: *A secure random string (at least 32 characters)*.
   - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app` *(Change to your deployed Vercel URL)*.
   - `PORT`: Automatically set by the hosting platform (defaults to `8080`).

### 3. AI Service (Render / Railway)
1. Create a new Web Service pointing to the `ai-service/` path.
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT` (Read from `Procfile`).
4. **Environment Variables**:
   - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app,http://localhost:5173`.

### 4. Frontend (Vercel)
1. Connect your GitHub repository to **Vercel**.
2. Add a new project and select the `frontend/` directory.
3. Framework Preset: **Vite**
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend.onrender.com` *(Point to your Spring Boot backend deployment URL without trailing slash)*.
   - `VITE_AI_API_URL`: `https://your-ai-service.onrender.com` *(Point to your FastAPI service deployment URL without trailing slash)*.
7. Vercel automatically deploys the frontend and reads `vercel.json` to configure rewrite rules, avoiding 404s on page refresh.

---

## 🌟 Key Architectural & Scalability Highlights (Interview Prep)

If presenting this project in a software engineering interview, highlight the following:

1. **Programmatic Neon Connection Parser**: Instead of hardcoding static JDBC strings, the custom `DataSourceConfig` takes standard PostgreSQL URIs, parses credentials, maps host and port details, and automatically forces **SSL Modes (`sslmode=require`)**, making cloud serverless database integration effortless.
2. **Clean Scalable Spring Architecture**: Strict separation of concerns is maintained via controllers mapping REST endpoints, service layers handling transaction borders, repositories interacting with JPA, and DTOs mapping database models securely (mitigating object exposure vulnerabilities).
3. **Silent Access Token Refresh**: The React frontend uses custom Axios interceptors. When a request returns a `401 Unauthorized` error (e.g. access token expired), the interceptor locks the request queue, fires a silent request to `/api/auth/refresh` using the stored secure refresh token, updates LocalStorage with the fresh access token, and continues original failed requests seamlessly.
4. **Framer Motion Micro-Animations & Elegant Styling**: Fully customized CSS system combined with React's Framer Motion delivers premium micro-interactions, responsive side-drawers, loading skeletons, and custom glassmorphic aesthetics.
