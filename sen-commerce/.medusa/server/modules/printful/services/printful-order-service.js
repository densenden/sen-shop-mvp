"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintfulOrderService = void 0;
const utils_1 = require("@medusajs/framework/utils");
class PrintfulOrderService extends (0, utils_1.MedusaService)({}) {
    constructor(container, options) {
        super(container, options);
        this.apiToken = process.env.PRINTFUL_API_TOKEN || "";
        this.apiBaseUrl = "https://api.printful.com";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRmdWwtb3JkZXItc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3ByaW50ZnVsL3NlcnZpY2VzL3ByaW50ZnVsLW9yZGVyLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQXlEO0FBOER6RCxNQUFhLG9CQUFxQixTQUFRLElBQUEscUJBQWEsRUFBQyxFQUFFLENBQUM7SUFJekQsWUFBWSxTQUFjLEVBQUUsT0FBYTtRQUN2QyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxFQUFFLENBQUE7UUFDcEQsSUFBSSxDQUFDLFVBQVUsR0FBRywwQkFBMEIsQ0FBQTtJQUM5QyxDQUFDO0lBRUQsMkJBQTJCO0lBQzNCLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBaUM7UUFDakQsTUFBTSxHQUFHLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxTQUFTLEVBQUU7WUFDbkQsTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUU7Z0JBQ1AsYUFBYSxFQUFFLFVBQVUsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDeEMsY0FBYyxFQUFFLGtCQUFrQjthQUNuQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztTQUNoQyxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ1osTUFBTSxTQUFTLEdBQUcsTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDbEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBQ3RFLE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLFNBQVMs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