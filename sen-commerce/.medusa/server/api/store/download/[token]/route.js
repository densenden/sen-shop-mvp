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
            filters: {
                token,
                is_active: true
            },
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
            filters: { id: downloadAccess.digital_product_id }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2Rvd25sb2FkL1t0b2tlbl0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EseUVBQTRFO0FBRzVFLHdEQUF3RDtBQUNqRCxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQ3RCLEdBQWtCLEVBQ2xCLEdBQW1CLEVBQ25CLEVBQUU7SUFDRixJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtRQUM1QixNQUFNLHFCQUFxQixHQUN6QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx3Q0FBc0IsQ0FBQyxDQUFBO1FBRTNDLGdDQUFnQztRQUNoQyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQywyQkFBMkIsQ0FBQztZQUMvRSxPQUFPLEVBQUU7Z0JBQ1AsS0FBSztnQkFDTCxTQUFTLEVBQUUsSUFBSTthQUNoQjtZQUNELFNBQVMsRUFBRSxDQUFDLGlCQUFpQixDQUFDO1NBQy9CLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNwQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsa0NBQWtDO2FBQzFDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxtQkFBbUI7UUFDbkIsSUFBSSxjQUFjLENBQUMsVUFBVSxJQUFJLElBQUksSUFBSSxFQUFFLEdBQUcsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDbEYsbUJBQW1CO1lBQ25CLE1BQU0scUJBQXFCLENBQUMsNkJBQTZCLENBQUM7Z0JBQ3hELEVBQUUsRUFBRSxjQUFjLENBQUMsRUFBRTtnQkFDckIsU0FBUyxFQUFFLEtBQUs7YUFDakIsQ0FBQyxDQUFBO1lBRUYsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLGdDQUFnQzthQUN4QyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsMEJBQTBCO1FBQzFCLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxNQUFNLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDO1lBQ3ZFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxjQUFjLENBQUMsa0JBQWtCLEVBQUU7U0FDbkQsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3BCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLEtBQUssRUFBRSwyQkFBMkI7YUFDbkMsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELHVCQUF1QjtRQUN2QixJQUFJLGNBQWMsQ0FBQyxhQUFhLEtBQUssQ0FBQyxDQUFDO1lBQ25DLGNBQWMsQ0FBQyxjQUFjLElBQUksY0FBYyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ2xFLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLEtBQUssRUFBRSx5QkFBeUI7YUFDakMsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELHNDQUFzQztRQUN0QyxNQUFNLHFCQUFxQixDQUFDLDZCQUE2QixDQUFDO1lBQ3hELEVBQUUsRUFBRSxjQUFjLENBQUMsRUFBRTtZQUNyQixjQUFjLEVBQUUsY0FBYyxDQUFDLGNBQWMsR0FBRyxDQUFDO1lBQ2pELGtCQUFrQixFQUFFLElBQUksSUFBSSxFQUFFO1NBQy9CLENBQUMsQ0FBQTtRQUVGLHVCQUF1QjtRQUN2QixpRUFBaUU7UUFDakUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUE7SUFFdkMsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ2xELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSw0QkFBNEI7U0FDcEMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQXpFWSxRQUFBLEdBQUcsT0F5RWYifQ==