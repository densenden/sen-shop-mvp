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
                // Check if product is already imported by checking metadata
                const allProducts = await productModuleService.listProducts({});
                const existingProduct = allProducts.find(p => p.metadata && p.metadata.printful_product_id === productId);
                if (existingProduct) {
                    throw new Error(`Product with Printful ID ${productId} already exists in Medusa as "${existingProduct.title}"`);
                }
                const printfulProduct = await printfulService.getProduct(productId);
                if (!printfulProduct) {
                    throw new Error("Product not found in Printful");
                }
                console.log("Printful Product:", JSON.stringify(printfulProduct, null, 2));
                // Validate and fix product data
                if (!printfulProduct.name || printfulProduct.name.trim() === '') {
                    console.warn(`Printful product ${productId} has no name, using fallback`);
                    printfulProduct.name = `Printful Product ${productId}`;
                }
                // Ensure variants array exists and has valid data
                if (!printfulProduct.variants || printfulProduct.variants.length === 0) {
                    console.warn(`Printful product ${productId} has no variants, creating default variant`);
                    printfulProduct.variants = [{
                            id: `variant_${productId}`,
                            name: "Default Variant",
                            price: "25.00",
                            currency: "USD"
                        }];
                }
                else {
                    // Validate existing variants
                    printfulProduct.variants = printfulProduct.variants.filter(variant => variant && variant.id).map(variant => ({
                        ...variant,
                        name: variant.name || "Default Variant",
                        price: variant.price || "25.00",
                        currency: variant.currency || "USD"
                    }));
                    if (printfulProduct.variants.length === 0) {
                        printfulProduct.variants = [{
                                id: `variant_${productId}`,
                                name: "Default Variant",
                                price: "25.00",
                                currency: "USD"
                            }];
                    }
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
                if (printfulProduct.variants && printfulProduct.variants.length > 0) {
                    const variantPrice = printfulProduct.variants[0].price;
                    if (variantPrice && !isNaN(parseFloat(variantPrice))) {
                        price = Math.round(parseFloat(variantPrice) * 100);
                    }
                }
                else if (printfulProduct.price && !isNaN(parseFloat(printfulProduct.price))) {
                    price = Math.round(parseFloat(printfulProduct.price) * 100);
                }
                // If no valid price found, set reasonable defaults based on product type
                if (price === 0 || isNaN(price)) {
                    // Set default prices for POD products ($15-$35 range)
                    const defaultPrices = [1500, 2000, 2500, 3000, 3500]; // $15-$35
                    price = defaultPrices[Math.floor(Math.random() * defaultPrices.length)];
                    console.log(`Set default price $${price / 100} for product: ${printfulProduct.name}`);
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