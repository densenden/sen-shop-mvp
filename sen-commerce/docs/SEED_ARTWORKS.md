# Seeding Artworks Database

The artworks API is working correctly but the database is empty. To add sample artworks to the database:

## Option 1: Seed just artworks
```bash
cd /Users/densen/masterschool/SenShopMVP/sen-commerce
npm run seed:artwork
```

## Option 2: Full database seed (products + artworks)
```bash
cd /Users/densen/masterschool/SenShopMVP/sen-commerce
npm run seed
```

## What gets seeded:

### Artwork Collections:
1. **Abstract Geometries** - Modern abstract geometric artwork
2. **Nature Landscapes** - Stunning natural landscapes  
3. **Minimalist Portraits** - Clean, minimalist portrait artwork

### Individual Artworks:
1. **Geometric Fusion** - Vibrant geometric composition
2. **Color Symphony** - Explosive array of colors
3. **Mountain Vista** - Breathtaking mountain landscape
4. **Forest Reflection** - Peaceful forest scene
5. **Modern Face** - Contemporary minimalist portrait
6. **Elegant Silhouette** - Striking silhouette portrait

All artworks use high-quality Unsplash images and are properly categorized.

After running the seed command, refresh your storefront at http://localhost:3000/artworks to see the artworks!