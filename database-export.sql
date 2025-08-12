-- =====================================================
-- SenCommerce Database Schema Export
-- Generated for database migration/recreation
-- Compatible with PostgreSQL 13+
-- =====================================================

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS digital_product_download CASCADE;
DROP TABLE IF EXISTS printful_sync_log CASCADE;
DROP TABLE IF EXISTS printful_order_tracking CASCADE;
DROP TABLE IF EXISTS printful_product CASCADE;
DROP TABLE IF EXISTS artwork_product_relation CASCADE;
DROP TABLE IF EXISTS artwork CASCADE;
DROP TABLE IF EXISTS artwork_collection CASCADE;
DROP TABLE IF EXISTS digital_product CASCADE;

-- =====================================================
-- CUSTOM TABLES (SenCommerce Specific)
-- =====================================================

-- Artwork Collections Table
CREATE TABLE artwork_collection (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artworks Table  
CREATE TABLE artwork (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    image_url VARCHAR,
    collection_id VARCHAR REFERENCES artwork_collection(id) ON DELETE SET NULL,
    midjourney_version VARCHAR,
    tags TEXT[], -- PostgreSQL array for tags
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Digital Products Table (for downloadable content)
CREATE TABLE digital_product (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    file_url VARCHAR NOT NULL,
    file_size BIGINT, -- in bytes
    file_type VARCHAR,
    price DECIMAL(10,2) NOT NULL,
    download_limit INTEGER DEFAULT 5,
    expires_in_days INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Digital Product Downloads Table (tracking)
CREATE TABLE digital_product_download (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_product_id VARCHAR NOT NULL REFERENCES digital_product(id) ON DELETE CASCADE,
    customer_id VARCHAR, -- References medusa customer
    order_id VARCHAR, -- References medusa order
    token VARCHAR UNIQUE NOT NULL,
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Printful Products Table (POD integration)
CREATE TABLE printful_product (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    printful_id BIGINT UNIQUE NOT NULL,
    medusa_product_id VARCHAR, -- References medusa product
    sync_product_id BIGINT, -- Printful sync product ID
    external_id VARCHAR,
    name VARCHAR NOT NULL,
    synced BOOLEAN DEFAULT false,
    sync_status VARCHAR DEFAULT 'pending', -- pending, synced, failed
    printful_data JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Printful Order Tracking Table
CREATE TABLE printful_order_tracking (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    medusa_order_id VARCHAR NOT NULL,
    printful_order_id BIGINT,
    external_id VARCHAR,
    status VARCHAR DEFAULT 'draft', -- draft, pending, fulfilled, canceled, failed
    tracking_number VARCHAR,
    tracking_url VARCHAR,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    printful_data JSONB DEFAULT '{}',
    webhook_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Printful Sync Log Table (for debugging and monitoring)
CREATE TABLE printful_sync_log (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    operation VARCHAR NOT NULL, -- sync_products, create_order, webhook_received
    printful_id BIGINT,
    medusa_id VARCHAR,
    status VARCHAR NOT NULL, -- success, error, warning
    message TEXT,
    request_data JSONB,
    response_data JSONB,
    error_details JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artwork-Product Relations Table (many-to-many)
CREATE TABLE artwork_product_relation (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id VARCHAR NOT NULL REFERENCES artwork(id) ON DELETE CASCADE,
    product_id VARCHAR NOT NULL, -- References medusa product
    is_primary BOOLEAN DEFAULT false, -- one primary artwork per product
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combinations
    UNIQUE(artwork_id, product_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Artwork indexes
CREATE INDEX idx_artwork_collection_id ON artwork(collection_id);
CREATE INDEX idx_artwork_title ON artwork(title);
CREATE INDEX idx_artwork_created_at ON artwork(created_at);
CREATE INDEX idx_artwork_tags ON artwork USING GIN(tags);

-- Digital product indexes
CREATE INDEX idx_digital_product_active ON digital_product(is_active);
CREATE INDEX idx_digital_product_price ON digital_product(price);
CREATE INDEX idx_digital_product_created_at ON digital_product(created_at);

-- Digital download indexes
CREATE INDEX idx_digital_download_token ON digital_product_download(token);
CREATE INDEX idx_digital_download_customer ON digital_product_download(customer_id);
CREATE INDEX idx_digital_download_order ON digital_product_download(order_id);
CREATE INDEX idx_digital_download_expires ON digital_product_download(expires_at);
CREATE INDEX idx_digital_download_product ON digital_product_download(digital_product_id);

-- Printful indexes
CREATE INDEX idx_printful_product_printful_id ON printful_product(printful_id);
CREATE INDEX idx_printful_product_medusa_id ON printful_product(medusa_product_id);
CREATE INDEX idx_printful_product_sync_status ON printful_product(sync_status);
CREATE INDEX idx_printful_product_synced ON printful_product(synced);

-- Printful order tracking indexes
CREATE INDEX idx_printful_order_medusa_id ON printful_order_tracking(medusa_order_id);
CREATE INDEX idx_printful_order_printful_id ON printful_order_tracking(printful_order_id);
CREATE INDEX idx_printful_order_status ON printful_order_tracking(status);
CREATE INDEX idx_printful_order_tracking_number ON printful_order_tracking(tracking_number);

-- Printful sync log indexes
CREATE INDEX idx_printful_sync_operation ON printful_sync_log(operation);
CREATE INDEX idx_printful_sync_status ON printful_sync_log(status);
CREATE INDEX idx_printful_sync_created_at ON printful_sync_log(created_at);
CREATE INDEX idx_printful_sync_printful_id ON printful_sync_log(printful_id);

-- Artwork-product relation indexes
CREATE INDEX idx_artwork_product_artwork ON artwork_product_relation(artwork_id);
CREATE INDEX idx_artwork_product_product ON artwork_product_relation(product_id);
CREATE INDEX idx_artwork_product_primary ON artwork_product_relation(is_primary);

-- Collection indexes
CREATE INDEX idx_artwork_collection_public ON artwork_collection(is_public);
CREATE INDEX idx_artwork_collection_name ON artwork_collection(name);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_artwork_collection_updated_at BEFORE UPDATE ON artwork_collection FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artwork_updated_at BEFORE UPDATE ON artwork FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_digital_product_updated_at BEFORE UPDATE ON digital_product FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_digital_product_download_updated_at BEFORE UPDATE ON digital_product_download FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_printful_product_updated_at BEFORE UPDATE ON printful_product FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_printful_order_tracking_updated_at BEFORE UPDATE ON printful_order_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate secure download tokens
CREATE OR REPLACE FUNCTION generate_download_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired download tokens
CREATE OR REPLACE FUNCTION cleanup_expired_downloads()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM digital_product_download 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO printful_sync_log (operation, status, message)
    VALUES ('cleanup_expired_downloads', 'success', 'Deleted ' || deleted_count || ' expired download tokens');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (Optional - for development/testing)
-- =====================================================

-- Sample artwork collection
INSERT INTO artwork_collection (id, name, description, is_public) 
VALUES 
('coll_01H8QQ7RQZV7JQJ6QJ6QJ6QJ6Q', 'Abstract Digital Art', 'Collection of abstract digital artworks created with AI', true),
('coll_01H8QQ7RQZV7JQJ6QJ6QJ6QJ6R', 'Nature Inspired', 'Digital art inspired by natural forms and landscapes', true);

-- Sample artworks
INSERT INTO artwork (id, title, image_url, collection_id, midjourney_version, tags) 
VALUES 
('art_01H8QQ7RQZV7JQJ6QJ6QJ6QJ6S', 'Cosmic Swirl', 'https://example.com/cosmic-swirl.jpg', 'coll_01H8QQ7RQZV7JQJ6QJ6QJ6QJ6Q', 'v5.2', ARRAY['abstract', 'cosmic', 'blue', 'swirl']),
('art_01H8QQ7RQZV7JQJ6QJ6QJ6QJ6T', 'Forest Dreams', 'https://example.com/forest-dreams.jpg', 'coll_01H8QQ7RQZV7JQJ6QJ6QJ6QJ6R', 'v5.2', ARRAY['nature', 'forest', 'green', 'dreamlike']);

-- Sample digital product
INSERT INTO digital_product (id, name, description, file_url, file_size, file_type, price, download_limit, expires_in_days) 
VALUES 
('dp_01H8QQ7RQZV7JQJ6QJ6QJ6QJ6U', 'Cosmic Swirl - High Resolution', 'High resolution version of Cosmic Swirl artwork', 'https://storage.supabase.co/bucket/digital-products/cosmic-swirl-hd.png', 15728640, 'image/png', 9.99, 3, 30);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for artworks with collection info
CREATE VIEW artwork_with_collection AS
SELECT 
    a.id,
    a.title,
    a.image_url,
    a.midjourney_version,
    a.tags,
    a.created_at,
    a.updated_at,
    ac.id as collection_id,
    ac.name as collection_name,
    ac.description as collection_description
FROM artwork a
LEFT JOIN artwork_collection ac ON a.collection_id = ac.id;

-- View for active digital products with download stats
CREATE VIEW digital_products_with_stats AS
SELECT 
    dp.*,
    COUNT(dpd.id) as total_downloads,
    COUNT(DISTINCT dpd.customer_id) as unique_customers,
    MAX(dpd.last_downloaded_at) as last_download_at
FROM digital_product dp
LEFT JOIN digital_product_download dpd ON dp.id = dpd.digital_product_id
WHERE dp.is_active = true
GROUP BY dp.id;

-- View for printful sync status overview
CREATE VIEW printful_sync_status AS
SELECT 
    sync_status,
    COUNT(*) as product_count,
    MAX(last_sync_at) as last_sync_time
FROM printful_product 
GROUP BY sync_status;

-- =====================================================
-- PERMISSIONS (Adjust based on your user setup)
-- =====================================================

-- Grant permissions to application user (replace 'sencommerce_user' with your actual user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sencommerce_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sencommerce_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sencommerce_user;

-- =====================================================
-- MAINTENANCE PROCEDURES
-- =====================================================

-- Procedure to check data integrity
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(check_name TEXT, status TEXT, details TEXT) AS $$
BEGIN
    -- Check for orphaned artwork records
    RETURN QUERY
    SELECT 
        'Orphaned Artworks'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
        'Found ' || COUNT(*) || ' artworks with invalid collection_id'::TEXT
    FROM artwork a
    LEFT JOIN artwork_collection ac ON a.collection_id = ac.id
    WHERE a.collection_id IS NOT NULL AND ac.id IS NULL;
    
    -- Check for expired download tokens
    RETURN QUERY
    SELECT 
        'Expired Download Tokens'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'INFO' ELSE 'OK' END::TEXT,
        'Found ' || COUNT(*) || ' expired download tokens'::TEXT
    FROM digital_product_download 
    WHERE expires_at < NOW();
    
    -- Check for unsynced Printful products
    RETURN QUERY
    SELECT 
        'Unsynced Printful Products'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
        'Found ' || COUNT(*) || ' products with sync_status != synced'::TEXT
    FROM printful_product 
    WHERE sync_status != 'synced';
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BACKUP RECOMMENDATIONS
-- =====================================================

/*
For regular backups, use:

1. Full database dump:
pg_dump -h hostname -U username -d database_name -f sencommerce_backup_$(date +%Y%m%d_%H%M%S).sql

2. Schema only:
pg_dump -h hostname -U username -d database_name --schema-only -f sencommerce_schema_$(date +%Y%m%d).sql

3. Data only:
pg_dump -h hostname -U username -d database_name --data-only -f sencommerce_data_$(date +%Y%m%d).sql

4. Custom tables only:
pg_dump -h hostname -U username -d database_name -t artwork -t artwork_collection -t digital_product -t printful_product -f sencommerce_custom_tables.sql

To restore:
psql -h hostname -U username -d new_database_name -f backup_file.sql
*/

-- =====================================================
-- MIGRATION NOTES
-- =====================================================

/*
When migrating to a new service:

1. Ensure PostgreSQL version compatibility (13+)
2. Install required extensions if needed:
   - CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   - CREATE EXTENSION IF NOT EXISTS "pgcrypto";

3. Update connection strings in your application
4. Verify all custom functions work in the new environment
5. Re-run any custom configurations (users, permissions, etc.)
6. Test all API endpoints after migration
7. Verify file storage URLs are accessible from new environment

Environment variables to update:
- DATABASE_URL
- SUPABASE_URL (if using Supabase storage)
- SUPABASE_ANON_KEY
- Any other database-related configuration
*/

-- End of schema export
-- Generated on: $(date)
-- Total custom tables: 7
-- Total indexes: 20+
-- Total functions: 4
-- Total views: 3