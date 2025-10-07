# Printful Studio - Testing Guide

## Quick Test Steps

### 1. Access Printful Studio
```
http://localhost:9000/admin/printful-studio
```

### 2. Test Composer Workflow

#### Step 1: Start from Artwork
1. Go to **Artworks** tab
2. You should see artworks from your artwork module
3. Click "Create Product" on any artwork
4. Composer opens with artwork pre-loaded ✅

#### Step 2: Product Selection Tab
1. **Artwork Tab** shows your selected artwork ✅
2. Click **Next** to go to Product tab
3. Catalog loads automatically (v2 products from Printful)
4. Click any product (e.g., "Unisex T-Shirt")
5. Product is selected, showing variants count ✅
6. Click **Next**

#### Step 3: Design Tab
1. Select printing technique (DTG, Embroidery, etc.)
2. See artwork preview
3. Click **Next** ✅

#### Step 4: Mockups Tab
1. Click "Generate Mockups" button
2. Mockup preview appears (currently shows artwork)
3. Click **Next** ✅

#### Step 5: Details Tab
1. Product title is auto-filled: `[Artwork Name] - [Product Name]`
2. Edit title if needed
3. Add description
4. Click **Next** ✅

#### Step 6: Pricing Tab
1. Set markup type (Percentage or Fixed)
2. Set markup value (e.g., 50%)
3. Click **Create Product** ✅

#### Result
- Product created on Printful ✅
- Imported to Medusa ✅
- Artwork linked ✅
- Alert shows success with IDs ✅

### 3. Test Batch Creation

1. Go to **Artworks** tab
2. Click multiple artworks to select them (border turns blue)
3. Go to **Catalog** tab
4. Click multiple products to select them
5. Go to **Batch Create** tab
6. See calculation: `N artworks × M products = X total products`
7. Click "Create All Products"
8. Confirm dialog
9. Wait for completion
10. Alert shows created count ✅

### 4. UI Features to Verify

#### Dashboard
- [x] Shows metrics (artworks, catalog products, linked products)
- [x] Quick start guide

#### Artworks
- [x] Grid of artworks with images
- [x] Selection works (click to select/deselect)
- [x] "Create Product" button works
- [x] Selected count badge

#### Catalog
- [x] Grid of Printful products
- [x] Selection works
- [x] Product details visible
- [x] Selected count badge

#### Composer
- [x] 6 tabs visible
- [x] Progress indicators (✓ on completed steps)
- [x] Navigation (Previous/Next buttons)
- [x] Each tab shows appropriate content
- [x] Product selection loads catalog
- [x] Session updates persist

#### Batch
- [x] Shows selected counts
- [x] Calculates total products
- [x] Batch creation works

## API Endpoints to Test

### Create Session
```bash
curl -X POST http://localhost:9000/admin/printful-studio/composer \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{"artwork_id":"your_artwork_id"}'
```

### Update Session
```bash
curl -X PUT http://localhost:9000/admin/printful-studio/composer/SESSION_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "product": {
      "catalog_product_id": "71",
      "catalog_product_name": "T-Shirt",
      "selected_variant_ids": ["4011"]
    }
  }'
```

### Create Product
```bash
curl -X POST http://localhost:9000/admin/printful-studio/composer/SESSION_ID/create-product \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "auto_import_to_medusa": true,
    "medusa_status": "draft"
  }'
```

### Batch Create
```bash
curl -X POST http://localhost:9000/admin/printful-studio/batch/create-products \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "artwork_ids": ["art1", "art2"],
    "catalog_product_ids": ["71", "19"],
    "auto_import_to_medusa": true,
    "pricing_config": {
      "markup_type": "percentage",
      "markup_value": 50
    }
  }'
```

## Expected Behavior

### When Everything Works
- ✅ Artworks load from artwork module
- ✅ Catalog loads from Printful API
- ✅ Product selection updates session
- ✅ All tabs accessible and functional
- ✅ Create product succeeds
- ✅ Product appears in Medusa
- ✅ Product appears on Printful
- ✅ Batch creation works for multiple combinations

### Common Issues & Solutions

#### Issue: Catalog doesn't load
**Check:**
- PRINTFUL_API_TOKEN is set
- Printful API is reachable
- Check browser console for errors

**Solution:**
```bash
# Verify API token
curl https://api.printful.com/v2/catalog-products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Issue: Artworks don't appear
**Check:**
- Artworks exist in artwork module
- Navigate to `/admin/artworks` to verify

**Solution:**
Upload artworks via Artworks module first

#### Issue: Product creation fails
**Check:**
- All required tabs completed
- Session state is valid
- Check server logs

**Solution:**
Check logs for specific error messages

#### Issue: Session not persisting
**Fix:**
Sessions now use global storage, should persist across requests

## Performance Expectations

- **Catalog Load:** 1-2 seconds (cached 15s)
- **Session Create:** <100ms
- **Session Update:** <50ms
- **Product Create:** 2-5 seconds
- **Batch Create (per product):** 3-7 seconds

## Browser Console Checks

Open browser dev tools and check for:
- No React errors
- API calls succeed (Network tab)
- Session updates work

## Success Criteria

All of these should work:
- [ ] Can create composer session
- [ ] Can select artwork
- [ ] Can select product from catalog
- [ ] Can navigate all 6 tabs
- [ ] Can create single product
- [ ] Product appears in Medusa
- [ ] Can select multiple artworks
- [ ] Can select multiple products
- [ ] Can batch create products
- [ ] Batch results show success/failure counts

## Next Steps After Testing

Once confirmed working:
1. Test with real Printful products
2. Verify mockup generation with real API
3. Test with different artwork formats
4. Test pricing calculations
5. Verify Medusa product data

## Notes

- Mockup generation currently uses artwork URL as preview
- Real mockup API integration can be added in mockups tab
- Pricing calculation uses simple markup logic
- Sessions are in-memory (consider Redis for production)
