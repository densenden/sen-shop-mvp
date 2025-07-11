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
    // Multer needs to be called as middleware, so we wrap it in a promise
    await new Promise((resolve, reject) => {
        upload.single("file")(req, res, (err) => {
            if (err) {
                console.error('[uploads] Multer error:', err);
                res.status(400).json({ error: err.message });
                return reject(err);
            }
            resolve();
        });
    });
    // @ts-ignore
    const file = req.file;
    console.log('[uploads] File received:', file ? file.originalname : 'No file');
    if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    try {
        // Create the upload service with the container (for DI)
        const imageUploadService = new artwork_module_1.ImageUploadService(req.scope);
        const publicUrl = await imageUploadService.uploadImage(file.buffer, file.originalname, file.mimetype);
        console.log('[uploads] Upload successful:', publicUrl);
        res.json({ files: [{ url: publicUrl }] });
    }
    catch (err) {
        console.error('[uploads] Upload error:', err);
        res.status(500).json({ error: err.message || "Upload failed" });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3VwbG9hZHMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0Esb0RBQTJCO0FBQzNCLG9FQUFvRTtBQUVwRSw2Q0FBNkM7QUFDN0MsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQkFBTSxFQUFDLEVBQUUsT0FBTyxFQUFFLGdCQUFNLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0FBRTFELHlEQUF5RDtBQUNsRCxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUE7SUFFdEUsc0VBQXNFO0lBQ3RFLE1BQU0sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDMUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFVLEVBQUUsR0FBVSxFQUFFLENBQUMsR0FBUSxFQUFFLEVBQUU7WUFDekQsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUM3QyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtnQkFDNUMsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDcEIsQ0FBQztZQUNELE9BQU8sRUFBRSxDQUFBO1FBQ1gsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtJQUVGLGFBQWE7SUFDYixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFBO0lBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUU3RSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDVixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUE7UUFDbkQsT0FBTTtJQUNSLENBQUM7SUFFRCxJQUFJLENBQUM7UUFDSCx3REFBd0Q7UUFDeEQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLG1DQUFrQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUU1RCxNQUFNLFNBQVMsR0FBRyxNQUFNLGtCQUFrQixDQUFDLFdBQVcsQ0FDcEQsSUFBSSxDQUFDLE1BQU0sRUFDWCxJQUFJLENBQUMsWUFBWSxFQUNqQixJQUFJLENBQUMsUUFBUSxDQUNkLENBQUE7UUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBQ3RELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBQUMsT0FBTyxHQUFRLEVBQUUsQ0FBQztRQUNsQixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQzdDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPLElBQUksZUFBZSxFQUFFLENBQUMsQ0FBQTtJQUNqRSxDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBdkNZLFFBQUEsSUFBSSxRQXVDaEIifQ==