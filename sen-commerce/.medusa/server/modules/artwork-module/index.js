"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARTWORK_MODULE = exports.ImageUploadService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const artwork_module_service_1 = require("./services/artwork-module-service");
var image_upload_service_1 = require("./services/image-upload-service");
Object.defineProperty(exports, "ImageUploadService", { enumerable: true, get: function () { return image_upload_service_1.ImageUploadService; } });
exports.ARTWORK_MODULE = "artworkModuleService";
exports.default = (0, utils_1.Module)(exports.ARTWORK_MODULE, {
    service: artwork_module_service_1.ArtworkModuleService
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9hcnR3b3JrLW1vZHVsZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBa0Q7QUFDbEQsOEVBQXdFO0FBQ3hFLHdFQUFvRTtBQUEzRCwwSEFBQSxrQkFBa0IsT0FBQTtBQUVkLFFBQUEsY0FBYyxHQUFHLHNCQUFzQixDQUFBO0FBRXBELGtCQUFlLElBQUEsY0FBTSxFQUFDLHNCQUFjLEVBQUU7SUFDcEMsT0FBTyxFQUFFLDZDQUFvQjtDQUM5QixDQUFDLENBQUEifQ==