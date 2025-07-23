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
            printfulProducts = await printfulService.fetchStoreProducts();
            existingPrintfulProducts = await printfulService.listPrintfulProducts();
        }
        catch (error) {
            console.log("Printful service not available:", error.message);
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
                id: p.id,
                name: p.name,
                description: p.description,
                thumbnail_url: p.thumbnail_url,
                status: 'available',
                provider: 'printful',
                already_imported: existingPrintfulProducts.some(ep => ep.printful_product_id === p.id)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3Qtc3luYy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTZCQSxrQkE2RUM7QUFFRCxvQkErQkM7QUEzSUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrREFBa0QsQ0FBQyxDQUFBO0FBRy9ELHFEQUFtRDtBQXVCbkQsZ0VBQWdFO0FBQ2hFLElBQUksUUFBUSxHQUFjLEVBQUUsQ0FBQTtBQUVyQixLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFBO0lBQ2xELElBQUksQ0FBQztRQUNILElBQUksZ0JBQWdCLEdBQVUsRUFBRSxDQUFBO1FBQ2hDLElBQUksZUFBZSxHQUFVLEVBQUUsQ0FBQTtRQUMvQixJQUFJLHdCQUF3QixHQUFVLEVBQUUsQ0FBQTtRQUV4QywrQkFBK0I7UUFDL0IsSUFBSSxDQUFDO1lBQ0gsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQVEsQ0FBQTtZQUNsRSxnQkFBZ0IsR0FBRyxNQUFNLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO1lBQzdELHdCQUF3QixHQUFHLE1BQU0sZUFBZSxDQUFDLG9CQUFvQixFQUFFLENBQUE7UUFDekUsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUMvRCxDQUFDO1FBRUQsOEJBQThCO1FBQzlCLElBQUksQ0FBQztZQUNILE1BQU0scUJBQXFCLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsNkJBQTZCLENBQVEsQ0FBQTtZQUNyRixlQUFlLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxtQkFB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