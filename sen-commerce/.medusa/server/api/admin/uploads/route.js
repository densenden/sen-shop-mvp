"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const multer_1 = __importDefault(require("multer"));
const artwork_module_1 = require("../../../modules/artwork-module");
// Use Multer to handle file upload in memory
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// This handler will be used by Medusa's API route system
const POST = async (req, res) => {
    console.log('[uploads] Request headers:', req.headers['content-type']);
    console.log('[uploads] Using array upload for file field - v2');
    // Multer needs to be called as middleware, so we wrap it in a promise
    // Handle 'file' field (supports both single and multiple with same field name)
    await new Promise((resolve, reject) => {
        upload.array('file', 10)(req, res, (err) => {
            if (err) {
                console.error('[uploads] Multer error:', err);
                console.error('[uploads] Error type:', err.code);
                res.status(400).json({ error: err.message });
                return reject(err);
            }
            console.log('[uploads] Multer processing complete');
            resolve();
        });
    });
    // @ts-ignore - Handle both req.file and req.files
    const files = req.files || (req.file ? [req.file] : []);
    console.log('[uploads] Files received:', files.length);
    if (!files || files.length === 0) {
        res.status(400).json({ error: "No files uploaded" });
        return;
    }
    try {
        // Create the upload service with the container (for DI)
        const imageUploadService = new artwork_module_1.ImageUploadService(req.scope);
        const uploadedFiles = [];
        // Upload each file
        for (const file of files) {
            const publicUrl = await imageUploadService.uploadImage(file.buffer, file.originalname, file.mimetype);
            console.log('[uploads] Upload successful:', publicUrl);
            uploadedFiles.push({ url: publicUrl });
        }
        res.json({ files: uploadedFiles });
    }
    catch (err) {
        console.error('[uploads] Upload error:', err);
        res.status(500).json({ error: err.message || "Upload failed" });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3VwbG9hZHMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0Esb0RBQTJCO0FBQzNCLG9FQUFvRTtBQUVwRSw2Q0FBNkM7QUFDN0MsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQkFBTSxFQUFDLEVBQUUsT0FBTyxFQUFFLGdCQUFNLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0FBRTFELHlEQUF5RDtBQUNsRCxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUE7SUFDdEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrREFBa0QsQ0FBQyxDQUFBO0lBRS9ELHNFQUFzRTtJQUN0RSwrRUFBK0U7SUFDL0UsTUFBTSxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUMxQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFVLEVBQUUsR0FBVSxFQUFFLENBQUMsR0FBUSxFQUFFLEVBQUU7WUFDNUQsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUM3QyxPQUFPLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDaEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7Z0JBQzVDLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3BCLENBQUM7WUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxDQUFDLENBQUE7WUFDbkQsT0FBTyxFQUFFLENBQUE7UUFDWCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0lBRUYsa0RBQWtEO0lBQ2xELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDdkQsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFdEQsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ2pDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQTtRQUNwRCxPQUFNO0lBQ1IsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILHdEQUF3RDtRQUN4RCxNQUFNLGtCQUFrQixHQUFHLElBQUksbUNBQWtCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRTVELE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQTtRQUV4QixtQkFBbUI7UUFDbkIsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUN6QixNQUFNLFNBQVMsR0FBRyxNQUFNLGtCQUFrQixDQUFDLFdBQVcsQ0FDcEQsSUFBSSxDQUFDLE1BQU0sRUFDWCxJQUFJLENBQUMsWUFBWSxFQUNqQixJQUFJLENBQUMsUUFBUSxDQUNkLENBQUE7WUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBQ3RELGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQTtRQUN4QyxDQUFDO1FBRUQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFBO0lBQ3BDLENBQUM7SUFBQyxPQUFPLEdBQVEsRUFBRSxDQUFDO1FBQ2xCLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDN0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sSUFBSSxlQUFlLEVBQUUsQ0FBQyxDQUFBO0lBQ2pFLENBQUM7QUFDSCxDQUFDLENBQUE7QUFsRFksUUFBQSxJQUFJLFFBa0RoQiJ9