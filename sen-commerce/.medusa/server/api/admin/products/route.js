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
            // Get Medusa v2 product service
            const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
            console.log("Product service resolved:", !!productService);
            // Build filters
            const filters = {};
            if (q) {
                filters.title = { $ilike: `%${q}%` };
            }
            // Build options
            const options = {
                relations: ["variants", "tags", "metadata"]
            };
            // List products using the correct method
            const [result, resultCount] = await productService.listAndCountProducts(filters, {
                take: parseInt(limit),
                skip: parseInt(offset),
                relations: ["variants", "tags", "metadata"],
            });
            console.log("Products fetched:", result?.length || 0);
            // Format response to match expected structure
            products = result?.map(product => {
                const formatted = {
                    id: product.id,
                    title: product.title,
                    description: product.description,
                    status: product.status,
                    metadata: product.metadata || {},
                    variants: product.variants || [],
                    tags: product.tags || [],
                    created_at: product.created_at,
                    updated_at: product.updated_at
                };
                // Add thumbnail from first variant's image if available
                if (product.variants?.[0]?.images?.[0]) {
                    formatted.thumbnail = product.variants[0].images[0].url;
                }
                return formatted;
            });
            count = resultCount;
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
            const pricingModuleService = req.scope.resolve(utils_1.Modules.PRICING);
            await pricingModuleService.addPrices({
                priceSetId: medusaProduct.variants[0].price_set_id,
                prices: [{
                        amount: price_usd || printfulProduct.price || 0,
                        currency_code: "usd",
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
                        currency_code: "usd",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3RzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQXNCQSxrQkErRUM7QUFFRCxvQkFxSkM7QUEzUEQscURBQW1EO0FBRW5ELDZDQUFnRDtBQW1CekMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXZELHlCQUF5QjtRQUN6QixNQUFNLEVBQUUsQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFLEVBQUUsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFBO1FBRXZELElBQUksUUFBUSxHQUFVLEVBQUUsQ0FBQTtRQUN4QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUE7UUFFYixJQUFJLENBQUM7WUFDSCxnQ0FBZ0M7WUFDaEMsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3pELE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1lBRTFELGdCQUFnQjtZQUNoQixNQUFNLE9BQU8sR0FBUSxFQUFFLENBQUE7WUFDdkIsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDTixPQUFPLENBQUMsS0FBSyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUN0QyxDQUFDO1lBRUQsZ0JBQWdCO1lBQ2hCLE1BQU0sT0FBTyxHQUFRO2dCQUNuQixTQUFTLEVBQUUsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQzthQUM1QyxDQUFBO1lBRUQseUNB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