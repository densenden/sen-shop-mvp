import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, ISalesChannelModuleService, IPricingModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa"
import { ProductImageService } from "../../../services/product-image-service"

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

// Note: Replaced by ProductImageService - keeping for backwards compatibility if needed

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
    const skippedProducts: any[] = [];

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
                    
                    console.log(`[DEBUG] Fetched Printful product:`, printfulProduct ? 'Success' : 'Null')
                if (printfulProduct) {
                    console.log(`[DEBUG] Printful product structure:`)
                    console.log(`  - ID: ${printfulProduct.id}`)
                    console.log(`  - Name: ${printfulProduct.name}`)
                    console.log(`  - Thumbnail: ${printfulProduct.thumbnail_url}`)
                    console.log(`  - Description: ${printfulProduct.description}`)
                    console.log(`  - Variants count: ${printfulProduct.variants ? printfulProduct.variants.length : 0}`)
                    if (printfulProduct.variants && printfulProduct.variants.length > 0) {
                        console.log(`  - First variant:`, JSON.stringify(printfulProduct.variants[0], null, 2))
                    }
                }
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

                // Collect all available Printful images
                console.log(`[DEBUG] Starting image collection for product ${productId}`)
                console.log(`[DEBUG] Available data - Thumbnail: ${productThumbnail}, Variants: ${variants.length}`)
                
                let imageCollection
                let collectedImages = []
                
                // 1. Always add thumbnail if available
                if (productThumbnail) {
                    collectedImages.push(productThumbnail)
                    console.log(`[DEBUG] Added thumbnail: ${productThumbnail}`)
                }
                
                // 2. Add variant images if available
                variants.forEach((variant, index) => {
                    if (variant.image && !collectedImages.includes(variant.image)) {
                        collectedImages.push(variant.image)
                        console.log(`[DEBUG] Added variant ${index} image: ${variant.image}`)
                    }
                })
                
                // 3. Try comprehensive image collection with fallback
                try {
                    const imageService = new ProductImageService(req)
                    console.log(`[DEBUG] Attempting comprehensive image collection...`)
                    
                    console.log(`[DEBUG] Passing original Printful product data to image service`)
                    console.log(`[DEBUG] Original product variants:`, printfulProduct.variants?.length)
                    
                    imageCollection = await imageService.collectPrintfulImages(
                      printfulProduct, // Pass original Printful data, not processed variants
                      artworkUrl,
                      8, // max mockups
                      20 // max total images
                    )
                    
                    console.log(`[DEBUG] ✅ Comprehensive collection succeeded: ${imageCollection.images.length} images`)
                } catch (imageError) {
                    console.warn(`[DEBUG] ⚠️ Comprehensive collection failed, using basic images:`, imageError.message)
                    
                    // Create basic image collection from what we have
                    imageCollection = {
                        images: collectedImages.map(url => ({ url, type: 'basic' })),
                        thumbnail: collectedImages[0] || productThumbnail,
                        metadata: {
                            total_images: collectedImages.length,
                            image_sources: { mockups: 0, catalog: 0, variants: collectedImages.length - 1, user_uploads: 0 },
                            printful_product_id: productId,
                            artwork_url: artworkUrl
                        }
                    }
                    console.log(`[DEBUG] Using ${collectedImages.length} basic images`)
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
                
                // If no valid price found, skip the product instead of using hardcoded fallbacks
                if (price === 0 || isNaN(price)) {
                  console.log(`Skipping product ${productName} - no valid price found and no hardcoded fallbacks`)
                  skippedProducts.push({
                    name: productName,
                    reason: 'No valid price found'
                  })
                  continue
                }

                // Convert image collection to Medusa format
                let medusaImageData
                try {
                    if (imageCollection && imageCollection.images) {
                        // Try using the image service for conversion
                        try {
                            const imageService = new ProductImageService(req)
                            medusaImageData = imageService.convertToMedusaFormat(imageCollection)
                            console.log(`[DEBUG] ✅ Image service conversion succeeded`)
                        } catch (conversionError) {
                            console.warn(`[DEBUG] ⚠️ Image service conversion failed:`, conversionError.message)
                            throw conversionError
                        }
                    } else {
                        throw new Error("No image collection available")
                    }
                } catch (conversionError) {
                    console.warn(`[DEBUG] Using manual image format conversion`)
                    // Manual conversion as fallback
                    medusaImageData = {
                        thumbnail: imageCollection?.thumbnail || collectedImages[0] || productThumbnail,
                        images: collectedImages.map(url => ({ url })),
                        metadata: {
                            total_images: collectedImages.length,
                            image_sources: { mockups: 0, catalog: 0, variants: collectedImages.length, user_uploads: 0 },
                            printful_product_id: productId,
                            artwork_url: artworkUrl,
                            fallback_conversion: true
                        }
                    }
                }
                
                console.log(`[DEBUG] Final image data for product creation:`)
                console.log(`  - Thumbnail: ${medusaImageData.thumbnail}`)
                console.log(`  - Images count: ${medusaImageData.images.length}`)
                console.log(`  - First few images:`, medusaImageData.images.slice(0, 3))
                
                console.log(`[DEBUG] Creating product with ${medusaImageData.images.length} images`)
                console.log(`[DEBUG] Image data structure:`, JSON.stringify(medusaImageData, null, 2))
                console.log(`[DEBUG] Thumbnail:`, medusaImageData.thumbnail)
                console.log(`[DEBUG] Images array:`, medusaImageData.images)
                
                // Create the product with comprehensive image data
                const productInput = {
                    title: productName,
                    description: productDescription,
                    status: "draft", // Start as draft
                    thumbnail: medusaImageData.thumbnail,
                    images: medusaImageData.images,
                    metadata: {
                        fulfillment_type: "printful_pod",
                        printful_product_id: productId,
                        product_type: "store",
                        artwork_url: artworkUrl,
                        original_thumbnail: productThumbnail,
                        // Include comprehensive image metadata
                        ...medusaImageData.metadata,
                    },
                }
                
                console.log(`[DEBUG] Product input:`, JSON.stringify(productInput, null, 2))
                
                medusaProduct = (await productModuleService.createProducts([productInput]))[0]
                
                console.log(`[DEBUG] Created medusaProduct:`, medusaProduct ? 'Success' : 'Failed')
                
                if (medusaProduct) {
                    console.log(`[DEBUG] ✅ Product created successfully!`)
                    console.log(`  - ID: ${medusaProduct.id}`)
                    console.log(`  - Title: ${medusaProduct.title}`)
                    console.log(`  - Status: ${medusaProduct.status}`)
                    console.log(`  - Thumbnail: ${medusaProduct.thumbnail}`)
                    console.log(`  - Images count: ${medusaProduct.images ? medusaProduct.images.length : 0}`)
                    
                    // Retrieve the product immediately after creation to verify what was stored
                    try {
                        const retrievedProduct = await productModuleService.retrieveProduct(medusaProduct.id, {
                            relations: ["images", "variants"]
                        })
                        console.log(`[DEBUG] 🔍 Retrieved product verification:`)
                        console.log(`  - Retrieved thumbnail: ${retrievedProduct.thumbnail}`)
                        console.log(`  - Retrieved images count: ${retrievedProduct.images ? retrievedProduct.images.length : 0}`)
                        console.log(`  - Retrieved images:`, retrievedProduct.images)
                        console.log(`  - Retrieved variants count: ${retrievedProduct.variants ? retrievedProduct.variants.length : 0}`)
                    } catch (retrieveError) {
                        console.error(`[DEBUG] ⚠️ Failed to retrieve product for verification:`, retrieveError.message)
                    }
                } else {
                    console.error(`[DEBUG] ❌ Product creation failed - no product returned`)
                }
                
                // Create basic variant with price
                console.log(`[DEBUG] Creating variant for product ${medusaProduct.id}`)
                const variants_created = await productModuleService.createProductVariants([{
                    title: "Default",
                    sku: `printful-${productId}`,
                    product_id: medusaProduct.id,
                    prices: [{
                        amount: price,
                        currency_code: "eur"
                    }],
                    metadata: {
                        printful_product_id: productId
                    }
                }])
                
                console.log(`[DEBUG] Created variants:`, variants_created)
                
                // Verify pricing was set correctly
                if (variants_created && variants_created[0]) {
                    const variant = variants_created[0] as any
                    console.log(`[DEBUG] ✅ Variant created with pricing:`)
                    console.log(`  - Variant ID: ${variant.id}`)
                    console.log(`  - SKU: ${variant.sku}`)
                    console.log(`  - Has prices: ${variant.prices ? 'Yes' : 'No'}`)
                    console.log(`  - Price details:`, variant.prices)
                } else {
                    console.error(`[DEBUG] ❌ No variants created for product ${productId}`)
                }
                
                // Link to sales channel  
                const remoteLink = req.scope.resolve("remoteLink")
                await remoteLink.create([
                    {
                        [Modules.PRODUCT]: { product_id: medusaProduct.id },
                        [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
                    },
                ])
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
                  status: "published" as const,
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
            importedProducts.push({
                productId,
                medusaProductId: medusaProduct.id,
                medusaProduct: medusaProduct, // Include full product object for frontend
                provider
            });
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
    return { success: true, imported: importedProducts.length, failed: errors.length, imported_products: importedProducts, errors };
}

async function processSync(syncId: string, action: string, provider: string) {
  // Placeholder for async processing
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
];
