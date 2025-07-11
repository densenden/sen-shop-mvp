"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("@medusajs/framework/http");
const multer_1 = __importDefault(require("multer"));
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types for digital products
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'application/zip',
            'application/x-zip-compressed',
            'audio/mpeg',
            'audio/mp3',
            'video/mp4',
            'application/epub+zip',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type not allowed: ${file.mimetype}`));
        }
    }
});
exports.default = (0, http_1.defineMiddlewares)({
    routes: [
        {
            matcher: "/admin/digital-products",
            method: "POST",
            middlewares: [upload.single('file')],
        },
    ],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBpL21pZGRsZXdhcmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsbURBQTREO0FBQzVELG9EQUEyQjtBQUUzQixvQ0FBb0M7QUFDcEMsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQkFBTSxFQUFDO0lBQ3BCLE9BQU8sRUFBRSxnQkFBTSxDQUFDLGFBQWEsRUFBRTtJQUMvQixNQUFNLEVBQUU7UUFDTixRQUFRLEVBQUUsRUFBRSxHQUFHLElBQUksR0FBRyxJQUFJLEVBQUUscUJBQXFCO0tBQ2xEO0lBQ0QsVUFBVSxFQUFFLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRTtRQUM1QiwwQ0FBMEM7UUFDMUMsTUFBTSxZQUFZLEdBQUc7WUFDbkIsaUJBQWlCO1lBQ2pCLFlBQVk7WUFDWixXQUFXO1lBQ1gsV0FBVztZQUNYLFdBQVc7WUFDWCxpQkFBaUI7WUFDakIsOEJBQThCO1lBQzlCLFlBQVk7WUFDWixXQUFXO1lBQ1gsV0FBVztZQUNYLHNCQUFzQjtZQUN0QiwwQkFBMEI7WUFDMUIsbUVBQW1FO1lBQ25FLG9CQUFvQjtZQUNwQix5RUFBeUU7U0FDMUUsQ0FBQTtRQUNELElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUN6QyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ2hCLENBQUM7YUFBTSxDQUFDO1lBQ04sRUFBRSxDQUFDLElBQUksS0FBSyxDQUFDLDBCQUEwQixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQzFELENBQUM7SUFDSCxDQUFDO0NBQ0YsQ0FBQyxDQUFBO0FBRUYsa0JBQWUsSUFBQSx3QkFBaUIsRUFBQztJQUMvQixNQUFNLEVBQUU7UUFDTjtZQUNFLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsTUFBTSxFQUFFLE1BQU07WUFDZCxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3JDO0tBQ0Y7Q0FDRixDQUFDLENBQUEifQ==