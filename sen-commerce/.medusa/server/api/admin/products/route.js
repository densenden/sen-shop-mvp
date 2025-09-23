"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const medusa_1 = require("@medusajs/medusa");
async function GET(req, res) {
    try {
        console.log("Fetching products with query:", req.query);
        // Parse query parameters
        const { q, limit = 20, offset = 0, fields } = req.query;
        let products = [];
        let count = 0;
        try {
            // Get Medusa v2 product service and query service
            const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
            const query = req.scope.resolve(utils_1.ContainerRegistrationKeys.QUERY);
            console.log("Product service resolved:", !!productService);
            // Build filters
            const filters = {};
            if (q) {
                filters.title = { $ilike: `%${q}%` };
            }
            // Fetch products with pricing data using the query service
            const { data: result } = await query.graph({
                entity: "product",
                filters: filters,
                fields: [
                    "id",
                    "title",
                    "description",
                    "status",
                    "metadata",
                    "created_at",
                    "updated_at",
                    "thumbnail",
                    "images.*",
                    "variants.*",
                    "variants.price_set.*",
                    "variants.price_set.prices.*"
                ],
                pagination: {
                    skip: parseInt(offset),
                    take: parseInt(limit),
                },
            });
            console.log("Products fetched:", result?.length || 0);
            // Format response to match expected structure
            products = result?.map(product => {
                // Format variants with pricing data
                const formattedVariants = (product.variants || []).map((variant) => {
                    const prices = variant.price_set?.prices || [];
                    const defaultPrice = prices.find((p) => p.currency_code === 'eur') || prices.find((p) => p.currency_code === 'usd') || prices[0];
                    return {
                        id: variant.id,
                        title: variant.title,
                        sku: variant.sku,
                        prices: defaultPrice ? [{
                                amount: defaultPrice.amount,
                                currency_code: defaultPrice.currency_code
                            }] : [],
                        calculated_price: defaultPrice ? {
                            amount: defaultPrice.amount,
                            currency_code: defaultPrice.currency_code
                        } : null
                    };
                });
                const formatted = {
                    id: product.id,
                    title: product.title,
                    description: product.description,
                    status: product.status,
                    metadata: product.metadata || {},
                    variants: formattedVariants,
                    tags: product.tags || [],
                    created_at: product.created_at,
                    updated_at: product.updated_at
                };
                // Enhanced thumbnail extraction with multiple fallback options
                let thumbnail = null;
                // 1. Try from product's direct thumbnail field (highest priority)
                if (product.thumbnail) {
                    thumbnail = product.thumbnail;
                }
                // 2. Try from product metadata (Printful products store thumbnail here)
                else if (product.metadata?.original_thumbnail) {
                    thumbnail = product.metadata.original_thumbnail;
                }
                // 3. Try from product images array (if available)
                else if (product.images?.[0]?.url) {
                    thumbnail = product.images[0].url;
                }
                // 4. Try from first variant's images (old method)
                else if (product.variants?.[0]?.images?.[0]) {
                    thumbnail = product.variants[0].images[0].url;
                }
                if (thumbnail) {
                    formatted.thumbnail = thumbnail;
                }
                else {
                    console.warn(`No thumbnail found for product ${product.id} (${product.title})`);
                }
                return formatted;
            });
            count = result?.length || 0;
        }
        catch (productError) {
            console.error("Could not fetch real products:", productError);
            products = [];
            count = 0;
        }
        res.json({
            products: products || [],
            count: count || 0
        });
    }
    catch (error) {
        console.error("Error fetching products:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            error: "Failed to fetch products",
            message: error.message
        });
    }
}
async function POST(req, res) {
    try {
        const { title, description, artwork_id, product_type, printful_product_id, digital_file_data, price_usd } = req.body;
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
        const productModuleService = req.scope.resolve(utils_1.Modules.PRODUCT);
        const salesChannelService = req.scope.resolve(utils_1.Modules.SALES_CHANNEL);
        const artworkModuleService = req.scope.resolve("artworkModuleService");
        const digitalProductModuleService = req.scope.resolve("digitalProductModuleService");
        const printfulModule = req.scope.resolve("printfulModule");
        const [defaultSalesChannel] = await salesChannelService.listSalesChannels({
            name: "Default", // Assuming the default sales channel is named "Default"
        });
        if (!defaultSalesChannel) {
            throw new Error("Default sales channel not found.");
        }
        let medusaProduct;
        let productMetadata = {};
        if (product_type === "printful_pod") {
            if (!printful_product_id) {
                return res.status(400).json({ error: "Printful Product ID is required for 'printful_pod' type." });
            }
            const printfulProduct = await printfulModule.getProduct(printful_product_id);
            if (!printfulProduct) {
                throw new Error(`Printful product with ID ${printful_product_id} not found.`);
            }
            // Collect images from Printful product (same logic as sync process)
            const productImages = [];
            // 1. Primary thumbnail
            if (printfulProduct.thumbnail_url) {
                productImages.push(printfulProduct.thumbnail_url);
            }
            // 2. Variant images
            if (printfulProduct.variants && printfulProduct.variants.length > 0) {
                printfulProduct.variants.forEach(variant => {
                    if (variant.image && !productImages.includes(variant.image)) {
                        productImages.push(variant.image);
                    }
                });
            }
            productMetadata = {
                fulfillment_type: "printful_pod",
                printful_product_id: printful_product_id,
                original_thumbnail: printfulProduct.thumbnail_url, // Store for thumbnail extraction
            };
            medusaProduct = (await productModuleService.createProducts([
                {
                    title: title || printfulProduct.name,
                    description: description || printfulProduct.description,
                    status: "published",
                    thumbnail: productImages[0], // Set primary thumbnail
                    images: productImages.map(url => ({ url })), // Include all collected images
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
            const pricingModuleService = req.scope.resolve(utils_1.Modules.PRICING);
            await pricingModuleService.addPrices({
                priceSetId: medusaProduct.variants[0].price_set_id,
                prices: [{
                        amount: price_usd || printfulProduct.price || 0,
                        currency_code: "eur",
                    }],
            });
        }
        else if (product_type === "digital") {
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
            const pricingModuleService = req.scope.resolve(utils_1.Modules.PRICING);
            await pricingModuleService.addPrices({
                priceSetId: medusaProduct.variants[0].price_set_id,
                prices: [{
                        amount: price_usd || 0,
                        currency_code: "eur",
                    }],
            });
        }
        // Link product to sales channel
        if (medusaProduct) {
            const remoteLink = req.scope.resolve("remoteLink");
            await remoteLink.create([
                {
                    [utils_1.Modules.PRODUCT]: { product_id: medusaProduct.id },
                    [utils_1.Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
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
    }
    catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Failed to create product", message: error.message });
    }
}
exports.middlewares = [
    (0, medusa_1.authenticate)("admin", ["session", "bearer"]),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3RzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQXNCQSxrQkFtSUM7QUFFRCxvQkF5S0M7QUFuVUQscURBQThFO0FBRTlFLDZDQUFnRDtBQW1CekMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXZELHlCQUF5QjtRQUN6QixNQUFNLEVBQUUsQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFLEVBQUUsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFBO1FBRXZELElBQUksUUFBUSxHQUFVLEVBQUUsQ0FBQTtRQUN4QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUE7UUFFYixJQUFJLENBQUM7WUFDSCxrREFBa0Q7WUFDbEQsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3pELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ2hFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1lBRTFELGdCQUFnQjtZQUNoQixNQUFNLE9BQU8sR0FBUSxFQUFFLENBQUE7WUFDdkIsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDTixPQUFPLENBQUMsS0FBSyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUN0QyxDQUFDO1lBRUQsMkRBQTJEO1lBQzNELE1BQU0sRUFB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