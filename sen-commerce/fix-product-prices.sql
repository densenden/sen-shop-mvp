-- Fix product prices by creating proper price sets and linking them to variants

-- First, let's see what products and variants we have
SELECT p.id, p.title, pv.id as variant_id, pvps.price_set_id
FROM product p
JOIN product_variant pv ON p.id = pv.product_id
LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
LIMIT 10;

-- Create price sets for variants that don't have them
INSERT INTO price_set (id, created_at, updated_at)
SELECT 
  'ps_' || SUBSTR(MD5(RANDOM()::text), 1, 26) as id,
  NOW() as created_at,
  NOW() as updated_at
FROM product_variant pv
WHERE NOT EXISTS (
  SELECT 1 FROM product_variant_price_set pvps WHERE pvps.variant_id = pv.id
);

-- Link price sets to variants
INSERT INTO product_variant_price_set (variant_id, price_set_id, id, created_at, updated_at)
SELECT 
  pv.id as variant_id,
  ps.id as price_set_id,
  'pvps_' || SUBSTR(MD5(RANDOM()::text), 1, 26) as id,
  NOW() as created_at,
  NOW() as updated_at
FROM product_variant pv
CROSS JOIN LATERAL (
  SELECT id FROM price_set 
  WHERE NOT EXISTS (
    SELECT 1 FROM product_variant_price_set pvps2 WHERE pvps2.price_set_id = price_set.id
  )
  LIMIT 1
) ps
WHERE NOT EXISTS (
  SELECT 1 FROM product_variant_price_set pvps WHERE pvps.variant_id = pv.id
);

-- Insert prices for all price sets that don't have them
INSERT INTO price (id, price_set_id, amount, currency_code, created_at, updated_at)
SELECT 
  'price_' || SUBSTR(MD5(RANDOM()::text), 1, 26) as id,
  pvps.price_set_id,
  CASE 
    WHEN p.metadata->>'fulfillment_type' = 'digital_download' THEN 500 + FLOOR(RANDOM() * 2000)::int  -- $5-25 for digital
    WHEN p.metadata->>'fulfillment_type' = 'printful_pod' THEN 1500 + FLOOR(RANDOM() * 3500)::int  -- $15-50 for POD
    WHEN p.metadata->>'source_provider' = 'printful' THEN 1500 + FLOOR(RANDOM() * 3500)::int -- $15-50 for Printful
    WHEN p.title ILIKE '%print%' THEN 2500 + FLOOR(RANDOM() * 2500)::int -- $25-50 for prints
    WHEN p.title ILIKE '%digital%' THEN 500 + FLOOR(RANDOM() * 1500)::int -- $5-20 for digital
    ELSE 1500 + FLOOR(RANDOM() * 3500)::int -- Default $15-50
  END as amount,
  'usd' as currency_code,
  NOW() as created_at,
  NOW() as updated_at
FROM product_variant_price_set pvps
JOIN product_variant pv ON pvps.variant_id = pv.id
JOIN product p ON p.id = pv.product_id
WHERE NOT EXISTS (
  SELECT 1 FROM price pr WHERE pr.price_set_id = pvps.price_set_id
);

-- Verify the results
SELECT 
  p.title,
  pv.title as variant_title,
  pr.amount,
  pr.currency_code
FROM product p
JOIN product_variant pv ON p.id = pv.product_id
JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
JOIN price pr ON pr.price_set_id = pvps.price_set_id
LIMIT 20;