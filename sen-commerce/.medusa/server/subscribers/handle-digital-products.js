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
                        id: item.digitalProductId
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