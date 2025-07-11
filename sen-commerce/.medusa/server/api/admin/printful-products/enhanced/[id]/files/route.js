"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const printful_1 = require("../../../../../../modules/printful");
// GET /admin/printful-products/enhanced/:id/files
// Get all files for a product (photos, videos, design files)
async function GET(req, res) {
    try {
        const { id } = req.params;
        const { file_type, placement } = req.query;
        // Get the printful module service
        const printfulService = req.scope.resolve(printful_1.PRINTFUL_MODULE);
        // Query filters
        const filters = { product_id: id };
        if (file_type)
            filters.file_type = file_type;
        if (placement)
            filters.placement = placement;
        // Fetch files from database
        const files = await printfulService.listPrintfulProductFiles({ filters });
        res.json({
            files: files || [],
            count: files?.length || 0
        });
    }
    catch (error) {
        console.error('Error fetching product files:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch product files' });
    }
}
// POST /admin/printful-products/enhanced/:id/files
// Add new file to product (photo, video, design file)
async function POST(req, res) {
    try {
        const { id } = req.params;
        const { file_type, file_url, file_name, placement, is_primary, metadata } = req.body;
        // Validate required fields
        if (!file_type || !file_url) {
            return res.status(400).json({ error: 'file_type and file_url are required' });
        }
        // Validate file_type
        const validFileTypes = ['design', 'mockup', 'template', 'photo', 'video'];
        if (!validFileTypes.includes(file_type)) {
            return res.status(400).json({
                error: `Invalid file_type. Must be one of: ${validFileTypes.join(', ')}`
            });
        }
        // Get the printful module service
        const printfulService = req.scope.resolve(printful_1.PRINTFUL_MODULE);
        // Create new file record
        const newFile = await printfulService.createPrintfulProductFiles({
            product_id: id,
            file_type,
            file_url,
            file_name: file_name || 'untitled',
            placement: placement || 'front',
            is_primary: is_primary || false,
            metadata: metadata || {}
        });
        res.status(201).json({
            success: true,
            file: newFile,
            message: 'File added successfully'
        });
    }
    catch (error) {
        console.error('Error adding product file:', error);
        res.status(500).json({ error: error.message || 'Failed to add product file' });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3ByaW50ZnVsLXByb2R1Y3RzL2VuaGFuY2VkL1tpZF0vZmlsZXMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFLQSxrQkF5QkM7QUFJRCxvQkFpREM7QUFsRkQsaUVBQW9FO0FBRXBFLGtEQUFrRDtBQUNsRCw2REFBNkQ7QUFDdEQsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO1FBQ3pCLE1BQU0sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQVksQ0FBQTtRQUVqRCxrQ0FBa0M7UUFDbEMsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsMEJBQWUsQ0FBQyxDQUFBO1FBRTFELGdCQUFnQjtRQUNoQixNQUFNLE9BQU8sR0FBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQTtRQUN2QyxJQUFJLFNBQVM7WUFBRSxPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtRQUM1QyxJQUFJLFNBQVM7WUFBRSxPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtRQUU1Qyw0QkFBNEI7UUFDNUIsTUFBTSxLQUFLLEdBQUcsTUFBTSxlQUFlLENBQUMsd0JBQXdCLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO1FBRXpFLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxLQUFLLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEIsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQztTQUMxQixDQUFDLENBQUE7SUFFSixDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLCtCQUErQixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3JELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksK0JBQStCLEVBQUUsQ0FBQyxDQUFBO0lBQ25GLENBQUM7QUFDSCxDQUFDO0FBRUQsbURBQW1EO0FBQ25ELHNEQUFzRDtBQUMvQyxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7UUFDekIsTUFBTSxFQUNKLFNBQVMsRUFDVCxRQUFRLEVBQ1IsU0FBUyxFQUNULFNBQVMsRUFDVCxVQUFVLEVBQ1YsUUFBUSxFQUNULEdBQUcsR0FBRyxDQUFDLElBQVcsQ0FBQTtRQUVuQiwyQkFBMkI7UUFDM0IsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzVCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUscUNBQXFDLEVBQUUsQ0FBQyxDQUFBO1FBQy9FLENBQUM7UUFFRCxxQkFBcUI7UUFDckIsTUFBTSxjQUFjLEdBQUcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDekUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUN4QyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsc0NBQXNDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7YUFDekUsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELGtDQUFrQztRQUNsQyxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQywwQkFBZSxDQUFDLENBQUE7UUFFMUQseUJBQXlCO1FBQ3pCLE1BQU0sT0FBTyxHQUFHLE1BQU0sZUFBZSxDQUFDLDBCQUEwQixDQUFDO1lBQy9ELFVBQVUsRUFBRSxFQUFFO1lBQ2QsU0FBUztZQUNULFFBQVE7WUFDUixTQUFTLEVBQUUsU0FBUyxJQUFJLFVBQVU7WUFDbEMsU0FBUyxFQUFFLFNBQVMsSUFBSSxPQUFPO1lBQy9CLFVBQVUsRUFBRSxVQUFVLElBQUksS0FBSztZQUMvQixRQUFRLEVBQUUsUUFBUSxJQUFJLEVBQUU7U0FDekIsQ0FBQyxDQUFBO1FBRUYsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUUsT0FBTztZQUNiLE9BQU8sRUFBRSx5QkFBeUI7U0FDbkMsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNsRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLDRCQUE0QixFQUFFLENBQUMsQ0FBQTtJQUNoRixDQUFDO0FBQ0gsQ0FBQyJ9