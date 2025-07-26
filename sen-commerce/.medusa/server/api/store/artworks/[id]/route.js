"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const artwork_module_1 = require("../../../../modules/artwork-module");
const utils_1 = require("@medusajs/framework/utils");
const GET = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                error: "Artwork ID is required"
            });
        }
        console.log(`[Store API] Fetching artwork with ID: ${id}`);
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
        if (!artworkModuleService) {
            return res.status(500).json({
                error: "Artwork service not available"
            });
        }
        // Get artwork by ID
        const artwork = await artworkModuleService.retrieveArtwork(id, {
            relations: ["artwork_collection"]
        });
        if (!artwork) {
            console.log(`[Store API] Artwork not found with ID: ${id}`);
            return res.status(404).json({
                error: "Artwork not found"
            });
        }
        console.log(`[Store API] Found artwork: ${artwork.title}`);
        // Get related products for this artwork
        let relatedProducts = [];
        try {
            if (Array.isArray(artwork.product_ids) && artwork.product_ids.length > 0) {
                const productResult = await productService.listProducts({
                    id: artwork.product_ids,
                }, {
                    relations: ["variants", "variants.prices"]
                });
                relatedProducts = productResult || [];
                console.log(`[Store API] Found ${relatedProducts.length} related products`);
            }
            else {
                console.log(`[Store API] No product_ids found for artwork ${id}`);
            }
        }
        catch (error) {
            console.warn("Could not fetch related products:", error);
        }
        // Format response
        const response = {
            id: artwork.id,
            title: artwork.title,
            description: artwork.description,
            image_url: artwork.image_url,
            artwork_collection_id: artwork.artwork_collection_id,
            artist_name: artwork.artist_name,
            creation_date: artwork.creation_date,
            dimensions: artwork.dimensions,
            style: artwork.style,
            brand_story: artwork.brand_story,
            tags: artwork.tags ? (Array.isArray(artwork.tags) ? artwork.tags : [artwork.tags]) : [],
            products: relatedProducts
        };
        res.json({ artwork: response });
    }
    catch (error) {
        console.error("[Store API] Error fetching artwork:", error);
        res.status(500).json({
            error: "Failed to fetch artwork",
            message: error.message
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FydHdvcmtzL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsdUVBQW1FO0FBR25FLHFEQUFtRDtBQUU1QyxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7UUFFekIsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ1IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLHdCQUF3QjthQUNoQyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5Q0FBeUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUUxRCxNQUFNLG9CQUFvQixHQUF5QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQywrQkFBYyxDQUFDLENBQUE7UUFDcEYsTUFBTSxjQUFjLEdBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUVoRixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUMxQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsK0JBQStCO2FBQ3ZDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxvQkFBb0I7UUFDcEIsTUFBTSxPQUFPLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFO1lBQzdELFNBQVMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO1NBQ2xDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsMENBQTBDLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDM0QsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLG1CQUFtQjthQUMzQixDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUE7UUFFMUQsd0NBQXdDO1FBQ3hDLElBQUksZUFBZSxHQUFpQixFQUFFLENBQUE7UUFDdEMsSUFBSSxDQUFDO1lBQ0gsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDekUsTUFBTSxhQUFhLEdBQWlCLE1BQU0sY0FBYyxDQUFDLFlBQVksQ0FBQztvQkFDcEUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxXQUF1QjtpQkFDcEMsRUFBRTtvQkFDRCxTQUFTLEVBQUUsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUM7aUJBQzNDLENBQUMsQ0FBQTtnQkFDRixlQUFlLEdBQUcsYUFBYSxJQUFJLEVBQUUsQ0FBQTtnQkFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsZUFBZSxDQUFDLE1BQU0sbUJBQW1CLENBQUMsQ0FBQTtZQUM3RSxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxnREFBZ0QsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUNuRSxDQUFDO1FBQ0gsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzFELENBQUM7UUFFRCxrQkFBa0I7UUFDbEIsTUFBTSxRQUFRLEdBQUc7WUFDZixFQUFFLEVBQUUsT0FBTyxDQUFDLEVBQUU7WUFDZCxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7WUFDcEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO1lBQ2hDLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztZQUM1QixxQkFBcUIsRUFBRSxPQUFPLENBQUMscUJBQXFCO1lBQ3BELFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztZQUNoQyxhQUFhLEVBQUUsT0FBTyxDQUFDLGFBQWE7WUFDcEMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1lBQzlCLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSztZQUNwQixXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7WUFDaEMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDdkYsUUFBUSxFQUFFLGVBQWU7U0FDMUIsQ0FBQTtRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQTtJQUVqQyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDM0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLHlCQUF5QjtZQUNoQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDdkIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQTlFWSxRQUFBLEdBQUcsT0E4RWYifQ==