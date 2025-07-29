"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const medusa_1 = require("@medusajs/medusa");
// In-memory storage for sync logs (in production, use database)
let syncLogs = [];
async function GET(req, res) {
    console.log("[Product Sync] GET request received");
    try {
        const printfulService = req.scope.resolve("printfulModule");
        const digitalProductService = req.scope.resolve("digitalProductModuleService");
        const [printfulStoreProducts, existingPrintfulProducts, digitalProducts] = await Promise.all([
            printfulService.fetchProducts().catch(() => []),
            printfulService.listPrintfulProducts().catch(() => []),
            digitalProductService.listDigitalProducts({}).catch(() => [])
        ]);
        const availableProducts = {
            printful: printfulStoreProducts.map(p => ({
                id: p.id || p.external_id,
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
                already_imported: false
            }))
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
    const productModuleService = req.scope.resolve(utils_1.Modules.PRODUCT);
    const importedProducts = [];
    const errors = [];
    const printfulService = req.scope.resolve("printfulModule");
    for (const productId of productIds) {
        try {
            let medusaProduct;
            if (provider === "printful") {
                // Check if product is already imported
                const existingProducts = await productModuleService.listProducts({
                    metadata: {
                        printful_product_id: productId
                    }
                });
                if (existingProducts.length > 0) {
                    throw new Error(`Product with Printful ID ${productId} already exists in Medusa`);
                }
                const printfulProduct = await printfulService.getProduct(productId);
                if (!printfulProduct) {
                    throw new Error("Product not found in Printful");
                }
                console.log("Printful Product:", JSON.stringify(printfulProduct, null, 2));
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
                if (printfulProduct.variants && printfulProduct.variants.length > 0) {
                    price = Math.round(parseFloat(printfulProduct.variants[0].price) * 100);
                }
                else if (printfulProduct.price) {
                    price = Math.round(parseFloat(printfulProduct.price) * 100);
                }
                // If no price found, set reasonable defaults based on product type
                if (price === 0) {
                    // Set default prices for POD products ($15-$35 range)
                    const defaultPrices = [1500, 2000, 2500, 3000, 3500]; // $15-$35
                    price = defaultPrices[Math.floor(Math.random() * defaultPrices.length)];
                    console.log(`Set default price ${price / 100} for product: ${printfulProduct.name}`);
                }
                medusaProduct = (await productModuleService.createProducts([
                    {
                        title: printfulProduct.name || `Product ${printfulProduct.id}`,
                        status: "published",
                        description: printfulProduct.description || `High-quality print-on-demand ${printfulProduct.name}`,
                        thumbnail: printfulProduct.thumbnail_url || printfulProduct.image,
                        variants: [
                            {
                                title: printfulProduct.variants?.[0]?.name || "Default Variant",
                                sku: `pod-${printfulProduct.id}-default`,
                                manage_inventory: false, // POD products don't need inventory management
                                allow_backorder: true,
                            },
                        ],
                        metadata: {
                            fulfillment_type: "printful_pod",
                            printful_product_id: printfulProduct.id,
                            product_type: "store",
                        },
                    },
                ]))[0];
                if (medusaProduct) {
                    const pricingModuleService = req.scope.resolve(utils_1.Modules.PRICING);
                    await pricingModuleService.addPrices({
                        priceSetId: medusaProduct.variants[0].price_set_id,
                        prices: [{
                                amount: price,
                                currency_code: "usd",
                            }],
                    });
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
                const digitalProductService = req.scope.resolve("digitalProductModuleService");
                const digitalProduct = await digitalProductService.getDigitalProduct(productId);
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
                const price = Math.round(parseFloat(digitalProduct.price) * 100);
                medusaProduct = (await productModuleService.createProducts([
                    {
                        title: digitalProduct.name,
                        status: "published",
                        variants: [
                            {
                                title: "Digital Version",
                            },
                        ],
                        metadata: {
                            fulfillment_type: "digital",
                        },
                    },
                ]))[0];
                if (medusaProduct) {
                    const digitalProductService = req.scope.resolve("digitalProductModuleService");
                    await digitalProductService.linkProduct(medusaProduct.id, digitalProduct.id);
                    const pricingModuleService = req.scope.resolve(utils_1.Modules.PRICING);
                    await pricingModuleService.addPrices({
                        priceSetId: medusaProduct.variants[0].price_set_id,
                        prices: [{
                                amount: price,
                                currency_code: "usd",
                            }],
                    });
                    const remoteLink = req.scope.resolve("remoteLink");
                    await remoteLink.create([
                        {
                            [utils_1.Modules.PRODUCT]: { product_id: medusaProduct.id },
                            [utils_1.Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
                        },
                    ]);
                }
            }
            importedProducts.push(medusaProduct);
        }
        catch (error) {
            errors.push({ productId, error: error.message });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3Qtc3luYy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFxQkEsa0JBa0RDO0FBRUQsb0JBNEJDO0FBcEdELHFEQUFtRDtBQUVuRCw2Q0FBZ0Q7QUFlaEQsZ0VBQWdFO0FBQ2hFLElBQUksUUFBUSxHQUFjLEVBQUUsQ0FBQTtBQUVyQixLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFBO0lBQ2xELElBQUksQ0FBQztRQUNILE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFRLENBQUE7UUFDbEUsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBUSxDQUFBO1FBRXJGLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxlQUFlLENBQUMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDM0YsZUFBZSxDQUFDLGFBQWEsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDL0MsZUFBZSxDQUFDLG9CQUFvQixFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUN0RCxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1NBQzlELENBQUMsQ0FBQztRQUVILE1BQU0saUJBQWlCLEdBQUc7WUFDeEIsUUFBUSxFQUFFLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3hDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJ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