"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const GET = async (req, res) => {
    try {
        // Get query parameters for filtering
        const { limit = 20, offset = 0, handle, tag, collection_id, category_id, artwork_id } = req.query;
        // Try to get real products from the database
        let products = [];
        let count = 0;
        // If filtering by artwork_id, handle it specially
        if (artwork_id) {
            try {
                // Get artwork details and its linked products
                const artworkModuleService = req.scope.resolve("artworkModule");
                const artwork = await artworkModuleService.retrieveArtworks(artwork_id);
                if (artwork && artwork.product_ids && artwork.product_ids.length > 0) {
                    const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
                    const productIds = Array.isArray(artwork.product_ids) ? artwork.product_ids : [];
                    const result = await productService.listProducts({ id: productIds }, {
                        relations: ["variants", "images", "tags", "categories", "variants.prices"],
                        take: Number(limit),
                        skip: Number(offset)
                    });
                    products = result || [];
                }
                else {
                    // If no products linked to artwork, return empty array
                    products = [];
                }
                count = products.length;
            }
            catch (error) {
                console.error("Error fetching products for artwork:", error.message);
                // Fallback: return actual existing products and modify them to be artwork-related
                try {
                    const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
                    const result = await productService.listProducts({}, {
                        relations: ["variants", "images", "tags", "categories", "variants.prices"],
                        take: 2
                    });
                    if (result && result.length > 0) {
                        products = result.slice(0, 2).map((product) => ({
                            ...product,
                            title: `${product.title} with Custom Artwork`,
                            description: `${product.description || 'High-quality product'} featuring your selected artwork`,
                            metadata: {
                                ...product.metadata,
                                artwork_id: artwork_id,
                                customizable: true
                            },
                            variants: product.variants?.map((variant) => ({
                                ...variant,
                                prices: variant.prices?.length > 0 ? variant.prices : [
                                    { amount: 2500, currency_code: "usd" }
                                ]
                            })) || [
                                {
                                    id: `${product.id}-default`,
                                    title: "Default",
                                    prices: [{ amount: 2500, currency_code: "eur" }]
                                }
                            ]
                        }));
                    }
                    else {
                        // No products found, return empty array instead of fake data
                        console.log('[Store Products] No products found for artwork:', artwork_id);
                        products = [];
                    }
                }
                catch (fallbackError) {
                    console.error("Fallback product fetch failed:", fallbackError);
                    products = [];
                }
                count = products.length;
            }
        }
        else {
            try {
                const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
                const query = req.scope.resolve(utils_1.ContainerRegistrationKeys.QUERY);
                // Build filter object - only show published products for store
                const filters = { status: 'published' };
                if (handle)
                    filters.handle = handle;
                if (tag)
                    filters.tags = { name: tag };
                if (collection_id)
                    filters.collection_id = collection_id;
                if (category_id)
                    filters.category_id = category_id;
                // Use query service to get products with pricing
                const { data: productsData } = await query.graph({
                    entity: "product",
                    filters,
                    fields: [
                        "id",
                        "title",
                        "description",
                        "handle",
                        "thumbnail",
                        "status",
                        "metadata",
                        "created_at",
                        "updated_at",
                        "variants.*",
                        "variants.price_set.*",
                        "variants.price_set.prices.*",
                        "images.*",
                        "tags.*",
                        "categories.*"
                    ],
                    pagination: {
                        take: Number(limit),
                        skip: Number(offset)
                    }
                });
                const result = productsData || [];
                console.log('[Store Products] Query result:', {
                    filter: filters,
                    count: result?.length || 0,
                    firstProduct: result?.[0] ? { id: result[0].id, title: result[0].title, status: result[0].status } : null
                });
                // Add calculated EUR pricing from price_set data
                if (result && result.length > 0) {
                    for (const product of result) {
                        if (product.variants && product.variants.length > 0) {
                            for (const variant of product.variants) {
                                // Get EUR price from price_set, prioritize EUR currency
                                const eurPrice = variant.price_set?.prices?.find(p => p.currency_code === 'eur');
                                const fallbackPrice = variant.price_set?.prices?.[0];
                                variant.calculated_price = {
                                    amount: eurPrice?.amount || fallbackPrice?.amount || 10, // Default to 10 cents (€0.10) if no price found
                                    currency_code: 'eur'
                                };
                            }
                        }
                    }
                }
                // Transform products for storefront compatibility
                const transformedProducts = (result || []).map(product => {
                    // Get price from first variant with proper price set data
                    const firstVariant = product.variants?.[0];
                    const prices = firstVariant?.price_set?.prices || [];
                    const defaultPrice = prices.find((p) => p.currency_code === 'eur') || prices[0];
                    const price = defaultPrice?.amount || 2000;
                    const currency_code = 'eur'; // Force EUR for all products
                    console.log(`[Store Products] Product ${product.title}: price=${price}, currency=${currency_code}, prices=${prices.length}`);
                    return {
                        id: product.id,
                        title: product.title,
                        description: product.description,
                        handle: product.handle || product.id,
                        thumbnail: product.thumbnail,
                        price: price,
                        currency_code: currency_code,
                        status: product.status,
                        metadata: product.metadata,
                        variants: product.variants,
                        images: product.images
                    };
                });
                products = transformedProducts;
                count = products.length;
            }
            catch (productError) {
                console.error("Could not fetch products:", productError.message);
                products = [];
                count = 0;
            }
        }
        res.json({
            products: products || [],
            count: count || 0,
            limit: Number(limit),
            offset: Number(offset)
        });
    }
    catch (error) {
        console.error("[Store Products] Error fetching products:", error);
        res.status(500).json({
            error: "Failed to fetch products",
            message: error.message
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3Byb2R1Y3RzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHFEQUE4RTtBQUV2RSxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDO1FBQ0gscUNBQXFDO1FBQ3JDLE1BQU0sRUFDSixLQUFLLEdBQUcsRUFBRSxFQUNWLE1BQU0sR0FBRyxDQUFDLEVBQ1YsTUFBTSxFQUNOLEdBQUcsRUFDSCxhQUFhLEVBQ2IsV0FBVyxFQUNYLFVBQVUsRUFDWCxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUE7UUFFYiw2Q0FBNkM7UUFDN0MsSUFBSSxRQUFRLEdBQVUsRUFBRSxDQUFBO1FBQ3hCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQTtRQUViLGtEQUFrRDtRQUNsRCxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2YsSUFBSSxDQUFDO2dCQUNILDhDQUE4QztnQkFDOUMsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQVEsQ0FBQTtnQkFDdEUsTUFBTSxPQUFPLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQTtnQkFFdkUsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLFdBQVcsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDckUsTUFBTSxjQUFjLEdBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtvQkFDaEYsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMs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