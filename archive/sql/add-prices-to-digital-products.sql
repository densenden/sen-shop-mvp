-- First, create price sets for digital product variants
WITH digital_variants AS (
  SELECT 
    pv.id as variant_id,
    p.title as product_title
  FROM product p
  JOIN product_variant pv ON p.id = pv.product_id
  WHERE p.metadata::text LIKE '%digital_download%'
    AND p.status = 'published'
),
new_price_sets AS (
  INSERT INTO price_set (id)
  SELECT 'pset_' || substr(md5(random()::text), 1, 26)
  FROM digital_variants
  RETURNING id
),
price_set_mapping AS (
  SELECT 
    dv.variant_id,
    ps.id as price_set_id,
    ROW_NUMBER() OVER () as rn
  FROM digital_variants dv
  CROSS JOIN (SELECT id, ROW_NUMBER() OVER () as rn FROM new_price_sets) ps
  WHERE dv.variant_id IS NOT NULL
)
-- Link variants to price sets
INSERT INTO product_variant_price_set (variant_id, price_set_id)
SELECT variant_id, price_set_id
FROM price_set_mapping
ON CONFLICT (variant_id) DO NOTHING;

-- Now add EUR prices for all digital product variants
WITH variant_price_sets AS (
  SELECT 
    pv.id as variant_id,
    pvps.price_set_id,
    p.title as product_title,
    pv.title as variant_title
  FROM product p
  JOIN product_variant pv ON p.id = pv.product_id
  JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
  WHERE p.metadata::text LIKE '%digital_download%'
    AND p.status = 'published'
)
INSERT INTO price (
  id,
  currency_code,
  amount,
  price_set_id,
  min_quantity,
  max_quantity
)
SELECT 
  'price_' || substr(md5(random()::text || variant_id), 1, 26),
  'eur',
  CASE 
    WHEN product_title LIKE '%Premium%' THEN 4999  -- €49.99 for premium
    WHEN product_title LIKE '%Bundle%' THEN 3999   -- €39.99 for bundles
    WHEN product_title LIKE '%Pack%' THEN 2999     -- €29.99 for packs
    ELSE 1999  -- €19.99 default
  END,
  price_set_id,
  1,
  NULL
FROM variant_price_sets
ON CONFLICT DO NOTHING;