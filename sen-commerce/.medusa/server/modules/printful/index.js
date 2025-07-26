"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PODProviderManager = exports.PrintfulWebhookEvent = exports.PrintfulOrderTracking = exports.PrintfulSyncLog = exports.PrintfulProductFile = exports.PrintfulProductVariant = exports.PrintfulProduct = exports.PRINTFUL_MODULE = void 0;
const utils_1 = require("@medusajs/framework/utils");
const printful_product_1 = require("./models/printful-product");
Object.defineProperty(exports, "PrintfulProduct", { enumerable: true, get: function () { return printful_product_1.PrintfulProduct; } });
Object.defineProperty(exports, "PrintfulProductVariant", { enumerable: true, get: function () { return printful_product_1.PrintfulProductVariant; } });
Object.defineProperty(exports, "PrintfulProductFile", { enumerable: true, get: function () { return printful_product_1.PrintfulProductFile; } });
Object.defineProperty(exports, "PrintfulSyncLog", { enumerable: true, get: function () { return printful_product_1.PrintfulSyncLog; } });
Object.defineProperty(exports, "PrintfulOrderTracking", { enumerable: true, get: function () { return printful_product_1.PrintfulOrderTracking; } });
Object.defineProperty(exports, "PrintfulWebhookEvent", { enumerable: true, get: function () { return printful_product_1.PrintfulWebhookEvent; } });
const printful_pod_product_service_1 = require("./services/printful-pod-product-service");
const pod_provider_facade_1 = require("./services/pod-provider-facade");
Object.defineProperty(exports, "PODProviderManager", { enumerable: true, get: function () { return pod_provider_facade_1.PODProviderManager; } });
exports.PRINTFUL_MODULE = "printfulModule";
exports.default = (0, utils_1.Module)(exports.PRINTFUL_MODULE, {
    service: printful_pod_product_service_1.PrintfulPodProductService
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wcmludGZ1bC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBaUU7QUFDakUsZ0VBT2tDO0FBYWhDLGdHQW5CQSxrQ0FBZSxPQW1CQTtBQUNmLHVHQW5CQSx5Q0FBc0IsT0FtQkE7QUFDdEIsb0dBbkJBLHNDQUFtQixPQW1CQTtBQUNuQixnR0FuQkEsa0NBQWUsT0FtQkE7QUFDZixzR0FuQkEsd0NBQXFCLE9BbUJBO0FBQ3JCLHFHQW5CQSx1Q0FBb0IsT0FtQkE7QUFqQnRCLDBGQUFtRjtBQUduRix3RUFBbUU7QUFlakUsbUdBZk8sd0NBQWtCLE9BZVA7QUFiUCxRQUFBLGVBQWUsR0FBRyxnQkFBZ0IsQ0FBQTtBQUUvQyxrQkFBZSxJQUFBLGNBQU0sRUFBQyx1QkFBZSxFQUFFO0lBQ3JDLE9BQU8sRUFBRSx3REFBeUI7Q0FDbkMsQ0FBQyxDQUFBIn0=