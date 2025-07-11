"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageUploadService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const supabase_js_1 = require("@supabase/supabase-js");
class ImageUploadService extends (0, utils_1.MedusaService)({}) {
    constructor(container, options = {}) {
        super(container, options);
        this.bucketName = "artworks";
        // Initialize Supabase client for getting correct URLs
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        }
        // Get the file service from the container
        // This will use the S3 provider configured in medusa-config.ts
        try {
            this.fileService_ = container.file || container.fileService || container.resolve("fileService");
        }
        catch (error) {
            console.log("File service not available in container");
        }
    }
    async uploadImage(buffer, fileName, mimeType) {
        if (!this.fileService_ && !this.supabase) {
            throw new Error("Neither file service nor Supabase is configured properly.");
        }
        try {
            // Generate unique filename
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(7);
            const fileExt = fileName.split('.').pop() || 'jpg';
            const uniqueFileName = `${timestamp}-${randomId}.${fileExt}`;
            // Try to use file service first
            if (this.fileService_) {
                try {
                    // Create a file object for Medusa's file service
                    const file = {
                        fieldname: 'file',
                        originalname: fileName,
                        encoding: '7bit',
                        mimetype: mimeType,
                        buffer: buffer,
                        size: buffer.length,
                        filename: uniqueFileName
                    };
                    // Upload using Medusa's file service
                    const result = await this.fileService_.create(file);
                    console.log("File service upload result:", result);
                    // If we have Supabase client, get the proper public URL
                    if (this.supabase && result.key) {
                        const { data: { publicUrl } } = this.supabase.storage
                            .from(this.bucketName)
                            .getPublicUrl(result.key);
                        console.log("Supabase public URL:", publicUrl);
                        return publicUrl;
                    }
                    return result.url;
                }
                catch (fileServiceError) {
                    console.log("File service upload failed, falling back to Supabase:", fileServiceError);
                }
            }
            // Fallback to direct Supabase upload
            if (this.supabase) {
                const { data, error } = await this.supabase.storage
                    .from(this.bucketName)
                    .upload(uniqueFileName, buffer, {
                    contentType: mimeType,
                    cacheControl: '3600',
                    upsert: false
                });
                if (error) {
                    throw new Error(`Supabase upload error: ${error.message}`);
                }
                const { data: { publicUrl } } = this.supabase.storage
                    .from(this.bucketName)
                    .getPublicUrl(uniqueFileName);
                console.log("Direct Supabase upload successful, URL:", publicUrl);
                return publicUrl;
            }
            throw new Error("No upload method available");
        }
        catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
    async deleteImage(imageUrl) {
        if (!this.fileService_ && !this.supabase) {
            console.log("No deletion service configured");
            return;
        }
        try {
            // Extract the key from the URL
            // For Supabase URLs like: https://xxx.supabase.co/storage/v1/object/public/artworks/filename.jpg
            const urlParts = imageUrl.split('/');
            const fileKey = urlParts[urlParts.length - 1];
            // Try file service first
            if (this.fileService_) {
                try {
                    await this.fileService_.delete({ fileKey });
                    console.log("Image deleted via file service:", fileKey);
                    return;
                }
                catch (error) {
                    console.log("File service deletion failed:", error);
                }
            }
            // Fallback to Supabase
            if (this.supabase) {
                const { error } = await this.supabase.storage
                    .from(this.bucketName)
                    .remove([fileKey]);
                if (error) {
                    console.error('Supabase deletion error:', error);
                }
                else {
                    console.log("Image deleted via Supabase:", fileKey);
                }
            }
        }
        catch (error) {
            console.error('Error deleting image:', error);
            // Don't throw here to avoid breaking the flow if deletion fails
        }
    }
}
exports.ImageUploadService = ImageUploadService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2UtdXBsb2FkLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9hcnR3b3JrLW1vZHVsZS9zZXJ2aWNlcy9pbWFnZS11cGxvYWQtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBeUQ7QUFDekQsdURBQW9EO0FBaUJwRCxNQUFhLGtCQUFtQixTQUFRLElBQUEscUJBQWEsRUFBQyxFQUFFLENBQUM7SUFLdkQsWUFBWSxTQUFjLEVBQUUsVUFBZSxFQUFFO1FBQzNDLEtBQUssQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFIbkIsZUFBVSxHQUFXLFVBQVUsQ0FBQTtRQUtyQyxzREFBc0Q7UUFDdEQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQTtRQUM3RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUE7UUFFdkYsSUFBSSxXQUFXLElBQUksV0FBVyxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFBLDBCQUFZLEVBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFBO1FBQ3hELENBQUM7UUFFRCwwQ0FBMEM7UUFDMUMsK0RBQStEO1FBQy9ELElBQUksQ0FBQztZQUNILElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsV0FBVyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7UUFDakcsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxDQUFDLENBQUE7UUFDeEQsQ0FBQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQWMsRUFBRSxRQUFnQixFQUFFLFFBQWdCO1FBQ2xFLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sSUFBSSxLQUFLLENBQUMsMkRBQTJELENBQUMsQ0FBQTtRQUM5RSxDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0gsMkJBQTJCO1lBQzNCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUM1QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN4RCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQTtZQUNsRCxNQUFNLGNBQWMsR0FBRyxHQUFHLFNBQVMsSUFBSSxRQUFRLElBQUksT0FBTyxFQUFFLENBQUE7WUFFNUQsZ0NBQWdDO1lBQ2hDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUM7b0JBQ0gsaURBQWlEO29CQUNqRCxNQUFNLElBQUksR0FBbUI7d0JBQzNCLFNBQVMsRUFBRSxNQUFNO3dCQUNqQixZQUFZLEVBQUUsUUFBUTt3QkFDdEIsUUFBUSxFQUFFLE1BQU07d0JBQ2hCLFFBQVEsRUFBRSxRQUFRO3dCQUNsQixNQUFNLEVBQUUsTUFBTTt3QkFDZCxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU07d0JBQ25CLFFBQVEsRUFBRSxjQUFjO3FCQUN6QixDQUFBO29CQUVELHFDQUFxQztvQkFDckMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQXNCLENBQUE7b0JBRXhFLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLENBQUE7b0JBRWxELHdEQUF3RDtvQkFDeEQsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFDaEMsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPOzZCQUNsRCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQzs2QkFDckIsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFFM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxTQUFTLENBQUMsQ0FBQTt3QkFDOUMsT0FBTyxTQUFTLENBQUE7b0JBQ2xCLENBQUM7b0JBRUQsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFBO2dCQUNuQixDQUFDO2dCQUFDLE9BQU8sZ0JBQWdCLEVBQUUsQ0FBQztvQkFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1REFBdUQsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFBO2dCQUN4RixDQUFDO1lBQ0gsQ0FBQztZQUVELHFDQUFxQztZQUNyQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbEIsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTztxQkFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7cUJBQ3JCLE1BQU0sQ0FBQyxjQUFjLEVBQUUsTUFBTSxFQUFFO29CQUM5QixXQUFXLEVBQUUsUUFBUTtvQkFDckIsWUFBWSxFQUFFLE1BQU07b0JBQ3BCLE1BQU0sRUFBRSxLQUFLO2lCQUNkLENBQUMsQ0FBQTtnQkFFSixJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNWLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO2dCQUM1RCxDQUFDO2dCQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTztxQkFDbEQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7cUJBQ3JCLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQTtnQkFFL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5Q0FBeUMsRUFBRSxTQUFTLENBQUMsQ0FBQTtnQkFDakUsT0FBTyxTQUFTLENBQUE7WUFDbEIsQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQTtRQUMvQyxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDOUMsTUFBTSxLQUFLLENBQUE7UUFDYixDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBZ0I7UUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFBO1lBQzdDLE9BQU07UUFDUixDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0gsK0JBQStCO1lBQy9CLGlHQUFpRztZQUNqRyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3BDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBRTdDLHlCQUF5QjtZQUN6QixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDO29CQUNILE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO29CQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxFQUFFLE9BQU8sQ0FBQyxDQUFBO29CQUN2RCxPQUFNO2dCQUNSLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDZixPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixFQUFFLEtBQUssQ0FBQyxDQUFBO2dCQUNyRCxDQUFDO1lBQ0gsQ0FBQztZQUVELHVCQUF1QjtZQUN2QixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbEIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPO3FCQUMxQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztxQkFDckIsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtnQkFFcEIsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDVixPQUFPLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFBO2dCQUNsRCxDQUFDO3FCQUFNLENBQUM7b0JBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsRUFBRSxPQUFPLENBQUMsQ0FBQTtnQkFDckQsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDN0MsZ0VBQWdFO1FBQ2xFLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUE3SUQsZ0RBNklDIn0=