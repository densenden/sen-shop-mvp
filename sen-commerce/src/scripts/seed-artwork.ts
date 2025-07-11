import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ARTWORK_MODULE } from "../modules/artwork-module";

export default async function seedArtworkData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const artworkModuleService = container.resolve(ARTWORK_MODULE);

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
    } catch (error) {
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
      product_ids: []
    },
    {
      title: "Color Symphony",
      description: "An explosive array of colors arranged in geometric harmony",
      image_url: "https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?w=800&h=800&fit=crop",
      artwork_collection_id: createdCollections[0]?.id,
      product_ids: []
    },
    {
      title: "Mountain Vista",
      description: "A breathtaking mountain landscape at golden hour",
      image_url: "https://images.unsplash.com/photo-1464822759844-d150065273e8?w=800&h=800&fit=crop",
      artwork_collection_id: createdCollections[1]?.id,
      product_ids: []
    },
    {
      title: "Forest Reflection",
      description: "Peaceful forest scene reflected in still water",
      image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=800&fit=crop",
      artwork_collection_id: createdCollections[1]?.id,
      product_ids: []
    },
    {
      title: "Modern Face",
      description: "Contemporary minimalist portrait with clean lines",
      image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
      artwork_collection_id: createdCollections[2]?.id,
      product_ids: []
    },
    {
      title: "Elegant Silhouette",
      description: "A striking silhouette portrait with dramatic lighting",
      image_url: "https://images.unsplash.com/photo-1494790108755-2616c047f21a?w=800&h=800&fit=crop",
      artwork_collection_id: createdCollections[2]?.id,
      product_ids: []
    }
  ];

  for (const artwork of artworks) {
    try {
      const created = await artworkModuleService.createArtworks(artwork);
      logger.info(`Created artwork: ${artwork.title}`);
    } catch (error) {
      logger.error(`Failed to create artwork ${artwork.title}:`, error);
    }
  }

  logger.info("Finished seeding artwork data.");
}