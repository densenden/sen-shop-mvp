"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintfulPodProductService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const printful_product_1 = require("../models/printful-product");
const printful_order_service_1 = require("./printful-order-service");
// This service handles fetching and importing Printful products using V2 API
class PrintfulPodProductService extends (0, utils_1.MedusaService)({
    PrintfulProduct: printful_product_1.PrintfulProduct,
}) {
    constructor(container, options) {
        super(container, options);
        this.container = container;
        this.apiToken = process.env.PRINTFUL_API_TOKEN || "";
        this.orderService = new printful_order_service_1.PrintfulOrderService(container, options);
        this.apiBaseUrlV1 = "https://api.printful.com";
        this.apiBaseUrlV2 = "https://api.printful.com/v2";
    }
    // V2 API: Fetch catalog products (available for printing)
    async fetchCatalogProducts() {
        const res = await fetch(`${this.apiBaseUrlV2}/catalog-products`, {
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V2 API error:", res.status, errorText);
            throw new Error("Failed to fetch catalog products from Printful V2");
        }
        const data = await res.json();
        return data.data || [];
    }
    // V2 API: Get specific catalog product with variants
    async getCatalogProduct(productId) {
        const res = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}`, {
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
        });
        if (!res.ok) {
            if (res.status === 404)
                return null;
            const errorText = await res.text();
            console.error("Printful V2 API error:", res.status, errorText);
            throw new Error("Failed to fetch catalog product from Printful V2");
        }
        const data = await res.json();
        return data.data || null;
    }
    // V1 API: Fetch store products (still needed for store operations)
    async fetchStoreProducts() {
        const res = await fetch(`${this.apiBaseUrlV1}/store/products`, {
            headers: { Authorization: `Bearer ${this.apiToken}` },
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V1 API error:", res.status, errorText);
            throw new Error("Failed to fetch store products from Printful");
        }
        const data = await res.json();
        // Printful returns an array of sync products
        if (data.result && Array.isArray(data.result)) {
            return data.result.map((item) => ({
                id: item.id.toString(),
                name: item.name,
                thumbnail_url: item.thumbnail_url,
                description: item.description,
                // For listing, we don't need full variants, just basic info
                variants: []
            }));
        }
        return [];
    }
    // V1 API: Get specific store product
    async getStoreProduct(productId) {
        const res = await fetch(`${this.apiBaseUrlV1}/store/products/${productId}`, {
            headers: { Authorization: `Bearer ${this.apiToken}` },
        });
        if (!res.ok) {
            if (res.status === 404)
                return null;
            const errorText = await res.text();
            console.error("Printful V1 API error:", res.status, errorText);
            throw new Error("Failed to fetch store product from Printful");
        }
        const data = await res.json();
        // The Printful API returns data in result.sync_product with variants in result.sync_variants
        if (data.result && data.result.sync_product) {
            const syncProduct = data.result.sync_product;
            const syncVariants = data.result.sync_variants || [];
            // Map to expected format
            return {
                id: syncProduct.id.toString(),
                name: syncProduct.name,
                thumbnail_url: syncProduct.thumbnail_url,
                description: syncProduct.description,
                variants: syncVariants.map((v) => ({
                    id: v.id.toString(),
                    name: v.name,
                    price: parseFloat(v.retail_price),
                    currency: v.currency || 'USD'
                }))
            };
        }
        return data.result || null;
    }
    // V1 API: Create store product
    async createStoreProduct(productData) {
        const res = await fetch(`${this.apiBaseUrlV1}/store/products`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V1 API error:", res.status, errorText);
            throw new Error("Failed to create store product in Printful");
        }
        const data = await res.json();
        return data.result;
    }
    // V1 API: Update store product
    async updateStoreProduct(productId, productData) {
        const res = await fetch(`${this.apiBaseUrlV1}/store/products/${productId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V1 API error:", res.status, errorText);
            throw new Error("Failed to update store product in Printful");
        }
        const data = await res.json();
        return data.result;
    }
    // V1 API: Delete store product
    async deleteStoreProduct(productId) {
        const res = await fetch(`${this.apiBaseUrlV1}/store/products/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.apiToken}` },
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V1 API error:", res.status, errorText);
            throw new Error("Failed to delete store product from Printful");
        }
        return true;
    }
    // Create Medusa product from Printful data
    async createMedusaProduct(printfulProduct, artworkId) {
        const { createProductsWorkflow } = require("@medusajs/medusa/core-flows");
        // Prepare the product input
        const input = {
            products: [{
                    title: printfulProduct.name,
                    description: printfulProduct.description || "",
                    thumbnail: printfulProduct.thumbnail_url,
                    images: [{ url: printfulProduct.thumbnail_url }],
                    is_giftcard: false,
                    discountable: true,
                    status: "published",
                    handle: printfulProduct.name.toLowerCase().replace(/\s+/g, '-'),
                    // Add custom metadata to link to Printful
                    metadata: {
                        printful_product_id: printfulProduct.id,
                        artwork_id: artworkId,
                        product_type: "printful_pod"
                    }
                }]
        };
        // Run the workflow to create the product
        const { result } = await createProductsWorkflow(this.container).run({ input });
        return result[0];
    }
    // Sync Printful product to local database
    async syncPrintfulProduct(printfulProduct, artworkId) {
        const existingProducts = await this.listPrintfulProducts({
            filters: { printful_product_id: printfulProduct.id }
        });
        if (existingProducts.length > 0) {
            // Update existing product
            const updated = await this.updatePrintfulProducts({
                id: existingProducts[0].id,
                name: printfulProduct.name,
                thumbnail_url: printfulProduct.thumbnail_url,
                artwork_id: artworkId,
                price: printfulProduct.variants?.[0]?.price || null
            });
            return updated;
        }
        else {
            // Create new product
            const created = await this.createPrintfulProducts({
                printful_product_id: printfulProduct.id,
                name: printfulProduct.name,
                thumbnail_url: printfulProduct.thumbnail_url,
                artwork_id: artworkId,
                price: printfulProduct.variants?.[0]?.price || null
            });
            return created;
        }
    }
    // Get all products with their linked artwork info
    async getProductsWithArtwork() {
        const products = await this.listPrintfulProducts();
        // You can enhance this to join with artwork data
        return products;
    }
    // Helper methods for CRUD operations
    async findPrintfulProduct(id) {
        const results = await this.listPrintfulProducts({ filters: { id } });
        return results[0] || null;
    }
    async findPrintfulProductByPrintfulId(printfulId) {
        const results = await this.listPrintfulProducts({ filters: { printful_product_id: printfulId } });
        return results[0] || null;
    }
    // Order methods - delegate to PrintfulOrderService
    async createOrder(orderData) {
        return this.orderService.createOrder(orderData);
    }
    async getOrder(orderId) {
        return this.orderService.getOrder(orderId);
    }
    async updateOrder(orderId, orderData) {
        return this.orderService.updateOrder(orderId, orderData);
    }
    async cancelOrder(orderId) {
        return this.orderService.cancelOrder(orderId);
    }
    async getOrders(params) {
        return this.orderService.getOrders(params);
    }
    // V2 API: Generate mockups for a product with artwork
    async generateMockups(productId, variantIds, artworkUrl) {
        const requestData = {
            product_id: productId,
            variant_ids: variantIds,
            files: [{
                    id: 'artwork',
                    url: artworkUrl,
                    type: 'front'
                }],
            options: {
                layout: 'product_only',
                background: 'white'
            }
        };
        const res = await fetch(`${this.apiBaseUrlV2}/mockups`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V2 Mockup API error:", res.status, errorText);
            throw new Error("Failed to generate mockups from Printful V2");
        }
        const data = await res.json();
        return data.data || data;
    }
    // V2 API: Get mockup generation status and download URLs
    async getMockupStatus(taskId) {
        const res = await fetch(`${this.apiBaseUrlV2}/mockups/${taskId}`, {
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V2 Mockup Status API error:", res.status, errorText);
            throw new Error("Failed to get mockup status from Printful V2");
        }
        const data = await res.json();
        return data.data || data;
    }
    // Helper method to wait for mockup generation and return URLs
    async generateAndWaitForMockups(productId, variantIds, artworkUrl, maxWaitTime = 30000) {
        // Start mockup generation
        const mockupTask = await this.generateMockups(productId, variantIds, artworkUrl);
        if (mockupTask.status === 'completed') {
            return mockupTask.mockups.map(m => m.mockup_url);
        }
        // Poll for completion
        const startTime = Date.now();
        const pollInterval = 2000; // 2 seconds
        while (Date.now() - startTime < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            try {
                const status = await this.getMockupStatus(mockupTask.id);
                if (status.status === 'completed') {
                    return status.mockups.map(m => m.mockup_url);
                }
                else if (status.status === 'failed') {
                    throw new Error('Mockup generation failed');
                }
                // Continue polling if status is still 'processing'
            }
            catch (error) {
                console.warn('Error checking mockup status:', error);
            }
        }
        throw new Error('Mockup generation timed out');
    }
    // Enhanced product import with mockups
    async importProductWithMockups(printfulProduct, artworkUrl) {
        let mockupUrls = [];
        if (artworkUrl && printfulProduct.variants.length > 0) {
            try {
                // Take first few variants to generate mockups
                const variantIds = printfulProduct.variants.slice(0, 3).map(v => v.id);
                mockupUrls = await this.generateAndWaitForMockups(printfulProduct.id, variantIds, artworkUrl);
                console.log(`Generated ${mockupUrls.length} mockups for product ${printfulProduct.id}`);
            }
            catch (error) {
                console.warn(`Failed to generate mockups for product ${printfulProduct.id}:`, error);
                // Continue with import even if mockups fail
            }
        }
        // Create product with mockup images
        const productImages = [printfulProduct.thumbnail_url, ...mockupUrls].filter(Boolean);
        const productInput = {
            title: printfulProduct.name,
            description: printfulProduct.description || `${printfulProduct.name} - Custom print-on-demand product`,
            thumbnail: productImages[0],
            images: productImages.map(url => ({ url })),
            status: "published",
            metadata: {
                printful_product_id: printfulProduct.id,
                mockup_urls: mockupUrls,
                artwork_url: artworkUrl,
                fulfillment_type: "printful_pod"
            }
        };
        return productInput;
    }
}
exports.PrintfulPodProductService = PrintfulPodProductService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRmdWwtcG9kLXByb2R1Y3Qtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3ByaW50ZnVsL3NlcnZpY2VzL3ByaW50ZnVsLXBvZC1wcm9kdWN0LXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQXlEO0FBQ3pELGlFQUE0RDtBQUM1RCxxRUFBK0Q7QUFtRy9ELDZFQUE2RTtBQUM3RSxNQUFhLHlCQUEwQixTQUFRLElBQUEscUJBQWEsRUFBQztJQUMzRCxlQUFlLEVBQWYsa0NBQWU7Q0FDaEIsQ0FBQztJQU9BLFlBQVksU0FBYyxFQUFFLE9BQWE7UUFDdkMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUN6QixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtRQUMxQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksRUFBRSxDQUFBO1FBQ3BELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSw2Q0FBb0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDaEUsSUFBSSxDQUFDLFlBQVksR0FBRywwQkFBMEIsQ0FBQTtRQUM5QyxJQUFJLENBQUMsWUFBWSxHQUFHLDZCQUE2QixDQUFBO0lBQ25ELENBQUM7SUFFRCwwREFBMEQ7SUFDMUQsS0FBSyxDQUFDLG9CQUFvQjtRQUN4QixNQUFNLEdBQUcsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLG1CQUFtQixFQUFFO1lBQy9ELE9BQU8sRUFBRTtnQkFDUCxhQUFhLEVBQUUsVUFBVSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUN4QyxjQUFjLEVBQUUsa0JBQWtCO2FBQ25DO1NBQ0YsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNaLE1BQU0sU0FBUyxHQUFH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