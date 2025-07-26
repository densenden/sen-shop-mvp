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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FkbWluLXByb2R1Y3Qtc3luYy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMEVBQTBFO0FBQzFFLG9GQUFvRjs7QUE4QnBGLGtCQW1IQztBQUVELG9CQWlDQztBQWhMRCxxREFBbUQ7QUF1Qm5ELGdFQUFnRTtBQUNoRSxJQUFJLFFBQVEsR0FBYyxFQUFFLENBQUE7QUFFckIsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE9BQU8sQ0FBQyxHQUFHLENBQUMsMkNBQTJDLENBQUMsQ0FBQTtJQUN4RCxJQUFJLENBQUM7UUFDSCxJQUFJLGdCQUFnQixHQUFVLEVBQUUsQ0FBQTtRQUNoQyxJQUFJLGVBQWUsR0FBVSxFQUFFLENBQUE7UUFDL0IsSUFBSSx3QkFBd0IsR0FBVSxFQUFFLENBQUE7UUFFeEMsK0JBQStCO1FBQy9CLElBQUksQ0FBQztZQUNILE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFRLENBQUE7WUFDbEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUE7WUFFNUQsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFBO2dCQUNsRCxnQkFBZ0IsR0FBRyxNQUFNLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO2dCQUM3RCxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFBO2dCQUVsRSxPQUFPLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUE7Z0JBQ3BELE1BQU0sZUFBZSxHQUFHLE1BQU0sZUFBZSxDQUFDLG9CQUFvQixFQUFFLENBQUE7Z0JBQ3BFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFBO2dCQUVoRSxzREFBc0Q7Z0JBQ3RELE1BQU0sZ0JBQWdCLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUMzRSxFQUFFLEVBQUUsV0FBVyxPQUFPLENBQUMsRUFBRSxFQUFFO29CQUMzQixJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7b0JBQ2xCLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztvQkFDaEMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxLQUFLO29CQUM1QixNQUFNLEVBQUUsV0FBVztvQkFDbkIsUUFBUSxFQUFFLFVBQVU7b0JBQ3BCLGdCQUFnQixFQUFFLEtBQUs7b0JBQ3ZCLFlBQVksRUFBRSxTQUFTO2lCQUN4QixDQUFDLENBQUMsQ0FBQTtnQkFFSCxvREFBb0Q7Z0JBQ3BELElBQUksQ0FBQztvQkFDSCx3QkFBd0IsR0FBRyxNQUFNLGVBQWUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFBO29CQUN2RSxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixFQUFFLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFBO2dCQUM3RSxDQUFDO2dCQUFDLE9BQU8sT0FBTyxFQUFFLENBQUM7b0JBQ2pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUVBQWlFLENBQUMsQ0FBQTtvQkFDOUUsd0JBQXdCLEdBQUcsRUFBRSxDQUFBO2dCQUMvQixDQUFDO2dCQUVELHFDQUFxQztnQkFDckMsZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLGdCQUFnQixFQUFFLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQTtZQUMvRCxDQUFDO1FBQ0gsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN2RCxPQUFPLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNyRCxDQUFDO1FBRUQsOEJBQThCO1FBQzlCLElBQUksQ0FBQztZQUNILE1BQU0scUJBQXFCLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsNkJBQTZCLENBQVEsQ0FBQTtZQUNyRixlQUFlLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN2RSxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3RFLENBQUM7UUFFRCxrQkFBa0I7UUFDbEIsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUN6QyxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQTtZQUNkLFFBQVEsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuQixLQUFLLFNBQVM7b0JBQ1osR0FBRyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUE7b0JBQ2hCLE1BQUs7Z0JBQ1AsS0FBSyxTQUFTO29CQUNaLEdBQUcsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFBO29CQUNoQixNQUFLO2dCQUNQLEtBQUssUUFBUTtvQkFDWCxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQTtvQkFDZixNQUFLO2dCQUNQLEtBQUssYUFBYTtvQkFDaEIsR0FBRyxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUE7b0JBQ3BCLE1BQUs7WUFDVCxDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUE7UUFDWixDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBRW5FLHVDQUF1QztRQUN2QyxNQUFNLGlCQUFpQixHQUFHO1lBQ3hCLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNuQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxDQUFDLElBQUksRUFBRTtnQkFDaEQsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO2dCQUNaLFdBQVcsRUFBRSxDQUFDLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksa0NBQWtDO2dCQUN6RSxhQUFhLEVBQUUsQ0FBQyxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUMsS0FBSztnQkFDekMsTUFBTSxFQUFFLFdBQVc7Z0JBQ25CLFFBQVEsRUFBRSxVQUFVO2dCQUNwQixnQkFBZ0IsRUFBRSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FDbkQsRUFBRSxDQUFDLG1CQUFtQixLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLG1CQUFtQixLQUFLLENBQUMsQ0FBQyxXQUFXLENBQzVFO2dCQUNELFlBQVksRUFBRSxDQUFDLENBQUMsWUFBWSxJQUFJLE9BQU87YUFDeEMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxFQUFFLGVBQWUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNsQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJO2dCQUNiLFdBQVcsRUFBRSxFQUFFLENBQUMsV0FBVztnQkFDM0IsU0FBUyxFQUFFLEVBQUUsQ0FBQyxTQUFTO2dCQUN2QixTQUFTLEVBQUUsRUFBRSxDQUFDLFNBQVM7Z0JBQ3ZCLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixRQUFRLEVBQUUsU0FBUztnQkFDbkIsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLDBDQUEwQzthQUNuRSxDQUFDLENBQUM7U0FDSixDQUFBO1FBRUQsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLElBQUksRUFBRSxRQUFRO1lBQ2QsS0FBSztZQUNMLGtCQUFrQixFQUFFLGlCQUFpQjtZQUNyQyxPQUFPLEVBQUUseURBQXlEO1NBQ25FLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxnREFBZ0QsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN0RSxPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMvRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSwyQkFBMkIsRUFBRSxDQUFDLENBQUE7SUFDOUQsQ0FBQztBQUNILENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEdBQUcsVUFBVSxFQUFFLFdBQVcsR0FBRyxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFJL0QsQ0FBQTtRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLE1BQU0sZUFBZSxRQUFRLGVBQWUsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFFbEgsSUFBSSxNQUFNLEtBQUssaUJBQWlCLEVBQUUsQ0FBQztZQUNqQyxPQUFPLE1BQU0sY0FBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFBO1FBQzlELENBQUM7UUFFRCx3QkFBd0I7UUFDeEIsTUFBTSxPQUFPLEdBQVk7WUFDdkIsRUFBRSxFQUFFLFFBQVEsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ3hCLFNBQVMsRUFBRSxNQUFNO1lBQ2pCLE1BQU0sRUFBRSxhQUFhO1lBQ3JCLGFBQWEsRUFBRSxRQUFRO1lBQ3ZCLFVBQVUsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNyQyxDQUFBO1FBRUQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUV6QixrQ0FBa0M7UUFDbEMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBRXpDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxDQUFDLENBQUE7SUFDeEYsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzVDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHNCQUFzQixFQUFFLENBQUMsQ0FBQTtJQUN6RCxDQUFDO0FBQ0gsQ0FBQztBQUVELEtBQUssVUFBVSxXQUFXLENBQUMsTUFBYyxFQUFFLE1BQWMsRUFBRSxRQUFnQjtJQUN6RSxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxNQUFNLENBQUMsQ0FBQTtJQUM3RCxJQUFJLFFBQVEsS0FBSyxDQUFDLENBQUM7UUFBRSxPQUFNO0lBRTNCLElBQUksQ0FBQztRQUNILDJCQUEyQjtRQUMzQixNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFBO1FBRXZELFFBQVEsTUFBTSxFQUFFLENBQUM7WUFDZixLQUFLLGFBQWE7Z0JBQ2hCLE1BQU0saUJBQWlCLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO2dCQUN6QyxNQUFLO1lBQ1AsS0FBSyxlQUFlO2dCQUNsQixNQUFNLFlBQVksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7Z0JBQ3BDLE1BQUs7WUFDUCxLQUFLLGlCQUFpQjtnQkFDcEIsTUFBTSxjQUFjLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO2dCQUN0QyxNQUFLO1FBQ1QsQ0FBQztRQUVELDBCQUEwQjtRQUMxQixRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQTtRQUNyQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsWUFBWSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDNUQsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZix1QkFBdUI7UUFDdkIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUE7UUFDcEMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsR0FBRyxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUE7UUFDM0YsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBQzVELENBQUM7QUFDSCxDQUFDO0FBRUQsS0FBSyxVQUFVLGlCQUFpQixDQUFDLE1BQWMsRUFBRSxRQUFnQjtJQUMvRCxJQUFJLFFBQVEsS0FBSyxVQUFVLEVBQUUsQ0FBQztRQUM1QixxQ0FBcUM7UUFDckMsTUFBTSxXQUFXLEdBQUc7WUFDbEI7Z0JBQ0UsRUFBRSxFQUFFLFFBQVEsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJO2dCQUMxQixVQUFVLEVBQUUsVUFBVTtnQkFDdEIsWUFBWSxFQUFFLGdCQUFnQjtnQkFDOUIsU0FBUyxFQUFFLFFBQVE7Z0JBQ25CLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixhQUFhLEVBQUUsUUFBUTtnQkFDdkIsVUFBVSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUNwQyxZQUFZLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7YUFDdkM7WUFDRDtnQkFDRSxFQUFFLEVBQUUsUUFBUSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUk7Z0JBQzFCLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixZQUFZLEVBQUUsV0FBVztnQkFDekIsU0FBUyxFQUFFLFFBQVE7Z0JBQ25CLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixhQUFhLEVBQUUsUUFBUTtnQkFDdkIsVUFBVSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUNwQyxZQUFZLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7YUFDdkM7U0FDRixDQUFBO1FBRUQsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsV0FBVyxDQUFDLENBQUE7SUFDdkMsQ0FBQztBQUNILENBQUM7QUFFRCxLQUFLLFVBQVUsWUFBWSxDQUFDLE1BQWMsRUFBRSxRQUFnQjtJQUMxRCx3QkFBd0I7SUFDeEIsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQTtBQUN6RCxDQUFDO0FBRUQsS0FBSyxVQUFVLGNBQWMsQ0FBQyxNQUFjLEVBQUUsUUFBZ0I7SUFDNUQsMkJBQTJCO0lBQzNCLE1BQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7QUFDekQsQ0FBQztBQUVELEtBQUssVUFBVSxjQUFjLENBQUMsR0FBa0IsRUFBRSxHQUFtQixFQUFFLFFBQWdCLEVBQUUsVUFBb0I7SUFDM0csSUFBSSxDQUFDO1FBQ0gsMkNBQTJDO1FBQzNDLElBQUksZUFBZSxDQUFBO1FBQ25CLElBQUkscUJBQXFCLENBQUE7UUFFekIsSUFBSSxRQUFRLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDO2dCQUNILGVBQWUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBUSxDQUFBO1lBQzlELENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUNBQW1DLEVBQUUsS0FBSyxDQUFDLENBQUE7Z0JBQ3pELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQyxDQUFBO1lBQzFFLENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDM0IsSUFBSSxDQUFDO2dCQUNILHFCQUFxQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLDZCQUE2QixDQUFRLENBQUE7WUFDakYsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxnREFBZ0QsRUFBRSxLQUFLLENBQUMsQ0FBQTtnQkFDdEUsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSx1Q0FBdUMsRUFBRSxDQUFDLENBQUE7WUFDakYsQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLGdCQUFnQixHQUFVLEVBQUUsQ0FBQTtRQUNsQyxNQUFNLE1BQU0sR0FBVSxFQUFFLENBQUE7UUFFeEIsS0FBSyxNQUFNLFNBQVMsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNuQyxJQUFJLENBQUM7Z0JBQ0gsSUFBSSxhQUFhLENBQUE7Z0JBRWpCLElBQUksUUFBUSxLQUFLLFVBQVUsRUFBRSxDQUFDO29CQUM1QiwrQkFBK0I7b0JBQy9CLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxlQUFlLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtvQkFDbkUsTUFBTSxlQUFlLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQTtvQkFFdEUsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO3dCQUNyQixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSwrQkFBK0IsRUFBRSxDQUFDLENBQUE7d0JBQ2xFLFNBQVE7b0JBQ1YsQ0FBQztvQkFFRCx5REFBeUQ7b0JBQ3pELE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO29CQUUvRCxhQUFhLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxjQUFjLENBQUM7d0JBQ3hELEtBQUssRUFBRSxlQUFlLENBQUMsSUFBSTt3QkFDM0IsV0FBVyxFQUFFLGVBQWUsQ0FBQyxXQUFXO3dCQUN4QyxNQUFNLEVBQUUsT0FBTzt3QkFDZixRQUFRLEVBQUU7NEJBQ1IsZ0JBQWdCLEVBQUUsY0FBYzs0QkFDaEMsbUJBQW1CLEVBQUUsZUFBZSxDQUFDLEVBQUU7NEJBQ3ZDLGVBQWUsRUFBRSxVQUFVO3lCQUM1QjtxQkFDRixDQUFDLENBQUE7b0JBRUYsMEJBQTBCO29CQUMxQixNQUFNLG9CQUFvQixDQUFDLHFCQUFxQixDQUFDO3dCQUMvQyxLQUFLLEVBQUUsU0FBUzt3QkFDaEIsR0FBRyxFQUFFLFlBQVksZUFBZSxDQUFDLEVBQUUsRUFBRTt3QkFDckMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxFQUFFO3dCQUM1QixRQUFRLEVBQUU7NEJBQ1IsbUJBQW1CLEVBQUUsZUFBZSxDQUFDLEVBQUU7eUJBQ3hDO3FCQUNGLENBQUMsQ0FBQTtnQkFFSixDQUFDO3FCQUFNLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUNsQyw4QkFBOEI7b0JBQzlCLE1BQU0sY0FBYyxHQUFHLE1BQU0scUJBQXFCLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFBO29CQUV0RSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7d0JBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLDJCQUEyQixFQUFFLENBQUMsQ0FBQTt3QkFDOUQsU0FBUTtvQkFDVixDQUFDO29CQUVELHlEQUF5RDtvQkFDekQsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7b0JBRS9ELGFBQWEsR0FBRyxNQUFNLG9CQUFvQixDQUFDLGNBQWMsQ0FBQzt3QkFDeEQsS0FBSyxFQUFFLGNBQWMsQ0FBQyxJQUFJO3dCQUMxQixXQUFXLEVBQUUsY0FBYyxDQUFDLFdBQVc7d0JBQ3ZDLE1BQU0sRUFBRSxPQUFPO3dCQUNmLFFBQVEsRUFBRTs0QkFDUixnQkFBZ0IsRUFBRSxrQkFBa0I7NEJBQ3BDLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxFQUFFOzRCQUNyQyxlQUFlLEVBQUUsU0FBUzs0QkFDMUIsU0FBUyxFQUFFLGNBQWMsQ0FBQyxTQUFTOzRCQUNuQyxTQUFTLEVBQUUsY0FBYyxDQUFDLFNBQVM7eUJBQ3BDO3FCQUNGLENBQUMsQ0FBQTtvQkFFRiw2Q0FBNkM7b0JBQzdDLE1BQU0sb0JBQW9CLENBQUMscUJBQXFCLENBQUM7d0JBQy9DLEtBQUssRUFBRSxrQkFBa0I7d0JBQ3pCLEdBQUcsRUFBRSxXQUFXLGNBQWMsQ0FBQyxFQUFFLEVBQUU7d0JBQ25DLFVBQVUsRUFBRSxhQUFhLENBQUMsRUFBRTt3QkFDNUIsUUFBUSxFQUFFOzRCQUNSLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxFQUFFO3lCQUN0QztxQkFDRixDQUFDLENBQUE7Z0JBQ0osQ0FBQztnQkFFRCxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7b0JBQ3BCLFNBQVM7b0JBQ1QsZUFBZSxFQUFFLGFBQWEsQ0FBQyxFQUFFO29CQUNqQyxRQUFRO2lCQUNULENBQUMsQ0FBQTtnQkFFRix3QkFBd0I7Z0JBQ3hCLFFBQVEsQ0FBQyxPQUFPLENBQUM7b0JBQ2YsRUFBRSxFQUFFLFVBQVUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLFNBQVMsRUFBRTtvQkFDdkMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxFQUFFO29CQUM1QixZQUFZLEVBQUUsYUFBYSxDQUFDLEtBQUs7b0JBQ2pDLFNBQVMsRUFBRSxRQUFRO29CQUNuQixNQUFNLEVBQUUsU0FBUztvQkFDakIsYUFBYSxFQUFFLFFBQVE7b0JBQ3ZCLFVBQVUsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtvQkFDcEMsWUFBWSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2lCQUN2QyxDQUFDLENBQUE7WUFFSixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDZixPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQTtnQkFDM0QsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDVixTQUFTO29CQUNULEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlO2lCQUNoRSxDQUFDLENBQUE7Z0JBRUYsb0JBQW9CO2dCQUNwQixRQUFRLENBQUMsT0FBTyxDQUFDO29CQUNmLEVBQUUsRUFBRSxVQUFVLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxTQUFTLEVBQUU7b0JBQ3ZDLFVBQVUsRUFBRSxTQUFTO29CQUNyQixTQUFTLEVBQUUsUUFBUTtvQkFDbkIsTUFBTSxFQUFFLFFBQVE7b0JBQ2hCLGFBQWEsRUFBRSxRQUFRO29CQUN2QixhQUFhLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTtvQkFDdkUsVUFBVSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO29CQUNwQyxZQUFZLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7aUJBQ3ZDLENBQUMsQ0FBQTtZQUNKLENBQUM7UUFDSCxDQUFDO1FBRUQsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLE9BQU8sRUFBRSxJQUFJO1lBQ2IsUUFBUSxFQUFFLGdCQUFnQixDQUFDLE1BQU07WUFDakMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLGlCQUFpQixFQUFFLGdCQUFnQjtZQUNuQyxNQUFNO1NBQ1AsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ2pELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLDJCQUEyQixFQUFFLENBQUMsQ0FBQTtJQUM5RCxDQUFDO0FBQ0gsQ0FBQyJ9