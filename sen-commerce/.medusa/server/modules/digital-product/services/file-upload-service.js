"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const supabase_js_1 = require("@supabase/supabase-js");
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
    // Upload a digital product file
    async uploadFile(buffer, fileName, mimeType) {
        try {
            // Generate unique filename to avoid conflicts
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(7);
            const fileExt = fileName.split('.').pop() || 'bin';
            const uniqueFileName = `digital-products/${timestamp}-${randomId}.${fileExt}`;
            console.log(`Uploading file to Supabase: ${uniqueFileName}`);
            // Upload to Supabase
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
            return {
                url: publicUrl,
                key: uniqueFileName,
                size: buffer.length,
                mimeType: mimeType
            };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS11cGxvYWQtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2RpZ2l0YWwtcHJvZHVjdC9zZXJ2aWNlcy9maWxlLXVwbG9hZC1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUF5RDtBQUN6RCx1REFBb0Q7QUFTcEQsNERBQTREO0FBQzVELE1BQWEsaUJBQWtCLFNBQVEsSUFBQSxxQkFBYSxFQUFDLEVBQUUsQ0FBQztJQUl0RCxZQUFZLFNBQWMsRUFBRSxVQUFlLEVBQUU7UUFDM0MsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUhuQixlQUFVLEdBQVcsT0FBTyxDQUFBLENBQUMsbUJBQW1CO1FBS3RELDZCQUE2QjtRQUM3QixNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFBO1FBQzdFLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQTtRQUV2RixJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDakMsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFBO1FBQzNFLENBQUM7UUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUEsMEJBQVksRUFBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUE7SUFDeEQsQ0FBQztJQUVELGdDQUFnQztJQUNoQyxLQUFLLENBQUMsVUFBVSxDQUNkLE1BQWMsRUFDZCxRQUFnQixFQUNoQixRQUFnQjtRQUVoQixJQUFJLENBQUM7WUFDSCw4Q0FBOEM7WUFDOUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO1lBQzVCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FB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