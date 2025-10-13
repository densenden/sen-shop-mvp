"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
exports.POST = POST;
exports.importProducts = importProducts;
const utils_1 = require("@medusajs/framework/utils");
const medusa_1 = require("@medusajs/medusa");
const product_image_service_1 = require("../../../services/product-image-service");
// In-memory storage for sync logs (in production, use database)
let syncLogs = [];
// Note: Replaced by ProductImageService - keeping for backwards compatibility if needed
async function GET(req, res) {
    console.log("[Product Sync] GET request received");
    try {
        const printfulService = req.scope.resolve("printfulModule");
        const digitalProductService = req.scope.resolve("digitalProductModuleService");
        const { apiVersion } = options;
        const productModuleService = req.scope.resolve(utils_1.Modules.PRODUCT);
        const [printfulStoreProductsBasic, existingMedusaProducts, digitalProducts] = await Promise.all([
            printfulService.fetchProducts().catch((err) => {
                console.error("Error fetching Printful products:", err);
                return [];
            }),
            productModuleService.listProducts({}).catch((err) => {
                console.error("Error listing existing Medusa products:", err);
                return [];
            }),
            digitalProductService.listDigitalProducts({}).catch((err) => {
                console.error("Error fetching digital products:", err);
                return [];
            })
        ]);
        // Fetch detailed data for each Printful product to get all images and variants
        const printfulStoreProducts = await Promise.all(printfulStoreProductsBasic.map(async (basicProduct) => {
            try {
                // Use the service method that exists - first try getProduct, then direct API methods
                let rawPrintfulData = null;
                if (typeof printfulService.getProduct === 'function') {
                    rawPrintfulData = await printfulService.getProduct(basicProduct.id);
                }
                else if (typeof printfulService.getStoreProduct === 'function') {
                    rawPrintfulData = await printfulService.getStoreProduct(basicProduct.id);
                }
                console.log(`[DEBUG] Fetched detailed raw Printful product ${basicProduct.id}:`, rawPrintfulData ? 'Success' : 'Failed');
                if (rawPrintfulData) {
                    // Merge basic product data with detailed raw data to preserve all fields
                    return {
                        ...basicProduct,
                        ...rawPrintfulData,
                        // Ensure we have the detailed variants and image data
                        sync_product: rawPrintfulData.sync_product,
                        sync_variants: rawPrintfulData.sync_variants
                    };
                }
                return basicProduct;
            }
            catch (error) {
                console.warn(`Failed to fetch detailed data for product ${basicProduct.id}:`, error);
                return basicProduct;
            }
        }));
        const availableProducts = {
            printful: printfulStoreProducts.map(p => {
                const productId = p.id || p.external_id;
                const alreadyImported = existingMedusaProducts.some((mp) => mp.metadata && mp.metadata.printful_product_id === productId);
                // Calculate comprehensive image count
                let imageCount = 0;
                const imageUrls = new Set(); // Use Set to avoid counting duplicates
                // Add main thumbnail
                if (p.thumbnail_url)
                    imageUrls.add(p.thumbnail_url);
                if (p.image && p.image !== p.thumbnail_url)
                    imageUrls.add(p.image);
                // Add images from sync_product if available (detailed data)
                if (p.sync_product?.thumbnail_url) {
                    imageUrls.add(p.sync_product.thumbnail_url);
                }
                // Add images from sync_variants (detailed product data)
                if (p.sync_variants && Array.isArray(p.sync_variants)) {
                    p.sync_variants.forEach(variant => {
                        if (variant.files && Array.isArray(variant.files)) {
                            variant.files.forEach(file => {
                                if (file.thumbnail_url)
                                    imageUrls.add(file.thumbnail_url);
                                if (file.preview_url)
                                    imageUrls.add(file.preview_url);
                                if (file.url)
                                    imageUrls.add(file.url);
                            });
                        }
                    });
                }
                // Fallback: Add images from basic variants structure
                if (p.variants && Array.isArray(p.variants)) {
                    p.variants.forEach(variant => {
                        if (variant.files && Array.isArray(variant.files)) {
                            variant.files.forEach(file => {
                                if (file.thumbnail_url)
                                    imageUrls.add(file.thumbnail_url);
                                if (file.preview_url)
                                    imageUrls.add(file.preview_url);
                                if (file.url)
                                    imageUrls.add(file.url);
                            });
                        }
                        if (variant.image && variant.image !== p.thumbnail_url) {
                            imageUrls.add(variant.image);
                        }
                    });
                }
                imageCount = imageUrls.size;
                // Debug logging for the first few products
                if (printfulStoreProducts.indexOf(p) < 3) {
                    console.log(`[DEBUG] Product ${p.name || p.id}:`);
                    console.log(`  - Has sync_variants: ${!!(p.sync_variants && p.sync_variants.length)}`);
                    console.log(`  - sync_variants count: ${p.sync_variants?.length || 0}`);
                    console.log(`  - Basic variants count: ${p.variants?.length || 0}`);
                    console.log(`  - Total images found: ${imageCount}`);
                    console.log(`  - Image URLs collected: ${Array.from(imageUrls).slice(0, 3).join(', ')}`);
                }
                // Calculate variations count (prioritize detailed data)
                const variationsCount = (p.sync_variants && Array.isArray(p.sync_variants))
                    ? p.sync_variants.length
                    : (p.variants && Array.isArray(p.variants))
                        ? p.variants.length
                        : 0;
                return {
                    id: productId,
                    name: p.name,
                    description: p.description || `${p.name} - Available for custom printing`,
                    thumbnail_url: p.thumbnail_url || p.image,
                    status: 'available',
                    provider: 'printful',
                    already_imported: alreadyImported,
                    product_type: p.product_type || 'store',
                    image_count: imageCount,
                    variations_count: variationsCount,
                    medusa_product_id: alreadyImported ? existingMedusaProducts.find((mp) => mp.metadata && mp.metadata.printful_product_id === productId)?.id : null
                };
            }),
            digital: digitalProducts.map(dp => {
                const alreadyImported = existingMedusaProducts.some((mp) => mp.metadata && mp.metadata.digital_product_id === dp.id);
                return {
                    id: dp.id,
                    name: dp.name,
                    description: dp.description,
                    file_size: dp.file_size,
                    mime_type: dp.mime_type,
                    status: 'available',
                    provider: 'digital',
                    already_imported: alreadyImported,
                    image_count: dp.image_url ? 1 : 0,
                    variations_count: 1, // Digital products typically have one variation
                    medusa_product_id: alreadyImported ? existingMedusaProducts.find((mp) => mp.metadata && mp.metadata.digital_product_id === dp.id)?.id : null
                };
            })
        };
        const stats = syncLogs.reduce((acc, log) => {
            acc.total++;
            acc[log.status]++;
            return acc;
        }, { total: 0, pending: 0, success: 0, failed: 0, in_progress: 0 });
        res.json({
            logs: syncLogs,
            stats,
            available_products: availableProducts
        });
    }
    catch (error) {
        console.error("[Product Sync] Error fetching sync data:", error);
        res.status(500).json({ error: "Failed to fetch sync data" });
    }
}
async function POST(req, res) {
    try {
        const { action, provider = "printful", product_ids = [] } = req.body;
        const syncLog = {
            id: `sync_${Date.now()}`,
            sync_type: action,
            status: "in_progress",
            provider_type: provider,
            created_at: new Date().toISOString()
        };
        syncLogs.unshift(syncLog);
        if (action === "import_products") {
            // Handle import synchronously for immediate feedback
            const result = await importProducts(req, provider, product_ids);
            syncLog.status = result.failed > 0 ? "failed" : "success";
            syncLog.completed_at = new Date().toISOString();
            res.json(result);
        }
        else {
            // Handle other actions asynchronously
            processSync(syncLog.id, action, provider);
            res.json({ success: true, syncId: syncLog.id });
        }
    }
    catch (error) {
        console.error("Error starting sync:", error);
        res.status(500).json({ error: "Failed to start sync" });
    }
}
async function importProducts(req, provider, productIds, options = {}) {
    console.log(`[DEBUG] Starting import for provider: ${provider}, products: ${JSON.stringify(productIds)}`);
    const productModuleService = req.scope.resolve(utils_1.Modules.PRODUCT);
    const importedProducts = [];
    const errors = [];
    const skippedProducts = [];
    let printfulService;
    try {
        printfulService = req.scope.resolve("printfulModule");
        console.log(`[DEBUG] Resolved printfulService:`, typeof printfulService, Object.keys(printfulService || {}));
    }
    catch (resolveError) {
        console.error(`[DEBUG] Failed to resolve printfulModule:`, resolveError);
        throw new Error(`Failed to resolve Printful service: ${resolveError.message}`);
    }
    for (const productId of productIds) {
        console.log(`[DEBUG] Processing product ID: ${productId}`);
        try {
            let medusaProduct;
            if (provider === "printful") {
                console.log(`[DEBUG] Checking for existing products...`);
                // Check if product is already imported by checking metadata
                const allProducts = await productModuleService.listProducts({});
                console.log(`[DEBUG] Found ${allProducts.length} existing products in Medusa`);
                const existingProduct = allProducts.find(p => {
                    console.log(`[DEBUG] Checking product:`, p.id, p.metadata);
                    return p.metadata && p.metadata.printful_product_id === productId;
                });
                if (existingProduct) {
                    skippedProducts.push({
                        productId,
                        reason: "already_imported",
                        medusa_product_id: existingProduct.id,
                        medusa_product_title: existingProduct.title,
                    });
                    console.log(`[DEBUG] Skipping product ${productId} - already imported as ${existingProduct.id}`);
                    continue;
                }
                console.log(`[DEBUG] No existing product found, proceeding with import`);
                let printfulProduct;
                try {
                    console.log(`Fetching Printful product: ${productId}`);
                    console.log('Available methods on printfulService:', Object.getOwnPropertyNames(printfulService));
                    // Try different method names to find the right one
                    if (printfulService.getStoreProduct) {
                        printfulProduct = await printfulService.getStoreProduct(productId);
                    }
                    else if (printfulService.getInternalProductService) {
                        const internalService = printfulService.getInternalProductService();
                        printfulProduct = await internalService.getStoreProduct(productId);
                    }
                    else if (printfulService.getProduct) {
                        printfulProduct = await printfulService.getProduct(productId);
                    }
                    else {
                        throw new Error('No product retrieval method found on Printful service');
                    }
                    console.log(`[DEBUG] Fetched Printful product:`, printfulProduct ? 'Success' : 'Null');
                    if (printfulProduct) {
                        console.log(`[DEBUG] Printful product structure:`);
                        console.log(`  - ID: ${printfulProduct.id}`);
                        console.log(`  - Name: ${printfulProduct.name}`);
                        console.log(`  - Thumbnail: ${printfulProduct.thumbnail_url}`);
                        console.log(`  - Description: ${printfulProduct.description}`);
                        console.log(`  - Variants count: ${printfulProduct.variants ? printfulProduct.variants.length : 0}`);
                        if (printfulProduct.variants && printfulProduct.variants.length > 0) {
                            console.log(`  - First variant:`, JSON.stringify(printfulProduct.variants[0], null, 2));
                        }
                    }
                }
                catch (apiError) {
                    console.error(`Error fetching Printful product ${productId}:`, apiError);
                    throw new Error(`Failed to fetch product from Printful: ${apiError?.message || apiError}`);
                }
                if (!printfulProduct) {
                    throw new Error("Product not found in Printful");
                }
                // Get a random artwork for mockup generation
                let artworkUrl = null;
                try {
                    const manager = req.scope.resolve("manager");
                    const artworks = await manager.query(`
                    SELECT image_url FROM artwork WHERE deleted_at IS NULL ORDER BY RANDOM() LIMIT 1
                  `);
                    if (artworks.length > 0) {
                        artworkUrl = artworks[0].image_url;
                    }
                }
                catch (artworkError) {
                    console.warn('Failed to fetch random artwork for mockup generation:', artworkError);
                }
                console.log("Printful Product:", JSON.stringify(printfulProduct, null, 2));
                // Validate and fix product data with safe access
                const productName = printfulProduct.name || printfulProduct.title || `Printful Product ${productId}`;
                const productDescription = printfulProduct.description || `High-quality print-on-demand ${productName}`;
                const productThumbnail = printfulProduct.thumbnail_url || printfulProduct.image || '';
                // Ensure variants array exists and has valid data
                let variants = [];
                let sizeValues = new Set();
                let colorValues = new Set();
                if (printfulProduct.variants && Array.isArray(printfulProduct.variants) && printfulProduct.variants.length > 0) {
                    console.log(`Processing ${printfulProduct.variants.length} variants for product ${productId}`);
                    // Validate existing variants
                    variants = printfulProduct.variants
                        .filter(variant => {
                        if (!variant) {
                            console.warn('Null variant found, skipping');
                            return false;
                        }
                        if (!variant.id && !variant.variant_id) {
                            console.warn('Variant without id found:', variant);
                            return false;
                        }
                        return true;
                    })
                        .map((variant, index) => {
                        console.log(`[DEBUG] Processing variant ${index}:`, JSON.stringify(variant, null, 2));
                        // Extract size and color if available
                        const rawName = variant.name || variant.title || "Default Variant";
                        console.log(`[DEBUG] Raw variant name:`, rawName, typeof rawName);
                        const variantName = String(rawName);
                        console.log(`[DEBUG] String variant name:`, variantName);
                        const parts = variantName.split('/').map(p => String(p || '').trim());
                        let size = "One Size";
                        let color = "Default";
                        if (parts.length > 1) {
                            // Last part is usually size
                            size = parts[parts.length - 1];
                            sizeValues.add(size);
                        }
                        // Check for color in variant object
                        if (variant.color) {
                            color = String(variant.color);
                            colorValues.add(color);
                        }
                        return {
                            id: String(variant.id || variant.variant_id),
                            name: String(variantName),
                            size: String(size),
                            color: String(color),
                            price: String(variant.price || "25.00"),
                            currency: String(variant.currency || "USD")
                        };
                    });
                }
                // If no valid variants, create a default one
                if (variants.length === 0) {
                    console.warn(`Printful product ${productId} has no valid variants, creating default variant`);
                    variants = [{
                            id: `variant_${productId}`,
                            name: "Default Variant",
                            size: "One Size",
                            color: "Default",
                            price: "25.00",
                            currency: "USD"
                        }];
                    sizeValues.add("One Size");
                    colorValues.add("Default");
                }
                // Update the product object with validated data
                printfulProduct.name = productName;
                printfulProduct.description = productDescription;
                printfulProduct.thumbnail_url = productThumbnail;
                printfulProduct.variants = variants;
                // Collect all available Printful images
                console.log(`[DEBUG] Starting image collection for product ${productId}`);
                console.log(`[DEBUG] Available data - Thumbnail: ${productThumbnail}, Variants: ${variants.length}`);
                let imageCollection;
                let collectedImages = [];
                // 1. Always add thumbnail if available
                if (productThumbnail) {
                    collectedImages.push(productThumbnail);
                    console.log(`[DEBUG] Added thumbnail: ${productThumbnail}`);
                }
                // 2. Add variant images if available
                variants.forEach((variant, index) => {
                    if (variant.image && !collectedImages.includes(variant.image)) {
                        collectedImages.push(variant.image);
                        console.log(`[DEBUG] Added variant ${index} image: ${variant.image}`);
                    }
                });
                // 3. Use ProductImageService for comprehensive image collection
                const imageService = new product_image_service_1.ProductImageService(req);
                console.log(`[DEBUG] Starting comprehensive image collection with ProductImageService`);
                try {
                    imageCollection = await imageService.collectPrintfulImages(printfulProduct, // Pass original Printful data
                    artworkUrl, 8, // max mockups
                    20 // max total images
                    );
                    console.log(`[DEBUG] ✅ Comprehensive collection succeeded: ${imageCollection.images.length} images`);
                    console.log(`[DEBUG] Image sources: ${JSON.stringify(imageCollection.metadata.image_sources)}`);
                }
                catch (imageError) {
                    console.error(`[DEBUG] ❌ Comprehensive collection failed:`, imageError);
                    // Fallback: Create basic image collection from manually collected images
                    console.log(`[DEBUG] Using fallback with ${collectedImages.length} basic images`);
                    imageCollection = {
                        images: collectedImages.map(url => ({ url, type: 'basic' })),
                        thumbnail: collectedImages[0] || productThumbnail,
                        metadata: {
                            total_images: collectedImages.length,
                            image_sources: { mockups: 0, catalog: 0, variants: collectedImages.length - 1, user_uploads: 0 },
                            printful_product_id: productId,
                            artwork_url: artworkUrl,
                            collection_method: 'fallback'
                        }
                    };
                }
                const salesChannelService = req.scope.resolve(utils_1.Modules.SALES_CHANNEL);
                let [defaultSalesChannel] = await salesChannelService.listSalesChannels({
                    name: "Default",
                });
                if (!defaultSalesChannel) {
                    defaultSalesChannel = await salesChannelService.createSalesChannels({
                        name: "Default",
                        description: "Default sales channel for all products",
                    });
                }
                // Get price from variants or set a default price for POD products
                let price = 0;
                console.log(`[DEBUG] 💰 PRICING DEBUG for ${productName}:`);
                console.log(`[DEBUG] Available variants: ${variants.length}`);
                console.log(`[DEBUG] Variants structure:`, variants.map(v => ({
                    id: v.id,
                    name: v.name,
                    price: v.price,
                    currency: v.currency,
                    has_price: !!v.price,
                    price_type: typeof v.price
                })));
                if (variants && variants.length > 0 && variants[0]) {
                    const firstVariant = variants[0];
                    console.log(`[DEBUG] First variant pricing:`, {
                        name: firstVariant.name,
                        price: firstVariant.price,
                        currency: firstVariant.currency,
                        raw_price: firstVariant.price,
                        is_number: !isNaN(parseFloat(firstVariant.price?.toString() || '0'))
                    });
                    const variantPrice = firstVariant.price;
                    if (variantPrice && !isNaN(parseFloat(variantPrice.toString()))) {
                        price = Math.round(parseFloat(variantPrice.toString()) * 100);
                        console.log(`[DEBUG] ✅ Converted price: ${variantPrice} -> ${price} cents`);
                    }
                    else {
                        console.log(`[DEBUG] ❌ Invalid variant price: ${variantPrice}`);
                    }
                }
                // Fallback to product price if available
                if (price === 0 && printfulProduct && printfulProduct.price && !isNaN(parseFloat(printfulProduct.price.toString()))) {
                    price = Math.round(parseFloat(printfulProduct.price.toString()) * 100);
                    console.log(`[DEBUG] ✅ Used product fallback price: ${printfulProduct.price} -> ${price} cents`);
                }
                // Additional fallback - check if printfulProduct has retail_price
                if (price === 0 && printfulProduct?.variants?.[0]?.retail_price) {
                    const retailPrice = parseFloat(printfulProduct.variants[0].retail_price);
                    if (!isNaN(retailPrice)) {
                        price = Math.round(retailPrice * 100);
                        console.log(`[DEBUG] ✅ Used retail_price fallback: ${retailPrice} -> ${price} cents`);
                    }
                }
                console.log(`[DEBUG] 💰 FINAL PRICE: ${price} cents (${price / 100} ${printfulProduct?.variants?.[0]?.currency || 'USD'})`);
                // If no valid price found, skip the product instead of using hardcoded fallbacks
                if (price === 0 || isNaN(price)) {
                    console.log(`❌ Skipping product ${productName} - no valid price found`);
                    console.log(`[DEBUG] Price sources checked:`);
                    console.log(`  - variants[0].price: ${variants?.[0]?.price}`);
                    console.log(`  - printfulProduct.price: ${printfulProduct?.price}`);
                    console.log(`  - printfulProduct.variants[0].retail_price: ${printfulProduct?.variants?.[0]?.retail_price}`);
                    skippedProducts.push({
                        productId,
                        name: productName,
                        reason: 'no_price'
                    });
                    continue;
                }
                // Convert image collection to Medusa format using ProductImageService
                let medusaImageData;
                try {
                    medusaImageData = imageService.convertToMedusaFormat(imageCollection);
                    console.log(`[DEBUG] ✅ Image conversion succeeded: ${medusaImageData.images.length} images`);
                }
                catch (conversionError) {
                    console.error(`[DEBUG] ❌ Image conversion failed:`, conversionError);
                    // Final fallback: Manual conversion
                    medusaImageData = {
                        thumbnail: imageCollection?.thumbnail || collectedImages[0] || productThumbnail,
                        images: (imageCollection?.images || collectedImages).map(img => typeof img === 'string' ? { url: img } : { url: img.url || img }),
                        metadata: {
                            ...(imageCollection?.metadata || {}),
                            printful_product_id: productId,
                            artwork_url: artworkUrl,
                            conversion_method: 'manual_fallback'
                        }
                    };
                    console.log(`[DEBUG] Using manual fallback conversion`);
                }
                console.log(`[DEBUG] Final image data for product creation:`);
                console.log(`  - Thumbnail: ${medusaImageData.thumbnail}`);
                console.log(`  - Images count: ${medusaImageData.images.length}`);
                console.log(`  - First few images:`, medusaImageData.images.slice(0, 3));
                console.log(`[DEBUG] Creating product with ${medusaImageData.images.length} images`);
                console.log(`[DEBUG] Image data structure:`, JSON.stringify(medusaImageData, null, 2));
                console.log(`[DEBUG] Thumbnail:`, medusaImageData.thumbnail);
                console.log(`[DEBUG] Images array:`, medusaImageData.images);
                // Create the product with comprehensive image data
                const productInput = {
                    title: productName,
                    description: productDescription,
                    status: "draft", // Start as draft
                    thumbnail: medusaImageData.thumbnail,
                    images: medusaImageData.images,
                    metadata: {
                        fulfillment_type: "printful_pod",
                        printful_product_id: productId,
                        product_type: "store",
                        printful_api_version: apiVersion || 'v1',
                        artwork_url: artworkUrl,
                        original_thumbnail: productThumbnail,
                        // Include comprehensive image metadata
                        ...medusaImageData.metadata,
                    },
                };
                console.log(`[DEBUG] Product input:`, JSON.stringify(productInput, null, 2));
                medusaProduct = (await productModuleService.createProducts([productInput]))[0];
                console.log(`[DEBUG] Created medusaProduct:`, medusaProduct ? 'Success' : 'Failed');
                if (medusaProduct) {
                    console.log(`[DEBUG] ✅ Product created successfully!`);
                    console.log(`  - ID: ${medusaProduct.id}`);
                    console.log(`  - Title: ${medusaProduct.title}`);
                    console.log(`  - Status: ${medusaProduct.status}`);
                    console.log(`  - Thumbnail: ${medusaProduct.thumbnail}`);
                    console.log(`  - Images count: ${medusaProduct.images ? medusaProduct.images.length : 0}`);
                    // Retrieve the product immediately after creation to verify what was stored
                    try {
                        const retrievedProduct = await productModuleService.retrieveProduct(medusaProduct.id, {
                            relations: ["images", "variants"]
                        });
                        console.log(`[DEBUG] 🔍 Retrieved product verification:`);
                        console.log(`  - Retrieved thumbnail: ${retrievedProduct.thumbnail}`);
                        console.log(`  - Retrieved images count: ${retrievedProduct.images ? retrievedProduct.images.length : 0}`);
                        console.log(`  - Retrieved images:`, retrievedProduct.images);
                        console.log(`  - Retrieved variants count: ${retrievedProduct.variants ? retrievedProduct.variants.length : 0}`);
                    }
                    catch (retrieveError) {
                        console.error(`[DEBUG] ⚠️ Failed to retrieve product for verification:`, retrieveError.message);
                    }
                }
                else {
                    console.error(`[DEBUG] ❌ Product creation failed - no product returned`);
                }
                // Create basic variant with price
                console.log(`[DEBUG] Creating variant for product ${medusaProduct.id}`);
                const variants_created = await productModuleService.createProductVariants([{
                        title: "Default",
                        sku: `printful-${productId}`,
                        product_id: medusaProduct.id,
                        prices: [{
                                amount: price,
                                currency_code: "eur"
                            }],
                        metadata: {
                            printful_product_id: productId
                        }
                    }]);
                console.log(`[DEBUG] Created variants:`, variants_created);
                // Verify pricing was set correctly
                if (variants_created && variants_created[0]) {
                    const variant = variants_created[0];
                    console.log(`[DEBUG] ✅ Variant created with pricing:`);
                    console.log(`  - Variant ID: ${variant.id}`);
                    console.log(`  - SKU: ${variant.sku}`);
                    console.log(`  - Has prices: ${variant.prices ? 'Yes' : 'No'}`);
                    console.log(`  - Price details:`, variant.prices);
                }
                else {
                    console.error(`[DEBUG] ❌ No variants created for product ${productId}`);
                }
                // Link to sales channel  
                const remoteLink = req.scope.resolve("remoteLink");
                await remoteLink.create([
                    {
                        [utils_1.Modules.PRODUCT]: { product_id: medusaProduct.id },
                        [utils_1.Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
                    },
                ]);
            }
            else if (provider === "digital") {
                const digitalProductService = req.scope.resolve("digitalProductModuleService");
                // Just get all and filter manually since the service doesn't support where clause properly
                const allDigitalProducts = await digitalProductService.listDigitalProducts();
                const digitalProduct = allDigitalProducts.find(p => p.id === productId);
                if (!digitalProduct) {
                    throw new Error("Digital product not found");
                }
                const salesChannelService = req.scope.resolve(utils_1.Modules.SALES_CHANNEL);
                let [defaultSalesChannel] = await salesChannelService.listSalesChannels({
                    name: "Default",
                });
                if (!defaultSalesChannel) {
                    defaultSalesChannel = await salesChannelService.createSalesChannels({
                        name: "Default",
                        description: "Default sales channel for all products",
                    });
                }
                const price = Math.round(parseFloat(digitalProduct.price || "5.00") * 100);
                // Import the workflow for digital products too
                const { createProductsWorkflow: createDigitalWorkflow } = await import("@medusajs/core-flows");
                const digitalProductInput = {
                    title: digitalProduct.name,
                    status: "published",
                    description: digitalProduct.description || `Digital download: ${digitalProduct.name}`,
                    options: [
                        {
                            title: "Format",
                            values: ["Digital"]
                        }
                    ],
                    variants: [
                        {
                            title: "Digital Version",
                            sku: `digital-${productId}`,
                            manage_inventory: false,
                            allow_backorder: true,
                            options: {
                                "Format": "Digital"
                            },
                            prices: [
                                {
                                    amount: price,
                                    currency_code: "usd",
                                }
                            ]
                        },
                    ],
                    sales_channels: [{ id: defaultSalesChannel.id }],
                    metadata: {
                        fulfillment_type: "digital",
                        digital_product_id: digitalProduct.id,
                    },
                };
                const { result: digitalResult } = await createDigitalWorkflow(req.scope).run({
                    input: { products: [digitalProductInput] }
                });
                // Handle different possible result structures
                if (digitalResult) {
                    if (Array.isArray(digitalResult)) {
                        medusaProduct = digitalResult[0];
                    }
                    else if (digitalResult && typeof digitalResult === 'object' && 'products' in digitalResult) {
                        const resultWithProducts = digitalResult;
                        medusaProduct = resultWithProducts.products[0];
                    }
                    else {
                        medusaProduct = digitalResult;
                    }
                }
                if (!medusaProduct) {
                    throw new Error("Failed to create digital product - no result returned from workflow");
                }
            }
            importedProducts.push({
                productId,
                medusaProductId: medusaProduct.id,
                medusaProduct: medusaProduct, // Include full product object for frontend
                medusa_product_title: medusaProduct.title,
                provider
            });
        }
        catch (error) {
            console.error(`[DEBUG] Error importing product ${productId}:`, error);
            console.error(`[DEBUG] Error stack:`, error.stack);
            console.error(`[DEBUG] Error details:`, {
                name: error?.name,
                message: error?.message,
                stack: error?.stack
            });
            errors.push({
                productId,
                error: error?.message || error?.toString() || "Unknown error during import"
            });
        }
    }
    try {
        if (typeof printfulService?.getProvider === "function") {
            const provider = printfulService.getProvider("printful");
            const internalService = provider?.getInternalProductService?.();
            internalService?.clearCaches?.();
        }
        else if (printfulService?.clearCaches) {
            printfulService.clearCaches();
        }
    }
    catch (cacheError) {
        console.warn("[DEBUG] Failed to clear Printful caches after import", cacheError);
    }
    return {
        success: errors.length === 0,
        imported: importedProducts.length,
        failed: errors.length,
        skipped: skippedProducts,
        skipped_count: skippedProducts.length,
        imported_products: importedProducts,
        errors
    };
}
async function processSync(syncId, action, provider) {
    // Placeholder for async processing
}
exports.middlewares = [
    (0, medusa_1.authenticate)("admin", ["session", "bearer"]),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3Qtc3luYy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUF3QkEsa0JBZ0xDO0FBRUQsb0JBNEJDO0FBRUQsd0NBMGlCQztBQWp4QkQscURBQW1EO0FBRW5ELDZDQUErQztBQUMvQyxtRkFBNkU7QUFlN0UsZ0VBQWdFO0FBQ2hFLElBQUksUUFBUSxHQUFjLEVBQUUsQ0FBQTtBQUU1Qix3RkFBd0Y7QUFFakYsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLENBQUMsQ0FBQTtJQUNsRCxJQUFJLENBQUM7UUFDSCxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBUSxDQUFBO1FBQ2xFLE1BQU0scUJBQXFCLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsNkJBQTZCLENBQVEsQ0FBQTtRQUVyRixNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsT0FBTyxDQUFBO1FBQzlCLE1BQU0sb0JBQW9CLEdBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUV2RixNQUFNLENBQUMsMEJBQTBCLEVBQUUsc0JBQXNCLEVBQUUsZUFBZSxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQzlGLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDNUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDdkQsT0FBTyxFQUFFLENBQUE7WUFDWCxDQUFDLENBQUM7WUFDRixvQkFBb0IsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFD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