-- POD Template System Migration
-- Creates tables for template management with proper indexes and relationships

-- Main template table
CREATE TABLE IF NOT EXISTS pod_template (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    provider TEXT NOT NULL CHECK (provider IN ('printful', 'printify', 'gelato')),
    variant_configs JSONB NOT NULL,
    pricing_rules JSONB NOT NULL,
    metadata JSONB,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    cloned_from TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Template version history table
CREATE TABLE IF NOT EXISTS pod_template_version (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    changes JSONB NOT NULL,
    change_summary TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Template-product link table
CREATE TABLE IF NOT EXISTS pod_template_product_link (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    template_version INTEGER NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    overrides JSONB
);

-- Indexes for pod_template table
CREATE INDEX IF NOT EXISTS idx_pod_template_provider ON pod_template(provider);
CREATE INDEX IF NOT EXISTS idx_pod_template_status ON pod_template(status);
CREATE INDEX IF NOT EXISTS idx_pod_template_provider_status ON pod_template(provider, status);
CREATE INDEX IF NOT EXISTS idx_pod_template_created ON pod_template(created_at);
CREATE INDEX IF NOT EXISTS idx_pod_template_updated ON pod_template(updated_at);
CREATE INDEX IF NOT EXISTS idx_pod_template_name ON pod_template(name);

-- Indexes for pod_template_version table
CREATE INDEX IF NOT EXISTS idx_pod_template_version_template ON pod_template_version(template_id);
CREATE INDEX IF NOT EXISTS idx_pod_template_version_created ON pod_template_version(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pod_template_version_unique ON pod_template_version(template_id, version_number);

-- Indexes for pod_template_product_link table
CREATE INDEX IF NOT EXISTS idx_pod_template_product_template ON pod_template_product_link(template_id);
CREATE INDEX IF NOT EXISTS idx_pod_template_product_product ON pod_template_product_link(product_id);
CREATE INDEX IF NOT EXISTS idx_pod_template_product_applied ON pod_template_product_link(applied_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pod_template_product_unique ON pod_template_product_link(template_id, product_id);

-- Foreign key constraints (these will be enforced at application level in Medusa)
-- pod_template_version.template_id -> pod_template.id
-- pod_template_product_link.template_id -> pod_template.id
-- pod_template.cloned_from -> pod_template.id (self-reference)

-- Add comments for documentation
COMMENT ON TABLE pod_template IS 'POD template configurations for product creation';
COMMENT ON TABLE pod_template_version IS 'Version history tracking for template changes';
COMMENT ON TABLE pod_template_product_link IS 'Links between templates and products created from them';

COMMENT ON COLUMN pod_template.variant_configs IS 'JSON configuration for product variants (sizes, colors, options)';
COMMENT ON COLUMN pod_template.pricing_rules IS 'JSON configuration for pricing calculations (markup, minimum price, etc.)';
COMMENT ON COLUMN pod_template.metadata IS 'Additional template metadata and settings';
COMMENT ON COLUMN pod_template.cloned_from IS 'Reference to source template if this was cloned';

COMMENT ON COLUMN pod_template_version.changes IS 'JSON snapshot of template state at this version';
COMMENT ON COLUMN pod_template_version.change_summary IS 'Human-readable description of changes made';

COMMENT ON COLUMN pod_template_product_link.overrides IS 'JSON of any custom overrides applied when template was used';

-- Add some sample data for testing (optional)
INSERT INTO pod_template (id, name, description, provider, variant_configs, pricing_rules, status) VALUES
('tpl_basic_tshirt', 'Basic T-Shirt Template', 'Standard t-shirt with common sizes and colors', 'printful',
 '{"sizes": ["S", "M", "L", "XL"], "colors": ["black", "white", "navy", "gray"], "options": {"default_size": "M", "default_color": "black"}}',
 '{"base_cost": 15.99, "markup_percentage": 100, "minimum_price": 25.00}',
 'active'),
('tpl_premium_hoodie', 'Premium Hoodie Template', 'Premium hoodie with extended size range', 'printful',
 '{"sizes": ["S", "M", "L", "XL", "2XL"], "colors": ["black", "white", "navy", "charcoal"], "options": {"default_size": "L", "default_color": "black"}}',
 '{"base_cost": 35.99, "markup_percentage": 120, "minimum_price": 65.00}',
 'active')
ON CONFLICT (id) DO NOTHING;