"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handleDigitalProducts;
const digital_product_1 = require("../modules/digital-product");
const email_service_1 = __importDefault(require("../services/email-service"));
const crypto_1 = __importDefault(require("crypto"));
async function handleDigitalProducts({ event: { data }, container }) {
    const logger = container.resolve("logger");
    try {
        console.log(`[Digital Products Subscriber] 📱 Processing digital products for order ${data.id}`);
        // Get order data from event (new structure)
        const orderData = data.data;
        if (!orderData || !orderData.items || !orderData.email) {
            console.log("[Digital Products Subscriber] ❌ No order data or items found, skipping digital products");
            return;
        }
        console.log(`[Digital Products Subscriber] 🔍 Checking ${orderData.items.length} items for digital products`);
        const digitalProductService = container.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Check each line item for digital products
        const digitalProductItems = [];
        for (const item of orderData.items) {
            console.log(`[Digital Products Subscriber] 🏷️ Checking item: ${item.title}`);
            console.log(`[Digital Products Subscriber] Item metadata:`, item.metadata);
            // Check if item has digital fulfillment
            const fulfillmentType = item.fulfillment_type ||
                item.metadata?.fulfillment_type ||
                item.product?.metadata?.fulfillment_type;
            if (fulfillmentType === 'digital' || fulfillmentType === 'digital_download') {
                // Look for linked digital product ID in metadata
                const digitalProductId = item.digital_product_id ||
                    item.metadata?.digital_product_id ||
                    item.product?.metadata?.digital_product_id;
                if (digitalProductId) {
                    digitalProductItems.push({
                        digitalProductId,
                        product: item.product || item,
                        quantity: item.quantity || 1
                    });
                    console.log(`[Digital Products Subscriber] ✅ Found digital product ${digitalProductId} for item ${item.title}`);
                }
                else {
                    console.log(`[Digital Products Subscriber] ⚠️ Digital item ${item.title} has no digital_product_id`);
                }
            }
        }
        // If we found digital products, create download access
        if (digitalProductItems.length > 0) {
            console.log(`[Digital Products Subscriber] 🎯 Processing ${digitalProductItems.length} digital product items`);
            const downloadLinks = [];
            for (const item of digitalProductItems) {
                try {
                    const digitalProducts = await digitalProductService.listDigitalProducts({
                        filters: { id: item.digitalProductId }
                    });
                    const digitalProduct = digitalProducts[0];
                    if (digitalProduct) {
                        console.log(`[Digital Products Subscriber] 📁 Found digital product: ${digitalProduct.name}`);
                        // Generate secure token for each quantity
                        for (let i = 0; i < item.quantity; i++) {
                            const token = crypto_1.default.randomBytes(32).toString('hex');
                            // Create download access
                            await digitalProductService.createDigitalProductDownloads({
                                digital_product_id: digitalProduct.id,
                                order_id: orderData.id,
                                customer_id: orderData.customer_id || orderData.email,
                                token,
                                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                                is_active: true,
                                download_count: 0
                            });
                            downloadLinks.push({
                                product_name: digitalProduct.name,
                                download_url: `${process.env.STORE_URL || 'http://localhost:3000'}/api/store/download/${token}`,
                                expires_in_days: 7
                            });
                            console.log(`[Digital Products Subscriber] 🔗 Created download link for ${digitalProduct.name}`);
                        }
                    }
                    else {
                        console.log(`[Digital Products Subscriber] ❌ Digital product ${item.digitalProductId} not found`);
                    }
                }
                catch (error) {
                    console.error(`[Digital Products Subscriber] ❌ Error processing digital product ${item.digitalProductId}:`, error);
                }
            }
            // Send email with download links
            if (downloadLinks.length > 0) {
                console.log(`[Digital Products Subscriber] 📧 Sending ${downloadLinks.length} download links to ${orderData.email}`);
                const emailService = new email_service_1.default();
                // Get customer name
                const customerName = orderData.customer_info?.name ||
                    orderData.customer_info?.first_name ||
                    orderData.email.split('@')[0] || 'Customer';
                const orderNumber = orderData.id.slice(-8).toUpperCase();
                const emailData = {
                    customerEmail: orderData.email,
                    customerName,
                    orderId: orderData.id,
                    orderNumber,
                    downloadLinks: downloadLinks.map(link => ({
                        productTitle: link.product_name,
                        downloadUrl: link.download_url,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                    }))
                };
                try {
                    await emailService.sendDigitalDownloadLinks(emailData);
                    console.log(`[Digital Products Subscriber] ✅ Download links email sent successfully to ${orderData.email}`);
                }
                catch (error) {
                    console.error(`[Digital Products Subscriber] ❌ Failed to send download links email:`, error);
                }
            }
            else {
                console.log(`[Digital Products Subscriber] ⚠️ No download links generated, skipping email`);
            }
        }
        else {
            console.log(`[Digital Products Subscriber] ℹ️ No digital products found in order ${data.id}`);
        }
    }
    catch (error) {
        console.error(`[Digital Products Subscriber] ❌ Error processing digital products for order ${data.id}:`, error);
        console.error("[Digital Products Subscriber] Full error stack:", error.stack);
        // Don't throw - we don't want to fail the order
    }
}
exports.config = {
    event: "order.placed",
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlLWRpZ2l0YWwtcHJvZHVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc3Vic2NyaWJlcnMvaGFuZGxlLWRpZ2l0YWwtcHJvZHVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBT0Esd0NBNklDO0FBbEpELGdFQUFtRTtBQUVuRSw4RUFBb0Q7QUFDcEQsb0RBQTJCO0FBRVosS0FBSyxVQUFVLHFCQUFxQixDQUFDLEVBQ2xELEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxFQUNmLFNBQVMsRUFDa0M7SUFDM0MsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtJQUUxQyxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLDBFQUEwRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUVoRyw0Q0FBNEM7UUFDNUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtRQUMzQixJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLHlGQUF5RixDQUFDLENBQUE7WUFDdEcsT0FBTTtRQUNSLENBQUM7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLDZDQUE2QyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sNkJBQTZCLENBQUMsQ0FBQTtRQUU3RyxNQUFNLHFCQUFxQixHQUN6QixTQUFTLENBQUMsT0FBTyxDQUFDLHdDQUFzQixDQUFDLENBQUE7UUFFM0MsNENBQTRDO1FBQzVDLE1BQU0sbUJBQW1CLEdBQXNFLEVBQUUsQ0FBQTtRQUVqRyxLQUFLLE1BQU0sSUFBSSxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLG9EQUFvRCxJQUFJLENBQUMsS0FBSyxF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