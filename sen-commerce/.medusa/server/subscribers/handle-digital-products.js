"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handleDigitalProducts;
const utils_1 = require("@medusajs/framework/utils");
const digital_product_1 = require("../modules/digital-product");
const crypto_1 = __importDefault(require("crypto"));
async function handleDigitalProducts({ event: { data }, container }) {
    const logger = container.resolve("logger");
    try {
        logger.info(`Processing digital products for order ${data.id}`);
        const query = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
        const digitalProductService = container.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Get order with line items
        const { data: [order] } = await query.graph({
            entity: "order",
            filters: { id: data.id },
            fields: [
                "id",
                "email",
                "customer_id",
                "items.*",
                "items.product.*"
            ],
        });
        if (!order || !order.items) {
            logger.warn(`Order ${data.id} not found or has no items`);
            return;
        }
        // Check each line item for digital products
        const digitalProductIds = [];
        // For now, we'll check if products have digital products by querying separately
        for (const item of order.items) {
            if (item?.product?.id) {
                // Query for linked digital products
                // Since we removed the link, we'll need another way to associate them
                // For now, let's check if product metadata or title indicates it's digital
                // This is a placeholder - you'll need to implement your own logic
                // For example, you could:
                // 1. Store digital product IDs in product metadata
                // 2. Use a naming convention
                // 3. Create a custom field on products
                logger.info(`Checking product ${item.product.id} for digital products`);
            }
        }
        // If we found digital products, create download access
        if (digitalProductIds.length > 0) {
            const downloadLinks = [];
            for (const digitalProductId of digitalProductIds) {
                const digitalProducts = await digitalProductService.listDigitalProducts({
                    filters: { id: digitalProductId }
                });
                const digitalProduct = digitalProducts[0];
                if (digitalProduct) {
                    // Generate secure token
                    const token = crypto_1.default.randomBytes(32).toString('hex');
                    // Create download access
                    await digitalProductService.createDigitalProductDownloads([
                        {
                            digital_product_id: digitalProduct.id,
                            order_id: order.id,
                            customer_id: order.customer_id ?? order.email ?? undefined,
                            token,
                            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                            is_active: true
                        }
                    ]);
                    downloadLinks.push({
                        product_name: digitalProduct.name,
                        download_url: `${process.env.STORE_URL || 'http://localhost:8000'}/download/${token}`,
                        expires_in_days: 7
                    });
                }
            }
            // Send email with download links
            if (downloadLinks.length > 0) {
                logger.info(`Sending ${downloadLinks.length} download links to ${order.email}`);
                // TODO: Send email using notification service
                // For now, just log the links
                logger.info(`Download links: ${JSON.stringify(downloadLinks)}`);
            }
        }
    }
    catch (error) {
        logger.error(`Error processing digital products for order ${data.id}:`, error);
        // Don't throw - we don't want to fail the order
    }
}
exports.config = {
    event: "order.placed",
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlLWRpZ2l0YWwtcHJvZHVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc3Vic2NyaWJlcnMvaGFuZGxlLWRpZ2l0YWwtcHJvZHVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBTUEsd0NBbUdDO0FBeEdELHFEQUFxRTtBQUNyRSxnRUFBbUU7QUFFbkUsb0RBQTJCO0FBRVosS0FBSyxVQUFVLHFCQUFxQixDQUFDLEVBQ2xELEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxFQUNmLFNBQVMsRUFDc0I7SUFDL0IsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUUxQyxJQUFJLENBQUM7UUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUUvRCxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2hFLE1BQU0scUJBQXFCLEdBQ3pCLFNBQVMsQ0FBQyxPQUFPLENBQUMsd0NBQXNCLENBQUMsQ0FBQTtRQUUzQyw0QkFBNEI7UUFDNUIsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQzFDLE1BQU0sRUFBRSxPQUFPO1lBQ2YsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDeEIsTUFBTSxFQUFFO2dCQUNOLElBQUk7Z0JBQ0osT0FBTztnQkFDUCxhQUFhO2dCQUNiLFNBQVM7Z0JBQ1QsaUJBQWlCO2FBQ2xCO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLEVB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