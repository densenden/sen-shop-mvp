"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalProductModuleService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const models_1 = require("../models");
const file_upload_service_1 = require("./file-upload-service");
const crypto_1 = __importDefault(require("crypto"));
// Main service for managing digital products
class DigitalProductModuleService extends (0, utils_1.MedusaService)({
    DigitalProduct: models_1.DigitalProduct,
    DigitalProductDownload: models_1.DigitalProductDownload
}) {
    constructor(container, options) {
        super(container, options);
        this.fileUploadService_ = new file_upload_service_1.FileUploadService(container, options);
    }
    // Create a digital product with file upload
    async createDigitalProduct(data) {
        const { fileBuffer, fileName, mimeType, ...productData } = data;
        // Check file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (fileBuffer.length > maxSize) {
            throw new Error(`File too large: ${(fileBuffer.length / (1024 * 1024)).toFixed(1)}MB exceeds the 50MB limit`);
        }
        // Upload file to Supabase
        const uploadResult = await this.fileUploadService_.uploadFile(fileBuffer, fileName, mimeType);
        // Create digital product record
        const digitalProduct = await this.createDigitalProducts({
            ...productData,
            file_url: uploadResult.url,
            file_key: uploadResult.key,
            file_size: uploadResult.size,
            mime_type: uploadResult.mimeType,
            thumbnail_url: uploadResult.thumbnailUrl || null,
            thumbnail_key: uploadResult.thumbnailKey || null
        });
        return digitalProduct;
    }
    // Generate download access for an order
    async createDownloadAccess(data) {
        // Generate unique download token
        const token = crypto_1.default.randomBytes(32).toString('hex');
        // Calculate expiry date (default 7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (data.expires_in_days || 7));
        const downloadAccess = await this.createDigitalProductDownloads({
            digital_product_id: data.digital_product_id,
            order_id: data.order_id,
            customer_id: data.customer_id,
            token: token,
            expires_at: expiresAt,
            is_active: true
        });
        return downloadAccess;
    }
    // Validate and get download URL
    async getDownloadUrl(token) {
        // Find download record by token
        const [download] = await this.listDigitalProductDownloads({
            token,
            relations: ["digital_product"]
        });
        if (!download) {
            throw new Error("Invalid download token");
        }
        // Check if expired
        if (download.expires_at && new Date(download.expires_at) < new Date()) {
            throw new Error("Download link has expired");
        }
        // Check if still active
        if (!download.is_active) {
            throw new Error("Download link is no longer active");
        }
        // Get the digital product
        const [digitalProduct] = await this.listDigitalProducts({
            id: download.digital_product_id
        });
        if (!digitalProduct) {
            throw new Error("Digital product not found");
        }
        // Check max downloads limit
        if (digitalProduct.max_downloads > 0 &&
            download.download_count >= digitalProduct.max_downloads) {
            throw new Error("Maximum download limit reached");
        }
        // Update download count
        await this.updateDigitalProductDownloads({
            id: download.id,
            download_count: download.download_count + 1,
            last_downloaded_at: new Date()
        });
        // Return public URL (since bucket is public)
        return {
            url: digitalProduct.file_url,
            product: digitalProduct
        };
    }
    // Delete digital product and its files (including thumbnail)
    async deleteDigitalProductWithFile(id) {
        const [product] = await this.listDigitalProducts({ id });
        if (product && product.file_key) {
            // Delete file and thumbnail from storage
            await this.fileUploadService_.deleteFileWithThumbnail(product.file_key, product.thumbnail_key);
        }
        // Delete database record
        await this.deleteDigitalProducts(id);
    }
}
exports.DigitalProductModuleService = DigitalProductModuleService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlnaXRhbC1wcm9kdWN0LW1vZHVsZS1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvZGlnaXRhbC1wcm9kdWN0L3NlcnZpY2VzL2RpZ2l0YWwtcHJvZHVjdC1tb2R1bGUtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBeUQ7QUFDekQsc0NBQWtFO0FBQ2xFLCtEQUF5RDtBQUN6RCxvREFBMkI7QUFFM0IsNkNBQTZDO0FBQzdDLE1BQWEsMkJBQTRCLFNBQVEsSUFBQSxxQkFBYSxFQUFDO0lBQzdELGNBQWMsRUFBZCx1QkFBYztJQUNkLHNCQUFzQixFQUF0QiwrQkFBc0I7Q0FDdkIsQ0FBQztJQUdBLFlBQVksU0FBYyxFQUFFLE9BQWE7UUFDdkMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUN6QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSx1Q0FBaUIsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDckUsQ0FBQztJQUVELDRDQUE0QztJQUM1QyxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFNMUI7UUFDQyxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsR0FBRyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUE7UUFFL0QsK0JBQStCO1FBQy9CLE1BQU0sT0FBTyxHQUFHLEVBQUUsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFBLENBQUMsT0FBTztRQUN4QyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsT0FBTyxFQUFFLENBQUM7WUFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFBO1FBQy9HLENBQUM7UUFFRCwwQkFBMEI7UUFDMUIsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUMzRCxVQUFVLEVBQ1YsUUFBUSxFQUNSLFFBQVEsQ0FDVCxDQUFBO1FBRUQsZ0NBQWdDO1FBQ2hDLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDO1lBQ3RELEdBQUcsV0FBVztZQUNkLFFBQVEsRUFBRSxZQUFZLENBQUMsR0FBRztZQUMxQixRQUFRLEVBQUUsWUFBWSxDQUFDLEdBQUc7WUFDMUIsU0FBUyxFQUFFLFlBQVksQ0FBQyxJQUFJO1lBQzVCLFNBQVMsRUFBRSxZQUFZLENBQUMsUUFBUTtZQUNoQyxhQUFhLEVBQUUsWUFBWSxDQUFDLFlBQVksSUFBSSxJQUFJO1lBQ2hELGFBQWEsRUFBRSxZQUFZLENBQUMsWUFBWSxJQUFJLElBQUk7U0FDakQsQ0FBQyxDQUFBO1FBRUYsT0FBTyxjQUFjLENBQUE7SUFDdkIsQ0FBQztJQUVELHdDQUF3QztJQUN4QyxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFLMUI7UUFDQyxpQ0FBaUM7UUFDakMsTUFBTSxLQUFLLEdBQUcsZ0JBQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXBELHlDQUF5QztRQUN6QyxNQUFNLFNBQVMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFBO1FBQzVCLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRXBFLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLDZCQUE2QixDQUFDO1lBQzlELGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0I7WUFDM0MsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztZQUM3QixLQUFLLEVBQUUsS0FBSztZQUNaLFVBQVUsRUFBRSxTQUFTO1lBQ3JCLFNBQVMsRUFBRSxJQUFJO1NBQ2hCLENBQUMsQ0FBQTtRQUVGLE9BQU8sY0FBYyxDQUFBO0lBQ3ZCLENBQUM7SUFFRCxnQ0FBZ0M7SUFDaEMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFhO1FBSWhDLGdDQUFnQztRQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMsMkJBQTJCLENBQUM7WUFDeEQsS0FBSztZQUNMLFNBQVMsRUFBRSxDQUFDLGlCQUFpQixDQUFDO1NBQy9CLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQTtRQUMzQyxDQUFDO1FBRUQsbUJBQW1CO1FBQ25CLElBQUksUUFBUSxDQUFDLFVBQVUsSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ3RFLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQTtRQUM5QyxDQUFDO1FBRUQsd0JBQXdCO1FBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFBO1FBQ3RELENBQUM7UUFFRCwwQkFBMEI7UUFDMUIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDO1lBQ3RELEVBQUUsRUFBRSxRQUFRLENBQUMsa0JBQWtCO1NBQ2hDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUE7UUFDOUMsQ0FBQztRQUVELDRCQUE0QjtRQUM1QixJQUFJLGNBQWMsQ0FBQyxhQUFhLEdBQUcsQ0FBQztZQUNoQyxRQUFRLENBQUMsY0FBYyxJQUFJLGNBQWMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM1RCxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUE7UUFDbkQsQ0FBQztRQUVELHdCQUF3QjtRQUN4QixNQUFNLElBQUksQ0FBQyw2QkFBNkIsQ0FBQztZQUN2QyxFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDZixjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWMsR0FBRyxDQUFDO1lBQzNDLGtCQUFrQixFQUFFLElBQUksSUFBSSxFQUFFO1NBQy9CLENBQUMsQ0FBQTtRQUVGLDZDQUE2QztRQUM3QyxPQUFPO1lBQ0wsR0FBRyxFQUFFLGNBQWMsQ0FBQyxRQUFRO1lBQzVCLE9BQU8sRUFBRSxjQUFjO1NBQ3hCLENBQUE7SUFDSCxDQUFDO0lBRUQsNkRBQTZEO0lBQzdELEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxFQUFVO1FBQzNDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFeEQsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLHlDQUF5QztZQUN6QyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyx1QkFBdUIsQ0FDbkQsT0FBTyxDQUFDLFFBQVEsRUFDaEIsT0FBTyxDQUFDLGFBQWEsQ0FDdEIsQ0FBQTtRQUNILENBQUM7UUFFRCx5QkFBeUI7UUFDekIsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDdEMsQ0FBQztDQUNGO0FBL0lELGtFQStJQyJ9