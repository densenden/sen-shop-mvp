-- First check which variants don't have price sets
SELECT 
  pv.id as variant_id,
  p.title as product_title,
  pv.title as variant_title
FROM product p
JOIN product_variant pv ON p.id = pv.product_id
LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
WHERE p.metadata::text LIKE '%digital_download%'
  AND p.status = 'published'
  AND pvps.variant_id IS NULL;

-- Create a single price set for testing
INSERT INTO price_set (id)
VALUES ('pset_digital_2025_test')
ON CONFLICT (id) DO NOTHING;

-- Link first digital variant to this price set
INSERT INTO product_variant_price_set (variant_id, price_set_id)
SELECT 
  pv.id,
  'pset_digital_2025_test'
FROM product p
JOIN product_variant pv ON p.id = pv.product_id
LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
WHERE p.metadata::text LIKE '%digital_download%'
  AND p.status = 'published'
  AND pvps.variant_id IS NULL
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add a price for this price set
INSERT INTO price (
  id,
  currency_code,
  amount,
  raw_amount,
  price_set_id,
  min_quantity,
  max_quantity,
  created_at,
  updated_at
)
VALUES (
  'price_digital_test_' || substr(md5(random()::text), 1, 20),
  'eur',
  1999,  -- €19.99
  '{"value": "19.99", "precision": 20}',
  'pset_digital_2025_test',
  1,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Show what we created
SELECT 
  p.title as product,
  pv.title as variant,
  pr.amount as price_cents,
  pr.currency_code
FROM product p
JOIN product_variant pv ON p.id = pv.product_id
JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
JOIN price pr ON pvps.price_set_id = pr.price_set_id
WHERE pvps.price_set_id = 'pset_digital_2025_test';