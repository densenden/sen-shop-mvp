-- Create a test order with digital downloads for your email

-- First, let's create a test order
INSERT INTO "order" (
  id,
  display_id,
  version,
  status,
  email,
  customer_id,
  sales_channel_id,
  currency_code,
  total,
  subtotal,
  tax_total,
  shipping_total,
  created_at,
  updated_at
) VALUES (
  'order_digital_test_' || substr(md5(random()::text), 1, 20),
  999999,
  1,
  'completed',
  'discord@deniskreuzer.dk',
  NULL,
  'sc_01HSJR9YGQ1E3NCPGG7WN6S5Y1',
  'eur',
  1999,  -- €19.99
  1999,
  0,
  0,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Get the order ID we just created
WITH new_order AS (
  SELECT id FROM "order" 
  WHERE email = 'discord@deniskreuzer.dk' 
  AND display_id = 999999 
  LIMIT 1
),
-- Create order line item for digital product
new_line_item AS (
  INSERT INTO order_line_item (
    id,
    title,
    thumbnail,
    variant_id,
    product_id,
    product_title,
    product_description,
    product_handle,
    variant_title,
    unit_price,
    raw_unit_price,
    metadata
  )
  SELECT 
    'oli_digital_test_' || substr(md5(random()::text), 1, 20),
    'Digital Art Download - Print Resolution',
    'https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/test-artwork.jpg',
    'variant_01K1JA8M5X6P2EVZQW14TTG17W',
    'prod_01K1JA8M5X255SZFTXRSECEGEJ',
    'Digital Art Download',
    'High-resolution digital artwork for print',
    'digital-art-download',
    'Print Resolution (300 DPI)',
    1999,
    '{"value": "19.99", "precision": 20}',
    '{"fulfillment_type": "digital_download", "digital_product_id": "01JZ5BBTGPMZFHV6H18F9ZQN9Q", "digital_download_url": "https://vewahhcqqozacsodvhlb.supabase.co/storage/v1/object/public/artworks/test-artwork.jpg"}'::jsonb
  FROM new_order
  RETURNING id
),
-- Create order item linking
new_order_item AS (
  INSERT INTO order_item (
    id,
    order_id,
    version,
    item_id,
    quantity,
    raw_quantity,
    fulfilled_quantity,
    raw_fulfilled_quantity,
    shipped_quantity,
    raw_shipped_quantity,
    return_requested_quantity,
    raw_return_requested_quantity,
    return_received_quantity,
    raw_return_received_quantity,
    return_dismissed_quantity,
    raw_return_dismissed_quantity,
    written_off_quantity,
    raw_written_off_quantity
  )
  SELECT 
    'oi_digital_test_' || substr(md5(random()::text), 1, 20),
    no.id,
    1,
    nli.id,
    1,
    '{"value": "1", "precision": 20}',
    0,
    '{"value": "0", "precision": 20}',
    0,
    '{"value": "0", "precision": 20}',
    0,
    '{"value": "0", "precision": 20}',
    0,
    '{"value": "0", "precision": 20}',
    0,
    '{"value": "0", "precision": 20}',
    0,
    '{"value": "0", "precision": 20}'
  FROM new_order no
  CROSS JOIN new_line_item nli
  RETURNING id
)
-- Show what we created
SELECT 
  o.id as order_id,
  o.display_id,
  oli.title as item_title,
  oli.metadata->>'fulfillment_type' as fulfillment_type
FROM new_order no
JOIN "order" o ON no.id = o.id
JOIN order_item oi ON o.id = oi.order_id
JOIN order_line_item oli ON oi.item_id = oli.id;