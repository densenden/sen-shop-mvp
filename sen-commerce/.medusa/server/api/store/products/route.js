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
                // Build filter object - temporarily show all products for debugging
                const filters = {};
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
                        take: 200, // Fixed at 200 to get all products
                        skip: 0
                    }
                });
                const result = productsData || [];
                // Also check database directly for comparison
                const allProducts = await productService.listProducts({}, { take: 100 });
                console.log('[Store Products] Direct product service count:', allProducts?.length || 0);
                console.log('[Store Products] Query result:', {
                    filter: filters,
                    count: result?.length || 0,
                    directServiceCount: allProducts?.length || 0,
                    limit: Number(limit) || 100,
                    offset: Number(offset) || 0,
                    firstProduct: result?.[0] ? { id: result[0].id, title: result[0].title, status: result[0].status } : null
                });
                // Log metadata of all products for debugging
                result.forEach(p => {
                    if (p.metadata?.fulfillment_type === 'digital_download') {
                        console.log('[Store Products] Found digital product:', p.title, p.metadata);
                    }
                });
                // Add calculated EUR pricing from price_set data
                if (result && result.length > 0) {
                    for (const product of result) {
                        if (product.variants && product.variants.length > 0) {
                            for (const variant of product.variants) {
                                // Get EUR price from price_set, prioritize EUR currency
                                const eurPrice = variant.price_set?.prices?.find(p => p.currency_code === 'eur');
                                const fallbackPrice = variant.price_set?.prices?.[0];
                                // Log price data for debugging
                                console.log(`[Products] Product ${product.title}, Variant: eurPrice=${eurPrice?.amount}, fallbackPrice=${fallbackPrice?.amount}`);
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
                    const price = defaultPrice?.amount || 0;
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