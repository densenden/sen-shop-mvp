"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const GET = async (req, res) => {
    try {
        const artworkId = req.params.id;
        if (!artworkId) {
            return res.status(400).json({ error: "Artwork ID is required" });
        }
        console.log(`Fetching products for artwork: ${artworkId}`);
        let products = [];
        let count = 0;
        try {
            // Try to get artwork details and its linked products
            const artworkModuleService = req.scope.resolve("artworkModuleService");
            const artwork = await artworkModuleService.retrieve(artworkId, {
                relations: ["products"],
            });
            if (artwork && artwork.products && artwork.products.length > 0) {
                // Products are already populated from the relation
                products = artwork.products;
            }
            else if (artwork && artwork.product_ids && artwork.product_ids.length > 0) {
                const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
                const productIds = Array.isArray(artwork.product_ids) ? artwork.product_ids : [];
                const result = await productService.listProducts({ id: productIds }, {
                    relations: [
                        "variants",
                        "images",
                        "tags",
                        "categories",
                        "variants.prices",
                    ],
                });
                products = result || [];
            }
            else {
                // If no products linked to artwork, return existing products as customizable versions
                const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
                const result = await productService.listProducts({}, {
                    relations: ["variants", "images", "tags", "categories", "variants.prices"],
                    take: 3
                });
                if (result && result.length > 0) {
                    products = result.slice(0, 3).map((product) => ({
                        ...product,
                        title: `${product.title} with Custom Artwork`,
                        description: `${product.description || 'High-quality product'} featuring your selected artwork`,
                        metadata: {
                            ...product.metadata,
                            artwork_id: artworkId,
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
                                prices: [{ amount: 2500, currency_code: "usd" }]
                            }
                        ]
                    }));
                }
            }
            count = products.length;
        }
        catch (error) {
            console.error("Error fetching products for artwork:", error.message);
            // Fallback: return mock products that work with the cart system
            products = [
                {
                    id: "artwork-tshirt-" + artworkId,
                    title: "T-Shirt with this Artwork",
                    handle: "artwork-tshirt-" + artworkId,
                    description: "High-quality cotton t-shirt featuring this artwork",
                    thumbnail: null,
                    images: [],
                    variants: [
                        {
                            id: "variant-tshirt-" + artworkId,
                            title: "Medium",
                            prices: [
                                { amount: 2500, currency_code: "usd" }
                            ]
                        }
                    ],
                    metadata: {
                        artwork_id: artworkId,
                        customizable: true
                    }
                },
                {
                    id: "artwork-poster-" + artworkId,
                    title: "Art Print Poster",
                    handle: "artwork-poster-" + artworkId,
                    description: "Premium quality art print poster featuring this artwork",
                    thumbnail: null,
                    images: [],
                    variants: [
                        {
                            id: "variant-poster-" + artworkId,
                            title: "18x24",
                            prices: [
                                { amount: 1500, currency_code: "usd" }
                            ]
                        }
                    ],
                    metadata: {
                        artwork_id: artworkId,
                        customizable: true
                    }
                }
            ];
            count = products.length;
        }
        res.json({
            products: products || [],
            count: count || 0,
            artwork_id: artworkId
        });
    }
    catch (error) {
        console.error("[Store Artwork Products] Error fetching products:", error);
        res.status(500).json({
            error: "Failed to fetch products for artwork",
            message: error.message
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FydHdvcmtzL1tpZF0vcHJvZHVjdHMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEscURBQW1EO0FBRTVDLE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNuRSxJQUFJLENBQUM7UUFDSCxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQTtRQUUvQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDZixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHdCQUF3QixFQUFFLENBQUMsQ0FBQTtRQUNsRSxDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsU0FBUyxFQUFFLENBQUMsQ0FBQTtRQUUxRCxJQUFJLFFBQVEsR0FBVSxFQUFFLENBQUE7UUFDeEIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFBO1FBRWIsSUFBSSxDQUFDO1lBQ0gscURBQXFEO1lBQ3JELE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQVEsQ0FBQTtZQUM3RSxNQUFNLE9BQU8sR0FBRyxNQUFNLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUU7Z0JBQzdELFNBQVMsRUFBRSxDQUFDLFVBQVUsQ0FBQzthQUN4QixDQUFDLENBQUE7WUFFRixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMvRCxtREFBbUQ7Z0JBQ25ELFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFBO1lBQzdCLENBQUM7aUJBQU0sSUFBSSxP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