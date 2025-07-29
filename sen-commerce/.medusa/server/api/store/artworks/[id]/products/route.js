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
            else if (artwork && artwork.product_ids && Object.keys(artwork.product_ids).length > 0) {
                const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
                const productIds = Object.keys(artwork.product_ids);
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