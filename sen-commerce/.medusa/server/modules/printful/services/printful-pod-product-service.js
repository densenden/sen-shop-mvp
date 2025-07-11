"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintfulPodProductService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const printful_product_1 = require("../models/printful-product");
// This service handles fetching and importing Printful products using V2 API
class PrintfulPodProductService extends (0, utils_1.MedusaService)({
    PrintfulProduct: printful_product_1.PrintfulProduct,
}) {
    constructor(container, options) {
        super(container, options);
        this.container = container;
        this.apiToken = process.env.PRINTFUL_API_TOKEN || "";
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
        return data.result || [];
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
}
exports.PrintfulPodProductService = PrintfulPodProductService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRmdWwtcG9kLXByb2R1Y3Qtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3ByaW50ZnVsL3NlcnZpY2VzL3ByaW50ZnVsLXBvZC1wcm9kdWN0LXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQXlEO0FBQ3pELGlFQUE0RDtBQTBFNUQsNkVBQTZFO0FBQzdFLE1BQWEseUJBQTBCLFNBQVEsSUFBQSxxQkFBYSxFQUFDO0lBQzNELGVBQWUsRUFBZixrQ0FBZTtDQUNoQixDQUFDO0lBTUEsWUFBWSxTQUFjLEVBQUUsT0FBYTtRQUN2QyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFBO1FBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxFQUFFLENBQUE7UUFDcEQsSUFBSSxDQUFDLFlBQVksR0FBRywwQkFBMEIsQ0FBQTtRQUM5QyxJQUFJLENBQUMsWUFBWSxHQUFHLDZCQUE2QixDQUFBO0lBQ25ELENBQUM7SUFFRCwwREFBMEQ7SUFDMUQsS0FBSyxDQUFDLG9CQUFvQjtRQUN4QixNQUFNLEdBQUcsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLG1CQUFtQixFQUFFO1lBQy9ELE9BQU8sRUFBRTtnQkFDUCxhQUFhLEVBQUUsVUFBVSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUN4QyxjQUFjLEVBQUUsa0JBQWtCO2FBQ25DO1NBQ0YsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNaLE1BQU0sU0FBUyxHQUFHLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFBO1lBQ2xDLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxDQUFDLE1B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