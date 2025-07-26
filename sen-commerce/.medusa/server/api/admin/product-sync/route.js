"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
console.log("[Medusa] Loaded /api/admin/product-sync route.ts");
const utils_1 = require("@medusajs/framework/utils");
// In-memory storage for sync logs (in production, use database)
let syncLogs = [];
async function GET(req, res) {
    console.log("[Product Sync] GET request received");
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
            available_products: availableProducts
        });
    }
    catch (error) {
        console.error("[Product Sync] Error fetching sync data:", error);
        console.error("[Product Sync] Error stack:", error.stack);
        res.status(500).json({ error: "Failed to fetch sync data" });
    }
}
async function POST(req, res) {
    try {
        const { action, provider = "printful", product_ids = [] } = req.body;
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
        res.json({ success: true, syncId: syncLog.id });
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
                    const printfulProduct = printfulProducts.find(p => p.id === productId);
                    if (!printfulProduct) {
                        errors.push({ productId, error: "Product not found in Printful" });
                        continue;
                    }
                    // Create Medusa product using the product module service
                    const productModuleService = req.scope.resolve(utils_1.Modules.PRODUCT);
                    medusaProduct = await productModuleService.createProducts({
                        title: printfulProduct.name,
                        description: printfulProduct.description,
                        status: "draft",
                        metadata: {
                            fulfillment_type: "printful_pod",
                            printful_product_id: printfulProduct.id,
                            source_provider: "printful"
                        }
                    });
                    // Create product variants
                    await productModuleService.createProductVariants({
                        title: "Default",
                        sku: `printful-${printfulProduct.id}`,
                        product_id: medusaProduct.id,
                        metadata: {
                            printful_product_id: printfulProduct.id
                        }
                    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3Qtc3luYy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTZCQSxrQkFrSEM7QUFFRCxvQkErQkM7QUFoTEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrREFBa0QsQ0FBQyxDQUFBO0FBRy9ELHFEQUFtRDtBQXVCbkQsZ0VBQWdFO0FBQ2hFLElBQUksUUFBUSxHQUFjLEVBQUUsQ0FBQTtBQUVyQixLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFBO0lBQ2xELElBQUksQ0FBQztRQUNILElBQUksZ0JBQWdCLEdBQVUsRUFBRSxDQUFBO1FBQ2hDLElBQUksZUFBZSxHQUFVLEVBQUUsQ0FBQTtRQUMvQixJQUFJLHdCQUF3QixHQUFVLEVBQUUsQ0FBQTtRQUV4QywrQkFBK0I7UUFDL0IsSUFBSSxDQUFDO1lBQ0gsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQVEsQ0FBQTtZQUNsRSxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQTtZQUU1RCxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxDQUFDLENBQUE7Z0JBQ2xELGdCQUFnQixHQUFHLE1BQU0sZUFBZSxDQUFDLGtCQUFrQixFQUFFLENBQUE7Z0JBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUE7Z0JBRWxFLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQTtnQkFDcEQsTUFBTSxlQUFlLEdBQUcsTUFBTSxlQUFlLENBQUMsb0JBQW9CLEVBQUUs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