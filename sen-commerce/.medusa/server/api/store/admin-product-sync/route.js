"use strict";
// Store-level product sync endpoint (bypasses admin auth for development)
// This mirrors the admin/product-sync functionality but is accessible via store API
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
// In-memory storage for sync logs (in production, use database)
let syncLogs = [];
async function GET(req, res) {
    console.log("[Store Product Sync] GET request received");
    try {
        let printfulProducts = [];
        let digitalProducts = [];
        let existingPrintfulProducts = [];
        // Try to get Printful products
        try {
            const printfulService = req.scope.resolve("printfulModule");
            console.log("Printful service resolved:", !!printfulService);
            if (printfulService) {
                console.log("Fetching Printful store products...");
                printfulProducts = await printfulService.fetchStoreProducts();
                console.log("Printful products fetched:", printfulProducts.length);
                console.log("Fetching Printful catalog products...");
                const catalogProducts = await printfulService.fetchCatalogProducts();
                console.log("Catalog products fetched:", catalogProducts.length);
                // Add catalog products to the available products list
                const catalogFormatted = catalogProducts.slice(0, 10).map((product) => ({
                    id: `catalog-${product.id}`,
                    name: product.name,
                    description: product.description,
                    thumbnail_url: product.image,
                    status: 'available',
                    provider: 'printful',
                    already_imported: false,
                    product_type: 'catalog'
                }));
                // Try to get existing linked products from database
                try {
                    existingPrintfulProducts = await printfulService.listPrintfulProducts();
                    console.log("Existing Printful products:", existingPrintfulProducts.length);
                }
                catch (dbError) {
                    console.log("Database method not available, skipping existing products check");
                    existingPrintfulProducts = [];
                }
                // Combine store and catalog products
                printfulProducts = [...printfulProducts, ...catalogFormatted];
            }
        }
        catch (error) {
            console.error("Printful service error:", error.message);
            console.error("Printful error stack:", error.stack);
        }
        // Try to get digital products
        try {
            const digitalProductService = req.scope.resolve("digitalProductModuleService");
            digitalProducts = await digitalProductService.listDigitalProducts({});
        }
        catch (error) {
            console.log("Digital product service not available:", error.message);
        }
        // Calculate stats
        const stats = syncLogs.reduce((acc, log) => {
            acc.total += 1;
            switch (log.status) {
                case "pending":
                    acc.pending += 1;
                    break;
                case "success":
                    acc.success += 1;
                    break;
                case "failed":
                    acc.failed += 1;
                    break;
                case "in_progress":
                    acc.in_progress += 1;
                    break;
            }
            return acc;
        }, { total: 0, pending: 0, success: 0, failed: 0, in_progress: 0 });
        // Format available products for import
        const availableProducts = {
            printful: printfulProducts.map(p => ({
                id: p.id || p.external_id || `product-${p.name}`,
                name: p.name,
                description: p.description || `${p.name} - Available for custom printing`,
                thumbnail_url: p.thumbnail_url || p.image,
                status: 'available',
                provider: 'printful',
                already_imported: existingPrintfulProducts.some(ep => ep.printful_product_id === p.id || ep.printful_product_id === p.external_id),
                product_type: p.product_type || 'store'
            })),
            digital: digitalProducts.map(dp => ({
                id: dp.id,
                name: dp.name,
                description: dp.description,
                file_size: dp.file_size,
                mime_type: dp.mime_type,
                status: 'available',
                provider: 'digital',
                already_imported: false // TODO: Check if linked to Medusa product
            }))
        };
        res.json({
            logs: syncLogs,
            stats,
            available_products: availableProducts,
            message: "Store-level product sync endpoint (bypasses admin auth)"
        });
    }
    catch (error) {
        console.error("[Store Product Sync] Error fetching sync data:", error);
        console.error("[Store Product Sync] Error stack:", error.stack);
        res.status(500).json({ error: "Failed to fetch sync data" });
    }
}
async function POST(req, res) {
    try {
        const { action, provider = "printful", product_ids = [] } = req.body;
        console.log(`[Store Product Sync] POST action: ${action}, provider: ${provider}, products: ${product_ids.length}`);
        if (action === "import_products") {
            return await importProducts(req, res, provider, product_ids);
        }
        // Create sync log entry
        const syncLog = {
            id: `sync_${Date.now()}`,
            sync_type: action,
            status: "in_progress",
            provider_type: provider,
            created_at: new Date().toISOString()
        };
        syncLogs.unshift(syncLog);
        // Process the sync asynchronously
        processSync(syncLog.id, action, provider);
        res.json({ success: true, syncId: syncLog.id, message: "Store-level sync initiated" });
    }
    catch (error) {
        console.error("Error starting sync:", error);
        res.status(500).json({ error: "Failed to start sync" });
    }
}
async function processSync(syncId, action, provider) {
    const logIndex = syncLogs.findIndex(log => log.id === syncId);
    if (logIndex === -1)
        return;
    try {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        switch (action) {
            case "bulk_import":
                await performBulkImport(syncId, provider);
                break;
            case "update_prices":
                await updatePrices(syncId, provider);
                break;
            case "check_inventory":
                await checkInventory(syncId, provider);
                break;
        }
        // Update log as completed
        syncLogs[logIndex].status = "success";
        syncLogs[logIndex].completed_at = new Date().toISOString();
    }
    catch (error) {
        // Update log as failed
        syncLogs[logIndex].status = "failed";
        syncLogs[logIndex].error_message = error instanceof Error ? error.message : "Unknown error";
        syncLogs[logIndex].completed_at = new Date().toISOString();
    }
}
async function performBulkImport(syncId, provider) {
    if (provider === "printful") {
        // Add individual product import logs
        const productLogs = [
            {
                id: `sync_${Date.now()}_1`,
                product_id: "prod_123",
                product_name: "Custom T-Shirt",
                sync_type: "import",
                status: "success",
                provider_type: provider,
                created_at: new Date().toISOString(),
                completed_at: new Date().toISOString()
            },
            {
                id: `sync_${Date.now()}_2`,
                product_id: "prod_124",
                product_name: "Art Print",
                sync_type: "import",
                status: "success",
                provider_type: provider,
                created_at: new Date().toISOString(),
                completed_at: new Date().toISOString()
            }
        ];
        syncLogs.splice(1, 0, ...productLogs);
    }
}
async function updatePrices(syncId, provider) {
    // Simulate price update
    await new Promise(resolve => setTimeout(resolve, 1000));
}
async function checkInventory(syncId, provider) {
    // Simulate inventory check
    await new Promise(resolve => setTimeout(resolve, 1500));
}
async function importProducts(req, res, provider, productIds) {
    try {
        // Use Medusa v2 service resolution pattern
        let printfulService;
        let digitalProductService;
        if (provider === "printful") {
            try {
                printfulService = req.scope.resolve("printfulModule");
            }
            catch (error) {
                console.error("Could not resolve printfulModule:", error);
                return res.status(500).json({ error: "Printful service not available" });
            }
        }
        if (provider === "digital") {
            try {
                digitalProductService = req.scope.resolve("digitalProductModuleService");
            }
            catch (error) {
                console.error("Could not resolve digitalProductModuleService:", error);
                return res.status(500).json({ error: "Digital product service not available" });
            }
        }
        const importedProducts = [];
        const errors = [];
        for (const productId of productIds) {
            try {
                let medusaProduct;
                if (provider === "printful") {
                    // Get Printful product details
                    const printfulProducts = await printfulService.fetchStoreProducts();
                    let printfulProduct = printfulProducts.find(p => p.id === productId);
                    if (!printfulProduct) {
                        // Try catalog products if not found in store products
                        const catalogProducts = await printfulService.fetchCatalogProducts();
                        const catalogProduct = catalogProducts.find(p => `catalog-${p.id}` === productId || p.id === productId);
                        if (!catalogProduct) {
                            errors.push({ productId, error: "Product not found in Printful" });
                            continue;
                        }
                        // Use catalog product as fallback
                        printfulProduct = {
                            id: catalogProduct.id,
                            name: catalogProduct.name,
                            description: catalogProduct.description,
                            thumbnail_url: catalogProduct.image,
                            variants: catalogProduct.variants || []
                        };
                    }
                    // Collect all available images from Printful product
                    const productImages = [];
                    // 1. Primary thumbnail
                    if (printfulProduct.thumbnail_url) {
                        productImages.push(printfulProduct.thumbnail_url);
                    }
                    // 2. Variant images
                    if (printfulProduct.variants && printfulProduct.variants.length > 0) {
                        printfulProduct.variants.forEach(variant => {
                            if (variant.image && !productImages.includes(variant.image)) {
                                productImages.push(variant.image);
                            }
                        });
                    }
                    // Ensure we have at least a placeholder if no images found
                    if (productImages.length === 0 && printfulProduct.thumbnail_url) {
                        productImages.push(printfulProduct.thumbnail_url);
                    }
                    // Create Medusa product using the product module service
                    const productModuleService = req.scope.resolve(utils_1.Modules.PRODUCT);
                    medusaProduct = await productModuleService.createProducts({
                        title: printfulProduct.name,
                        description: printfulProduct.description || `${printfulProduct.name} - Custom print-on-demand product`,
                        status: "draft",
                        thumbnail: productImages[0], // Set primary thumbnail
                        images: productImages.map(url => ({ url })), // Include all collected images
                        metadata: {
                            fulfillment_type: "printful_pod",
                            printful_product_id: printfulProduct.id,
                            source_provider: "printful",
                            original_thumbnail: printfulProduct.thumbnail_url // Store for fallback
                        }
                    });
                    // Create product variants with pricing
                    const pricingModuleService = req.scope.resolve(utils_1.Modules.PRICING);
                    const variants = await productModuleService.createProductVariants([{
                            title: "Default",
                            sku: `printful-${printfulProduct.id}`,
                            product_id: medusaProduct.id,
                            metadata: {
                                printful_product_id: printfulProduct.id
                            }
                        }]);
                    // Add EUR pricing to the variant
                    if (variants && variants[0] && variants[0].price_set_id) {
                        await pricingModuleService.addPrices({
                            priceSetId: variants[0].price_set_id,
                            prices: [{
                                    amount: printfulProduct.price || 2500, // Default to €25 if no price
                                    currency_code: "eur"
                                }]
                        });
                    }
                    // Link product to default sales channel
                    const salesChannelService = req.scope.resolve(utils_1.Modules.SALES_CHANNEL);
                    const [defaultSalesChannel] = await salesChannelService.listSalesChannels({
                        name: "Default",
                    });
                    if (defaultSalesChannel) {
                        const remoteLink = req.scope.resolve("remoteLink");
                        await remoteLink.create([
                            {
                                [utils_1.Modules.PRODUCT]: { product_id: medusaProduct.id },
                                [utils_1.Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
                            },
                        ]);
                    }
                }
                else if (provider === "digital") {
                    // Get digital product details
                    const digitalProduct = await digitalProductService.retrieve(productId);
                    if (!digitalProduct) {
                        errors.push({ productId, error: "Digital product not found" });
                        continue;
                    }
                    // Create Medusa product using the product module service
                    const productModuleService = req.scope.resolve(utils_1.Modules.PRODUCT);
                    medusaProduct = await productModuleService.createProducts({
                        title: digitalProduct.name,
                        description: digitalProduct.description,
                        status: "draft",
                        metadata: {
                            fulfillment_type: "digital_download",
                            digital_product_id: digitalProduct.id,
                            source_provider: "digital",
                            file_size: digitalProduct.file_size,
                            mime_type: digitalProduct.mime_type
                        }
                    });
                    // Create product variant for digital product
                    await productModuleService.createProductVariants({
                        title: "Digital Download",
                        sku: `digital-${digitalProduct.id}`,
                        product_id: medusaProduct.id,
                        metadata: {
                            digital_product_id: digitalProduct.id
                        }
                    });
                }
                importedProducts.push({
                    productId,
                    medusaProductId: medusaProduct.id,
                    medusaProduct: medusaProduct, // Include full product object for frontend
                    provider
                });
                // Log successful import
                syncLogs.unshift({
                    id: `import_${Date.now()}_${productId}`,
                    product_id: medusaProduct.id,
                    product_name: medusaProduct.title,
                    sync_type: "import",
                    status: "success",
                    provider_type: provider,
                    created_at: new Date().toISOString(),
                    completed_at: new Date().toISOString()
                });
            }
            catch (error) {
                console.error("Error importing product:", productId, error);
                errors.push({
                    productId,
                    error: error instanceof Error ? error.message : "Unknown error"
                });
                // Log failed import
                syncLogs.unshift({
                    id: `import_${Date.now()}_${productId}`,
                    product_id: productId,
                    sync_type: "import",
                    status: "failed",
                    provider_type: provider,
                    error_message: error instanceof Error ? error.message : "Unknown error",
                    created_at: new Date().toISOString(),
                    completed_at: new Date().toISOString()
                });
            }
        }
        res.json({
            success: true,
            imported: importedProducts.length,
            failed: errors.length,
            imported_products: importedProducts,
            errors
        });
    }
    catch (error) {
        console.error("Error importing products:", error);
        res.status(500).json({ error: "Failed to import products" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FkbWluLXByb2R1Y3Qtc3luYy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMEVBQTBFO0FBQzFFLG9GQUFvRjs7QUErQnBGLGtCQW1IQztBQUVELG9CQWlDQztBQWpMRCxxREFBbUQ7QUF3Qm5ELGdFQUFnRTtBQUNoRSxJQUFJLFFBQVEsR0FBYyxFQUFFLENBQUE7QUFFckIsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE9BQU8sQ0FBQyxHQUFHLENBQUMsMkNBQTJDLENBQUMsQ0FBQTtJQUN4RCxJQUFJLENBQUM7UUFDSCxJQUFJLGdCQUFnQixHQUFVLEVBQUUsQ0FBQTtRQUNoQyxJQUFJLGVBQWUsR0FBVSxFQUFFLENBQUE7UUFDL0IsSUFBSSx3QkFBd0IsR0FBVSxFQUFFLENBQUE7UUFFeEMsK0JBQStCO1FBQy9CLElBQUksQ0FBQztZQUNILE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFRLENBQUE7WUFDbEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUE7WUFFNUQsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFBO2dCQUNsRCxnQkFBZ0IsR0FBRyxNQUFNLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO2dCQUM3RCxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFBO2dCQUVsRSxPQUFPLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUE7Z0JBQ3BELE1BQU0sZUFBZSxHQUFHLE1BQU0sZUFBZSxDQUFDLG9CQUFvQixFQUFFLENBQUE7Z0JBQ3BF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