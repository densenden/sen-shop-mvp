-- Create artwork_collection table
CREATE TABLE IF NOT EXISTS artwork_collection (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    topic TEXT,
    month_created TEXT,
    midjourney_version TEXT,
    purpose TEXT,
    thumbnail_url TEXT
);

-- Create artwork table
CREATE TABLE IF NOT EXISTS artwork (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    artwork_collection_id INTEGER REFERENCES artwork_collection(id) ON DELETE SET NULL,
    product_ids TEXT[]
); 