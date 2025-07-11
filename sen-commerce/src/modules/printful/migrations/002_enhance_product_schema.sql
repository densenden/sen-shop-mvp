-- Enhanced product schema for better product management
-- This migration adds support for videos, multiple photos, and enhanced metadata

-- Add video and additional image support to printful_product table
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS additional_images TEXT[]; -- Array of image URLs
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS provider_type VARCHAR(50) DEFAULT 'printful';
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add SEO and marketing fields
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add pricing and inventory fields
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2);
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE printful_product ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_printful_product_artwork_id ON printful_product(artwork_id);
CREATE INDEX IF NOT EXISTS idx_printful_product_status ON printful_product(status);
CREATE INDEX IF NOT EXISTS idx_printful_product_provider_type ON printful_product(provider_type);
CREATE INDEX IF NOT EXISTS idx_printful_product_category ON printful_product(category);

-- Create product variants table for better variant management
CREATE TABLE IF NOT EXISTS printful_product_variant (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR REFERENCES printful_product(id) ON DELETE CASCADE,
    printful_variant_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50),
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    image_url TEXT,
    availability VARCHAR(50) DEFAULT 'available',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for variants
CREATE INDEX IF NOT EXISTS idx_printful_variant_product_id ON printful_product_variant(product_id);
CREATE INDEX IF NOT EXISTS idx_printful_variant_printful_id ON printful_product_variant(printful_variant_id);

-- Create product files table for managing design files
CREATE TABLE IF NOT EXISTS printful_product_file (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR REFERENCES printful_product(id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL, -- 'design', 'mockup', 'template', etc.
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    printful_file_id VARCHAR,
    placement VARCHAR(50), -- 'front', 'back', 'left', 'right', etc.
    is_primary BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for files
CREATE INDEX IF NOT EXISTS idx_printful_file_product_id ON printful_product_file(product_id);
CREATE INDEX IF NOT EXISTS idx_printful_file_type ON printful_product_file(file_type);
CREATE INDEX IF NOT EXISTS idx_printful_file_placement ON printful_product_file(placement);

-- Create product sync log table for tracking sync operations
CREATE TABLE IF NOT EXISTS printful_sync_log (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR REFERENCES printful_product(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'import', 'update', 'delete', etc.
    status VARCHAR(50) NOT NULL, -- 'pending', 'success', 'failed'
    provider_type VARCHAR(50) NOT NULL,
    error_message TEXT,
    sync_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create index for sync log
CREATE INDEX IF NOT EXISTS idx_printful_sync_product_id ON printful_sync_log(product_id);
CREATE INDEX IF NOT EXISTS idx_printful_sync_status ON printful_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_printful_sync_type ON printful_sync_log(sync_type);

-- Create order tracking table for fulfillment
CREATE TABLE IF NOT EXISTS printful_order_tracking (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    medusa_order_id VARCHAR NOT NULL,
    printful_order_id VARCHAR NOT NULL,
    provider_type VARCHAR(50) DEFAULT 'printful',
    status VARCHAR(50) NOT NULL,
    tracking_number VARCHAR(255),
    tracking_url TEXT,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    estimated_delivery TIMESTAMP,
    fulfillment_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for order tracking
CREATE INDEX IF NOT EXISTS idx_printful_order_medusa_id ON printful_order_tracking(medusa_order_id);
CREATE INDEX IF NOT EXISTS idx_printful_order_printful_id ON printful_order_tracking(printful_order_id);
CREATE INDEX IF NOT EXISTS idx_printful_order_status ON printful_order_tracking(status);

-- Create webhook events table for debugging
CREATE TABLE IF NOT EXISTS printful_webhook_events (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_type VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    signature VARCHAR(255),
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for webhook events
CREATE INDEX IF NOT EXISTS idx_printful_webhook_type ON printful_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_printful_webhook_processed ON printful_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_printful_webhook_created ON printful_webhook_events(created_at);

-- Update triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
CREATE TRIGGER update_printful_product_updated_at BEFORE UPDATE ON printful_product FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_printful_variant_updated_at BEFORE UPDATE ON printful_product_variant FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_printful_file_updated_at BEFORE UPDATE ON printful_product_file FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_printful_order_updated_at BEFORE UPDATE ON printful_order_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();