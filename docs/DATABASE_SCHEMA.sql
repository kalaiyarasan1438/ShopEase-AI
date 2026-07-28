-- ═══════════════════════════════════════════════════════════════
--  ShopEasy — PostgreSQL Database Schema
--  Version: 1.0.0
-- ═══════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fast LIKE/ILIKE search

-- ── Roles ─────────────────────────────────────────────────────────────────────
CREATE TABLE roles (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL  -- ROLE_USER | ROLE_VENDOR | ROLE_ADMIN
);
INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_VENDOR'), ('ROLE_ADMIN');

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id           BIGSERIAL PRIMARY KEY,
    first_name   VARCHAR(50)  NOT NULL,
    last_name    VARCHAR(50)  NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    phone        VARCHAR(20),
    avatar_url   TEXT,
    enabled      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users (email);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles (id),
    PRIMARY KEY (user_id, role_id)
);

-- ── Categories ────────────────────────────────────────────────────────────────
CREATE TABLE categories (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    slug       VARCHAR(120) UNIQUE NOT NULL,
    image_url  TEXT,
    parent_id  BIGINT REFERENCES categories (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ── Vendors ───────────────────────────────────────────────────────────────────
CREATE TABLE vendors (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT       NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    business_name VARCHAR(150) NOT NULL,
    gst_number    VARCHAR(50),
    address       TEXT,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING | ACTIVE | SUSPENDED
    rating_avg    DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    total_sales   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ── Products ──────────────────────────────────────────────────────────────────
CREATE TABLE products (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    price        DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    old_price    DECIMAL(10,2),
    stock_qty    INT          NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    category_id  BIGINT       REFERENCES categories (id) ON DELETE SET NULL,
    vendor_id    BIGINT       REFERENCES vendors (id) ON DELETE SET NULL,
    badge        VARCHAR(50),           -- "Best Seller" | "New" | "Hot Deal"
    rating_avg   DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    rating_count INT          NOT NULL DEFAULT 0,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_category  ON products (category_id);
CREATE INDEX idx_products_vendor    ON products (vendor_id);
CREATE INDEX idx_products_active    ON products (is_active);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

CREATE TABLE product_images (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    image_url  TEXT   NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT     NOT NULL DEFAULT 0
);

-- ── Carts ─────────────────────────────────────────────────────────────────────
CREATE TABLE carts (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cart_items (
    id           BIGSERIAL PRIMARY KEY,
    cart_id      BIGINT        NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
    product_id   BIGINT        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity     INT           NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_at_add DECIMAL(10,2) NOT NULL,
    UNIQUE (cart_id, product_id)
);

-- ── Wishlists ─────────────────────────────────────────────────────────────────
CREATE TABLE wishlists (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    added_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

-- ── Orders ────────────────────────────────────────────────────────────────────
CREATE TABLE orders (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              BIGINT        NOT NULL REFERENCES users (id),
    status               VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    total_amount         DECIMAL(12,2) NOT NULL,
    shipping_amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping_name        VARCHAR(100),
    shipping_address_line1 VARCHAR(200),
    shipping_address_line2 VARCHAR(200),
    shipping_city        VARCHAR(100),
    shipping_state       VARCHAR(100),
    shipping_zip         VARCHAR(20),
    shipping_country     VARCHAR(100),
    payment_method       VARCHAR(20),
    payment_status       VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    tracking_number      VARCHAR(100),
    notes                TEXT,
    created_at           TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP
);
CREATE INDEX idx_orders_user   ON orders (user_id);
CREATE INDEX idx_orders_status ON orders (status);

CREATE TABLE order_items (
    id         BIGSERIAL PRIMARY KEY,
    order_id   BIGINT        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id BIGINT        NOT NULL REFERENCES products (id),
    vendor_id  BIGINT        REFERENCES vendors (id),
    quantity   INT           NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal   DECIMAL(12,2) NOT NULL
);

-- ── Reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title       VARCHAR(200),
    body        TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, user_id)    -- one review per product per user
);
CREATE INDEX idx_reviews_product ON reviews (product_id);

-- ── Payments ──────────────────────────────────────────────────────────────────
CREATE TABLE payments (
    id             BIGSERIAL PRIMARY KEY,
    order_id       BIGINT        NOT NULL REFERENCES orders (id),
    amount         DECIMAL(12,2) NOT NULL,
    gateway        VARCHAR(50),          -- stripe | razorpay | paypal
    transaction_id VARCHAR(200),
    status         VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── Trigger: update product rating on review insert/update ───────────────────
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products SET
        rating_avg   = (SELECT AVG(rating)   FROM reviews WHERE product_id = NEW.product_id),
        rating_count = (SELECT COUNT(*)       FROM reviews WHERE product_id = NEW.product_id),
        updated_at   = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_product_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ── Seed data ─────────────────────────────────────────────────────────────────
INSERT INTO categories (name, slug) VALUES
    ('Electronics', 'electronics'),
    ('Furniture',   'furniture'),
    ('Sports',      'sports'),
    ('Kitchen',     'kitchen'),
    ('Lifestyle',   'lifestyle'),
    ('Health',      'health');
