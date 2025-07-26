"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const GET = async (req, res) => {
    try {
        console.log("[Test Product Sync] GET request received");
        let printfulProducts = [];
        let digitalProducts = [];
        let existingPrintfulProducts = [];
        // Try to get Printful products
        try {
            const printfulService = req.scope.resolve("printfulModule");
            console.log("Printful service resolved:", !!printfulService);
            if (printfulService) {
                console.log("Fetching Printful store products...");
                printfulProducts = await printfulService.fetchStoreProducts();
                console.log("Printful products fetched:", printfulProducts.length);
                console.log("Fetching Printful catalog products...");
                const catalogProducts = await printfulService.fetchCatalogProducts();
                console.log("Catalog products fetched:", catalogProducts.length);
                // Add catalog products to the available products list
                const catalogFormatted = catalogProducts.slice(0, 10).map((product) => ({
                    id: `catalog-${product.id}`,
                    name: product.name,
                    description: product.description,
                    thumbnail_url: product.image,
                    status: 'available',
                    provider: 'printful',
                    already_imported: false,
                    product_type: 'catalog'
                }));
                // Combine store and catalog products
                printfulProducts = [...printfulProducts, ...catalogFormatted];
            }
        }
        catch (error) {
            console.error("Printful service error:", error.message);
        }
        // Try to get digital products
        try {
            const digitalProductService = req.scope.resolve("digitalProductModuleService");
            digitalProducts = await digitalProductService.listDigitalProducts({});
        }
        catch (error) {
            console.log("Digital product service not available:", error.message);
        }
        // Format available products for import
        const availableProducts = {
            printful: printfulProducts.map(p => ({
                id: p.id || p.external_id || `product-${p.name}`,
                name: p.name,
                description: p.description || `${p.name} - Available for custom printing`,
                thumbnail_url: p.thumbnail_url || p.image,
                status: 'available',
                provider: 'printful',
                already_imported: false,
                product_type: p.product_type || 'store'
            })),
            digital: digitalProducts.map(dp => ({
                id: dp.id,
                name: dp.name,
                description: dp.description,
                file_size: dp.file_size,
                mime_type: dp.mime_type,
                status: 'available',
                provider: 'digital',
                already_imported: false
            }))
        };
        res.json({
            success: true,
            available_products: availableProducts,
            logs: [],
            stats: { total: 0, pending: 0, success: 0, failed: 0, in_progress: 0 }
        });
    }
    catch (error) {
        console.error("[Test Product Sync] Error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch sync data",
            message: error.message
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3Rlc3QtcHJvZHVjdC1zeW5jL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVPLE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNuRSxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLDBDQUEwQyxDQUFDLENBQUE7UUFFdkQsSUFBSSxnQkFBZ0IsR0FBVSxFQUFFLENBQUE7UUFDaEMsSUFBSSxlQUFlLEdBQVUsRUFBRSxDQUFBO1FBQy9CLElBQUksd0JBQXdCLEdBQVUsRUFBRSxDQUFBO1FBRXhDLCtCQUErQjtRQUMvQixJQUFJLENBQUM7WUFDSCxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBUSxDQUFBO1lBQ2xFLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFBO1lBRTVELElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLENBQUMsQ0FBQTtnQkFDbEQsZ0JBQWdCLEdBQUcsTUFBTSxlQUFlLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtnQkFDN0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFFbEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFBO2dCQUNwRCxNQUFNLGVBQWUsR0FBRyxNQUFNLGVBQWUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFBO2dCQUNwRSxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFFaEUsc0RBQXNEO2dCQUN0RCxNQUFNLGdCQUFnQixHQUFH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