"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintfulOrderService = void 0;
const utils_1 = require("@medusajs/framework/utils");
class PrintfulOrderService extends (0, utils_1.MedusaService)({}) {
    constructor(container, options) {
        super(container, options);
        this.apiToken = process.env.PRINTFUL_API_TOKEN || "";
        this.apiBaseUrl = "https://api.printful.com";
        if (!this.apiToken) {
            console.warn("PRINTFUL_API_TOKEN not configured - Printful order functionality will not work");
        }
    }
    // Create order in Printful
    async createOrder(orderData) {
        const res = await fetch(`${this.apiBaseUrl}/orders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful order creation error:", res.status, errorText);
            throw new Error(`Failed to create order in Printful: ${errorText}`);
        }
        const data = await res.json();
        return data.result;
    }
    // Get order from Printful
    async getOrder(orderId) {
        const res = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            if (res.status === 404)
                return null;
            const errorText = await res.text();
            console.error("Printful order fetch error:", res.status, errorText);
            throw new Error(`Failed to fetch order from Printful: ${errorText}`);
        }
        const data = await res.json();
        return data.result;
    }
    // Update order in Printful
    async updateOrder(orderId, orderData) {
        const res = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful order update error:", res.status, errorText);
            throw new Error(`Failed to update order in Printful: ${errorText}`);
        }
        const data = await res.json();
        return data.result;
    }
    // Cancel order in Printful
    async cancelOrder(orderId) {
        const res = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${this.apiToken}`
            }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful order cancellation error:", res.status, errorText);
            throw new Error(`Failed to cancel order in Printful: ${errorText}`);
        }
        return true;
    }
    // Get all orders from Printful
    async getOrders(params) {
        const searchParams = new URLSearchParams();
        if (params?.status)
            searchParams.append('status', params.status);
        if (params?.offset)
            searchParams.append('offset', params.offset.toString());
        if (params?.limit)
            searchParams.append('limit', params.limit.toString());
        const url = `${this.apiBaseUrl}/orders${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful orders fetch error:", res.status, errorText);
            throw new Error(`Failed to fetch orders from Printful: ${errorText}`);
        }
        const data = await res.json();
        return data.result || [];
    }
    // Confirm order for fulfillment
    async confirmOrder(orderId) {
        const res = await fetch(`${this.apiBaseUrl}/orders/${orderId}/confirm`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful order confirmation error:", res.status, errorText);
            throw new Error(`Failed to confirm order in Printful: ${errorText}`);
        }
        const data = await res.json();
        return data.result;
    }
    // Estimate shipping costs
    async estimateShippingCosts(recipient, items) {
        const res = await fetch(`${this.apiBaseUrl}/shipping/rates`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipient,
                items
            })
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful shipping estimation error:", res.status, errorText);
            throw new Error(`Failed to estimate shipping costs: ${errorText}`);
        }
        const data = await res.json();
        return data.result;
    }
    // Convert Medusa order to Printful order format
    async convertMedusaOrderToPrintful(medusaOrder) {
        const shippingAddress = medusaOrder.shipping_address;
        const items = medusaOrder.items || [];
        const recipient = {
            name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
            address1: shippingAddress.address_1,
            address2: shippingAddress.address_2,
            city: shippingAddress.city,
            state_code: shippingAddress.province,
            country_code: shippingAddress.country_code,
            zip: shippingAddress.postal_code,
            phone: shippingAddress.phone,
            email: medusaOrder.email
        };
        const printfulItems = [];
        for (const item of items) {
            // Only process items that are Printful products
            if (item.metadata?.product_type === 'printful_pod') {
                printfulItems.push({
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    files: item.metadata?.files || [],
                    retail_price: item.unit_price
                });
            }
        }
        return {
            recipient,
            items: printfulItems,
            retail_costs: {
                currency: medusaOrder.currency_code,
                subtotal: medusaOrder.subtotal,
                discount: medusaOrder.discount_total,
                shipping: medusaOrder.shipping_total,
                tax: medusaOrder.tax_total
            }
        };
    }
}
exports.PrintfulOrderService = PrintfulOrderService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRmdWwtb3JkZXItc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3ByaW50ZnVsL3NlcnZpY2VzL3ByaW50ZnVsLW9yZGVyLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQXlEO0FBOER6RCxNQUFhLG9CQUFxQixTQUFRLElBQUEscUJBQWEsRUFBQyxFQUFFLENBQUM7SUFJekQsWUFBWSxTQUFjLEVBQUUsT0FBYTtRQUN2QyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxFQUFFLENBQUE7UUFDcEQsSUFBSSxDQUFDLFVBQVUsR0FBRywwQkFBMEIsQ0FBQTtRQUU1QyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0ZBQWdGLENBQUMsQ0FBQTtRQUNoRyxDQUFDO0lBQ0gsQ0FBQztJQUVELDJCQUEyQjtJQUMzQixLQUFLLENBQUMsV0FBVyxDQUFDLFNBQWlDO1FBQ2pELE1BQU0sR0FBRyxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsU0FBUyxFQUFFO1lBQ25ELE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFO2dCQUNQLGFBQWEsRUFBRSxVQUFVLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ3hDLGNBQWMsRUFBRSxrQkFBa0I7YUFDbkM7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7U0FDaEMsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNaLE1BQU0sU0FBUyxHQUFHLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFBO1lBQ2xDLE9BQU8sQ0FBQyxL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