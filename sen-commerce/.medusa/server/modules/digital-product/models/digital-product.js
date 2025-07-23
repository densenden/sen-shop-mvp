"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalProduct = void 0;
const utils_1 = require("@medusajs/framework/utils");
// This model represents a digital product (file that can be downloaded)
// It will be linked to regular products
exports.DigitalProduct = utils_1.model.define("digital_product", {
    id: utils_1.model.id().primaryKey(),
    // File information
    name: utils_1.model.text(), // Display name for the file
    file_url: utils_1.model.text(), // URL in Supabase bucket
    file_key: utils_1.model.text(), // Key/path in the bucket
    file_size: utils_1.model.number(), // Size in bytes
    mime_type: utils_1.model.text(), // File type (pdf, jpg, etc)
    // Metadata
    description: utils_1.model.text().nullable(), // Optional description
    preview_url: utils_1.model.text().nullable(), // Optional preview image
    // Access control
    max_downloads: utils_1.model.number().default(-1), // -1 = unlimited
    expires_at: utils_1.model.dateTime().nullable(), // Optional expiry date
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlnaXRhbC1wcm9kdWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvZGlnaXRhbC1wcm9kdWN0L21vZGVscy9kaWdpdGFsLXByb2R1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQWlEO0FBRWpELHdFQUF3RTtBQUN4RSx3Q0FBd0M7QUFDM0IsUUFBQSxjQUFjLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRTtJQUM1RCxFQUFFLEVBQUUsYUFBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRTtJQUUzQixtQkFBbUI7SUFDbkIsSUFBSSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSw0QkFBNEI7SUFDaEQsUUFBUSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSx5QkFBeUI7SUFDakQsUUFBUSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSx5QkFBeUI7SUFDakQsU0FBUyxFQUFFLGFBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxnQkFBZ0I7SUFDM0MsU0FBUyxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSw0QkFBNEI7SUFFckQsV0FBVztJQUNYLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsdUJBQXVCO0lBQzdELFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUseUJBQXlCO0lBRS9ELGlCQUFpQjtJQUNqQixhQUFhLEVBQUUsYUFBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLGlCQUFpQjtJQUM1RCxVQUFVLEVBQUUsYUFBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLHVCQUF1QjtDQUVqRSxDQUFDLENBQUEifQ==