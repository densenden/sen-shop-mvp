"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const supabase_js_1 = require("@supabase/supabase-js");
const sharp_1 = __importDefault(require("sharp"));
// Service to handle file uploads to Supabase "print" bucket
class FileUploadService extends (0, utils_1.MedusaService)({}) {
    constructor(container, options = {}) {
        super(container, options);
        this.bucketName = "print"; // Your bucket name
        // Initialize Supabase client
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase URL and Key are required for digital products");
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    // Generate thumbnail for image files
    async generateThumbnail(buffer, mimeType) {
        try {
            // Only generate thumbnails for image files
            if (!mimeType.startsWith('image/')) {
                return null;
            }
            // Generate 500px width thumbnail
            const thumbnail = await (0, sharp_1.default)(buffer)
                .resize(500, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
                .jpeg({
                quality: 85,
                progressive: true
            })
                .toBuffer();
            return thumbnail;
        }
        catch (error) {
            console.warn('Failed to generate thumbnail:', error);
            return null;
        }
    }
    // Upload a digital product file with optional thumbnail generation
    async uploadFile(buffer, fileName, mimeType) {
        try {
            // Generate unique filename to avoid conflicts
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(7);
            const fileExt = fileName.split('.').pop() || 'bin';
            const uniqueFileName = `digital-products/${timestamp}-${randomId}.${fileExt}`;
            console.log(`Uploading file to Supabase: ${uniqueFileName}`);
            // Upload main file to Supabase
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(uniqueFileName, buffer, {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: false
            });
            if (error) {
                console.error("Supabase upload error details:", error);
                if (error.message.includes("row-level security")) {
                    throw new Error("Upload failed: Supabase bucket RLS policy blocks uploads. Please disable RLS or add an upload policy in Supabase dashboard.");
                }
                throw new Error(`Upload failed: ${error.message}`);
            }
            // Get public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from(this.bucketName)
                .getPublicUrl(uniqueFileName);
            console.log(`File uploaded successfully: ${publicUrl}`);
            const result = {
                url: publicUrl,
                key: uniqueFileName,
                size: buffer.length,
                mimeType: mimeType
            };
            // Generate and upload thumbnail for images
            const thumbnailBuffer = await this.generateThumbnail(buffer, mimeType);
            if (thumbnailBuffer) {
                const thumbnailFileName = `digital-products/thumbnails/${timestamp}-${randomId}.jpg`;
                console.log(`Uploading thumbnail: ${thumbnailFileName}`);
                const { data: thumbData, error: thumbError } = await this.supabase.storage
                    .from(this.bucketName)
                    .upload(thumbnailFileName, thumbnailBuffer, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: false
                });
                if (!thumbError) {
                    const { data: { publicUrl: thumbnailUrl } } = this.supabase.storage
                        .from(this.bucketName)
                        .getPublicUrl(thumbnailFileName);
                    result.thumbnailUrl = thumbnailUrl;
                    result.thumbnailKey = thumbnailFileName;
                    console.log(`Thumbnail uploaded successfully: ${thumbnailUrl}`);
                }
                else {
                    console.warn('Failed to upload thumbnail:', thumbError);
                }
            }
            return result;
        }
        catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
    // Delete a file from storage
    async deleteFile(fileKey) {
        try {
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .remove([fileKey]);
            if (error) {
                console.error('Delete error:', error);
            }
            else {
                console.log(`File deleted: ${fileKey}`);
            }
        }
        catch (error) {
            console.error('Error deleting file:', error);
            // Don't throw to avoid breaking flow
        }
    }
    // Delete both main file and thumbnail
    async deleteFileWithThumbnail(fileKey, thumbnailKey) {
        const filesToDelete = [fileKey];
        if (thumbnailKey) {
            filesToDelete.push(thumbnailKey);
        }
        try {
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .remove(filesToDelete);
            if (error) {
                console.error('Delete error:', error);
            }
            else {
                console.log(`Files deleted: ${filesToDelete.join(', ')}`);
            }
        }
        catch (error) {
            console.error('Error deleting files:', error);
            // Don't throw to avoid breaking flow
        }
    }
    // Generate a time-limited signed URL for secure downloads
    async getSignedUrl(fileKey, expiresIn = 3600) {
        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .createSignedUrl(fileKey, expiresIn);
        if (error) {
            throw new Error(`Failed to create signed URL: ${error.message}`);
        }
        return data.signedUrl;
    }
}
exports.FileUploadService = FileUploadService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS11cGxvYWQtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2RpZ2l0YWwtcHJvZHVjdC9zZXJ2aWNlcy9maWxlLXVwbG9hZC1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHFEQUF5RDtBQUN6RCx1REFBb0Q7QUFDcEQsa0RBQXlCO0FBV3pCLDREQUE0RDtBQUM1RCxNQUFhLGlCQUFrQixTQUFRLElBQUEscUJBQWEsRUFBQyxFQUFFLENBQUM7SUFJdEQsWUFBWSxTQUFjLEVBQUUsVUFBZSxFQUFFO1FBQzNDLEtBQUssQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFIbkIsZUFBVSxHQUFXLE9BQU8sQ0FBQSxDQUFDLG1CQUFtQjtRQUt0RCw2QkFBNkI7UUFDN0IsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQTtRQUM3RSxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUE7UUFFdkYsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0RBQXdELENBQUMsQ0FBQTtRQUMzRSxDQUFDO1FBRUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFBLDBCQUFZLEVBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFBO0lBQ3hELENBQUM7SUFFRCxxQ0FBcUM7SUFDN0IsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE1BQWMsRUFBRSxRQUFnQjtRQUM5RCxJQUFJLENBQUM7WUFDSCwyQ0FBMkM7WUFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxJ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