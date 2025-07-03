CREATE TABLE IF NOT EXISTS printful_product (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id VARCHAR,
    printful_product_id VARCHAR,
    name VARCHAR NOT NULL,
    thumbnail_url VARCHAR,
    price NUMERIC
); 