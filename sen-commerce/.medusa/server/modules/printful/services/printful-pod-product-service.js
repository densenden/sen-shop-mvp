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
        this.syncProductsCache = null;
        this.catalogProductsCache = null;
        this.cacheTTL = 15000; // 15 seconds to stay within Printful rate limits
        // V1 API: Fetch ALL catalog products (200+ products including frames, posters, home decor)
        this.v1CatalogCache = null;
        this.container = container;
        this.apiToken = process.env.PRINTFUL_API_TOKEN || "";
        this.orderService = new printful_order_service_1.PrintfulOrderService(container, options);
        this.apiBaseUrlV1 = "https://api.printful.com";
        this.apiBaseUrlV2 = "https://api.printful.com/v2";
    }
    clearCaches() {
        this.syncProductsCache = null;
        this.catalogProductsCache = null;
    }
    // V1 API: Fetch sync products (templates that can be pushed to the store)
    async fetchSyncProducts(forceRefresh = false) {
        if (!forceRefresh && this.syncProductsCache && Date.now() - this.syncProductsCache.fetchedAt < this.cacheTTL) {
            return this.syncProductsCache.data;
        }
        const res = await fetch(`${this.apiBaseUrlV1}/sync/products`, {
            headers: { Authorization: `Bearer ${this.apiToken}` },
        });
        if (!res.ok) {
            if (res.status === 429) {
                const retryAfter = res.headers.get("Retry-After") || "15";
                throw new Error(`Printful rate limit reached. Try again after ${retryAfter} seconds.`);
            }
            const errorText = await res.text();
            console.error("Printful V1 sync products error:", res.status, errorText);
            throw new Error("Failed to fetch sync products from Printful");
        }
        const data = await res.json();
        const products = Array.isArray(data.result) ? data.result : [];
        this.syncProductsCache = { data: products, fetchedAt: Date.now() };
        return products;
    }
    async getSyncProduct(productId) {
        const res = await fetch(`${this.apiBaseUrlV1}/sync/products/${productId}`, {
            headers: { Authorization: `Bearer ${this.apiToken}` },
        });
        if (!res.ok) {
            if (res.status === 404) {
                return null;
            }
            const errorText = await res.text();
            console.error("Printful sync product fetch error:", res.status, errorText);
            throw new Error("Failed to fetch sync product from Printful");
        }
        const data = await res.json();
        return data.result || null;
    }
    async fetchV1CatalogProducts(forceRefresh = false) {
        if (!forceRefresh && this.v1CatalogCache && Date.now() - this.v1CatalogCache.fetchedAt < this.cacheTTL) {
            console.log('[PrintfulService] Using cached V1 catalog products');
            return this.v1CatalogCache.data;
        }
        console.log('[PrintfulService] Fetching V1 catalog products: /products');
        const res = await fetch(`${this.apiBaseUrlV1}/products`, {
            headers: { Authorization: `Bearer ${this.apiToken}` },
        });
        if (!res.ok) {
            if (res.status === 429) {
                const retryAfter = res.headers.get("Retry-After") || "15";
                throw new Error(`Printful rate limit reached. Try again after ${retryAfter} seconds.`);
            }
            const errorText = await res.text();
            console.error("Printful V1 catalog products error:", res.status, errorText);
            throw new Error("Failed to fetch V1 catalog products from Printful");
        }
        const data = await res.json();
        const products = Array.isArray(data.result) ? data.result : [];
        console.log(`[PrintfulService] Fetched ${products.length} V1 catalog products`);
        this.v1CatalogCache = { data: products, fetchedAt: Date.now() };
        return products;
    }
    // V1 API: Get single product details with variants
    async getV1Product(productId) {
        console.log(`[PrintfulService] Fetching V1 product: ${productId}`);
        const res = await fetch(`${this.apiBaseUrlV1}/products/${productId}`, {
            headers: { Authorization: `Bearer ${this.apiToken}` }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V1 product fetch error:", res.status, errorText);
            throw new Error(`Failed to fetch V1 product ${productId}`);
        }
        const data = await res.json();
        return data.result;
    }
    // V1 API: Generate mockup
    async generateV1Mockup(taskKey, params) {
        console.log(`[PrintfulService] Creating V1 mockup task: ${taskKey}`, params);
        const res = await fetch(`${this.apiBaseUrlV1}/mockup-generator/create-task/${taskKey}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V1 mockup generation error:", res.status, errorText);
            throw new Error(`Failed to generate V1 mockup: ${res.status}`);
        }
        const data = await res.json();
        console.log('[PrintfulService] V1 mockup task created:', data.result?.task_key);
        return data.result;
    }
    // V1 API: Get mockup task result (polling)
    async getV1MockupTask(taskKey) {
        const res = await fetch(`${this.apiBaseUrlV1}/mockup-generator/task?task_key=${taskKey}`, {
            headers: { Authorization: `Bearer ${this.apiToken}` }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V1 mockup task fetch error:", res.status, errorText);
            throw new Error(`Failed to fetch V1 mockup task`);
        }
        const data = await res.json();
        return data.result;
    }
    // V1 API: Fetch product templates (saved designs)
    async fetchV1ProductTemplates() {
        console.log('[PrintfulService] Fetching V1 product templates');
        const res = await fetch(`${this.apiBaseUrlV1}/product-templates`, {
            headers: { Authorization: `Bearer ${this.apiToken}` }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Printful V1 product templates error:", res.status, errorText);
            throw new Error("Failed to fetch V1 product templates");
        }
        const data = await res.json();
        const templates = Array.isArray(data.result) ? data.result : [];
        console.log(`[PrintfulService] Fetched ${templates.length} V1 product templates`);
        return templates;
    }
    // V2 API: Fetch catalog products (available for printing)
    async fetchCatalogProducts(forceRefresh = false, options) {
        // Don't use cache if filtering by category or pagination
        const useCache = !forceRefresh && !options?.category_id && !options?.offset;
        if (useCache && this.catalogProductsCache && Date.now() - this.catalogProductsCache.fetchedAt < this.cacheTTL) {
            return this.catalogProductsCache.data;
        }
        // Build query parameters
        const params = new URLSearchParams();
        if (options?.category_id)
            params.append('category_id', options.category_id);
        // V2 API returns max 37 products total - always request limit=100 to get all available
        if (options?.limit)
            params.append('limit', options.limit.toString());
        else if (!options?.offset)
            params.append('limit', '100'); // Get all on first request
        if (options?.offset)
            params.append('offset', options.offset.toString());
        const url = `${this.apiBaseUrlV2}/catalog-products${params.toString() ? '?' + params.toString() : ''}`;
        console.log(`[PrintfulService] Fetching catalog products: ${url}`);
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
        });
        if (!res.ok) {
            if (res.status === 429) {
                const retryAfter = res.headers.get("Retry-After") || "15";
                throw new Error(`Printful catalog rate limit reached. Try again after ${retryAfter} seconds.`);
            }
            const errorText = await res.text();
            console.error("Printful V2 API error:", res.status, errorText);
            throw new Error("Failed to fetch catalog products from Printful V2");
        }
        const data = await res.json();
        const products = data.data || [];
        const total = data.paging?.total || data.total || products.length;
        const hasMore = data.paging?.has_more || false;
        console.log(`[PrintfulService] Fetched ${products.length}/${total} catalog products`, {
            has_more: hasMore,
            paging: data.paging,
            will_fetch_all: hasMore && !options?.offset && !options?.limit
        });
        // If there are more products and no pagination was requested, fetch all
        if (hasMore && !options?.offset && !options?.limit) {
            console.log(`[PrintfulService] Fetching remaining products (total: ${total})`);
            const remainingProducts = await this.fetchAllCatalogProducts(products.length, total, options?.category_id);
            const allProducts = [...products, ...remainingProducts];
            // Only cache if fetching all products without filters
            if (!options?.category_id) {
                this.catalogProductsCache = { data: allProducts, fetchedAt: Date.now() };
            }
            return allProducts;
        }
        // Cache if fetching all products without filters
        if (!options?.category_id && !options?.offset) {
            this.catalogProductsCache = { data: products, fetchedAt: Date.now() };
        }
        return products;
    }
    // Helper to fetch all remaining catalog products
    async fetchAllCatalogProducts(currentCount, total, categoryId) {
        const allProducts = [];
        const limit = 100; // Printful's max per request
        let offset = currentCount;
        while (offset < total) {
            try {
                const batch = await this.fetchCatalogProducts(false, {
                    category_id: categoryId,
                    limit,
                    offset
                });
                if (batch.length === 0)
                    break;
                allProducts.push(...batch);
                offset += batch.length;
                console.log(`[PrintfulService] Progress: ${offset}/${total} products fetched`);
                // Rate limiting: wait 200ms between requests
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            catch (error) {
                console.error(`[PrintfulService] Error fetching batch at offset ${offset}:`, error);
                break;
            }
        }
        return allProducts;
    }
    // V2 API: Get specific catalog product with variants
    async getCatalogProduct(productId) {
        try {
            console.log(`[PrintfulService] Fetching V2 catalog product ${productId}`);
            // Fetch product details
            const productRes = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}`, {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
            });
            if (!productRes.ok) {
                if (productRes.status === 404) {
                    console.log(`[PrintfulService] V2 catalog product ${productId} not found`);
                    return null;
                }
                const errorText = await productRes.text();
                console.error("Printful V2 API error:", productRes.status, errorText);
                return null;
            }
            const productData = await productRes.json();
            if (!productData.data) {
                return null;
            }
            const catalogProduct = productData.data;
            // Fetch variants separately - V2 API requires this
            console.log(`[PrintfulService] Fetching variants for product ${productId}`);
            const variantsRes = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}/catalog-variants`, {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                },
            });
            if (variantsRes.ok) {
                const variantsData = await variantsRes.json();
                catalogProduct.variants = variantsData.data || [];
                console.log(`[PrintfulService] Loaded ${catalogProduct.variants.length} variants for product ${productId}`);
            }
            else {
                console.warn(`[PrintfulService] Failed to fetch variants, using empty array`);
                catalogProduct.variants = [];
            }
            // Extract placements and techniques from the product data
            const placements = catalogProduct.placements || [];
            const techniques = catalogProduct.techniques || [];
            // Extract available product options (e.g., stitch_color)
            // Note: Printful V2 catalog API often doesn't return product options
            // They're typically only required/validated during mockup generation
            const productOptions = catalogProduct.options || [];
            // Attach product_options to catalogProduct for frontend access
            catalogProduct.product_options = productOptions;
            console.log(`[PrintfulService] V2 Catalog product details:`);
            console.log(`  - ID: ${catalogProduct.id}`);
            console.log(`  - Name: ${catalogProduct.name}`);
            console.log(`  - Image: ${catalogProduct.image}`);
            console.log(`  - Variants: ${catalogProduct.variants?.length || 0}`);
            console.log(`  - Placements: ${placements.length}`, placements.map((p) => p.placement || p.id || p));
            console.log(`  - Techniques: ${techniques.length}`, techniques.map((t) => t.id || t.technique || t));
            console.log(`  - Product Options: ${productOptions.length}`, productOptions.map((o) => o.key || o.id));
            return catalogProduct;
        }
        catch (error) {
            console.error(`[PrintfulService] Error fetching V2 catalog product ${productId}:`, error);
            return null;
        }
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
        console.log(`[PrintfulService] Raw API response for product ${productId}:`);
        console.log(JSON.stringify(data, null, 2));
        // The Printful API returns data in result.sync_product with variants in result.sync_variants
        if (data.result && data.result.sync_product) {
            const syncProduct = data.result.sync_product;
            const syncVariants = data.result.sync_variants || [];
            console.log(`[PrintfulService] Sync product:`, syncProduct);
            console.log(`[PrintfulService] Found ${syncVariants.length} sync variants`);
            syncVariants.forEach((variant, index) => {
                console.log(`[PrintfulService] Variant ${index}:`, JSON.stringify(variant, null, 2));
            });
            // Map to expected format
            const mappedProduct = {
                id: syncProduct.id.toString(),
                name: syncProduct.name,
                thumbnail_url: syncProduct.thumbnail_url,
                description: syncProduct.description,
                variants: syncVariants.map((v) => ({
                    id: v.id.toString(),
                    name: v.name,
                    price: parseFloat(v.retail_price),
                    currency: v.currency || 'USD',
                    image: v.image || v.preview_url,
                    files: v.files || [] // Include files array for additional images
                }))
            };
            console.log(`[PrintfulService] ✅ Final mapped product structure:`);
            console.log(`  - Product ID: ${mappedProduct.id}`);
            console.log(`  - Product Name: ${mappedProduct.name}`);
            console.log(`  - Thumbnail: ${mappedProduct.thumbnail_url}`);
            console.log(`  - Variants: ${mappedProduct.variants.length}`);
            mappedProduct.variants.forEach((variant, index) => {
                console.log(`    Variant ${index}: ${variant.name} - Files: ${variant.files.length}`);
                variant.files.forEach((file, fileIndex) => {
                    console.log(`      File ${fileIndex}: ${file.type} -> ${file.preview_url || file.url}`);
                });
            });
            return mappedProduct;
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
    // V2 API: Fetch catalog categories
    async fetchCatalogCategories() {
        try {
            const res = await fetch(`${this.apiBaseUrlV2}/catalog-categories`, {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                console.warn(`[PrintfulService] Failed to fetch catalog categories:`, res.status);
                return [];
            }
            const data = await res.json();
            const categories = data.data || [];
            console.log(`[PrintfulService] Fetched ${categories.length} catalog categories`);
            return categories;
        }
        catch (error) {
            console.warn('[PrintfulService] Error fetching catalog categories:', error);
            return [];
        }
    }
    // V2 API: Fetch user's saved templates
    async fetchTemplates() {
        try {
            const res = await fetch(`${this.apiBaseUrlV2}/templates`, {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                console.warn(`[PrintfulService] Failed to fetch templates:`, res.status);
                return [];
            }
            const data = await res.json();
            const templates = data.data || [];
            console.log(`[PrintfulService] Fetched ${templates.length} templates`);
            return templates;
        }
        catch (error) {
            console.warn('[PrintfulService] Error fetching templates:', error);
            return [];
        }
    }
    // V1 API: Fetch detailed template information by ID
    async fetchTemplateDetails(templateId) {
        try {
            const res = await fetch(`${this.apiBaseUrlV1}/store/products/${templateId}`, {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                console.warn(`[PrintfulService] Failed to fetch template ${templateId}:`, res.status);
                return null;
            }
            const data = await res.json();
            const template = data.result || data;
            console.log(`[PrintfulService] Fetched template ${templateId} details:`, {
                id: template.id,
                name: template.sync_product?.name,
                variants: template.sync_variants?.length
            });
            return template;
        }
        catch (error) {
            console.warn(`[PrintfulService] Error fetching template ${templateId}:`, error);
            return null;
        }
    }
    // V2 API: Get available mockup styles for a product
    async getMockupStyles(productId) {
        try {
            const res = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}/mockup-styles`, {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) {
                console.warn(`[PrintfulService] Failed to fetch mockup styles for product ${productId}:`, res.status);
                return [];
            }
            const data = await res.json();
            const placements = data.data || [];
            // Return placements grouped by placement/technique to preserve relationship
            // This is the proper structure for the frontend
            const placementGroups = placements.map((placement) => ({
                placement: placement.placement,
                technique: placement.technique,
                display_name: placement.display_name,
                print_area_width: placement.print_area_width,
                print_area_height: placement.print_area_height,
                dpi: placement.dpi,
                mockup_styles: placement.mockup_styles || []
            }));
            const totalStyles = placementGroups.reduce((sum, p) => sum + (p.mockup_styles?.length || 0), 0);
            console.log(`[PrintfulService] Loaded ${placements.length} placement/technique groups with ${totalStyles} total mockup styles`);
            if (placementGroups.length > 0 && placementGroups[0].mockup_styles?.length > 0) {
                console.log('[PrintfulService] First placement group:', {
                    placement: placementGroups[0].placement,
                    technique: placementGroups[0].technique,
                    styles_count: placementGroups[0].mockup_styles.length
                });
            }
            return placementGroups;
        }
        catch (error) {
            console.warn('[PrintfulService] Error fetching mockup styles:', error);
            return [];
        }
    }
    // V2 API: Generate mockups for a product with artwork
    async generateMockups(productId, variantIds, artworkUrl, placement, technique, mockupStyleIds, productOptions) {
        // Fetch available mockup styles for this product
        const mockupStyles = await this.getMockupStyles(productId);
        console.log(`[PrintfulService] Found ${mockupStyles.length} mockup styles for product ${productId}`);
        if (mockupStyles.length > 0) {
            console.log('[PrintfulService] First mockup style:', mockupStyles[0]);
            console.log('[PrintfulService] All mockup style keys:', Object.keys(mockupStyles[0]));
        }
        // mockupStyles is now an array of placement groups
        // Each group has: { placement, technique, mockup_styles: [...] }
        // Determine which placement/technique to use
        let finalPlacement = placement ? String(placement) : undefined;
        let finalTechnique = technique ? String(technique) : undefined;
        let selectedPlacementGroup = null;
        // If user selected specific mockup style IDs, find which placement group they belong to
        if (mockupStyleIds && mockupStyleIds.length > 0 && mockupStyles.length > 0) {
            for (const group of mockupStyles) {
                const hasMatchingStyle = group.mockup_styles?.some((style) => mockupStyleIds.includes(String(style.id)));
                if (hasMatchingStyle) {
                    selectedPlacementGroup = group;
                    finalPlacement = String(group.placement);
                    finalTechnique = String(group.technique);
                    console.log(`[PrintfulService] Using placement/technique from selected styles: ${finalPlacement}/${finalTechnique}`);
                    break;
                }
            }
        }
        // Fall back to first placement group if not set
        if (!selectedPlacementGroup && mockupStyles.length > 0) {
            selectedPlacementGroup = mockupStyles[0];
            finalPlacement = String(selectedPlacementGroup.placement);
            finalTechnique = String(selectedPlacementGroup.technique);
            console.log(`[PrintfulService] Auto-selected first placement/technique: ${finalPlacement}/${finalTechnique}`);
        }
        // Ensure they are strings
        finalPlacement = String(finalPlacement || 'default');
        finalTechnique = String(finalTechnique || 'DTG');
        console.log('[PrintfulService] Mockup generation config:', {
            total_placement_groups: mockupStyles.length,
            selected_placement: finalPlacement,
            selected_technique: finalTechnique,
            user_selected_style_ids: mockupStyleIds?.length || 0,
            mode: mockupStyleIds?.length ? 'user-selected styles' : 'auto-select per variant'
        });
        // V2 API uses /mockup-tasks endpoint
        // Strategy: Create ONE request per variant with style IDs at PRODUCT level
        // Per official docs: mockup_style_ids goes at product level, NOT placement level
        const products = variantIds.map(variantId => {
            const product = {
                source: 'catalog',
                catalog_product_id: parseInt(productId, 10),
                catalog_variant_ids: [parseInt(variantId, 10)],
                placements: [{
                        placement: finalPlacement,
                        technique: finalTechnique,
                        layers: [{
                                type: 'file',
                                url: artworkUrl
                            }]
                    }]
            };
            // Add mockup_style_ids at PRODUCT level (per official API docs)
            if (mockupStyleIds && mockupStyleIds.length > 0) {
                product.mockup_style_ids = [parseInt(mockupStyleIds[0], 10)];
                console.log(`[PrintfulService] *** Setting mockup_style_ids=[${mockupStyleIds[0]}] at PRODUCT level for variant ${variantId} ***`);
            }
            // Add product options if provided (e.g., stitch_color)
            if (productOptions && Object.keys(productOptions).length > 0) {
                product.options = productOptions;
            }
            return product;
        });
        const requestData = {
            format: 'jpg',
            products: products
        };
        // NOTE: mockup_style_id is set per placement (in products array above)
        // DO NOT set mockup_style_ids at root level - it causes all requests to return the same mockup
        console.log('[PrintfulService] Generating mockups with V2 mockup-tasks API:', {
            product_id: productId,
            variant_count: variantIds.length,
            variant_ids: variantIds,
            artwork_url: artworkUrl,
            placement: finalPlacement,
            technique: finalTechnique,
            mockup_style_id: mockupStyleIds?.[0] || 'auto-select'
        });
        console.log('[PrintfulService] Raw mockup task request payload:', JSON.stringify(requestData, null, 2));
        // CRITICAL DEBUG: Log the exact mockup_style_ids being sent at product level
        if (requestData.products?.[0]?.mockup_style_ids) {
            console.log(`[PrintfulService] *** CONFIRMED: Sending mockup_style_ids=${JSON.stringify(requestData.products[0].mockup_style_ids)} at PRODUCT level ***`);
        }
        else {
            console.log(`[PrintfulService] *** WARNING: No mockup_style_ids at product level - Printful will auto-select ***`);
        }
        const res = await fetch(`${this.apiBaseUrlV2}/mockup-tasks`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('[PrintfulService] Mockup API error:', {
                status: res.status,
                statusText: res.statusText,
                body: errorText
            });
            // Handle rate limit specifically
            if (res.status === 429) {
                const errorData = JSON.parse(errorText);
                const waitSeconds = errorData.error?.message?.match(/(\d+) seconds/)?.[1] || '60';
                throw new Error(`Rate limit exceeded. Please wait ${waitSeconds} seconds before trying again.`);
            }
            throw new Error(`Failed to generate mockups: ${res.status} ${errorText}`);
        }
        const data = await res.json();
        console.log('[PrintfulService] Raw mockup task response:', JSON.stringify(data, null, 2));
        // Response is an array of tasks when requesting multiple variants
        const tasks = data.data || data;
        const tasksArray = Array.isArray(tasks) ? tasks : [tasks];
        // Log any warnings or errors from Printful
        if (data.warnings) {
            console.warn('[PrintfulService] ⚠️  Printful API warnings:', data.warnings);
        }
        if (data.errors) {
            console.error('[PrintfulService] ❌ Printful API errors:', data.errors);
        }
        console.log('[PrintfulService] Mockup tasks created:', {
            task_count: tasksArray.length,
            task_ids: tasksArray.map((t) => t.id),
            requested_styles: mockupStyleIds?.length || 'auto',
            requested_variants: variantIds.length,
            expected_mockups: mockupStyleIds?.length ? variantIds.length * mockupStyleIds.length : variantIds.length
        });
        // Return array of task IDs for polling
        return {
            id: tasksArray.map((t) => t.id).join(','), // Store as comma-separated for backward compat
            task_ids: tasksArray.map((t) => t.id),
            status: 'pending',
            mockups: []
        };
    }
    // V2 API: Get mockup generation status and download URLs
    async getMockupStatus(taskId) {
        const res = await fetch(`${this.apiBaseUrlV2}/mockup-tasks?id=${taskId}`, {
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            const errorText = await res.text();
            // Handle rate limiting with retry-after
            if (res.status === 429) {
                let retryAfter = 60; // Default to 60 seconds
                try {
                    const errorData = JSON.parse(errorText);
                    const match = errorData.data?.match(/after (\d+) seconds?/);
                    if (match) {
                        retryAfter = parseInt(match[1], 10);
                    }
                }
                catch (e) {
                    // Fallback to parsing from text
                }
                console.warn(`[PrintfulService] Rate limited. Retry after ${retryAfter}s for task ${taskId}`);
                const error = new Error(`Rate limited: retry after ${retryAfter}s`);
                error.retryAfter = retryAfter;
                error.status = 429;
                throw error;
            }
            console.error('[PrintfulService] Mockup status API error:', res.status, errorText);
            throw new Error(`Failed to get mockup status: ${res.status}`);
        }
        const data = await res.json();
        const tasks = data.data || data;
        const task = Array.isArray(tasks) ? tasks[0] : tasks;
        console.log('[PrintfulService] Raw task response for', taskId, ':', JSON.stringify(task, null, 2));
        // V2 API uses catalog_variant_mockups instead of mockups
        const mockups = task.catalog_variant_mockups || [];
        console.log('[PrintfulService] Mockup task status:', {
            task_id: taskId,
            status: task.status,
            mockup_count: mockups.length,
            sample_mockup: mockups.length > 0 ? JSON.stringify(mockups[0]) : null
        });
        // Normalize response - extract mockup URLs from the nested structure
        // Each catalog_variant_mockups entry has a nested mockups array
        const flattenedMockups = mockups.flatMap((variantMockup) => {
            const innerMockups = variantMockup.mockups || [];
            console.log(`[PrintfulService] Variant ${variantMockup.catalog_variant_id} has ${innerMockups.length} mockups`);
            return innerMockups.map((m) => ({
                mockup_url: m.mockup_url,
                variant_id: variantMockup.catalog_variant_id,
                placement: m.placement,
                technique: m.technique,
                style_id: m.style_id,
                view: m.view
            }));
        });
        console.log('[PrintfulService] Total mockups across all variants:', flattenedMockups.length);
        return {
            id: task.id,
            status: task.status,
            mockups: flattenedMockups
        };
    }
    // Helper method to wait for mockup generation and return URLs
    async generateAndWaitForMockups(productId, variantIds, artworkUrl, maxWaitTime = 30000, placement, technique, mockupStyleIds, productOptions) {
        console.log('[PrintfulService] generateAndWaitForMockups called with:', {
            productId,
            variantCount: variantIds.length,
            variantIds,
            maxWaitTime,
            placement,
            technique,
            mockupStyleIds: mockupStyleIds || 'auto-select',
            productOptions: productOptions || 'none'
        });
        // Start mockup generation (will auto-detect placement/technique if not provided)
        const mockupTask = await this.generateMockups(productId, variantIds, artworkUrl, placement, technique, mockupStyleIds, productOptions);
        // Get task IDs (may be multiple tasks for multiple variants)
        const taskIds = mockupTask.task_ids || [mockupTask.id];
        // Poll for completion of all tasks with rate limiting
        const startTime = Date.now();
        let pollInterval = 10000; // Start with 10 seconds between polls (respects rate limit)
        let pollCount = 0;
        let rateLimitWait = 0;
        console.log(`[PrintfulService] ⏳ Starting mockup polling for ${taskIds.length} tasks (rate limit: ~2 requests/minute)`);
        while (Date.now() - startTime < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, pollInterval + rateLimitWait));
            pollCount++;
            rateLimitWait = 0; // Reset after waiting
            try {
                console.log(`[PrintfulService] 🔄 Poll #${pollCount}: Checking ${taskIds.length} mockup task(s)...`);
                // Poll tasks SEQUENTIALLY with delay to respect rate limit (2 req/min = 1 req per 30s)
                const statuses = [];
                for (let i = 0; i < taskIds.length; i++) {
                    const taskId = taskIds[i];
                    // Add delay between requests (30 seconds for 2 req/min limit)
                    if (i > 0) {
                        const delayMs = 30000; // 30 seconds between requests
                        console.log(`[PrintfulService] ⏱️  Waiting ${delayMs / 1000}s before next request (rate limit)...`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    }
                    try {
                        const status = await this.getMockupStatus(taskId);
                        statuses.push(status);
                        console.log(`[PrintfulService] ✓ Task ${i + 1}/${taskIds.length}: ${status.status}`);
                    }
                    catch (error) {
                        if (error.status === 429 && error.retryAfter) {
                            console.warn(`[PrintfulService] ⚠️  Rate limited! Waiting ${error.retryAfter}s before retry...`);
                            rateLimitWait = error.retryAfter * 1000;
                            break; // Stop polling this round, wait longer
                        }
                        throw error;
                    }
                }
                if (statuses.length === 0) {
                    console.log(`[PrintfulService] No statuses retrieved (rate limited), will retry...`);
                    continue;
                }
                // Check if all completed
                const allCompleted = statuses.every(s => s.status === 'completed');
                const anyFailed = statuses.some(s => s.status === 'failed');
                if (anyFailed) {
                    throw new Error('One or more mockup generation tasks failed');
                }
                if (allCompleted) {
                    // Collect all mockup URLs from all tasks
                    const allMockups = statuses.flatMap(s => s.mockups || []);
                    const urls = allMockups.map(m => m.mockup_url);
                    console.log('[PrintfulService] ✅ All mockups completed:', {
                        task_count: taskIds.length,
                        total_mockups: urls.length,
                        expected_variants: variantIds.length,
                        mockup_style_ids_requested: mockupStyleIds?.length || 'auto-select',
                        expected_with_styles: mockupStyleIds?.length ? variantIds.length * mockupStyleIds.length : variantIds.length,
                        poll_count: pollCount,
                        total_time_s: Math.round((Date.now() - startTime) / 1000)
                    });
                    console.log('[PrintfulService] Mockup details:', allMockups.map((m, idx) => ({
                        index: idx + 1,
                        variant_id: m.variant_id,
                        mockup_style_id: m.mockup_style_id || 'not provided',
                        url: m.mockup_url
                    })));
                    return urls;
                }
                const completed = statuses.filter(s => s.status === 'completed').length;
                const pending = statuses.filter(s => s.status === 'pending').length;
                console.log(`[PrintfulService] 📊 Progress: ${completed}/${statuses.length} completed, ${pending} pending`);
                // Continue polling if any still processing
            }
            catch (error) {
                console.warn('[PrintfulService] ❌ Error checking mockup status:', error.message);
            }
        }
        throw new Error(`Mockup generation timed out after ${Math.round(maxWaitTime / 1000)}s (${pollCount} polling attempts)`);
    }
    // Legacy method - use ProductImageService for comprehensive image collection instead
    // This method is deprecated in favor of ProductImageService.collectPrintfulImages()
    async importProductWithMockups(printfulProduct, artworkUrl) {
        console.warn('[PrintfulPodProductService] importProductWithMockups is deprecated. Use ProductImageService.collectPrintfulImages() instead.');
        // Simple fallback for basic product structure
        const productInput = {
            title: printfulProduct.name,
            description: printfulProduct.description || `${printfulProduct.name} - Custom print-on-demand product`,
            thumbnail: printfulProduct.thumbnail_url,
            images: printfulProduct.thumbnail_url ? [{ url: printfulProduct.thumbnail_url }] : [],
            status: "published",
            metadata: {
                printful_product_id: printfulProduct.id,
                artwork_url: artworkUrl,
                fulfillment_type: "printful_pod",
                total_images: printfulProduct.thumbnail_url ? 1 : 0,
                image_sources: {
                    mockups: 0,
                    catalog: 0,
                    variants: 0
                }
            }
        };
        return productInput;
    }
    // ===== Printful Studio Methods =====
    /**
     * Upload artwork file to Printful Files API
     * V1 API: POST /files
     */
    async uploadArtworkToPrintful(fileUrl, fileName) {
        const payload = {
            url: fileUrl,
            type: 'default'
        };
        if (fileName) {
            payload.filename = fileName;
        }
        const res = await fetch(`${this.apiBaseUrlV1}/files`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Printful Files API error:', res.status, errorText);
            throw new Error('Failed to upload file to Printful');
        }
        const data = await res.json();
        return data.result || data;
    }
    /**
     * Get Printful file details
     * V1 API: GET /files/:id
     */
    async getPrintfulFile(fileId) {
        const res = await fetch(`${this.apiBaseUrlV1}/files/${fileId}`, {
            headers: { Authorization: `Bearer ${this.apiToken}` }
        });
        if (!res.ok) {
            if (res.status === 404)
                return null;
            const errorText = await res.text();
            console.error('Printful Files API error:', res.status, errorText);
            throw new Error('Failed to get file from Printful');
        }
        const data = await res.json();
        return data.result || data;
    }
    /**
     * Create a new sync product on Printful
     * V1 API: POST /store/products (Note: /sync/products is READ-ONLY)
     */
    async createSyncProduct(productData) {
        const payload = {
            sync_product: {
                name: productData.name,
                thumbnail: productData.thumbnail_url
            },
            sync_variants: productData.variants.map(v => ({
                variant_id: v.variant_id,
                retail_price: v.retail_price,
                files: v.files || []
            }))
        };
        console.log('[PrintfulService] Creating sync product with payload:', JSON.stringify(payload, null, 2));
        // Use /store/products endpoint, not /sync/products
        // /sync/products is READ-ONLY (GET only)
        const res = await fetch(`${this.apiBaseUrlV1}/store/products`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('[PrintfulService] Printful Store Products API error:', {
                status: res.status,
                statusText: res.statusText,
                errorBody: errorText
            });
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = errorJson.error?.message || errorJson.message || errorText;
            }
            catch (e) {
                // Not JSON, use as is
            }
            throw new Error(`Printful API error (${res.status}): ${errorDetails}`);
        }
        const data = await res.json();
        console.log('[PrintfulService] Sync product created, response:', data);
        return data.result || data;
    }
    /**
     * Update an existing sync product on Printful
     * V1 API: PUT /store/products/:id
     */
    async updateSyncProduct(productId, productData) {
        const payload = {};
        if (productData.name || productData.thumbnail_url) {
            payload.sync_product = {};
            if (productData.name)
                payload.sync_product.name = productData.name;
            if (productData.thumbnail_url)
                payload.sync_product.thumbnail = productData.thumbnail_url;
        }
        if (productData.variants) {
            payload.sync_variants = productData.variants.map(v => ({
                id: v.id,
                variant_id: v.variant_id,
                retail_price: v.retail_price,
                files: v.files || []
            }));
        }
        const res = await fetch(`${this.apiBaseUrlV1}/store/products/${productId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Printful Store Products API error:', res.status, errorText);
            throw new Error('Failed to update sync product on Printful');
        }
        const data = await res.json();
        return data.result || data;
    }
    /**
     * Delete a sync product from Printful
     * V1 API: DELETE /store/products/:id
     */
    async deleteSyncProduct(productId) {
        const res = await fetch(`${this.apiBaseUrlV1}/store/products/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.apiToken}` }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Printful Store Products API error:', res.status, errorText);
            throw new Error('Failed to delete sync product from Printful');
        }
    }
    /**
     * Get available product templates from catalog
     * V2 API: GET /v2/catalog-products with details
     */
    async getCatalogProductWithTemplates(productId) {
        const product = await this.getCatalogProduct(productId);
        if (!product)
            return null;
        // Fetch mockup templates for this product
        try {
            const res = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}/mockup-templates`, {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                return {
                    ...product,
                    mockup_templates: data.data || []
                };
            }
        }
        catch (error) {
            console.warn('Failed to fetch mockup templates:', error);
        }
        return product;
    }
    /**
     * Get variant details with pricing and techniques
     * V2 API: GET /v2/catalog-variants/:id
     */
    async getCatalogVariant(variantId) {
        const res = await fetch(`${this.apiBaseUrlV2}/catalog-variants/${variantId}`, {
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            if (res.status === 404)
                return null;
            const errorText = await res.text();
            console.error('Printful V2 Catalog Variants API error:', res.status, errorText);
            return null;
        }
        const data = await res.json();
        return data.data || data;
    }
    /**
     * Get pricing for a catalog variant
     * V2 API: GET /v2/catalog-variants/:id/prices
     */
    async getVariantPricing(variantId, quantity = 1) {
        const res = await fetch(`${this.apiBaseUrlV2}/catalog-variants/${variantId}/prices?quantity=${quantity}`, {
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Printful V2 Pricing API error:', res.status, errorText);
            return null;
        }
        const data = await res.json();
        return data.data || data;
    }
}
exports.PrintfulPodProductService = PrintfulPodProductService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRmdWwtcG9kLXByb2R1Y3Qtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3ByaW50ZnVsL3NlcnZpY2VzL3ByaW50ZnVsLXBvZC1wcm9kdWN0LXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQXlEO0FBQ3pELGlFQUE0RDtBQUM1RCxxRUFBK0Q7QUFtRy9ELDZFQUE2RTtBQUM3RSxNQUFhLHlCQUEwQixTQUFRLElBQUEscUJBQWEsRUFBQztJQUMzRCxlQUFlLEVBQWYsa0NBQWU7Q0FDaEIsQ0FBQztJQVVBLFlBQVksU0FBYyxFQUFFLE9BQWE7UUFDdkMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUxuQixzQkFBaUIsR0FBOEMsSUFBSSxDQUFBO1FBQ25FLHlCQUFvQixHQUFtRSxJQUFJLENBQUE7UUFDM0YsYUFBUSxHQUFHLEtBQUssQ0FBQSxDQUFDLGlEQUFpRDtRQTREMUUsMkZBQTJGO1FBQ25GLG1CQUFjLEdBQThDLElBQUksQ0FBQTtRQXpEdEUsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUE7UUFDMUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEVBQUUsQ0FBQTtRQUNwRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksNkNBQW9CLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ2hFLElBQUksQ0FBQyxZQUFZLEdBQUcsMEJBQTBCLENBQUE7UUFDOUMsSUFBSSxDQUFDLFlBQVksR0FBRyw2QkFBNkIsQ0FBQTtJQUNuRCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUE7UUFDN0IsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQTtJQUNsQyxDQUFDO0lBRUQsMEVBQTBFO0lBQzFFLEtBQUssQ0FBQyxp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