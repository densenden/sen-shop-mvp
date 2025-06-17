-- Add brand story and marketing fields to artwork_collection table
ALTER TABLE artwork_collection
ADD COLUMN IF NOT EXISTS brand_story TEXT,
ADD COLUMN IF NOT EXISTS genesis_story TEXT,
ADD COLUMN IF NOT EXISTS design_philosophy TEXT,
ADD COLUMN IF NOT EXISTS core_values JSONB,
ADD COLUMN IF NOT EXISTS visual_themes JSONB,
ADD COLUMN IF NOT EXISTS lifestyle_concepts JSONB,
ADD COLUMN IF NOT EXISTS campaign_ideas JSONB,
ADD COLUMN IF NOT EXISTS target_audience_messaging TEXT,
ADD COLUMN IF NOT EXISTS brand_tagline TEXT,
ADD COLUMN IF NOT EXISTS brand_colors JSONB,
ADD COLUMN IF NOT EXISTS brand_fonts JSONB,
ADD COLUMN IF NOT EXISTS social_media_tags JSONB,
ADD COLUMN IF NOT EXISTS editorial_image_1 TEXT,
ADD COLUMN IF NOT EXISTS editorial_image_2 TEXT,
ADD COLUMN IF NOT EXISTS editorial_image_3 TEXT,
ADD COLUMN IF NOT EXISTS editorial_image_4 TEXT;

-- Add indexes for JSON fields to improve query performance
CREATE INDEX IF NOT EXISTS idx_artwork_collection_core_values ON artwork_collection USING GIN (core_values);
CREATE INDEX IF NOT EXISTS idx_artwork_collection_visual_themes ON artwork_collection USING GIN (visual_themes);
CREATE INDEX IF NOT EXISTS idx_artwork_collection_social_tags ON artwork_collection USING GIN (social_media_tags); 