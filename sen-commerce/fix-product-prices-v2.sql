-- Fix product prices by creating proper price sets and linking them to variants

-- Create price sets for variants that don't have them
INSERT INTO price_set (id, created_at, updated_at)
SELECT 
  'ps_' || SUBSTR(MD5(RANDOM()::text || pv.id), 1, 26) as id,
  NOW() as created_at,
  NOW() as updated_at
FROM product_variant pv
WHERE NOT EXISTS (
  SELECT 1 FROM product_variant_price_set pvps WHERE pvps.variant_id = pv.id
);

-- Link price sets to variants that don't have them
WITH new_price_sets AS (
  SELECT 
    pv.id as variant_id,
    'ps_' || SUBSTR(MD5(RANDOM()::text || pv.id || '2'), 1, 26) as price_set_id,
    'pvps_' || SUBSTR(MD5(RANDOM()::text || pv.id || '3'), 1, 26) as id
  FROM product_variant pv
  WHERE NOT EXISTS (
    SELECT 1 FROM product_variant_price_set pvps WHERE pvps.variant_id = pv.id
  )
)
INSERT INTO product_variant_price_set (variant_id, price_set_id, id, created_at, updated_at)
SELECT 
  variant_id,
  price_set_id,
  id,
  NOW() as created_at,
  NOW() as updated_at
FROM new_price_sets;

-- Insert prices for all price sets that don't have them
INSERT INTO price (id, price_set_id, amount, raw_amount, currency_code, created_at, updated_at)
SELECT 
  'price_' || SUBSTR(MD5(RANDOM()::text || pvps.price_set_id), 1, 26) as id,
  pvps.price_set_id,
  CASE 
    WHEN p.metadata->>'fulfillment_type' = 'digital_download' THEN 500 + FLOOR(RANDOM() * 2000)::int  -- $5-25 for digital
    WHEN p.metadata->>'fulfillment_type' = 'printful_pod' THEN 1500 + FLOOR(RANDOM() * 3500)::int  -- $15-50 for POD
    WHEN p.metadata->>'source_provider' = 'printful' THEN 1500 + FLOOR(RANDOM() * 3500)::int -- $15-50 for Printful
    WHEN p.title ILIKE '%print%' THEN 2500 + FLOOR(RANDOM() * 2500)::int -- $25-50 for prints
    WHEN p.title ILIKE '%digital%' THEN 500 + FLOOR(RANDOM() * 1500)::int -- $5-20 for digital
    WHEN p.title ILIKE '%t-shirt%' THEN 2000 + FLOOR(RANDOM() * 1500)::int -- $20-35 for t-shirts
    WHEN p.title ILIKE '%hoodie%' OR p.title ILIKE '%sweatshirt%' THEN 3500 + FLOOR(RANDOM() * 2500)::int -- $35-60 for hoodies
    WHEN p.title ILIKE '%art%' THEN 1000 + FLOOR(RANDOM() * 4000)::int -- $10-50 for art
    ELSE 1500 + FLOOR(RANDOM() * 3500)::int -- Default $15-50
  END as amount,
  CASE 
    WHEN p.metadata->>'fulfillment_type' = 'digital_download' THEN 
      ('{"value": "' || (500 + FLOOR(RANDOM() * 2000)::int)::text || '", "precision": 2}')::jsonb
    WHEN p.metadata->>'fulfillment_type' = 'printful_pod' THEN 
      ('{"value": "' || (1500 + FLOOR(RANDOM() * 3500)::int)::text || '", "precision": 2}')::jsonb
    WHEN p.metadata->>'source_provider' = 'printful' THEN 
      ('{"value": "' || (1500 + FLOOR(RANDOM() * 3500)::int)::text || '", "precision": 2}')::jsonb
    WHEN p.title ILIKE '%print%' THEN 
      ('{"value": "' || (2500 + FLOOR(RANDOM() * 2500)::int)::text || '", "precision": 2}')::jsonb
    WHEN p.title ILIKE '%digital%' THEN 
      ('{"value": "' || (500 + FLOOR(RANDOM() * 1500)::int)::text || '", "precision": 2}')::jsonb
    WHEN p.title ILIKE '%t-shirt%' THEN 
      ('{"value": "' || (2000 + FLOOR(RANDOM() * 1500)::int)::text || '", "precision": 2}')::jsonb
    WHEN p.title ILIKE '%hoodie%' OR p.title ILIKE '%sweatshirt%' THEN 
      ('{"value": "' || (3500 + FLOOR(RANDOM() * 2500)::int)::text || '", "precision": 2}')::jsonb
    WHEN p.title ILIKE '%art%' THEN 
      ('{"value": "' || (1000 + FLOOR(RANDOM() * 4000)::int)::text || '", "precision": 2}')::jsonb
    ELSE 
      ('{"value": "' || (1500 + FLOOR(RANDOM() * 3500)::int)::text || '", "precision": 2}')::jsonb
  END as raw_amount,
  'usd' as currency_code,
  NOW() as created_at,
  NOW() as updated_at
FROM product_variant_price_set pvps
JOIN product_variant pv ON pvps.variant_id = pv.id
JOIN product p ON p.id = pv.product_id
WHERE NOT EXISTS (
  SELECT 1 FROM price pr WHERE pr.price_set_id = pvps.price_set_id AND pr.currency_code = 'usd'
);

-- Verify the results
SELECT 
  p.title,
  pv.title as variant_title,
  pr.amount,
  pr.currency_code,
  p.metadata->>'fulfillment_type' as fulfillment_type
FROM product p
JOIN product_variant pv ON p.id = pv.product_id
JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
JOIN price pr ON pr.price_set_id = pvps.price_set_id
WHERE pr.currency_code = 'usd'
ORDER BY p.created_at DESC
LIMIT 20;