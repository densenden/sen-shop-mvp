"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = seedArtworkData;
const utils_1 = require("@medusajs/framework/utils");
const artwork_module_1 = require("../modules/artwork-module");
async function seedArtworkData({ container }) {
    const logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
    const artworkModuleService = container.resolve(artwork_module_1.ARTWORK_MODULE);
    logger.info("Seeding artwork collections...");
    // Create artwork collections
    const collections = [
        {
            name: "Abstract Geometries",
            description: "Modern abstract geometric artwork perfect for contemporary spaces",
            topic: "abstract",
            purpose: "wall_art",
            month_created: "2024-01",
            midjourney_version: "6.0",
            thumbnail_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"
        },
        {
            name: "Nature Landscapes",
            description: "Stunning natural landscapes capturing the beauty of the outdoors",
            topic: "nature",
            purpose: "decoration",
            month_created: "2024-02",
            midjourney_version: "6.0",
            thumbnail_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"
        },
        {
            name: "Minimalist Portraits",
            description: "Clean, minimalist portrait artwork with modern aesthetic",
            topic: "portraits",
            purpose: "personal_art",
            month_created: "2024-03",
            midjourney_version: "6.0",
            thumbnail_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"
        }
    ];
    const createdCollections = [];
    for (const collection of collections) {
        try {
            const created = await artworkModuleService.createArtworkCollections(collection);
            createdCollections.push(created);
            logger.info(`Created collection: ${collection.name}`);
        }
        catch (error) {
            logger.error(`Failed to create collection ${collection.name}:`, error);
        }
    }
    logger.info("Seeding individual artworks...");
    // Create individual artworks
    const artworks = [
        {
            title: "Geometric Fusion",
            description: "A vibrant geometric composition with flowing lines and bold colors",
            image_url: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=800&fit=crop",
            artwork_collection_id: createdCollections[0]?.id,
            product_ids: {}
        },
        {
            title: "Color Symphony",
            description: "An explosive array of colors arranged in geometric harmony",
            image_url: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=800&h=800&fit=crop",
            artwork_collection_id: createdCollections[0]?.id,
            product_ids: {}
        },
        {
            title: "Mountain Vista",
            description: "A breathtaking mountain landscape at golden hour",
            image_url: "https://images.unsplash.com/photo-1464822759844-d150065273e8?w=800&h=800&fit=crop",
            artwork_collection_id: createdCollections[1]?.id,
            product_ids: {}
        },
        {
            title: "Forest Reflection",
            description: "Peaceful forest scene reflected in still water",
            image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=800&fit=crop",
            artwork_collection_id: createdCollections[1]?.id,
            product_ids: {}
        },
        {
            title: "Modern Face",
            description: "Contemporary minimalist portrait with clean lines",
            image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
            artwork_collection_id: createdCollections[2]?.id,
            product_ids: {}
        },
        {
            title: "Elegant Silhouette",
            description: "A striking silhouette portrait with dramatic lighting",
            image_url: "https://images.unsplash.com/photo-1494790108755-2616c047f21a?w=800&h=800&fit=crop",
            artwork_collection_id: createdCollections[2]?.id,
            product_ids: {}
        }
    ];
    for (const artwork of artworks) {
        try {
            const created = await artworkModuleService.createArtworks(artwork);
            logger.info(`Created artwork: ${artwork.title}`);
        }
        catch (error) {
            logger.error(`Failed to create artwork ${artwork.title}:`, error);
        }
    }
    logger.info("Finished seeding artwork data.");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VlZC1hcnR3b3JrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NjcmlwdHMvc2VlZC1hcnR3b3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsa0NBMEdDO0FBN0dELHFEQUFzRTtBQUN0RSw4REFBMkQ7QUFFNUMsS0FBSyxVQUFVLGVBQWUsQ0FBQyxFQUFFLFNBQVMsRUFBWTtJQUNuRSxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ25FLE1BQU0sb0JBQW9CLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQywrQkFBYyxDQUFRLENBQUM7SUFFdEUsTUFBTSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBRTlDLDZCQUE2QjtJQUM3QixNQUFNLFdBQVcsR0FBRztRQUNsQjtZQUNFLElBQUksRUFBRSxxQkFBcUI7WUFDM0IsV0FBVyxFQUFFLG1FQUFtRTtZQUNoRixLQUFLLEVBQUUsVUFBVTtZQUNqQixPQUFPLEVBQUUsVUFBVTtZQUNuQixhQUFhLEVBQUUsU0FBUztZQUN4QixrQkFBa0IsRUFBRSxLQUFLO1lBQ3pCLGFBQWEsRUFBRSxtRkFBbUY7U0FDbkc7UUFDRDtZQUNFLElBQUksRUFBRSxtQkFBbUI7WUFDekIsV0FBVyxFQUFFLGtFQUFrRTtZQUMvRSxLQUFLLEVBQUUsUUFBUTtZQUNmLE9BQU8sRUFBRSxZQUFZO1lBQ3JCLGFBQWEsRUFBRSxTQUFTO1lBQ3hCLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsYUFBYSxFQUFFLG1GQUFtRjtTQUNuRztRQUNEO1lBQ0UsSUFBSSxFQUFFLHNCQUFzQjtZQUM1QixXQUFXLEVBQUUsMERBQTBEO1lBQ3ZFLEtBQUssRUFBRSxXQUFXO1lBQ2xCLE9BQU8sRUFBRSxjQUFjO1lBQ3ZCLGFBQWEsRUFBRSxTQUFTO1lBQ3hCLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsYUFBYSxFQUFFLG1GQUFt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