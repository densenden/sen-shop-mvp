-- Create a simple test order with digital download

-- Create the order first
INSERT INTO "order" (
  id,
  version,
  status,
  email,
  currency_code
) VALUES (
  'order_digital_test_999999',
  1,
  'completed',
  'discord@deniskreuzer.dk',
  'eur'
) ON CONFLICT (id) DO NOTHING;

-- Create order line item for digital product
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
) VALUES (
  'oli_digital_test_999999',
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
) ON CONFLICT (id) DO NOTHING;

-- Create order item linking
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
) VALUES (
  'oi_digital_test_999999',
  'order_digital_test_999999',
  1,
  'oli_digital_test_999999',
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
) ON CONFLICT (id) DO NOTHING;

-- Show what we created
SELECT 
  o.id as order_id,
  o.display_id,
  o.email,
  oli.title as item_title,
  oli.metadata->>'fulfillment_type' as fulfillment_type
FROM "order" o
JOIN order_item oi ON o.id = oi.order_id
JOIN order_line_item oli ON oi.item_id = oli.id
WHERE o.id = 'order_digital_test_999999';