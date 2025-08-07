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

// Helper function to download and upload image to Medusa
async function downloadAndUploadImage(imageUrl: string, req: MedusaRequest): Promise<string> {
    try {
        console.log(`[DEBUG] Downloading image: ${imageUrl}`)
        
        // Download image
        const response = await fetch(imageUrl)
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`)
        }
        
        const buffer = await response.arrayBuffer()
        const contentType = response.headers.get('content-type') || 'image/jpeg'
        const fileName = `imported-${Date.now()}.${contentType.split('/')[1] || 'jpg'}`
        
        // Get file service to upload the image
        const fileModuleService = req.scope.resolve(Modules.FILE)
        
        // Create a File object from the buffer
        const file = new File([buffer], fileName, { type: contentType })
        
        // Upload the file
        const uploadResult = await fileModuleService.uploadFiles([{
            file,
            fileName
        }])
        
        console.log(`[DEBUG] Image uploaded successfully:`, uploadResult[0]?.url)
        return uploadResult[0]?.url || imageUrl // Fallback to original URL if upload fails
        
    } catch (error) {
        console.error(`[DEBUG] Failed to download/upload image ${imageUrl}:`, error)
        return imageUrl // Fallback to original URL
    }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Product Sync] GET request received")
  try {
    const printfulService = req.scope.resolve("printfulModule") as any
    const digitalProductService = req.scope.resolve("digitalProductModuleService") as any
    
    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT);
    
    const [printfulStoreProducts, existingMedusaProducts, digitalProducts] = await Promise.all([
      printfulService.fetchProducts().catch((err) => {
        console.error("Error fetching Printful products:", err)
        return []
      }),
      productModuleService.listProducts({}).catch((err) => {
        console.error("Error listing existing Medusa products:", err)
        return []
      }),
      digitalProductService.listDigitalProducts({}).catch((err) => {
        console.error("Error fetching digital products:", err)
        return []
      })
    ]);

    const availableProducts = {
      printful: printfulStoreProducts.map(p => {
        const productId = p.id || p.external_id
        const alreadyImported = existingMedusaProducts.some((mp: any) => 
          mp.metadata && mp.metadata.printful_product_id === productId
        )
        return {
          id: productId,
          name: p.name,
          description: p.description || `${p.name} - Available for custom printing`,
          thumbnail_url: p.thumbnail_url || p.image,
          status: 'available',
          provider: 'printful',
          already_imported: alreadyImported,
          product_type: p.product_type || 'store',
          medusa_product_id: alreadyImported ? existingMedusaProducts.find((mp: any) => 
            mp.metadata && mp.metadata.printful_product_id === productId
          )?.id : null
        }
      }),
      digital: digitalProducts.map(dp => {
        const alreadyImported = existingMedusaProducts.some((mp: any) => 
          mp.metadata && mp.metadata.digital_product_id === dp.id
        )
        return {
          id: dp.id,
          name: dp.name,
          description: dp.description,
          file_size: dp.file_size,
          mime_type: dp.mime_type,
          status: 'available',
          provider: 'digital',
          already_imported: alreadyImported,
          medusa_product_id: alreadyImported ? existingMedusaProducts.find((mp: any) => 
            mp.metadata && mp.metadata.digital_product_id === dp.id
          )?.id : null
        }
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
    console.log(`[DEBUG] Starting import for provider: ${provider}, products: ${JSON.stringify(productIds)}`)
    
    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT);
    const importedProducts: any[] = [];
    const errors: any[] = [];

    let printfulService;
    try {
        printfulService = req.scope.resolve("printfulModule") as any;
        console.log(`[DEBUG] Resolved printfulService:`, typeof printfulService, Object.keys(printfulService || {}))
    } catch (resolveError) {
        console.error(`[DEBUG] Failed to resolve printfulModule:`, resolveError)
        throw new Error(`Failed to resolve Printful service: ${resolveError.message}`)
    }

    for (const productId of productIds) {
        console.log(`[DEBUG] Processing product ID: ${productId}`)
        try {
            let medusaProduct;
            if (provider === "printful") {
                console.log(`[DEBUG] Checking for existing products...`)
                // Check if product is already imported by checking metadata
                const allProducts = await productModuleService.listProducts({});
                console.log(`[DEBUG] Found ${allProducts.length} existing products in Medusa`)
                
                const existingProduct = allProducts.find(p => {
                    console.log(`[DEBUG] Checking product:`, p.id, p.metadata)
                    return p.metadata && p.metadata.printful_product_id === productId
                });
                
                if (existingProduct) {
                    throw new Error(`Product with Printful ID ${productId} already exists in Medusa as "${existingProduct.title}"`);
                }
                console.log(`[DEBUG] No existing product found, proceeding with import`)

                let printfulProduct;
                try {
                    console.log(`Fetching Printful product: ${productId}`)
                    console.log('Available methods on printfulService:', Object.getOwnPropertyNames(printfulService))
                    
                    // Try different method names to find the right one
                    if (printfulService.getStoreProduct) {
                        printfulProduct = await printfulService.getStoreProduct(productId);
                    } else if (printfulService.getInternalProductService) {
                        const internalService = printfulService.getInternalProductService();
                        printfulProduct = await internalService.getStoreProduct(productId);
                    } else if (printfulService.getProduct) {
                        printfulProduct = await printfulService.getProduct(productId);
                    } else {
                        throw new Error('No product retrieval method found on Printful service');
                    }
                    
                    console.log(`Fetched product:`, printfulProduct ? 'Success' : 'Null')
                } catch (apiError) {
                    console.error(`Error fetching Printful product ${productId}:`, apiError);
                    throw new Error(`Failed to fetch product from Printful: ${apiError?.message || apiError}`);
                }

                if (!printfulProduct) {
                    throw new Error("Product not found in Printful");
                }

                // Get a random artwork for mockup generation
                let artworkUrl = null
                try {
                  const manager = req.scope.resolve("manager")
                  const artworks = await manager.query(`
                    SELECT image_url FROM artwork WHERE deleted_at IS NULL ORDER BY RANDOM() LIMIT 1
                  `)
                  if (artworks.length > 0) {
                    artworkUrl = artworks[0].image_url
                  }
                } catch (artworkError) {
                  console.warn('Failed to fetch random artwork for mockup generation:', artworkError)
                }

                console.log("Printful Product:", JSON.stringify(printfulProduct, null, 2));
                
                // Validate and fix product data with safe access
                const productName = printfulProduct.name || printfulProduct.title || `Printful Product ${productId}`;
                const productDescription = printfulProduct.description || `High-quality print-on-demand ${productName}`;
                const productThumbnail = printfulProduct.thumbnail_url || printfulProduct.image || '';
                
                // Ensure variants array exists and has valid data
                let variants = [];
                let sizeValues = new Set<string>();
                let colorValues = new Set<string>();
                
                if (printfulProduct.variants && Array.isArray(printfulProduct.variants) && printfulProduct.variants.length > 0) {
                    console.log(`Processing ${printfulProduct.variants.length} variants for product ${productId}`)
                    // Validate existing variants
                    variants = printfulProduct.variants
                        .filter(variant => {
                            if (!variant) {
                                console.warn('Null variant found, skipping')
                                return false
                            }
                            if (!variant.id && !variant.variant_id) {
                                console.warn('Variant without id found:', variant)
                                return false
                            }
                            return true
                        })
                        .map((variant, index) => {
                            console.log(`[DEBUG] Processing variant ${index}:`, JSON.stringify(variant, null, 2))
                            // Extract size and color if available
                            const rawName = variant.name || variant.title || "Default Variant";
                            console.log(`[DEBUG] Raw variant name:`, rawName, typeof rawName)
                            const variantName = String(rawName);
                            console.log(`[DEBUG] String variant name:`, variantName)
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
                let mockupUrls: string[] = []
                if (artworkUrl && variants.length > 0 && printfulService.generateAndWaitForMockups) {
                  try {
                    console.log(`Attempting to generate mockups for product ${productId} with artwork ${artworkUrl}`)
                    const variantIds = variants.slice(0, 3).map(v => v.id)
                    mockupUrls = await printfulService.generateAndWaitForMockups(productId, variantIds, artworkUrl, 20000)
                    console.log(`Successfully generated ${mockupUrls.length} mockups`)
                  } catch (mockupError) {
                    console.warn(`Failed to generate mockups for product ${productId}:`, mockupError.message || mockupError)
                    // Continue with import even if mockups fail
                  }
                } else {
                  console.log('Skipping mockup generation - method not available or missing artwork/variants')
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
                  console.log(`Set default price $${price/100} for product: ${productName}`);
                }

                // Use the proper workflow to create products with prices
                const { createProductsWorkflow } = await import("@medusajs/core-flows")
                
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
                    console.log(`Creating medusa variant ${index} from:`, variant)
                    const variantOptions: Record<string, string> = {};
                    
                    if (hasMultipleSizes) {
                        variantOptions["Size"] = String(variant.size || "One Size");
                    }
                    if (hasMultipleColors) {
                        variantOptions["Color"] = String(variant.color || "Default");
                    }
                    if (!hasMultipleSizes && !hasMultipleColors) {
                        variantOptions["Size"] = "One Size";
                    }
                    
                    const variantPrice = parseFloat(String(variant.price || "25.00"))
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
                const allPrintfulImages = []
                if (productThumbnail) {
                  allPrintfulImages.push(productThumbnail)
                }
                
                // Add variant images if available
                for (const variant of variants) {
                  if (variant.image) {
                    allPrintfulImages.push(variant.image)
                  }
                }
                
                // Use CDN URLs directly - no downloading
                const allImageUrls = [...allPrintfulImages, ...mockupUrls].filter(Boolean)
                const cdnImages = allImageUrls // Keep all as CDN URLs
                
                console.log(`[DEBUG] Using ${cdnImages.length} CDN image URLs for product ${productId}`)
                
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
                }

                const { result } = await createProductsWorkflow(req.scope).run({
                  input: { products: [productInput] }
                })
                
                console.log(`[DEBUG] Workflow result structure:`, JSON.stringify(result, null, 2))
                
                // Handle different possible result structures
                if (result && result.products && Array.isArray(result.products)) {
                    medusaProduct = result.products[0]
                } else if (result && Array.isArray(result)) {
                    medusaProduct = result[0]
                } else if (result) {
                    medusaProduct = result
                } else {
                    throw new Error("No result returned from product creation workflow")
                }
                
                console.log(`[DEBUG] Created medusaProduct:`, medusaProduct ? 'Success' : 'Null')
            } else if (provider === "digital") {
                const digitalProductService = req.scope.resolve("digitalProductModuleService") as any;
                // Just get all and filter manually since the service doesn't support where clause properly
                const allDigitalProducts = await digitalProductService.listDigitalProducts();
                const digitalProduct = allDigitalProducts.find(p => p.id === productId);

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

                const price = Math.round(parseFloat(digitalProduct.price || "5.00") * 100)

                // Import the workflow for digital products too
                const { createProductsWorkflow: createDigitalWorkflow } = await import("@medusajs/core-flows")
                
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
                }

                const { result: digitalResult } = await createDigitalWorkflow(req.scope).run({
                  input: { products: [digitalProductInput] }
                })
                
                // Handle different possible result structures
                if (digitalResult) {
                    if (Array.isArray(digitalResult)) {
                        medusaProduct = digitalResult[0]
                    } else if (digitalResult && typeof digitalResult === 'object' && 'products' in digitalResult) {
                        const resultWithProducts = digitalResult as { products: any[] }
                        medusaProduct = resultWithProducts.products[0]
                    } else {
                        medusaProduct = digitalResult
                    }
                }
                
                if (!medusaProduct) {
                    throw new Error("Failed to create digital product - no result returned from workflow")
                }
            }
            importedProducts.push(medusaProduct);
        } catch (error) {
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

async function processSync(syncId: string, action: string, provider: string) {
  // Placeholder for async processing
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
];
