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
            mime_type: uploadResult.mimeType
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
            filters: { token },
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
            filters: { id: download.digital_product_id }
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
    // Delete digital product and its file
    async deleteDigitalProductWithFile(id) {
        const [product] = await this.listDigitalProducts({ id });
        if (product && product.file_key) {
            // Delete file from storage
            await this.fileUploadService_.deleteFile(product.file_key);
        }
        // Delete database record
        await this.deleteDigitalProducts(id);
    }
}
exports.DigitalProductModuleService = DigitalProductModuleService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlnaXRhbC1wcm9kdWN0LW1vZHVsZS1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvZGlnaXRhbC1wcm9kdWN0L3NlcnZpY2VzL2RpZ2l0YWwtcHJvZHVjdC1tb2R1bGUtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxxREFBeUQ7QUFDekQsc0NBQWtFO0FBQ2xFLCtEQUF5RDtBQUN6RCxvREFBMkI7QUFFM0IsNkNBQTZDO0FBQzdDLE1BQWEsMkJBQTRCLFNBQVEsSUFBQSxxQkFBYSxFQUFDO0lBQzdELGNBQWMsRUFBZCx1QkFBYztJQUNkLHNCQUFzQixFQUF0QiwrQkFBc0I7Q0FDdkIsQ0FBQztJQUdBLFlBQVksU0FBYyxFQUFFLE9BQWE7UUFDdkMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUN6QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSx1Q0FBaUIsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDckUsQ0FBQztJQUVELDRDQUE0QztJQUM1QyxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFNMUI7UUFDQyxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsR0FBRyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUE7UUFFL0QsK0JBQStCO1FBQy9CLE1BQU0sT0FBTyxHQUFHLEVBQUUsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFBLENBQUMsT0FBTztRQUN4QyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsT0FBTyxFQUFFLENBQUM7WUFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFBO1FBQy9HLENBQUM7UUFFRCwwQkFB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