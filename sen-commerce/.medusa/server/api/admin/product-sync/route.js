"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
exports.POST = POST;
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
        const productModuleService = req.scope.resolve(utils_1.Modules.PRODUCT);
        const [printfulStoreProducts, existingMedusaProducts, digitalProducts] = await Promise.all([
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
        const availableProducts = {
            printful: printfulStoreProducts.map(p => {
                const productId = p.id || p.external_id;
                const alreadyImported = existingMedusaProducts.some((mp) => mp.metadata && mp.metadata.printful_product_id === productId);
                return {
                    id: productId,
                    name: p.name,
                    description: p.description || `${p.name} - Available for custom printing`,
                    thumbnail_url: p.thumbnail_url || p.image,
                    status: 'available',
                    provider: 'printful',
                    already_imported: alreadyImported,
                    product_type: p.product_type || 'store',
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
async function importProducts(req, provider, productIds) {
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
                    throw new Error(`Product with Printful ID ${productId} already exists in Medusa as "${existingProduct.title}"`);
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
                if (variants && variants.length > 0 && variants[0]) {
                    const firstVariant = variants[0];
                    const variantPrice = firstVariant.price;
                    if (variantPrice && !isNaN(parseFloat(variantPrice.toString()))) {
                        price = Math.round(parseFloat(variantPrice.toString()) * 100);
                    }
                }
                // Fallback to product price if available
                if (price === 0 && printfulProduct && printfulProduct.price && !isNaN(parseFloat(printfulProduct.price.toString()))) {
                    price = Math.round(parseFloat(printfulProduct.price.toString()) * 100);
                }
                // If no valid price found, skip the product instead of using hardcoded fallbacks
                if (price === 0 || isNaN(price)) {
                    console.log(`Skipping product ${productName} - no valid price found and no hardcoded fallbacks`);
                    skippedProducts.push({
                        name: productName,
                        reason: 'No valid price found'
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
    return { success: true, imported: importedProducts.length, failed: errors.length, imported_products: importedProducts, errors };
}
async function processSync(syncId, action, provider) {
    // Placeholder for async processing
}
exports.middlewares = [
    (0, medusa_1.authenticate)("admin", ["session", "bearer"]),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3Qtc3luYy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUF3QkEsa0JBOEVDO0FBRUQsb0JBNEJDO0FBbklELHFEQUFtRDtBQUVuRCw2Q0FBK0M7QUFDL0MsbUZBQTZFO0FBZTdFLGdFQUFnRTtBQUNoRSxJQUFJLFFBQVEsR0FBYyxFQUFFLENBQUE7QUFFNUIsd0ZBQXdGO0FBRWpGLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxDQUFDLENBQUE7SUFDbEQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQVEsQ0FBQTtRQUNsRSxNQUFNLHFCQUFxQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLDZCQUE2QixDQUFRLENBQUE7UUFFckYsTUFBTSxvQkFBb0IsR0FBMEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXZGLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxzQkFBc0IsRUFBRSxlQUFlLENBQUMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDekYsZUFBZSxDQUFDLGFBQWEsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUM1QyxPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUN2RCxPQUFPLEVBQUUsQ0FBQTtZQUNYLENBQUMsQ0FBQztZQUNGLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDbEQsT0FBTyxDQUFDLEtB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