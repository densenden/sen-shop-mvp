"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
exports.DELETE = DELETE;
// GET /admin/printful-products/enhanced/:id/files/:file_id
// Get specific file details
async function GET(req, res) {
    try {
        const { id, file_id } = req.params;
        // This would query the printful_product_file table
        console.log(`Fetching file ${file_id} for product ${id}`);
        // Mock response for now
        const file = {
            id: file_id,
            product_id: id,
            file_type: 'design',
            file_url: 'https://example.com/design1.png',
            file_name: 'design1.png',
            file_size: 1024000,
            mime_type: 'image/png',
            placement: 'front',
            is_primary: true,
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        res.json({ file });
    }
    catch (error) {
        console.error('Error fetching product file:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch product file' });
    }
}
// PUT /admin/printful-products/enhanced/:id/files/:file_id
// Update file details
async function PUT(req, res) {
    try {
        const { id, file_id } = req.params;
        const { file_name, placement, is_primary, metadata } = req.body;
        console.log(`Updating file ${file_id} for product ${id}`, {
            file_name,
            placement,
            is_primary,
            metadata
        });
        // This would update the printful_product_file table
        const updatedFile = {
            id: file_id,
            product_id: id,
            file_name: file_name || 'untitled',
            placement: placement || 'front',
            is_primary: is_primary || false,
            metadata: metadata || {},
            updated_at: new Date().toISOString()
        };
        res.json({
            success: true,
            file: updatedFile,
            message: 'File updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating product file:', error);
        res.status(500).json({ error: error.message || 'Failed to update product file' });
    }
}
// DELETE /admin/printful-products/enhanced/:id/files/:file_id
// Delete file
async function DELETE(req, res) {
    try {
        const { id, file_id } = req.params;
        console.log(`Deleting file ${file_id} for product ${id}`);
        // This would delete from printful_product_file table
        // Also handle file deletion from storage if needed
        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting product file:', error);
        res.status(500).json({ error: error.message || 'Failed to delete product file' });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3ByaW50ZnVsLXByb2R1Y3RzL2VuaGFuY2VkL1tpZF0vZmlsZXMvW2ZpbGVfaWRdL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsa0JBNkJDO0FBSUQsa0JBc0NDO0FBSUQsd0JBa0JDO0FBL0ZELDJEQUEyRDtBQUMzRCw0QkFBNEI7QUFDckIsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtRQUVsQyxtREFBbUQ7UUFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsT0FBTyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUV6RCx3QkFBd0I7UUFDeEIsTUFBTSxJQUFJLEdBQUc7WUFDWCxFQUFFLEVBQUUsT0FBTztZQUNYLFVBQVUsRUFBRSxFQUFFO1lBQ2QsU0FBUyxFQUFFLFFBQVE7WUFDbkIsUUFBUSxFQUFFLGlDQUFpQztZQUMzQyxTQUFTLEVBQUUsYUFBYTtZQUN4QixTQUFTLEVBQUUsT0FBTztZQUNsQixTQUFTLEVBQUUsV0FBVztZQUN0QixTQUFTLEVBQUUsT0FBTztZQUNsQixVQUFVLEVBQUUsSUFBSTtZQUNoQixRQUFRLEVBQUUsRUFBRTtZQUNaLFVBQVUsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtZQUNwQyxVQUFVLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDckMsQ0FBQTtRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBRXBCLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMs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