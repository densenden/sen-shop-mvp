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
                const printfulProduct = await printfulService.getProduct(productId);

                if (!printfulProduct) {
                    throw new Error("Product not found in Printful");
                }

                console.log("Printful Product:", JSON.stringify(printfulProduct, null, 2));

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

                const price = printfulProduct.price ? Math.round(parseFloat(printfulProduct.price) * 100) : 0

                medusaProduct = (await productModuleService.createProducts([
                  {
                    title: printfulProduct.name || `Product ${printfulProduct.id}`,
                    status: "published",
                    variants: [
                      {
                        title: printfulProduct.variants?.[0]?.name || "Default",
                      },
                    ],
                    metadata: {
                      fulfillment_type: "printful_pod",
                      printful_product_id: printfulProduct.id,
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
