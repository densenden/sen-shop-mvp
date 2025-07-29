import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, ISalesChannelModuleService, IPricingModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa";
import { PODProviderManager } from "../../../modules/printful/services/pod-provider-facade";
import { DigitalProductModuleService } from "../../../modules/digital-product/services/digital-product-module-service";
import { ArtworkModuleService } from "../../../modules/artwork-module/services/artwork-module-service";

interface CreateProductRequestBody {
  title: string;
  description?: string;
  artwork_id: string;
  product_type: "printful_pod" | "digital";
  printful_product_id?: string; // Required if product_type is "printful_pod"
  digital_file_data?: { // Required if product_type is "digital"
    fileBuffer: string; // Base64 encoded
    fileName: string;
    mimeType: string;
  };
  price_usd?: number; // Optional price for the product
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log("Fetching products with query:", req.query)
    
    // Parse query parameters
    const { q, limit = 20, offset = 0, fields } = req.query
    
    let products: any[] = []
    let count = 0
    
    try {
      // Get Medusa v2 product service
      const productService = req.scope.resolve(Modules.PRODUCT)
      console.log("Product service resolved:", !!productService)
      
      // Build filters
      const filters: any = {}
      if (q) {
        filters.title = { $ilike: `%${q}%` }
      }
      
      // Build options
      const options: any = {
        relations: ["variants", "tags", "metadata"]
      }
      
      // List products using the correct method
      const [result, resultCount] = await productService.listAndCountProducts(
        filters,
        {
          take: parseInt(limit as string),
          skip: parseInt(offset as string),
          relations: ["variants", "tags", "metadata"],
        }
      )
      console.log("Products fetched:", result?.length || 0)
      
      // Format response to match expected structure
      products = result?.map(product => {
        const formatted: any = {
          id: product.id,
          title: product.title,
          description: product.description,
          status: product.status,
          metadata: product.metadata || {},
          variants: product.variants || [],
          tags: product.tags || [],
          created_at: product.created_at,
          updated_at: product.updated_at
        }
        
        // Add thumbnail from first variant's image if available
        if ((product.variants?.[0] as any)?.images?.[0]) {
          formatted.thumbnail = ((product.variants[0] as any).images as any)[0].url
        }
        
        return formatted
      })
      
      count = resultCount
      
    } catch (productError) {
      console.error("Could not fetch real products:", productError)
      products = []
      count = 0
    }
    
    res.json({
      products: products || [],
      count: count || 0
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    console.error("Error stack:", error.stack)
    res.status(500).json({ 
      error: "Failed to fetch products",
      message: error.message 
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { title, description, artwork_id, product_type, printful_product_id, digital_file_data, price_usd } = req.body as CreateProductRequestBody;

    // Artwork ID is now optional for product creation, as it can be linked later
    // if (!artwork_id) {
    //   return res.status(400).json({ error: "Artwork ID is required." });
    // }
    if (!title) {
      return res.status(400).json({ error: "Product title is required." });
    }
    if (!product_type || (product_type !== "printful_pod" && product_type !== "digital")) {
      return res.status(400).json({ error: "Product type must be 'printful_pod' or 'digital'." });
    }

    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT);
    const salesChannelService: ISalesChannelModuleService = req.scope.resolve(Modules.SALES_CHANNEL);
    const artworkModuleService: ArtworkModuleService = req.scope.resolve("artworkModuleService");
    const digitalProductModuleService: DigitalProductModuleService = req.scope.resolve("digitalProductModuleService");
    const printfulModule: PODProviderManager = req.scope.resolve("printfulModule");

    const [defaultSalesChannel] = await salesChannelService.listSalesChannels({
      name: "Default", // Assuming the default sales channel is named "Default"
    });

    if (!defaultSalesChannel) {
      throw new Error("Default sales channel not found.");
    }

    let medusaProduct: any;
    let productMetadata: Record<string, any> = {};

    if (product_type === "printful_pod") {
      if (!printful_product_id) {
        return res.status(400).json({ error: "Printful Product ID is required for 'printful_pod' type." });
      }

      const printfulProduct = await printfulModule.getProduct(printful_product_id);

      if (!printfulProduct) {
        throw new Error(`Printful product with ID ${printful_product_id} not found.`);
      }

      productMetadata = {
        fulfillment_type: "printful_pod",
        printful_product_id: printful_product_id,
      };

      medusaProduct = (await productModuleService.createProducts([
        {
          title: title || printfulProduct.name,
          description: description || printfulProduct.description,
          status: "published",
          variants: [
            {
              title: "Default",
              // Prices are added separately via the pricing module
            },
          ],
          metadata: productMetadata,
        },
      ]))[0];

      // Add price to the created variant
      const pricingModuleService: IPricingModuleService = req.scope.resolve(Modules.PRICING);
      await pricingModuleService.addPrices({
        priceSetId: medusaProduct.variants[0].price_set_id,
        prices: [{
          amount: price_usd || printfulProduct.price || 0,
          currency_code: "usd",
        }],
      });

    } else if (product_type === "digital") {
      if (!digital_file_data || !digital_file_data.fileBuffer || !digital_file_data.fileName || !digital_file_data.mimeType) {
        return res.status(400).json({ error: "Digital file data (fileBuffer, fileName, mimeType) is required for 'digital' type." });
      }

      // Decode base64 file buffer
      const fileBuffer = Buffer.from(digital_file_data.fileBuffer, 'base64');

      const digitalProduct = await digitalProductModuleService.createDigitalProduct({
        name: title,
        description: description,
        fileBuffer: fileBuffer,
        fileName: digital_file_data.fileName,
        mimeType: digital_file_data.mimeType,
      });

      productMetadata = {
        fulfillment_type: "digital_download",
        digital_product_id: digitalProduct.id,
      };

      medusaProduct = (await productModuleService.createProducts([
        {
          title: title,
          description: description,
          status: "published",
          variants: [
            {
              title: "Digital Download",
              // Prices are added separately via the pricing module
            },
          ],
          metadata: productMetadata,
        },
      ]))[0];

      // Add price to the created variant
      const pricingModuleService: IPricingModuleService = req.scope.resolve(Modules.PRICING);
      await pricingModuleService.addPrices({
        priceSetId: medusaProduct.variants[0].price_set_id,
        prices: [{
          amount: price_usd || 0,
          currency_code: "usd",
        }],
      });
    }

    // Link product to sales channel
    if (medusaProduct) {
      const remoteLink = req.scope.resolve("remoteLink");
      await remoteLink.create([
        {
          [Modules.PRODUCT]: { product_id: medusaProduct.id },
          [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
        },
      ]);
    }

    // Link product to artwork
    if (medusaProduct) {
      if (artwork_id) { // Only link if artwork_id is provided
        await artworkModuleService.createArtworkProductRelation({
          artwork_id: artwork_id,
          product_id: medusaProduct.id,
          product_type: product_type === "printful_pod" ? "printful_pod" : "digital", // Ensure correct type
          is_primary: true, // Assuming it's primary for now
        });
      }
    }

    res.status(201).json({ product: medusaProduct });

  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product", message: error.message });
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
];
