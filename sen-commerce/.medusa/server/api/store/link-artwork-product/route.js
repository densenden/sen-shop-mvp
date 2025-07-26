"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.POST = void 0;
const artwork_module_1 = require("../../../modules/artwork-module");
const POST = async (req, res) => {
    try {
        const { artwork_id, printful_product_ids } = req.body;
        if (!artwork_id || !printful_product_ids || !Array.isArray(printful_product_ids)) {
            return res.status(400).json({
                error: "artwork_id and printful_product_ids array are required"
            });
        }
        console.log(`Linking artwork ${artwork_id} to products:`, printful_product_ids);
        // Get the artwork module service
        try {
            const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
            if (!artworkModuleService) {
                return res.status(500).json({
                    error: "Artwork module service not available"
                });
            }
            // Get the current artwork
            const [artworks] = await artworkModuleService.listAndCountArtworks({ id: artwork_id });
            if (!artworks || artworks.length === 0) {
                return res.status(404).json({
                    error: "Artwork not found"
                });
            }
            const artwork = artworks[0];
            console.log("Current artwork:", artwork.title);
            console.log("Current product_ids:", artwork.product_ids);
            // Update the artwork with the new product IDs
            const currentProductIds = artwork.product_ids || {};
            // Add new product IDs to the existing ones
            const updatedProductIds = { ...currentProductIds };
            printful_product_ids.forEach(productId => {
                updatedProductIds[productId] = {
                    provider: 'printful',
                    linked_at: new Date().toISOString(),
                    status: 'active'
                };
            });
            console.log("Updated product_ids:", updatedProductIds);
            console.log("Updating artwork with ID:", artwork_id);
            console.log("Artwork object ID:", artwork.id);
            // Update the artwork
            const updatedArtwork = await artworkModuleService.updateArtworks(artwork.id, {
                product_ids: updatedProductIds
            });
            console.log("Artwork updated successfully");
            res.json({
                success: true,
                artwork_id,
                linked_products: printful_product_ids,
                updated_artwork: {
                    id: updatedArtwork.id,
                    title: updatedArtwork.title,
                    product_ids: updatedArtwork.product_ids
                }
            });
        }
        catch (error) {
            console.error("Error linking artwork to products:", error);
            res.status(500).json({
                error: "Failed to link artwork to products",
                message: error.message
            });
        }
    }
    catch (error) {
        console.error("Link artwork-product API error:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
};
exports.POST = POST;
const GET = async (req, res) => {
    try {
        const { artwork_id } = req.query;
        if (!artwork_id) {
            return res.status(400).json({
                error: "artwork_id query parameter is required"
            });
        }
        console.log(`Getting linked products for artwork: ${artwork_id}`);
        // Get the artwork module service
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        if (!artworkModuleService) {
            return res.status(500).json({
                error: "Artwork module service not available"
            });
        }
        // Get the artwork
        const [artworks] = await artworkModuleService.listAndCountArtworks({ id: artwork_id });
        if (!artworks || artworks.length === 0) {
            return res.status(404).json({
                error: "Artwork not found"
            });
        }
        const artwork = artworks[0];
        const linkedProducts = artwork.product_ids || {};
        const productIds = Object.keys(linkedProducts);
        console.log(`Found ${productIds.length} linked products`);
        res.json({
            success: true,
            artwork_id,
            artwork_title: artwork.title,
            linked_products: linkedProducts,
            product_count: productIds.length
        });
    }
    catch (error) {
        console.error("Get linked products error:", error);
        res.status(500).json({
            error: "Failed to get linked products",
            message: error.message
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2xpbmstYXJ0d29yay1wcm9kdWN0L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG9FQUFnRTtBQUV6RCxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLFVBQVUsRUFBRSxvQkFBb0IsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUdoRCxDQUFBO1FBRUQsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLG9CQUFvQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7WUFDakYsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLHdEQUF3RDthQUNoRSxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsVUFBVSxlQUFlLEVBQUUsb0JBQW9CLENBQUMsQ0FBQTtRQUUvRSxpQ0FBaUM7UUFDakMsSUFBSSxDQUFDO1lBQ0gsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQywrQkFBYyxDQUFRLENBQUE7WUFFckUsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzFCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQzFCLEtBQUssRUFBRSxzQ0FBc0M7aUJBQzlDLENBQUMsQ0FBQTtZQUNKLENBQUM7WUFFRCwwQkFBMEI7WUFDMUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLE1BQU0sb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQTtZ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