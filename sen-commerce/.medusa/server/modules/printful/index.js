"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintfulWebhookEvent = exports.PrintfulOrderTracking = exports.PrintfulSyncLog = exports.PrintfulProductFile = exports.PrintfulProductVariant = exports.PrintfulProduct = exports.PRINTFUL_MODULE = void 0;
const utils_1 = require("@medusajs/framework/utils");
const printful_product_1 = require("./models/printful-product");
Object.defineProperty(exports, "PrintfulProduct", { enumerable: true, get: function () { return printful_product_1.PrintfulProduct; } });
Object.defineProperty(exports, "PrintfulProductVariant", { enumerable: true, get: function () { return printful_product_1.PrintfulProductVariant; } });
Object.defineProperty(exports, "PrintfulProductFile", { enumerable: true, get: function () { return printful_product_1.PrintfulProductFile; } });
Object.defineProperty(exports, "PrintfulSyncLog", { enumerable: true, get: function () { return printful_product_1.PrintfulSyncLog; } });
Object.defineProperty(exports, "PrintfulOrderTracking", { enumerable: true, get: function () { return printful_product_1.PrintfulOrderTracking; } });
Object.defineProperty(exports, "PrintfulWebhookEvent", { enumerable: true, get: function () { return printful_product_1.PrintfulWebhookEvent; } });
exports.PRINTFUL_MODULE = "printfulModule";
exports.default = (0, utils_1.Module)(exports.PRINTFUL_MODULE, {
    service: class PrintfulModuleService extends (0, utils_1.MedusaService)({
        PrintfulProduct: printful_product_1.PrintfulProduct,
        PrintfulProductVariant: printful_product_1.PrintfulProductVariant,
        PrintfulProductFile: printful_product_1.PrintfulProductFile,
        PrintfulSyncLog: printful_product_1.PrintfulSyncLog,
        PrintfulOrderTracking: printful_product_1.PrintfulOrderTracking,
        PrintfulWebhookEvent: printful_product_1.PrintfulWebhookEvent,
    }) {
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wcmludGZ1bC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBaUU7QUFDakUsZ0VBT2tDO0FBZ0JoQyxnR0F0QkEsa0NBQWUsT0FzQkE7QUFDZix1R0F0QkEseUNBQXNCLE9Bc0JBO0FBQ3RCLG9HQXRCQSxzQ0FBbUIsT0FzQkE7QUFDbkIsZ0dBdEJBLGtDQUFlLE9Bc0JBO0FBQ2Ysc0dBdEJBLHdDQUFxQixPQXNCQTtBQUNyQixxR0F0QkEsdUNBQW9CLE9Bc0JBO0FBbkJULFFBQUEsZUFBZSxHQUFHLGdCQUFnQixDQUFBO0FBRS9DLGtCQUFlLElBQUEsY0FBTSxFQUFDLHVCQUFlLEVBQUU7SUFDckMsT0FBTyxFQUFFLE1BQU0scUJBQXNCLFNBQVEsSUFBQSxxQkFBYSxFQUFDO1FBQ3pELGVBQWUsRUFBZixrQ0FBZTtRQUNmLHNCQUFzQixFQUF0Qix5Q0FBc0I7UUFDdEIsbUJBQW1CLEVBQW5CLHNDQUFtQjtRQUNuQixlQUFlLEVBQWYsa0NBQWU7UUFDZixxQkFBcUIsRUFBckIsd0NBQXFCO1FBQ3JCLG9CQUFvQixFQUFwQix1Q0FBb0I7S0FDckIsQ0FBQztLQUFHO0NBQ04sQ0FBQyxDQUFBIn0=