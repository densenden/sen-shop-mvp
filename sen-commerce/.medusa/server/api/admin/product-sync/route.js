"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const medusa_1 = require("@medusajs/medusa");
// In-memory storage for sync logs (in production, use database)
let syncLogs = [];
// Helper function to download and upload image to Medusa
async function downloadAndUploadImage(imageUrl, req) {
    try {
        console.log(`[DEBUG] Downloading image: ${imageUrl}`);
        // Download image
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const fileName = `imported-${Date.now()}.${contentType.split('/')[1] || 'jpg'}`;
        // Get file service to upload the image
        const fileModuleService = req.scope.resolve(utils_1.Modules.FILE);
        // Create a File object from the buffer
        const file = new File([buffer], fileName, { type: contentType });
        // Upload the file
        const uploadResult = await fileModuleService.uploadFiles([{
                file,
                fileName
            }]);
        console.log(`[DEBUG] Image uploaded successfully:`, uploadResult[0]?.url);
        return uploadResult[0]?.url || imageUrl; // Fallback to original URL if upload fails
    }
    catch (error) {
        console.error(`[DEBUG] Failed to download/upload image ${imageUrl}:`, error);
        return imageUrl; // Fallback to original URL
    }
}
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
                    console.log(`Fetched product:`, printfulProduct ? 'Success' : 'Null');
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
                // Try to generate mockups if we have artwork
                let mockupUrls = [];
                if (artworkUrl && variants.length > 0 && printfulService.generateAndWaitForMockups) {
                    try {
                        console.log(`Attempting to generate mockups for product ${productId} with artwork ${artworkUrl}`);
                        const variantIds = variants.slice(0, 3).map(v => v.id);
                        mockupUrls = await printfulService.generateAndWaitForMockups(productId, variantIds, artworkUrl, 20000);
                        console.log(`Successfully generated ${mockupUrls.length} mockups`);
                    }
                    catch (mockupError) {
                        console.warn(`Failed to generate mockups for product ${productId}:`, mockupError.message || mockupError);
                        // Continue with import even if mockups fail
                    }
                }
                else {
                    console.log('Skipping mockup generation - method not available or missing artwork/variants');
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
                // If no valid price found, set reasonable defaults based on product type
                if (price === 0 || isNaN(price)) {
                    // Set default prices for POD products ($15-$35 range)
                    const defaultPrices = [1500, 2000, 2500, 3000, 3500]; // $15-$35
                    price = defaultPrices[Math.floor(Math.random() * defaultPrices.length)];
                    console.log(`Set default price $${price / 100} for product: ${productName}`);
                }
                // Use the proper workflow to create products with prices
                const { createProductsWorkflow } = await import("@medusajs/core-flows");
                // Build options based on available attributes
                const productOptions = [];
                const hasMultipleSizes = sizeValues.size > 1;
                const hasMultipleColors = colorValues.size > 1;
                if (hasMultipleSizes) {
                    productOptions.push({
                        title: "Size",
                        values: Array.from(sizeValues)
                    });
                }
                if (hasMultipleColors) {
                    productOptions.push({
                        title: "Color",
                        values: Array.from(colorValues)
                    });
                }
                // If no options, add a default one
                if (productOptions.length === 0) {
                    productOptions.push({
                        title: "Size",
                        values: ["One Size"]
                    });
                }
                // Create product variants for Medusa
                const medusaVariants = variants.map((variant, index) => {
                    console.log(`Creating medusa variant ${index} from:`, variant);
                    const variantOptions = {};
                    if (hasMultipleSizes) {
                        variantOptions["Size"] = String(variant.size || "One Size");
                    }
                    if (hasMultipleColors) {
                        variantOptions["Color"] = String(variant.color || "Default");
                    }
                    if (!hasMultipleSizes && !hasMultipleColors) {
                        variantOptions["Size"] = "One Size";
                    }
                    const variantPrice = parseFloat(String(variant.price || "25.00"));
                    return {
                        title: String(variant.name),
                        sku: `pod-${productId}-${String(variant.id)}`,
                        manage_inventory: false,
                        allow_backorder: true,
                        options: variantOptions,
                        prices: [
                            {
                                amount: Math.round(isNaN(variantPrice) ? 2500 : variantPrice * 100),
                                currency_code: "usd",
                            }
                        ]
                    };
                });
                // Process all Printful images as CDN URLs - no downloading
                const allPrintfulImages = [];
                if (productThumbnail) {
                    allPrintfulImages.push(productThumbnail);
                }
                // Add variant images if available
                for (const variant of variants) {
                    if (variant.image) {
                        allPrintfulImages.push(variant.image);
                    }
                }
                // Use CDN URLs directly - no downloading
                const allImageUrls = [...allPrintfulImages, ...mockupUrls].filter(Boolean);
                const cdnImages = allImageUrls; // Keep all as CDN URLs
                console.log(`[DEBUG] Using ${cdnImages.length} CDN image URLs for product ${productId}`);
                const productInput = {
                    title: productName,
                    status: "published",
                    description: productDescription,
                    thumbnail: cdnImages[0] || productThumbnail,
                    images: cdnImages.map(url => ({ url })),
                    options: productOptions,
                    variants: medusaVariants,
                    sales_channels: [{ id: defaultSalesChannel.id }],
                    metadata: {
                        fulfillment_type: "printful_pod",
                        printful_product_id: productId,
                        product_type: "store",
                        mockup_urls: mockupUrls,
                        artwork_url: artworkUrl,
                        original_thumbnail: productThumbnail,
                    },
                };
                const { result } = await createProductsWorkflow(req.scope).run({
                    input: { products: [productInput] }
                });
                console.log(`[DEBUG] Workflow result structure:`, JSON.stringify(result, null, 2));
                // Handle different possible result structures
                if (result && result.products && Array.isArray(result.products)) {
                    medusaProduct = result.products[0];
                }
                else if (result && Array.isArray(result)) {
                    medusaProduct = result[0];
                }
                else if (result) {
                    medusaProduct = result;
                }
                else {
                    throw new Error("No result returned from product creation workflow");
                }
                console.log(`[DEBUG] Created medusaProduct:`, medusaProduct ? 'Success' : 'Null');
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
            importedProducts.push(medusaProduct);
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
    return { success: true, imported: importedProducts.length, failed: errors.length, errors };
}
async function processSync(syncId, action, provider) {
    // Placeholder for async processing
}
exports.middlewares = [
    (0, medusa_1.authenticate)("admin", ["session", "bearer"]),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3Qtc3luYy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUF5REEsa0JBOEVDO0FBRUQsb0JBNEJDO0FBcEtELHFEQUFtRDtBQUVuRCw2Q0FBZ0Q7QUFlaEQsZ0VBQWdFO0FBQ2hFLElBQUksUUFBUSxHQUFjLEVBQUUsQ0FBQTtBQUU1Qix5REFBeUQ7QUFDekQsS0FBSyxVQUFVLHNCQUFzQixDQUFDLFFBQWdCLEVBQUUsR0FBa0I7SUFDdEUsSUFBSSxDQUFDO1FBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUVyRCxpQkFBaUI7UUFDakIsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFBO1FBQ2hFLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUMzQyxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxZQUFZLENBQUE7UUFDeEUsTUFBTSxRQUFRLEdBQUcsWUFBWSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQTtRQUUvRSx1Q0FBdUM7UUFDdkMsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFekQsdUNBQXVDO1FBQ3ZDLE1BQU0sSUFBSSxH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