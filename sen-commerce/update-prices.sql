-- Update prices for all products that don't have prices yet
-- This gives realistic prices between $5-$100

-- First, let's see what we have
SELECT p.id, p.title, pv.id as variant_id, pv.price_set_id 
FROM product p 
JOIN product_variant pv ON p.id = pv.product_id;

-- Update price sets with random realistic prices
-- Note: Prices are stored in cents, so $5.00 = 500 cents

-- Set some common POD prices for products
UPDATE price_set ps
SET updated_at = NOW()
WHERE ps.id IN (
  SELECT DISTINCT pv.price_set_id 
  FROM product_variant pv 
  JOIN product p ON p.id = pv.product_id
  WHERE NOT EXISTS (
    SELECT 1 FROM price pr WHERE pr.price_set_id = ps.id
  )
);

-- Insert prices for products that don't have any
INSERT INTO price (id, price_set_id, amount, currency_code, created_at, updated_at)
SELECT 
  'price_' || SUBSTR(MD5(RANDOM()::text), 1, 26) as id,
  pv.price_set_id,
  CASE 
    WHEN RANDOM() < 0.2 THEN 500 + FLOOR(RANDOM() * 1000)::int  -- $5-15 (digital downloads)
    WHEN RANDOM() < 0.5 THEN 1500 + FLOOR(RANDOM() * 1000)::int -- $15-25 (small prints)
    WHEN RANDOM() < 0.8 THEN 2500 + FLOOR(RANDOM() * 2000)::int -- $25-45 (medium prints)
    ELSE 4500 + FLOOR(RANDOM() * 5500)::int                     -- $45-100 (large/premium)
  END as amount,
  'usd' as currency_code,
  NOW() as created_at,
  NOW() as updated_at
FROM product_variant pv
JOIN product p ON p.id = pv.product_id
WHERE NOT EXISTS (
  SELECT 1 FROM price pr WHERE pr.price_set_id = pv.price_set_id
);

-- Let's also ensure our digital products have reasonable prices
UPDATE price 
SET amount = 500 + FLOOR(RANDOM() * 2000)::int  -- $5-25 for digital
WHERE price_set_id IN (
  SELECT pv.price_set_id 
  FROM product_variant pv 
  JOIN product p ON p.id = pv.product_id
  WHERE p.metadata->>'fulfillment_type' = 'digital'
)
AND amount = 0;

-- And POD products get higher prices
UPDATE price 
SET amount = 1500 + FLOOR(RANDOM() * 3500)::int  -- $15-50 for POD
WHERE price_set_id IN (
  SELECT pv.price_set_id 
  FROM product_variant pv 
  JOIN product p ON p.id = pv.product_id
  WHERE p.metadata->>'fulfillment_type' = 'printful_pod'
)
AND (amount = 0 OR amount IS NULL);