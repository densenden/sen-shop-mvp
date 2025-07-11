-- Create a publishable API key for the storefront
INSERT INTO publishable_api_key (id, title, created_at, updated_at) 
VALUES (
  'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0',
  'Storefront API Key',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create a sales channel and associate it with the API key
INSERT INTO sales_channel (id, name, description, is_default, created_at, updated_at)
VALUES (
  'sc_default',
  'Default Sales Channel', 
  'Default sales channel for the storefront',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Link the API key to the sales channel
INSERT INTO publishable_api_key_sales_channel (publishable_api_key_id, sales_channel_id)
VALUES (
  'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0',
  'sc_default'
) ON CONFLICT DO NOTHING;