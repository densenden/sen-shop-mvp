"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalProductDownload = void 0;
const utils_1 = require("@medusajs/framework/utils");
// This model tracks each download of a digital product
// Used for access control and analytics
exports.DigitalProductDownload = utils_1.model.define("digital_product_download", {
    id: utils_1.model.id().primaryKey(),
    // Relations
    digital_product_id: utils_1.model.text(), // Link to digital product
    order_id: utils_1.model.text(), // Link to order
    customer_id: utils_1.model.text(), // Who downloaded
    // Access token for secure downloads
    token: utils_1.model.text().unique(), // Unique download token
    // Download tracking
    download_count: utils_1.model.number().default(0),
    last_downloaded_at: utils_1.model.dateTime().nullable(),
    expires_at: utils_1.model.dateTime().nullable(),
    // Status
    is_active: utils_1.model.boolean().default(true),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlnaXRhbC1wcm9kdWN0LWRvd25sb2FkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvZGlnaXRhbC1wcm9kdWN0L21vZGVscy9kaWdpdGFsLXByb2R1Y3QtZG93bmxvYWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQWlEO0FBRWpELHVEQUF1RDtBQUN2RCx3Q0FBd0M7QUFDM0IsUUFBQSxzQkFBc0IsR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLDBCQUEwQixFQUFFO0lBQzdFLEVBQUUsRUFBRSxhQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFO0lBRTNCLFlBQVk7SUFDWixrQkFBa0IsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsMEJBQTBCO0lBQzVELFFBQVEsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsZ0JBQWdCO0lBQ3hDLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsaUJBQWlCO0lBRTVDLG9DQUFvQztJQUNwQyxLQUFLLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLHdCQUF3QjtJQUV0RCxvQkFBb0I7SUFDcEIsY0FBYyxFQUFFLGFBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLGtCQUFrQixFQUFFLGFBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDL0MsVUFBVSxFQUFFLGFBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFFdkMsU0FBUztJQUNULFNBQVMsRUFBRSxhQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztDQUN6QyxDQUFDLENBQUEifQ==