import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, ISalesChannelModuleService, IPricingModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa";

interface SyncLog {
  id: string
  product_id?: string
  product_name?: string
  sync_type: string
  status: string
  provider_type: string
  error_message?: string
  sync_data?: any
  created_at: string
  completed_at?: string
}

// In-memory storage for sync logs (in production, use database)
let syncLogs: SyncLog[] = []

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Product Sync] GET request received")
  try {
    const printfulService = req.scope.resolve("printfulModule") as any
    const digitalProductService = req.scope.resolve("digitalProductModuleService") as any
    
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
  } catch (error) {
    console.error("[Product Sync] Error fetching sync data:", error);
    res.status(500).json({ error: "Failed to fetch sync data" });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { action, provider = "printful", product_ids = [] } = req.body as any;

    const syncLog: SyncLog = {
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
    } else {
      // Handle other actions asynchronously
      processSync(syncLog.id, action, provider);
      res.json({ success: true, syncId: syncLog.id });
    }
  } catch (error) {
    console.error("Error starting sync:", error);
    res.status(500).json({ error: "Failed to start sync" });
  }
}

async function importProducts(req: MedusaRequest, provider: string, productIds: string[]) {
    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT);
    const importedProducts: any[] = [];
    const errors: any[] = [];

    const printfulService = req.scope.resolve("printfulModule") as any;

    for (const productId of productIds) {
        try {
            let medusaProduct;
            if (provider === "printful") {
                // Check if product is already imported by checking metadata
                const allProducts = await productModuleService.listProducts({});
                const existingProduct = allProducts.find(p => 
                    p.metadata && p.metadata.printful_product_id === productId
                );
                
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
                } else {
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

                const salesChannelService: ISalesChannelModuleService = req.scope.resolve(Modules.SALES_CHANNEL);
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
                } else if (printfulProduct.price && !isNaN(parseFloat(printfulProduct.price))) {
                  price = Math.round(parseFloat(printfulProduct.price) * 100);
                }
                
                // If no valid price found, set reasonable defaults based on product type
                if (price === 0 || isNaN(price)) {
                  // Set default prices for POD products ($15-$35 range)
                  const defaultPrices = [1500, 2000, 2500, 3000, 3500]; // $15-$35
                  price = defaultPrices[Math.floor(Math.random() * defaultPrices.length)];
                  console.log(`Set default price $${price/100} for product: ${printfulProduct.name}`);
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
                  const pricingModuleService: IPricingModuleService = req.scope.resolve(Modules.PRICING);
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
                      [Modules.PRODUCT]: { product_id: medusaProduct.id },
                      [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
                    },
                  ]);
                }
            } else if (provider === "digital") {
                const digitalProductService = req.scope.resolve("digitalProductModuleService") as any;
                const digitalProduct = await digitalProductService.getDigitalProduct(productId);

                if (!digitalProduct) {
                    throw new Error("Digital product not found");
                }

                const salesChannelService: ISalesChannelModuleService = req.scope.resolve(Modules.SALES_CHANNEL);
                let [defaultSalesChannel] = await salesChannelService.listSalesChannels({
                  name: "Default",
                });

                if (!defaultSalesChannel) {
                  defaultSalesChannel = await salesChannelService.createSalesChannels({
                    name: "Default",
                    description: "Default sales channel for all products",
                  });
                }

                const price = Math.round(parseFloat(digitalProduct.price) * 100)

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
                  const digitalProductService = req.scope.resolve("digitalProductModuleService") as any;
                  await digitalProductService.linkProduct(medusaProduct.id, digitalProduct.id);

                  const pricingModuleService: IPricingModuleService = req.scope.resolve(Modules.PRICING);
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
                      [Modules.PRODUCT]: { product_id: medusaProduct.id },
                      [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
                    },
                  ]);
                }
            }
            importedProducts.push(medusaProduct);
        } catch (error) {
            errors.push({ productId, error: error.message });
        }
    }
    return { success: true, imported: importedProducts.length, failed: errors.length, errors };
}

async function processSync(syncId: string, action: string, provider: string) {
  // Placeholder for async processing
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
];
