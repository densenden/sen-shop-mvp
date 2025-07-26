"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const GET = async (req, res) => {
    try {
        console.log("Testing Printful connection...");
        // Test direct API call to Printful
        const apiToken = process.env.PRINTFUL_API_TOKEN;
        console.log("API Token exists:", !!apiToken);
        if (!apiToken) {
            return res.json({
                success: false,
                error: "PRINTFUL_API_TOKEN not configured",
                products: [],
                catalog_products: []
            });
        }
        let storeProducts = [];
        let catalogProducts = [];
        try {
            // Test V1 API - Store products
            console.log("Testing V1 API - Store products...");
            const storeResponse = await fetch("https://api.printful.com/store/products", {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (storeResponse.ok) {
                const storeData = await storeResponse.json();
                storeProducts = storeData.result || [];
                console.log("Store products fetched:", storeProducts.length);
            }
            else {
                console.error("Store API error:", storeResponse.status, await storeResponse.text());
            }
        }
        catch (error) {
            console.error("Store API fetch error:", error);
        }
        try {
            // Test V2 API - Catalog products  
            console.log("Testing V2 API - Catalog products...");
            const catalogResponse = await fetch("https://api.printful.com/v2/catalog-products?limit=5", {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (catalogResponse.ok) {
                const catalogData = await catalogResponse.json();
                catalogProducts = catalogData.data || [];
                console.log("Catalog products fetched:", catalogProducts.length);
            }
            else {
                console.error("Catalog API error:", catalogResponse.status, await catalogResponse.text());
            }
        }
        catch (error) {
            console.error("Catalog API fetch error:", error);
        }
        // Test service resolution
        let serviceResolved = false;
        try {
            const printfulService = req.scope.resolve("printfulModule");
            serviceResolved = !!printfulService;
            console.log("Printful service resolved:", serviceResolved);
        }
        catch (error) {
            console.error("Service resolution error:", error.message);
        }
        res.json({
            success: true,
            printful_api_token_configured: !!apiToken,
            service_resolved: serviceResolved,
            store_products: storeProducts,
            catalog_products: catalogProducts,
            store_products_count: storeProducts.length,
            catalog_products_count: catalogProducts.length
        });
    }
    catch (error) {
        console.error("Test Printful error:", error);
        res.status(500).json({
            success: false,
            error: error.message,
            products: [],
            catalog_products: []
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3Rlc3QtcHJpbnRmdWwvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRU8sTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ25FLElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQTtRQUU3QyxtQ0FBbUM7UUFDbkMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQTtRQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUU1QyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2QsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLG1DQUFtQztnQkFDMUMsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osZ0JBQWdCLEVBQUUsRUFBRTthQUNyQixDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsSUFBSSxhQUFhLEdBQUcsRUFBRSxDQUFBO1FBQ3RCLElBQUksZUFBZSxHQUFHLEVBQUUsQ0FBQTtRQUV4QixJQUFJLENBQUM7WUFDSCwrQkFBK0I7WUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFBO1lBQ2pELE1BQU0sYUFBYSxHQUFHLE1BQU0sS0FBSyxDQUFDLHlDQUF5QyxFQUFFO2dCQUMzRSxPQUFPLEVBQUU7b0JBQ1AsYUFBYSxFQUFFLFVBQVUsUUFBUSxFQUFFO29CQUNuQyxjQUFjLEVBQUUsa0JBQWtCO2lCQUNuQzthQUNGLENBQUMsQ0FBQTtZQUVGLElBQUksYUFBYSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNyQixNQUFNLFNBQVMsR0FBRyxNQUFNLGFBQWEs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