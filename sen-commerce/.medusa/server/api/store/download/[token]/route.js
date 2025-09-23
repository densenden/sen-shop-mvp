"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const digital_product_1 = require("../../../../modules/digital-product");
// GET /store/download/:token - Download digital product
const GET = async (req, res) => {
    try {
        const { token } = req.params;
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Find download access by token
        const [downloadAccess] = await digitalProductService.listDigitalProductDownloads({
            token,
            is_active: true,
            relations: ["digital_product"]
        });
        if (!downloadAccess) {
            return res.status(404).json({
                error: "Invalid or expired download link"
            });
        }
        // Check if expired
        if (downloadAccess.expires_at && new Date() > new Date(downloadAccess.expires_at)) {
            // Mark as inactive
            await digitalProductService.updateDigitalProductDownloads({
                id: downloadAccess.id,
                is_active: false
            });
            return res.status(410).json({
                error: "This download link has expired"
            });
        }
        // Get the digital product
        const [digitalProduct] = await digitalProductService.listDigitalProducts({
            id: downloadAccess.digital_product_id
        });
        if (!digitalProduct) {
            return res.status(404).json({
                error: "Digital product not found"
            });
        }
        // Check download limit
        if (digitalProduct.max_downloads !== -1 &&
            downloadAccess.download_count >= digitalProduct.max_downloads) {
            return res.status(429).json({
                error: "Download limit exceeded"
            });
        }
        // Update download count and timestamp
        await digitalProductService.updateDigitalProductDownloads({
            id: downloadAccess.id,
            download_count: downloadAccess.download_count + 1,
            last_downloaded_at: new Date()
        });
        // Redirect to file URL
        // In production, you might want to generate a signed URL instead
        res.redirect(digitalProduct.file_url);
    }
    catch (error) {
        console.error("Error processing download:", error);
        res.status(500).json({
            error: "Failed to process download"
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2Rvd25sb2FkL1t0b2tlbl0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EseUVBQTRFO0FBRzVFLHdEQUF3RDtBQUNqRCxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQ3RCLEdBQWtCLEVBQ2xCLEdBQW1CLEVBQ25CLEVBQUU7SUFDRixJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtRQUM1QixNQUFNLHFCQUFxQixHQUN6QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx3Q0FBc0IsQ0FBQyxDQUFBO1FBRTNDLGdDQUFnQztRQUNoQyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQywyQkFBMkIsQ0FBQztZQUMvRSxLQUFLO1lBQ0wsU0FBUyxFQUFFLElBQUk7WUFDZixTQUFTLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztTQUMvQixDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLGtDQUFrQzthQUMxQyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsbUJBQW1CO1FBQ25CLElBQUksY0FBYyxDQUFDLFVBQVUsSUFBSSxJQUFJLElBQUksRUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQ2xGLG1CQUFtQjtZQUNuQixNQUFNLHFCQUFxQixDQUFDLDZCQUE2QixDQUFDO2dCQUN4RCxFQUFFLEVBQUUsY0FBYyxDQUFDLEVBQUU7Z0JBQ3JCLFNBQVMsRUFBRSxLQUFLO2FBQ2pCLENBQUMsQ0FBQTtZQUVGLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLEtBQUssRUFBRSxnQ0FBZ0M7YUFDeEMsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELDBCQUEwQjtRQUMxQixNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQztZQUN2RSxFQUFFLEVBQUUsY0FBYyxDQUFDLGtCQUFrQjtTQUN0QyxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLDJCQUEyQjthQUNuQyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsdUJBQXVCO1FBQ3ZCLElBQUksY0FBYyxDQUFDLGFBQWEsS0FBSyxDQUFDLENBQUM7WUFDbkMsY0FBYyxDQUFDLGNBQWMsSUFBSSxjQUFjLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDbEUsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLHlCQUF5QjthQUNqQyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsc0NBQXNDO1FBQ3RDLE1BQU0scUJBQXFCLENBQUMsNkJBQTZCLENBQUM7WUFDeEQsRUFBRSxFQUFFLGNBQWMsQ0FBQyxFQUFFO1lBQ3JCLGNBQWMsRUFBRSxjQUFjLENBQUMsY0FBYyxHQUFHLENBQUM7WUFDakQsa0JBQWtCLEVBQUUsSUFBSSxJQUFJLEVBQUU7U0FDL0IsQ0FBQyxDQUFBO1FBRUYsdUJBQXVCO1FBQ3ZCLGlFQUFpRTtRQUNqRSxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUV2QyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDbEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLDRCQUE0QjtTQUNwQyxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBdkVZLFFBQUEsR0FBRyxPQXVFZiJ9