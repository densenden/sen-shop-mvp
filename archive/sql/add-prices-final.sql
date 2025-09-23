-- Add prices to all digital download products

-- First, add price sets and link them to variants
DO $$
DECLARE
  var_rec RECORD;
  price_set_id_new TEXT;
  price_id_new TEXT;
  link_id_new TEXT;
BEGIN
  FOR var_rec IN 
    SELECT 
      pv.id as variant_id,
      p.title as product_title,
      pv.title as variant_title
    FROM product p
    JOIN product_variant pv ON p.id = pv.product_id
    LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
    WHERE p.metadata::text LIKE '%digital_download%'
      AND p.status = 'published'
      AND pvps.variant_id IS NULL
  LOOP
    -- Generate IDs
    price_set_id_new := 'pset_' || substr(md5(random()::text || var_rec.variant_id), 1, 26);
    price_id_new := 'price_' || substr(md5(random()::text || var_rec.variant_id || '2'), 1, 26);
    link_id_new := 'pvps_' || substr(md5(random()::text || var_rec.variant_id || '3'), 1, 26);
    
    -- Create price set
    INSERT INTO price_set (id)
    VALUES (price_set_id_new)
    ON CONFLICT DO NOTHING;
    
    -- Link variant to price set
    INSERT INTO product_variant_price_set (id, variant_id, price_set_id)
    VALUES (link_id_new, var_rec.variant_id, price_set_id_new)
    ON CONFLICT DO NOTHING;
    
    -- Add price
    INSERT INTO price (
      id,
      currency_code,
      amount,
      raw_amount,
      price_set_id,
      min_quantity,
      max_quantity
    )
    VALUES (
      price_id_new,
      'eur',
      CASE 
        WHEN var_rec.product_title LIKE '%Premium%' THEN 4999  -- €49.99
        WHEN var_rec.product_title LIKE '%Bundle%' THEN 3999   -- €39.99
        WHEN var_rec.product_title LIKE '%Pack%' THEN 2999     -- €29.99
        ELSE 1999  -- €19.99
      END,
      '{"value": "19.99", "precision": 20}',
      price_set_id_new,
      1,
      NULL
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Added price for: % - %', var_rec.product_title, var_rec.variant_title;
  END LOOP;
END $$;

-- Verify the results
SELECT 
  p.title as product,
  pv.title as variant,
  pr.amount as price_cents,
  pr.currency_code
FROM product p
JOIN product_variant pv ON p.id = pv.product_id
JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
JOIN price pr ON pvps.price_set_id = pr.price_set_id
WHERE p.metadata::text LIKE '%digital_download%'
ORDER BY p.title;