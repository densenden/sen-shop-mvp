"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PODProviderManager = exports.GootenProvider = exports.PrintfulProvider = void 0;
const utils_1 = require("@medusajs/framework/utils");
const printful_pod_product_service_1 = require("./printful-pod-product-service");
const printful_order_service_1 = require("./printful-order-service");
const printful_fulfillment_service_1 = require("./printful-fulfillment-service");
// Printful provider implementation
class PrintfulProvider {
    constructor(container) {
        this.name = 'Printful';
        this.type = 'printful';
        this.isEnabled = true;
        this.productService = new printful_pod_product_service_1.PrintfulPodProductService(container);
        this.orderService = new printful_order_service_1.PrintfulOrderService(container);
        this.fulfillmentService = new printful_fulfillment_service_1.PrintfulFulfillmentService(container);
    }
    async fetchProducts() {
        const products = await this.productService.fetchStoreProducts();
        return products.map(this.mapPrintfulToPODProduct);
    }
    async getProduct(productId) {
        const product = await this.productService.getStoreProduct(productId);
        return product ? this.mapPrintfulToPODProduct(product) : null;
    }
    async createProduct(productData) {
        const printfulData = this.mapPODDataToPrintful(productData);
        const product = await this.productService.createStoreProduct(printfulData);
        return this.mapPrintfulToPODProduct(product);
    }
    async updateProduct(productId, productData) {
        const printfulData = this.mapPODDataToPrintful(productData);
        const product = await this.productService.updateStoreProduct(productId, printfulData);
        return this.mapPrintfulToPODProduct(product);
    }
    async deleteProduct(productId) {
        return await this.productService.deleteStoreProduct(productId);
    }
    async createOrder(orderData) {
        const printfulOrderData = this.mapPODOrderToPrintful(orderData);
        const order = await this.orderService.createOrder(printfulOrderData);
        return this.mapPrintfulToPODOrder(order);
    }
    async getOrder(orderId) {
        const order = await this.orderService.getOrder(orderId);
        return order ? this.mapPrintfulToPODOrder(order) : null;
    }
    async cancelOrder(orderId) {
        return await this.orderService.cancelOrder(orderId);
    }
    async processFulfillment(medusaOrder) {
        const result = await this.fulfillmentService.processFulfillment(medusaOrder);
        return {
            success: result.status !== 'failed',
            provider_order_id: result.printful_order_id,
            status: result.status,
            error: result.workflow_steps.find(step => step.status === 'failed')?.error
        };
    }
    async checkFulfillmentStatus(orderId) {
        const status = await this.fulfillmentService.checkFulfillmentStatus(orderId);
        return {
            status: status.status,
            tracking_number: status.tracking_number,
            tracking_url: status.tracking_url,
            updated_at: status.updated_at
        };
    }
    async processWebhook(payload, signature) {
        // This would use the webhook service
        return { success: true, message: 'Webhook processed' };
    }
    // Helper methods to convert between Printful and POD formats
    mapPrintfulToPODProduct(printfulProduct) {
        return {
            id: printfulProduct.id,
            name: printfulProduct.name,
            description: printfulProduct.description,
            thumbnail_url: printfulProduct.thumbnail_url,
            price: printfulProduct.variants?.[0]?.price,
            variants: Array.isArray(printfulProduct.variants) ? printfulProduct.variants.map((v) => ({
                id: v.id,
                name: v.name,
                price: v.price,
                currency: v.currency,
                availability: 'available'
            })) : []
        };
    }
    mapPODDataToPrintful(podData) {
        return {
            name: podData.name,
            description: podData.description,
            thumbnail_url: podData.image_url,
            variants: podData.variants
        };
    }
    mapPODOrderToPrintful(podOrder) {
        return {
            recipient: podOrder.recipient,
            items: podOrder.items.map(item => ({
                variant_id: item.variant_id,
                quantity: item.quantity,
                files: item.files || []
            }))
        };
    }
    mapPrintfulToPODOrder(printfulOrder) {
        return {
            id: printfulOrder.id,
            status: printfulOrder.status,
            items: printfulOrder.items,
            shipping: printfulOrder.shipping,
            total: printfulOrder.total,
            currency: printfulOrder.currency,
            tracking_number: printfulOrder.tracking_number,
            tracking_url: printfulOrder.tracking_url,
            created_at: printfulOrder.created_at,
            updated_at: printfulOrder.updated_at
        };
    }
}
exports.PrintfulProvider = PrintfulProvider;
// Example of another POD provider (Gooten)
class GootenProvider {
    constructor() {
        this.name = 'Gooten';
        this.type = 'gooten';
        this.isEnabled = false; // Disabled by default
    }
    async fetchProducts() {
        // Implement Gooten API calls
        console.log('Fetching products from Gooten...');
        return [];
    }
    async getProduct(productId) {
        console.log(`Getting product ${productId} from Gooten...`);
        return null;
    }
    async createProduct(productData) {
        console.log('Creating product in Gooten...');
        throw new Error('Not implemented');
    }
    async updateProduct(productId, productData) {
        console.log(`Updating product ${productId} in Gooten...`);
        throw new Error('Not implemented');
    }
    async deleteProduct(productId) {
        console.log(`Deleting product ${productId} from Gooten...`);
        return false;
    }
    async createOrder(orderData) {
        console.log('Creating order in Gooten...');
        throw new Error('Not implemented');
    }
    async getOrder(orderId) {
        console.log(`Getting order ${orderId} from Gooten...`);
        return null;
    }
    async cancelOrder(orderId) {
        console.log(`Cancelling order ${orderId} in Gooten...`);
        return false;
    }
    async processFulfillment(medusaOrder) {
        console.log('Processing fulfillment with Gooten...');
        return {
            success: false,
            provider_order_id: '',
            status: 'failed',
            error: 'Not implemented'
        };
    }
    async checkFulfillmentStatus(orderId) {
        console.log(`Checking fulfillment status for ${orderId} in Gooten...`);
        return {
            status: 'unknown',
            updated_at: new Date().toISOString()
        };
    }
    async processWebhook(payload, signature) {
        console.log('Processing Gooten webhook...');
        return { success: true, message: 'Webhook processed' };
    }
}
exports.GootenProvider = GootenProvider;
// POD Provider Manager - Main facade class
class PODProviderManager extends (0, utils_1.MedusaService)({}) {
    constructor(container, options) {
        super(container, options);
        this.providers = new Map();
        this.defaultProvider = 'printful';
        // Initialize providers
        this.providers.set('printful', new PrintfulProvider(container));
        this.providers.set('gooten', new GootenProvider());
        // Set default provider from environment
        this.defaultProvider = process.env.DEFAULT_POD_PROVIDER || 'printful';
    }
    // Get provider by name
    getProvider(providerName) {
        const name = providerName || this.defaultProvider;
        const provider = this.providers.get(name);
        if (!provider) {
            throw new Error(`POD provider '${name}' not found`);
        }
        if (!provider.isEnabled) {
            throw new Error(`POD provider '${name}' is disabled`);
        }
        return provider;
    }
    // Get all enabled providers
    getEnabledProviders() {
        return Array.from(this.providers.values()).filter(p => p.isEnabled);
    }
    // Register a new provider
    registerProvider(name, provider) {
        this.providers.set(name, provider);
    }
    // Enable/disable provider
    setProviderEnabled(name, enabled) {
        const provider = this.providers.get(name);
        if (provider) {
            provider.isEnabled = enabled;
        }
    }
    // Proxy methods to default provider
    async fetchProducts(providerName) {
        return await this.getProvider(providerName).fetchProducts();
    }
    async getProduct(productId, providerName) {
        return await this.getProvider(providerName).getProduct(productId);
    }
    async createProduct(productData, providerName) {
        return await this.getProvider(providerName).createProduct(productData);
    }
    async updateProduct(productId, productData, providerName) {
        return await this.getProvider(providerName).updateProduct(productId, productData);
    }
    async deleteProduct(productId, providerName) {
        return await this.getProvider(providerName).deleteProduct(productId);
    }
    async createOrder(orderData, providerName) {
        return await this.getProvider(providerName).createOrder(orderData);
    }
    async getOrder(orderId, providerName) {
        return await this.getProvider(providerName).getOrder(orderId);
    }
    async cancelOrder(orderId, providerName) {
        return await this.getProvider(providerName).cancelOrder(orderId);
    }
    async processFulfillment(medusaOrder, providerName) {
        return await this.getProvider(providerName).processFulfillment(medusaOrder);
    }
    async checkFulfillmentStatus(orderId, providerName) {
        return await this.getProvider(providerName).checkFulfillmentStatus(orderId);
    }
    async processWebhook(payload, signature, providerName) {
        return await this.getProvider(providerName).processWebhook(payload, signature);
    }
}
exports.PODProviderManager = PODProviderManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9kLXByb3ZpZGVyLWZhY2FkZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3ByaW50ZnVsL3NlcnZpY2VzL3BvZC1wcm92aWRlci1mYWNhZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQXlEO0FBQ3pELGlGQUEwRTtBQUMxRSxxRUFBK0Q7QUFDL0QsaUZBQTJFO0FBMEgzRSxtQ0FBbUM7QUFDbkMsTUFBYSxnQkFBZ0I7SUFTM0IsWUFBWSxTQUFjO1FBUjFCLFNBQUksR0FBRyxVQUFVLENBQUE7UUFDakIsU0FBSSxHQUFHLFVBQVUsQ0FBQTtRQUNqQixjQUFTLEdBQUcsSUFBSSxDQUFBO1FBT2QsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLHdEQUF5QixDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBQzlELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSw2Q0FBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUN2RCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSx5REFBMEIsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUNyRSxDQUFDO0lBRUQsS0FBSyxDQUFDLGFBQWE7UUFDakIsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLGtCQUFrQixFQUFFLENBQUE7UUFDL0QsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO0lBQ25ELENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQWlCO1FBQ2hDLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDcEUsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBO0lBQy9ELENBQUM7SUFFRCxLQUFLLENBQUMs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